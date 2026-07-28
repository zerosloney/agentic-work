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

const STATE_DIR = path.join(process.cwd(), '.loop-cli', 'state');

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(new Error('Invalid JSON on stdin: ' + e.message)); }
    });
    process.stdin.on('error', reject);
  });
}

// Collect forbidden_scope patterns from all state files. Returns [] if the
// state dir is missing or no file declares the field (fail open).
function collectForbiddenScopes() {
  const patterns = [];
  let files = [];
  try { files = fs.readdirSync(STATE_DIR); }
  catch { return patterns; } // dir missing — no active pipeline, allow
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const fp = path.join(STATE_DIR, f);
    try {
      const obj = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      if (Array.isArray(obj.forbidden_scope)) {
        for (const p of obj.forbidden_scope) {
          if (typeof p === 'string' && p.length > 0) patterns.push(p);
        }
      }
    } catch {
      // unreadable state — skip, don't block (validate-state-write handles bad JSON)
    }
  }
  return patterns;
}

// Minimal glob (gitignore-flavored subset):
//   - pattern with wildcards (* or **) → regex match (basename OR full path)
//   - trailing /*  (no other wildcards) → everything under that dir
//   - trailing /   → dir prefix
//   - otherwise    → exact path or suffix match
// Path separators normalized to '/' for cross-platform match.
// intentional-simple: * maps to .* (cross-segment); no brace expansion,
// no character classes. Fine for the small scope lists these pipelines use.
function matchesPattern(filePath, pattern) {
  const normalized = filePath.replace(/\\/g, '/');
  const rel = normalized.replace(/^\.?\//, '').replace(/^[A-Za-z]:\//, '');
  const cleanPattern = pattern.replace(/\\/g, '/').replace(/^\.?\//, '');

  // wildcard patterns (incl. **/x/*) → regex
  if (cleanPattern.includes('*')) {
    const re = new RegExp('^' + cleanPattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
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
  const input = await readStdin();
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
