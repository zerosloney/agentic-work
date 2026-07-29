#!/usr/bin/env node
'use strict';
// validate-state-write.js — PreToolUse hook: validate agentic-workflow state JSON
//
// Intercepts Write on files under .loop-cli/state/. Performs a cheap
// pre-write check: JSON must parse, top-level `version` must be 1 or 2, and
// the minimal required fields for that version must be present.
// Edit fragments pass through (fail open) — see the Edit branch below.
//
// This is NOT a full schema check — orchestrators run the authoritative
// `node scripts/validate-state.js <file>` after writing. The hook's job is to
// catch malformed writes early (bad JSON, wrong version, missing required
// fields) so the loop state never becomes unparseable.
//
// Contract: stdin = JSON tool payload, stdout = {} on allow,
//           exit 0 = allow, exit 2 = deny. Internal errors fail open (exit 0)
//           to avoid blocking legitimate writes.

const fs = require('fs');

// Minimal required fields per state version. Mirrors the `required` subset of
// validate-state.js fieldsV1/fieldsV2; intentionally smaller — hooks must stay
// fast and never reject shapes the CLI validator accepts.
const REQUIRED_BY_VERSION = {
  1: ['version', 'prompt', 'max_iterations', 'outer_iteration', 'round', 'tasks', 'consecutive_failures', 'stall_counter', 'fail_history', 'stop_reason'],
  2: ['version', 'prompt', 'max_iterations', 'outer_iteration', 'round', 'nodes', 'active_set', 'consecutive_failures', 'stall_counter', 'fail_history', 'stop_reason'],
};

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

function isStateFile(filePath) {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, '/');
  return /\.loop-cli\/state\/[^/]+\.json$/.test(normalized);
}

function validateState(json) {
  const errors = [];

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return ['state must be a JSON object'];
  }

  if (json.version === undefined) {
    errors.push('Missing required field: "version"');
    return errors;
  }
  if (![1, 2].includes(json.version)) {
    errors.push(`Invalid version: ${json.version} (expected: 1 | 2)`);
    return errors;
  }

  const required = REQUIRED_BY_VERSION[json.version];
  for (const field of required) {
    if (!(field in json)) {
      errors.push(`Missing required field (v${json.version}): "${field}"`);
    }
  }

  return errors;
}

async function main() {
  const input = await readStdin();

  const filePath = input.tool_input && input.tool_input.file_path;
  if (!isStateFile(filePath)) {
    // Not an agentic-workflow state file — allow.
    process.exit(0);
  }

  let newContent;
  try {
    if (input.tool_input && input.tool_input.content) {
      newContent = JSON.parse(input.tool_input.content);
    } else if (input.tool_input && input.tool_input.new_string) {
      // Edit operation — new_string is a partial fragment. Fragments are
      // usually not standalone-parseable JSON (e.g. `"round": 3,`), so any
      // parse check here false-rejects legitimate edits. Fail open; the
      // orchestrator runs the authoritative CLI validator after the write.
      process.exit(0);
    } else {
      // Cannot determine content — allow (fail open).
      process.exit(0);
    }
  } catch (e) {
    console.error(`State file write rejected: invalid JSON — ${e.message}`);
    process.exit(2);
  }

  const errors = validateState(newContent);
  if (errors.length > 0) {
    console.error('State file write rejected: validation failed');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(2);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(`Hook error: ${err.message}`);
  // Fail open — internal errors must not block legitimate writes.
  process.exit(0);
});
