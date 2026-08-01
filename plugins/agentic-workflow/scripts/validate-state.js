#!/usr/bin/env node
'use strict';
// validate-state.js — Validate agentic-workflow state JSON against schema
//
// Usage:
//   node scripts/validate-state.js <state-file>
//   node scripts/validate-state.js --state <state-file>
//   node scripts/validate-state.js --loop <state-file>
//   node scripts/validate-state.js --graph <state-file>
//
// Detects version (1 = coding-pipeline/ralph-pipeline, 2 = ralph-graph) and runs
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
// opt() makes a validator skip when the field is absent (undefined) — version=1
// is shared by coding-pipeline and ralph-pipeline, whose schemas differ:
//   - prior_cycles_summary / critical_checkpoints: coding-only (field-map.md marks 否)
//   - task.root_cause_group: coding-only ("仅编程领域")
//   - task.subtask_of: present in both but omitted on top-level tasks
// Making these required would reject valid ralph-pipeline.json.
function opt(fn) {
  return v => v === undefined ? null : fn(v);
}

const fieldsV1 = {
  version: v => v === 1 ? null : `version must be 1, got ${v}`,
  prompt: v => typeof v === 'string' ? null : `prompt must be string, got ${typeof v}`,
  max_iterations: v => Number.isInteger(v) && v >= 0 ? null : `max_iterations must be non-negative integer, got ${v}`,
  completion_promise: v => v === null || typeof v === 'string' ? null : `completion_promise must be null or string, got ${typeof v}`,
  outer_iteration: v => Number.isInteger(v) && v >= 0 ? null : `outer_iteration must be non-negative integer, got ${v}`,
  tasks: v => Array.isArray(v) ? null : `tasks must be an array, got ${typeof v}`,
  consecutive_failures: v => Number.isInteger(v) && v >= 0 ? null : `consecutive_failures must be non-negative integer, got ${v}`,
  stall_counter: v => Number.isInteger(v) && v >= 0 ? null : `stall_counter must be non-negative integer, got ${v}`,
  fail_history: v => Array.isArray(v) ? null : `fail_history must be an array, got ${typeof v}`,
  round: v => Number.isInteger(v) && v >= 0 ? null : `round must be non-negative integer, got ${v}`,
  stop_reason: v => v === null || typeof v === 'string' ? null : `stop_reason must be null or string, got ${typeof v}`,
  prior_cycles_summary: opt(v => typeof v === 'string' ? null : `prior_cycles_summary must be string, got ${typeof v}`),
  critical_checkpoints: opt(v => Array.isArray(v) ? null : `critical_checkpoints must be array, got ${typeof v}`),
  // forbidden_scope: persisted by orchestrator at init so block-forbidden-scope
  // hook (separate process) can enforce the declared boundary. Optional for
  // backward compat with state files written before this field existed.
  forbidden_scope: opt(v => Array.isArray(v) && v.every(x => typeof x === 'string') ? null : `forbidden_scope must be string array, got ${typeof v}`),
  // verification_status: persisted by orchestrator each round so
  // check-verification-on-stop hook can block stop when verification not passed.
  verification_status: opt(v => v === null || ['pass', 'fail', 'missing'].includes(v) ? null : `verification_status must be null|pass|fail|missing, got ${JSON.stringify(v)}`),
};

const fieldsV2 = {
  version: v => v === 2 ? null : `version must be 2, got ${v}`,
  prompt: fieldsV1.prompt,
  max_iterations: fieldsV1.max_iterations,
  completion_promise: fieldsV1.completion_promise,
  outer_iteration: fieldsV1.outer_iteration,
  nodes: v => v && typeof v === 'object' && !Array.isArray(v) ? null : `nodes must be object, got ${typeof v}`,
  active_set: v => Array.isArray(v) ? null : `active_set must be array, got ${typeof v}`,
  consecutive_failures: fieldsV1.consecutive_failures,
  stall_counter: fieldsV1.stall_counter,
  fail_history: fieldsV1.fail_history,
  round: fieldsV1.round,
  stop_reason: fieldsV1.stop_reason,
  forbidden_scope: fieldsV1.forbidden_scope,
  verification_status: fieldsV1.verification_status,
};

function unknownFields(obj, allowed, label) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.keys(obj)
    .filter((key) => !allowed.has(key))
    .map((key) => `${label}.${key}: unknown field`);
}

const taskFieldsV1 = {
  id: v => typeof v === 'string' && v.length > 0 ? null : `task.id must be non-empty string, got ${JSON.stringify(v)}`,
  title: v => typeof v === 'string' ? null : `task.title must be string, got ${typeof v}`,
  status: v => ['pending', 'in_progress', 'done', 'blocked'].includes(v) ? null : `task.status must be pending|in_progress|done|blocked, got ${JSON.stringify(v)}`,
  depends_on: v => Array.isArray(v) ? null : `task.depends_on must be array, got ${typeof v}`,
  accept_criteria: v => Array.isArray(v) && v.every(x => typeof x === 'string') ? null : `task.accept_criteria must be string array`,
  failures: v => Number.isInteger(v) && v >= 0 ? null : `task.failures must be non-negative integer, got ${v}`,
  root_cause_group: opt(v => typeof v === 'string' ? null : `task.root_cause_group must be string, got ${typeof v}`),
  subtask_of: opt(v => v === null || typeof v === 'string' ? null : `task.subtask_of must be null or string, got ${typeof v}`),
};

const nodeFieldsV2 = {
  status: taskFieldsV1.status,
  failures: taskFieldsV1.failures,
  result: v => v === null || typeof v === 'string' || typeof v === 'object' ? null : `node.result must be null|string|object`,
  subtask_of: taskFieldsV1.subtask_of,
};

const ROOT_FIELDS_V1 = new Set(Object.keys(fieldsV1));
const ROOT_FIELDS_V2 = new Set(Object.keys(fieldsV2));
const TASK_FIELDS = new Set(Object.keys(taskFieldsV1));
const NODE_FIELDS = new Set(Object.keys(nodeFieldsV2));

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
    errors.push(...unknownFields(t, TASK_FIELDS, `tasks[${i}]`));
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
  for (const t of tasks) graph.set(t.id, (t.depends_on || []).filter(d => graph.has(d) || tasks.some(x => x.id === d))); // intentional-simple: O(n²) filter, fine for <100 tasks
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
    errors.push(...unknownFields(n, NODE_FIELDS, `nodes.${id}`));
    for (const [key, validator] of Object.entries(nodeFieldsV2)) {
      const err = validator(n[key]);
      if (err) errors.push(`nodes.${id}.${key}: ${err}`);
    }
  }
  return errors;
}
const failHistoryItemFieldsV1 = {
  task_id: v => typeof v === 'string' && v.length > 0 ? null : `fail_history[].task_id must be non-empty string, got ${JSON.stringify(v)}`,
  round: v => Number.isInteger(v) && v >= 0 ? null : `fail_history[].round must be non-negative integer, got ${v}`,
  reason: v => typeof v === 'string' ? null : `fail_history[].reason must be string, got ${typeof v}`,
};

const failHistoryItemFieldsV2 = {
  node_id: v => typeof v === 'string' && v.length > 0 ? null : `fail_history[].node_id must be non-empty string, got ${JSON.stringify(v)}`,
  round: failHistoryItemFieldsV1.round,
  reason: failHistoryItemFieldsV1.reason,
};

function validateFailHistory(history, fieldMap) {
  const errors = [];
  if (!Array.isArray(history)) return errors;
  if (history.length > 10) errors.push(`fail_history must have at most 10 items, got ${history.length}`);
  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    if (!item || typeof item !== 'object') { errors.push(`fail_history[${i}] must be object`); continue; }
    errors.push(...unknownFields(item, new Set(Object.keys(fieldMap)), `fail_history[${i}]`));
    for (const [key, validator] of Object.entries(fieldMap)) {
      const err = validator(item[key]);
      if (err) errors.push(`fail_history[${i}].${key}: ${err}`);
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
    errors.push(...unknownFields(obj, ROOT_FIELDS_V1, 'root'));
    if (Array.isArray(obj.tasks)) errors.push(...validateTasks(obj.tasks));
    if (Array.isArray(obj.tasks)) {
      const cycle = checkCycles(obj.tasks);
      if (cycle) errors.push(`Circular dependency detected: ${cycle.join(' → ')} → ${cycle[0]}`);
    }
    if (Array.isArray(obj.fail_history)) errors.push(...validateFailHistory(obj.fail_history, failHistoryItemFieldsV1));
  } else if (version === 2) {
    errors = validate(obj, fieldsV2, 'root');
    errors.push(...unknownFields(obj, ROOT_FIELDS_V2, 'root'));
    if (obj.nodes) errors.push(...validateNodes(obj.nodes));
    if (Array.isArray(obj.fail_history)) errors.push(...validateFailHistory(obj.fail_history, failHistoryItemFieldsV2));
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
