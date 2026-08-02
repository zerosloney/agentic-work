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
// SYNC: 以下枚举与 scripts/state-schema.json 的 enum 保持一致。schema 改 enum 时必须同步此处,
// 否则 hook 会用旧值误拒合法状态写入。drift 风险已知;动态读取 schema 见 G-008 待办。
const REQUIRED_FIELDS = ['version', 'task_id', 'task_type', 'iteration', 'phase', 'status', 'goal_met', 'progress_delta', 'review'];
const VALID_STATUSES = ['pending', 'pass', 'fail', 'blocked', 'stalled', 'done'];
const VALID_PHASES = ['init', 'orchestrate', 'exec', 'verify', 'review', 'fix', 'done', 'aborted'];
const VALID_TASK_TYPES = ['task', 'graph'];
const VALID_REVIEWS = ['pending', 'approved', 'changes_requested'];

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      process.stdin.destroy();
      reject(new Error('Timed out waiting for hook input'));
    }, 3000);
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => {
      try { finish(resolve, JSON.parse(data)); }
      catch (e) { finish(reject, new Error('Invalid JSON on stdin: ' + e.message)); }
    });
    process.stdin.on('error', e => finish(reject, e));
  });
}

function isStateFile(filePath) {
  if (!filePath) return false;
  const relative = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (/^scripts\/loop-state\/[^/]+\.json$/i.test(relative)) return true;
  const resolved = path.resolve(filePath);
  const pluginRoots = [
    process.env.ZCODE_PLUGIN_ROOT,
    process.env.CODEBUDDY_PLUGIN_ROOT,
    process.env.TRAE_PLUGIN_ROOT,
    process.env.QODER_PLUGIN_ROOT,
    process.env.CLAUDE_PLUGIN_ROOT
  ].filter(Boolean).map(root => path.resolve(root, 'scripts', 'loop-state'));
  // Fallback supports local development and platforms that omit the root env.
  pluginRoots.push(path.resolve('scripts', 'loop-state'));
  const normalize = value => {
    const normalized = path.normalize(value);
    return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
  };
  return path.basename(resolved).endsWith('.json') &&
    pluginRoots.some(root => normalize(path.dirname(resolved)) === normalize(root));
}

function materializeEdit(filePath, toolInput) {
  if (typeof toolInput.old_string !== 'string' || typeof toolInput.new_string !== 'string') {
    throw new Error('Edit state writes must include old_string and new_string');
  }
  const resolved = path.resolve(filePath);
  const current = fs.readFileSync(resolved, 'utf-8');
  const start = current.indexOf(toolInput.old_string);
  if (start < 0) throw new Error('old_string was not found in the state file');
  if (current.indexOf(toolInput.old_string, start + toolInput.old_string.length) >= 0) {
    throw new Error('old_string is ambiguous in the state file');
  }
  return current.slice(0, start) + toolInput.new_string + current.slice(start + toolInput.old_string.length);
}

function validateState(json) {
  const errors = [];

  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    return ['State content must be a JSON object'];
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in json)) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  if (json.status === undefined || !VALID_STATUSES.includes(json.status)) {
    errors.push(`Invalid status: "${json.status}" (expected: ${VALID_STATUSES.join(' | ')})`);
  }
  if (json.phase === undefined || !VALID_PHASES.includes(json.phase)) {
    errors.push(`Invalid phase: "${json.phase}" (expected: ${VALID_PHASES.join(' | ')})`);
  }
  if (json.task_type === undefined || !VALID_TASK_TYPES.includes(json.task_type)) {
    errors.push(`Invalid task_type: "${json.task_type}" (expected: ${VALID_TASK_TYPES.join(' | ')})`);
  }
  if (json.review === undefined || !VALID_REVIEWS.includes(json.review)) {
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
  if (json.version === undefined || ![1, 2].includes(json.version)) {
    errors.push(`Invalid version: ${json.version} (expected: 1 | 2)`);
  }
  if (json.version === 1 && json.task_type !== 'task') {
    errors.push('Version 1 state must have task_type "task"');
  }
  if (json.version === 2 && json.task_type !== 'graph') {
    errors.push('Version 2 state must have task_type "graph"');
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
    if (input.tool_input && typeof input.tool_input.content === 'string') {
      newContent = JSON.parse(input.tool_input.content);
    } else if (input.tool_input && typeof input.tool_input.new_string === 'string') {
      const finalContent = materializeEdit(filePath, input.tool_input);
      newContent = JSON.parse(finalContent);
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
