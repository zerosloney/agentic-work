#!/usr/bin/env node
'use strict';
// block-forbidden-scope.js — PreToolUse hook: forbid writes into forbidden_scope
//
// Reads every .loop-cli/state/*.json, collects each file's forbidden_scope
// (string[] of glob patterns), and rejects Write/Edit whose target file_path
// matches any pattern. Lets the orchestrator enforce the declared boundary
// via a platform hook instead of relying solely on agent text convention.
//
// Contract: stdin = JSON tool payload, stderr = diagnostics,
//           exit 0 = allow, exit 2 = deny. Internal errors fail open.
//
// Match semantics: forbidden_scope entries are glob patterns matched against
// the normalized (forward-slash) absolute OR repo-relative path. A pattern
// ending in /* matches everything under that dir; a bare path segment matches
// exactly. Minimal glob (/* suffix + exact) — no deep ** support, intentional
// simplicity for the small scope lists these pipelines use.

const fs = require('fs');
const path = require('path');
const { readStdin } = require(path.join(__dirname, '..', 'scripts', 'lib', 'read-stdin.js'));

const STATE_DIR = path.join(process.cwd(), '.loop-cli', 'state');

// Collect forbidden_scope patterns from all state files. Returns [] if the
// state dir is missing or no file declares the field (fail open).
// intentional-simple: in-process mtime cache. Hook processes are short-lived
// (one invocation per PreToolUse event), so the cache only benefits repeated
// calls within a single hook invocation. For the common case (one pipeline,
// one state file) the savings are one stat+read+parse per call after the
// first. If N grows large, upgrade to a file-based cache keyed by dir mtime.
const patternCache = new Map();

function collectForbiddenScopes() {
  const patterns = [];
  let files = [];
  try { files = fs.readdirSync(STATE_DIR); }
  catch { return patterns; } // dir missing — no active pipeline, allow
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const fp = path.join(STATE_DIR, f);
    try {
      const stat = fs.statSync(fp);
      const cached = patternCache.get(fp);
      if (cached && cached.mtimeMs === stat.mtimeMs) {
        patterns.push(...cached.patterns);
        continue;
      }
      const obj = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      const filePatterns = [];
      if (Array.isArray(obj.forbidden_scope)) {
        for (const p of obj.forbidden_scope) {
          if (typeof p === 'string' && p.length > 0) filePatterns.push(p);
        }
      }
      patternCache.set(fp, { mtimeMs: stat.mtimeMs, patterns: filePatterns });
      patterns.push(...filePatterns);
    } catch {
      // unreadable state — skip, don't block (validate-state-write handles bad JSON)
    }
  }
  return patterns;
}

// Minimal glob (gitignore-flavored subset):
//   - ** → matches across path segments (.* equivalent)
//   - *  → matches within one segment ([^/]* — does NOT cross /)
//   - trailing /*  (no other wildcards) → everything directly under that dir
//   - trailing /   → dir prefix
//   - otherwise    → exact path or suffix match
// Path separators normalized to '/' for cross-platform match.
// intentional-simple: no brace expansion, no character classes. Fine for the
// small scope lists these pipelines use.
//
// * NOT crossing / is the gitignore/POSIX glob convention: `src/*` matches
// `src/a` but NOT `src/a/b` — use `src/**` for recursive. Earlier versions
// mapped * to .* (cross-segment), which over-blocked `src/*` to match nested
// paths. Fixed so single-segment * stays single-segment.
function matchesPattern(filePath, pattern) {
  const normalized = filePath.replace(/\\/g, '/');
  const rel = normalized.replace(/^\.?\//, '').replace(/^[A-Za-z]:\//, '');
  const cleanPattern = pattern.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/^[A-Za-z]:\//, '');

  // wildcard patterns (incl. **/x/*) → regex.
  // Escape regex specials first, then map ** → .* (cross-segment) and
  // remaining single * → [^/]* (single-segment). Use a placeholder so the
  // .* from ** isn't re-matched by the subsequent * → [^/]* pass.
  if (cleanPattern.includes('*')) {
    const PLACEHOLDER = '\u0000';
    const escaped = cleanPattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const reSrc = escaped
      .replace(/\*\*/g, PLACEHOLDER)
      .replace(/\*/g, '[^/]*')
      .replace(new RegExp(PLACEHOLDER, 'g'), '.*');
    const re = new RegExp('^' + reSrc + '$');
    const basename = rel.split('/').pop();
    return re.test(basename) || re.test(rel);
  }
  if (cleanPattern.endsWith('/*')) {
    const prefix = cleanPattern.slice(0, -2);
    return rel === prefix || rel.startsWith(prefix + '/');
  }
  if (cleanPattern.endsWith('/')) {
    return rel.startsWith(cleanPattern);
  }
  return rel === cleanPattern || rel.endsWith('/' + cleanPattern);
}

async function main() {
  const raw = await readStdin();
  let input;
  try { input = JSON.parse(raw); }
  catch (e) { process.exit(0); } // unparseable stdin → nothing to check, allow

  const filePath = input.tool_input && input.tool_input.file_path;
  if (!filePath) process.exit(0); // nothing to check

  const patterns = collectForbiddenScopes();
  if (patterns.length === 0) process.exit(0); // no forbidden_scope declared

  for (const p of patterns) {
    if (matchesPattern(filePath, p)) {
      console.error(`Write blocked: "${filePath}" matches forbidden_scope pattern "${p}"`);
      process.exit(2);
    }
  }
  process.exit(0);
}

main().catch(err => {
  console.error(`Hook error: ${err.message}`);
  process.exit(0); // fail open
});
