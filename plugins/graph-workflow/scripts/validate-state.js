#!/usr/bin/env node
'use strict';
// validate-state.js — graph-workflow 状态文件独立校验(对照 scripts/state-schema.json)
//
// 与根 scripts/validate-state.js(agentic-workflow 专用,字段名不兼容)独立,互不影响。
//
// 用法:
//   node scripts/validate-state.js <state-file>
//
// 退出码: 0=通过; 非零=失败,stderr 输出诊断。
//
// 校验内容:
//   - 公共必填字段存在 + 类型 + enum
//   - version=1(loop-task):单节点自环字段
//   - version=2(graph-run):图拓扑(graph.entry/nodes/edges, current_node, node_states)
//   - 跨字段一致性:status=blocked 时 blocker 必填;changes_requested 时 review_notes 建议填

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = ['version', 'task_id', 'task_type', 'iteration', 'phase', 'status', 'goal_met', 'progress_delta', 'review'];
const VALID_STATUSES = ['pending', 'pass', 'fail', 'blocked', 'stalled', 'done'];
const VALID_PHASES = ['init', 'orchestrate', 'exec', 'verify', 'review', 'fix', 'done', 'aborted'];
const VALID_TASK_TYPES = ['task', 'graph'];
const VALID_REVIEWS = ['pending', 'approved', 'changes_requested'];

const args = process.argv.slice(2);
const stateFile = args[0];

if (!stateFile) {
  console.error(`用法: node ${path.basename(__filename)} <state-file>`);
  process.exit(64);
}

let content;
try {
  content = fs.readFileSync(stateFile, 'utf-8');
} catch (e) {
  console.error(`错误: 无法读取 ${stateFile} — ${e.message}`);
  process.exit(64);
}

let json;
try {
  json = JSON.parse(content);
} catch (e) {
  console.error(`错误: ${stateFile} 不是合法 JSON — ${e.message}`);
  process.exit(1);
}

const errs = [];
const warns = [];

function check(cond, msg) {
  if (!cond) errs.push(msg);
}

// ─── 公共必填字段 ───
for (const f of REQUIRED_FIELDS) {
  check(f in json, `缺少必填字段: "${f}"`);
}

// ─── version 分支 ───
check(json.version === 1 || json.version === 2, `version 必须为 1 或 2,实际: ${json.version ?? '空'}`);

if (json.version !== 1 && json.version !== 2) {
  // 无法继续分支校验
  summarize();
}

// ─── 类型 / enum ───
if (VALID_TASK_TYPES.includes(json.task_type)) {
  // ok
} else {
  check(false, `task_type 非法: "${json.task_type}" (期望: task | graph)`);
}

check(VALID_PHASES.includes(json.phase), `phase 非法: "${json.phase}"`);
check(VALID_STATUSES.includes(json.status), `status 非法: "${json.status}"`);
check(typeof json.goal_met === 'boolean', `goal_met 必须为 boolean,实际: ${typeof json.goal_met}`);
check(VALID_REVIEWS.includes(json.review), `review 非法: "${json.review}"`);
check(typeof json.progress_delta === 'number' && json.progress_delta >= 0 && json.progress_delta <= 1,
  `progress_delta 必须为 0~1 数字,实际: ${json.progress_delta}`);
check(Number.isInteger(json.iteration) && json.iteration >= 0,
  `iteration 必须为非负整数,实际: ${json.iteration}`);
check(typeof json.task_id === 'string' && json.task_id.length > 0,
  `task_id 不能为空`);

// ─── 跨字段一致性 ───
if (json.status === 'blocked') {
  check(json.blocker != null && json.blocker !== '', 'status=blocked 时 blocker 必填');
}
if (json.review === 'changes_requested') {
  if (json.review_notes == null || json.review_notes === '') {
    warns.push('review=changes_requested 时 review_notes 建议填写具体修改建议');
  }
}

// ─── version 分支特有校验 ───
if (json.version === 1) {
  if ('graph' in json) {
    warns.push('version=1 通常不含 graph 字段(该字段为 version=2 图编排专用)');
  }
  check(Array.isArray(json.history), 'history 应为数组(跨轮上下文)');
}

if (json.version === 2) {
  check('graph' in json, 'version=2 必须含 graph 字段(图拓扑)');

  if ('graph' in json) {
    const g = json.graph;
    for (const gf of ['entry', 'nodes', 'edges']) {
      check(g && typeof g === 'object' && gf in g, `graph 缺少必填字段: "${gf}"`);
    }
    if (Array.isArray(g.nodes)) {
      const badNode = g.nodes.some(n => !n.id || !n.role);
      check(!badNode, 'graph.nodes 存在缺少 id 或 role 的节点');
      const badRole = g.nodes.some(n => !['executor', 'reviewer', 'fixer'].includes(n.role));
      check(!badRole, 'graph.nodes[].role 只能为 executor/reviewer/fixer');
    }
    if (Array.isArray(g.edges)) {
      const badEdge = g.edges.some(e => !e.from || !e.to);
      check(!badEdge, 'graph.edges 存在缺少 from 或 to 的边');
    }
  }

  check(json.node_states && typeof json.node_states === 'object' && !Array.isArray(json.node_states),
    'version=2 的 node_states 必须为对象');
}

function summarize() {
  for (const w of warns) {
    console.error(`  ⚠ 警告: ${w}`);
  }
  if (errs.length > 0) {
    console.error(`❌ 校验失败: ${stateFile}`);
    for (const e of errs) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }
  console.log(`✅ 校验通过: ${stateFile} (version=${json.version})`);
  process.exit(0);
}

summarize();
