#!/usr/bin/env node
'use strict';
// migrate-state.js — Migrate state files between schema versions.
//
// Two state families are supported (auto-detected by shape):
//
//   A) graph-workflow (scripts/loop-state/task-*.json):
//      v1 loop-task single-node cycle → v2 graph-run declarative graph.
//      The injected graph is DEFAULT_GRAPH from graph-run.sh, semantically
//      equivalent to the v1 exec→review→fix loop.
//
//   B) agentic-workflow (.loop-cli/state/ralph-pipeline.json):
//      v1 ralph-pipeline (tasks[]) → v2 ralph-graph (nodes{} + active_set[]).
//      Task metadata (title/depends_on/accept_criteria) is preserved inside
//      each node object; the validator only checks status/failures/result and
//      tolerates extra fields. active_set is recomputed as the ready set:
//      pending tasks whose depends_on are all done.
//
// Usage:
//   node scripts/migrate-state.js <state-file>                # in-place (writes .bak first)
//   node scripts/migrate-state.js <state-file> --dry-run      # preview only
//   node scripts/migrate-state.js <state-file> --out <file>   # write to a new file
//   node scripts/migrate-state.js <state-file> --no-backup    # in-place without .bak
//
// Exit codes: 0 = migrated (or already v2 / dry-run OK), 1 = error,
//             3 = unsupported version, 4 = already v2 (no-op, not an error).

const fs = require('fs');
const path = require('path');

// Keep in sync with plugins/graph-workflow/scripts/graph-run.sh DEFAULT_GRAPH.
const DEFAULT_GRAPH = {
  entry: 'exec-1',
  nodes: [
    { id: 'exec-1', role: 'executor' },
    { id: 'review-1', role: 'reviewer' },
    { id: 'fix-1', role: 'fixer' },
  ],
  edges: [
    { from: 'exec-1', to: 'review-1' },
    { from: 'review-1', to: '__done__', when: 'approved' },
    { from: 'review-1', to: 'fix-1', when: 'changes_requested' },
    { from: 'fix-1', to: 'review-1' },
    { from: 'review-1', to: '__abort__', when: 'blocked' },
  ],
};

// v1 phase → v2 node id. 'done'/'aborted' map to null (task already terminal).
const PHASE_TO_NODE = {
  init: 'exec-1',
  orchestrate: 'exec-1',
  exec: 'exec-1',
  verify: 'review-1',
  review: 'review-1',
  fix: 'fix-1',
  done: null,
  aborted: null,
};

function parseArgs(argv) {
  const args = { file: null, dryRun: false, out: null, noBackup: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--no-backup') args.noBackup = true;
    else if (a === '--out') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --out requires a file path');
        process.exit(2);
      }
      args.out = next;
      i++;
    } else if (!a.startsWith('--') && !args.file) args.file = a;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/migrate-state.js <state-file> [--dry-run] [--out <file>] [--no-backup]');
      process.exit(0);
    }
  }
  if (!args.file) {
    console.error('Error: state file path required. See --help.');
    process.exit(2);
  }
  return args;
}

function migrateGraphWorkflowV1toV2(old) {
  const next = { ...old };
  next.version = 2;
  next.task_type = 'graph';

  // Graph topology: only inject if absent (a partial v2 file keeps its graph).
  if (!next.graph || typeof next.graph !== 'object') {
    next.graph = JSON.parse(JSON.stringify(DEFAULT_GRAPH));
  }

  // Current node from the v1 phase.
  const phase = old.phase;
  next.current_node = Object.prototype.hasOwnProperty.call(PHASE_TO_NODE, phase)
    ? PHASE_TO_NODE[phase]
    : DEFAULT_GRAPH.entry;

  // Node states: conservative — everything pending unless the v1 state shows
  // the whole task already passed, in which case mark exec/review done so the
  // graph orchestrator routes to __done__ on the next review edge.
  const nodeStates = {};
  for (const n of next.graph.nodes) nodeStates[n.id] = { status: 'pending' };
  if (old.goal_met === true || old.status === 'pass' || old.status === 'done') {
    if (nodeStates['exec-1']) {
      nodeStates['exec-1'] = { status: 'done', result: 'pass', executed_at: new Date().toISOString() };
    }
    if (old.review === 'approved' && nodeStates['review-1']) {
      nodeStates['review-1'] = { status: 'done', result: 'approved', executed_at: new Date().toISOString() };
    }
  }
  next.node_states = nodeStates;

  return next;
}

// agentic-workflow: ralph-pipeline (v1, tasks[]) → ralph-graph (v2, nodes{}+active_set[])
function migrateRalphPipelineV1toV2(old) {
  const next = { ...old };
  next.version = 2;

  const tasks = Array.isArray(old.tasks) ? old.tasks : [];
  const doneIds = new Set(tasks.filter((t) => t && t.status === 'done').map((t) => t.id));

  const nodes = {};
  for (const t of tasks) {
    if (!t || typeof t.id !== 'string') continue;
    nodes[t.id] = {
      status: t.status,
      failures: Number.isInteger(t.failures) ? t.failures : 0,
      result: t.status === 'done' ? 'done' : null,
      // Preserved metadata — validator tolerates extra fields, orchestrator may need them.
      title: t.title,
      depends_on: Array.isArray(t.depends_on) ? t.depends_on : [],
      accept_criteria: Array.isArray(t.accept_criteria) ? t.accept_criteria : [],
    };
    if (t.root_cause_group) nodes[t.id].root_cause_group = t.root_cause_group;
    if (t.subtask_of !== undefined) nodes[t.id].subtask_of = t.subtask_of;
  }

  // Ready set: pending/in_progress tasks whose dependencies are all done.
  const activeSet = tasks
    .filter((t) => t && (t.status === 'pending' || t.status === 'in_progress'))
    .filter((t) => (Array.isArray(t.depends_on) ? t.depends_on : []).every((d) => doneIds.has(d)))
    .map((t) => t.id);

  next.nodes = nodes;
  next.active_set = activeSet;
  delete next.tasks;

  return next;
}

// Detect family: graph-workflow states carry task_id+phase; ralph states carry tasks[].
function detectFamily(state) {
  if (Array.isArray(state.tasks)) return 'ralph';
  if (typeof state.task_id === 'string' || typeof state.phase === 'string') return 'graph-workflow';
  return null;
}

function main() {
  const args = parseArgs(process.argv);
  const file = path.resolve(args.file);

  let state;
  try {
    state = JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    console.error(`Error: cannot read/parse state file ${file}: ${e.message}`);
    process.exit(1);
  }

  if (state.version === 2) {
    console.log(`State is already version 2 — nothing to do: ${file}`);
    process.exit(4);
  }
  if (state.version !== 1) {
    console.error(`Error: unsupported state version: ${JSON.stringify(state.version)} (expected 1)`);
    process.exit(3);
  }

  const family = detectFamily(state);
  if (!family) {
    console.error('Error: cannot detect state family (expected tasks[] for ralph or task_id/phase for graph-workflow)');
    process.exit(1);
  }

  const migrated = family === 'ralph'
    ? migrateRalphPipelineV1toV2(state)
    : migrateGraphWorkflowV1toV2(state);

  if (args.dryRun) {
    console.log(`[dry-run] v1 → v2 migration preview (family: ${family}):`);
    console.log(`  version:    1 → 2`);
    if (family === 'ralph') {
      console.log(`  tasks[] → nodes{}: ${Object.keys(migrated.nodes).length} node(s)`);
      console.log(`  active_set (ready set): ${JSON.stringify(migrated.active_set)}`);
      console.log(`  preserved fields: prompt, max_iterations, completion_promise, outer_iteration, round, fail_history, ...`);
    } else {
      console.log(`  task_type:  ${state.task_type} → graph`);
      console.log(`  graph:      injected DEFAULT_GRAPH (entry=exec-1, 3 nodes, 5 edges)`);
      console.log(`  current_node: ${state.phase} → ${migrated.current_node}`);
      console.log(`  node_states: ${JSON.stringify(migrated.node_states)}`);
      console.log(`  preserved fields: task_id, objective, goal_criteria, iteration, phase, status, goal_met, review, history, ...`);
    }
    process.exit(0);
  }

  const target = args.out ? path.resolve(args.out) : file;
  if (!args.out && !args.noBackup) {
    const bak = `${file}.bak`;
    fs.copyFileSync(file, bak);
    console.log(`  backup written: ${bak}`);
  }
  fs.writeFileSync(target, JSON.stringify(migrated, null, 2) + '\n');
  console.log(`✅ migrated v1 → v2 (${family}): ${target}`);
  if (family === 'ralph') {
    console.log('   verify with: node scripts/validate-state.js --graph ' + target);
  } else {
    console.log('   verify with: node plugins/graph-workflow/scripts/validate-state.js ' + target);
  }
}

main();
