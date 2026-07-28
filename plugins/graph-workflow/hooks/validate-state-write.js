#!/usr/bin/env node
'use strict';
// validate-state-write.js — PreToolUse hook: validate state JSON before write
//
// Intercepts Write/Edit operations on files under scripts/loop-state/.
// Validates JSON structure against required fields from state-schema.json.
// Exits 0 = allow, exit 2 = deny.

const fs = require('fs');
const path = require('path');

// ─── Minimal schema check (subset of state-schema.json required fields) ───
const REQUIRED_FIELDS = ['version', 'task_id', 'task_type', 'iteration', 'phase', 'status', 'goal_met', 'progress_delta', 'review'];
const VALID_STATUSES = ['pending', 'pass', 'fail', 'blocked', 'stalled', 'done'];
const VALID_PHASES = ['init', 'orchestrate', 'exec', 'verify', 'review', 'fix', 'done', 'aborted'];
const VALID_TASK_TYPES = ['task', 'graph'];
const VALID_REVIEWS = ['pending', 'approved', 'changes_requested'];

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
  return /loop-state\/[^/]+\.json$/.test(normalized);
}

function validateState(json) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (!(field in json)) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  if (json.status && !VALID_STATUSES.includes(json.status)) {
    errors.push(`Invalid status: "${json.status}" (expected: ${VALID_STATUSES.join(' | ')})`);
  }
  if (json.phase && !VALID_PHASES.includes(json.phase)) {
    errors.push(`Invalid phase: "${json.phase}" (expected: ${VALID_PHASES.join(' | ')})`);
  }
  if (json.task_type && !VALID_TASK_TYPES.includes(json.task_type)) {
    errors.push(`Invalid task_type: "${json.task_type}" (expected: ${VALID_TASK_TYPES.join(' | ')})`);
  }
  if (json.review && !VALID_REVIEWS.includes(json.review)) {
    errors.push(`Invalid review: "${json.review}" (expected: ${VALID_REVIEWS.join(' | ')})`);
  }
  if (json.goal_met !== undefined && typeof json.goal_met !== 'boolean') {
    errors.push(`Invalid goal_met: expected boolean, got ${typeof json.goal_met}`);
  }
  if (json.progress_delta !== undefined) {
    if (typeof json.progress_delta !== 'number' || json.progress_delta < 0 || json.progress_delta > 1) {
      errors.push(`Invalid progress_delta: expected number 0~1, got ${json.progress_delta}`);
    }
  }
  if (json.version !== undefined && ![1, 2].includes(json.version)) {
    errors.push(`Invalid version: ${json.version} (expected: 1 | 2)`);
  }

  return errors;
}

async function main() {
  const input = await readStdin();

  // Extract file_path from tool_input
  const filePath = input.tool_input && input.tool_input.file_path;
  if (!isStateFile(filePath)) {
    // Not a state file — allow
    process.exit(0);
  }

  // Read the new content being written
  let newContent;
  try {
    if (input.tool_input && input.tool_input.content) {
      newContent = JSON.parse(input.tool_input.content);
    } else if (input.tool_input && input.tool_input.new_string) {
      // Edit operation — new_string is partial, can't fully validate
      // Just check it's valid JSON
      JSON.parse(input.tool_input.new_string);
      process.exit(0);
    } else {
      // Can't determine content — allow
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

  // Valid — allow
  process.exit(0);
}

main().catch(err => {
  console.error(`Hook error: ${err.message}`);
  // On internal error, allow (fail open to avoid blocking legitimate writes)
  process.exit(0);
});
