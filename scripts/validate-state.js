#!/usr/bin/env node
'use strict';
// validate-state.js — Validate loop-workflow state JSON against schema
//
// Usage:
//   node scripts/validate-state.js <state-file>
//   node scripts/validate-state.js --state <state-file>
//   node scripts/validate-state.js --loop <state-file>
//   node scripts/validate-state.js --graph <state-file>
//
// Detects version (1 = coding-loop/ralph-loop, 2 = ralph-graph) and runs
// the appropriate schema. Exits 0 on success, non-zero with diagnostics on
// failure.

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { file: null, version: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--loop') { args.version = 1; args.file = argv[++i]; }
    else if (argv[i] === '--graph') { args.version = 2; args.file = argv[++i]; }
    else if (argv[i] === '--state') { args.file = argv[++i]; }
    else if (!args.file && !argv[i].startsWith('--')) args.file = argv[i];
  }
  return args;
}

// Field-level validators return either null (ok) or a string (error message).
const fieldsV1 = {
  version: v => v === 1 ? null : `version must be 1, got ${v}`,
  tasks: v => Array.isArray(v) ? null : `tasks must be an array, got ${typeof v}`,
  consecutive_failures: v => Number.isInteger(v) && v >= 0 ? null : `consecutive_failures must be non-negative integer, got ${v}`,
  stall_counter: v => Number.isInteger(v) && v >= 0 ? null : `stall_counter must be non-negative integer, got ${v}`,
  fail_history: v => Array.isArray(v) ? null : `fail_history must be an array, got ${typeof v}`,
  round: v => Number.isInteger(v) && v >= 0 ? null : `round must be non-negative integer, got ${v}`,
  stop_reason: v => v === null || typeof v === 'string' ? null : `stop_reason must be null or string, got ${typeof v}`,
  prior_cycles_summary: v => typeof v === 'string' ? null : `prior_cycles_summary must be string, got ${typeof v}`,
  critical_checkpoints: v => Array.isArray(v) ? null : `critical_checkpoints must be array, got ${typeof v}`,
};

const fieldsV2 = {
  version: v => v === 2 ? null : `version must be 2, got ${v}`,
  nodes: v => v && typeof v === 'object' && !Array.isArray(v) ? null : `nodes must be object, got ${typeof v}`,
  active_set: v => Array.isArray(v) ? null : `active_set must be array, got ${typeof v}`,
  consecutive_failures: fieldsV1.consecutive_failures,
  stall_counter: fieldsV1.stall_counter,
  fail_history: fieldsV1.fail_history,
  round: fieldsV1.round,
  stop_reason: fieldsV1.stop_reason,
};

const taskFieldsV1 = {
  id: v => typeof v === 'string' && v.length > 0 ? null : `task.id must be non-empty string, got ${JSON.stringify(v)}`,
  title: v => typeof v === 'string' ? null : `task.title must be string, got ${typeof v}`,
  status: v => ['pending', 'in_progress', 'done', 'blocked'].includes(v) ? null : `task.status must be pending|in_progress|done|blocked, got ${JSON.stringify(v)}`,
  depends_on: v => Array.isArray(v) ? null : `task.depends_on must be array, got ${typeof v}`,
  accept_criteria: v => Array.isArray(v) && v.every(x => typeof x === 'string') ? null : `task.accept_criteria must be string array`,
  failures: v => Number.isInteger(v) && v >= 0 ? null : `task.failures must be non-negative integer, got ${v}`,
};

const nodeFieldsV2 = {
  status: taskFieldsV1.status,
  failures: taskFieldsV1.failures,
  result: v => v === null || typeof v === 'string' || typeof v === 'object' ? null : `node.result must be null|string|object`,
};

function validate(obj, fieldMap, label) {
  const errors = [];
  for (const [key, validator] of Object.entries(fieldMap)) {
    const err = validator(obj[key]);
    if (err) errors.push(`${label}.${key}: ${err}`);
  }
  return errors;
}

function validateTasks(tasks) {
  const errors = [];
  if (!Array.isArray(tasks)) return [`tasks must be array`];
  const seenIds = new Set();
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    if (!t || typeof t !== 'object') { errors.push(`tasks[${i}] must be object`); continue; }
    for (const [key, validator] of Object.entries(taskFieldsV1)) {
      const err = validator(t[key]);
      if (err) errors.push(`tasks[${i}].${key}: ${err}`);
    }
    if (typeof t.id === 'string') {
      if (seenIds.has(t.id)) errors.push(`tasks[${i}].id: duplicate id "${t.id}"`);
      seenIds.add(t.id);
    }
  }
  for (let i = 0; i < tasks.length; i++) {
    if (!Array.isArray(tasks[i].depends_on)) continue;
    for (const depId of tasks[i].depends_on) {
      if (!seenIds.has(depId)) errors.push(`tasks[${i}].depends_on: unknown id "${depId}"`);
    }
  }
  return errors;
}

function checkCycles(tasks) {
  const graph = new Map();
  for (const t of tasks) graph.set(t.id, (t.depends_on || []).filter(d => graph.has(d) || tasks.some(x => x.id === d)));
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  for (const id of graph.keys()) color.set(id, WHITE);
  function dfs(id, path) {
    if (color.get(id) === GRAY) return [...path, id];
    if (color.get(id) === BLACK) return null;
    color.set(id, GRAY);
    path.push(id);
    for (const dep of graph.get(id)) {
      const cycle = dfs(dep, [...path]);
      if (cycle) return cycle;
    }
    color.set(id, BLACK);
    return null;
  }
  for (const id of graph.keys()) {
    const cycle = dfs(id, []);
    if (cycle) return cycle;
  }
  return null;
}

function validateNodes(nodes) {
  const errors = [];
  if (!nodes || typeof nodes !== 'object') return [`nodes must be object`];
  const seenIds = new Set();
  for (const [id, n] of Object.entries(nodes)) {
    seenIds.add(id);
    if (!n || typeof n !== 'object') { errors.push(`nodes.${id} must be object`); continue; }
    for (const [key, validator] of Object.entries(nodeFieldsV2)) {
      const err = validator(n[key]);
      if (err) errors.push(`nodes.${id}.${key}: ${err}`);
    }
  }
  return errors;
}

function detectVersion(obj) {
  if (obj && typeof obj === 'object') {
    if (obj.version === 1) return 1;
    if (obj.version === 2) return 2;
  }
  return null;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    console.error('Usage: node scripts/validate-state.js <state-file>');
    process.exit(2);
  }
  const file = path.resolve(args.file);
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(2);
  }
  let raw;
  try { raw = fs.readFileSync(file, 'utf-8'); }
  catch (err) { console.error(`Read error: ${err.message}`); process.exit(2); }
  let obj;
  try { obj = JSON.parse(raw); }
  catch (err) { console.error(`Invalid JSON: ${err.message}`); process.exit(1); }

  const version = args.version || detectVersion(obj);
  if (!version) {
    console.error('Cannot detect schema version (version field missing or not 1/2)');
    process.exit(1);
  }

  let errors = [];
  if (version === 1) {
    errors = validate(obj, fieldsV1, 'root');
    if (Array.isArray(obj.tasks)) errors.push(...validateTasks(obj.tasks));
    if (Array.isArray(obj.tasks)) {
      const cycle = checkCycles(obj.tasks);
      if (cycle) errors.push(`Circular dependency detected: ${cycle.join(' → ')} → ${cycle[0]}`);
    }
  } else if (version === 2) {
    errors = validate(obj, fieldsV2, 'root');
    if (obj.nodes) errors.push(...validateNodes(obj.nodes));
  }

  if (errors.length === 0) {
    console.log(`✓ ${file} is valid (version=${version})`);
    process.exit(0);
  } else {
    console.error(`✗ ${file} failed validation (version=${version}):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

main();