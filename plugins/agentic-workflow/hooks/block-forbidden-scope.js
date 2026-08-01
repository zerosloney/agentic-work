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
// both the normalized absolute path and the current-workspace-relative path.
// A pattern ending in /* matches the directory and everything below it; a
// bare path segment matches exactly (or the same suffix in an absolute path).
// Minimal glob support is intentional for the small scope lists these
// pipelines use.

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
//   - trailing /*  (no other wildcards) → directory and everything below it
//   - trailing /   → dir prefix
//   - otherwise    → exact path or suffix match
// Path separators normalized to '/' for cross-platform match.
// intentional-simple: no brace expansion, no character classes. Fine for the
// small scope lists these pipelines use.
//
// A normal `*` stays within one path segment. The trailing `/*` form is the
// explicit recursive directory shorthand used by forbidden_scope declarations.
function matchesPattern(filePath, pattern) {
  if (typeof filePath !== 'string' || typeof pattern !== 'string') return false;

  const normalize = (value) => value.replace(/\\/g, '/');
  const stripDotPrefix = (value) => value.replace(/^\.\//, '');
  const normalized = normalize(filePath);
  const isAbsolute = (value) => value.startsWith('/') || /^[A-Za-z]:\//.test(value);
  const absolutePath = isAbsolute(normalized)
    ? normalized
    : normalize(path.resolve(filePath));
  const relativePath = normalize(path.relative(process.cwd(), absolutePath)).replace(/^\.\//, '');
  const cleanPattern = stripDotPrefix(normalize(pattern));
  const patternIsAbsolute = isAbsolute(cleanPattern);
  const patternPath = patternIsAbsolute
    ? cleanPattern
    : stripDotPrefix(cleanPattern);

  // Relative scope declarations are normally repo-relative. Absolute target
  // paths from Write/Edit therefore must be compared with relativePath too.
  // Absolute declarations continue to match absolutePath directly.
  const candidates = patternIsAbsolute
    ? [absolutePath, normalized]
    : [relativePath, normalized.replace(/^[A-Za-z]:\//, '')];

  // `dir/*` is a recursive directory shorthand. Handle it before the generic
  // wildcard branch; otherwise the `*` branch would make this code unreachable.
  if (patternPath.endsWith('/*') && !patternPath.slice(0, -2).includes('*')) {
    const prefix = patternPath.slice(0, -2).replace(/\/$/, '');
    return candidates.some((candidate) => candidate === prefix || candidate.startsWith(prefix + '/'));
  }

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
    return candidates.some((candidate) => re.test(candidate) || re.test(candidate.split('/').pop()));
  }
  if (patternPath.endsWith('/')) {
    return candidates.some((candidate) => candidate.startsWith(patternPath));
  }
  return candidates.some((candidate) => candidate === patternPath || candidate.endsWith('/' + patternPath));
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
