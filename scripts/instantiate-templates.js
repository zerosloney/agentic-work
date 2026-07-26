#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'loop-workflow', 'templates');
const OUT_BASE = path.join(ROOT, 'plugins', 'loop-workflow');
const PLATFORMS = ['opencode', 'codebuddy', 'zcode'];

// 占位符替换表（与 spec §6.2 一致）
const AGENT_MAP = {
  'coding-orchestrator.md':  { name: 'coding-orchestrator',  desc: 'Coding-Loop 主控 Agent：编排 executor/reviewer，按 scope drift 零容忍门禁停止。', exe: 'coding-builder',     rev: 'coding-reviewer',     engine: '' },
  'coding-executor.md':      { name: 'coding-builder',       desc: 'Coding-Loop 受控编码 Builder：声明 scope 内编码、按根因分组修复、真实验证。',   exe: null,                rev: null,                engine: '' },
  'coding-reviewer.md':      { name: 'coding-reviewer',      desc: 'Coding-Loop 只读审查 Agent：scope drift 检测、根因归并、verdict 输出。',          exe: null,                rev: null,                engine: '' },
  'ralph-orchestrator.md':   { name: 'ralph-orchestrator',   desc: 'Ralph 主控 Agent：TaskList 编排，背压熔断门禁决定停止。',                       exe: 'ralph-worker',       rev: 'ralph-reviewer',     engine: 'loop' },
  'ralph-executor.md':       { name: 'ralph-worker',         desc: 'Ralph Loop 执行者：单任务执行、运行验证、原样回报。',                            exe: null,                rev: null,                engine: '' },
  'ralph-reviewer.md':       { name: 'ralph-reviewer',       desc: 'Ralph Loop 只读质量阀：accept_criteria 复核、verdict 输出。',                   exe: null,                rev: null,                engine: '' },
  'testing-orchestrator.md': { name: 'test-orchestrator',    desc: 'Test-Loop 主控 Agent：源码冻结，三项验证信号驱动停止。',                       exe: 'test-writer',        rev: 'coverage-reviewer',  engine: '' },
  'testing-executor.md':     { name: 'test-writer',          desc: 'Test-Loop 执行者：仅写测试、源码冻结、回报三项信号。',                          exe: null,                rev: null,                engine: '' },
  'testing-reviewer.md':     { name: 'coverage-reviewer',    desc: 'Test-Loop 只读质量阀：三项信号 + 源码冻结双保险。',                            exe: null,                rev: null,                engine: '' },
  'writing-orchestrator.md': { name: 'writing-orchestrator', desc: 'Writing-Loop 主控 Agent：写作边界，三项质量信号驱动停止（弱门禁）。',         exe: 'writing-author',     rev: 'writing-reviewer',   engine: '' },
  'writing-executor.md':     { name: 'writing-author',       desc: 'Writing-Loop 执行者：仅写文档、术语一致、链接可达。',                          exe: null,                rev: null,                engine: '' },
  'writing-reviewer.md':     { name: 'writing-reviewer',     desc: 'Writing-Loop 只读质量阀：术语漂移/死链/代码示例三项扫描。',                    exe: null,                rev: null,                engine: '' }
};

// backpressure 配置块（spec §6.3）
const BACKPRESSURE = {
  'coding-orchestrator.md':  '### 背压（coding 域）\n- MAX_CYCLES = 8（>8 轮未 DONE 强制停止）\n- STALL_MAX = 2（连续 2 轮任务状态签名无变化 → STALL）\n- 失败计数达到 3 → 立即 ESCALATE\n- 风险评估默认 medium；用户描述含"生产 / 安全 / 数据迁移"→ high',
  'ralph-orchestrator.md':   '### 背压（ralph 域）\n- MAX_CYCLES = 10（>10 轮未 DONE 强制停止）\n- STALL_MAX = 3（连续 3 轮状态签名无变化 → STALL）\n- 失败计数达到 max_failures → 立即 ESCALATE（默认 max_failures=3）',
  'testing-orchestrator.md': '### 背压（testing 域）\n- MAX_CYCLES = 8（>8 轮未 DONE 强制停止）\n- STALL_MAX = 2（连续 2 轮任务状态签名无变化 → STALL）\n- 三项信号必须全达标：coverage.lines ≥ 80%、mutation_score ≥ 60%、empty_assertions_count == 0\n- 失败计数达到 3 → 立即 ESCALATE',
  'writing-orchestrator.md': '### 背压（writing 域）\n- MAX_CYCLES = 6（>6 轮未 DONE 强制停止）\n- STALL_MAX = 2（连续 2 轮状态签名无变化 → STALL）\n- 三项信号必须全达标：terminology_drift_count == 0、broken_links_count == 0、code_example_errors == 0\n- 失败计数达到 2 → 立即 ESCALATE（弱门禁，retry_on_failure=false）'
};

const COMMAND_MAP = {
  'coding-loop.md':   { name: 'coding-loop',   desc: 'Coding-Loop: 受控编码/审查闭环',            agent: 'coding-orchestrator',   exe: 'coding-builder',     rev: 'coding-reviewer' },
  'ralph-loop.md':    { name: 'ralph-loop',    desc: 'Ralph-Loop: 通用编排执行审查闭环（线性）', agent: 'ralph-orchestrator',    exe: 'ralph-worker',       rev: 'ralph-reviewer' },
  'ralph-graph.md':   { name: 'ralph-graph',   desc: 'Ralph-Graph: 通用编排执行审查闭环（DAG 路由表）', agent: 'ralph-orchestrator', exe: 'ralph-worker',       rev: 'ralph-reviewer' },
  'testing-loop.md':  { name: 'test-loop',     desc: 'Test-Loop: 三项验证信号驱动的测试编写闭环（源码冻结）', agent: 'test-orchestrator', exe: 'test-writer',      rev: 'coverage-reviewer' },
  'writing-loop.md':  { name: 'writing-loop',  desc: 'Writing-Loop: 文档写作质量信号闭环（写作边界）',     agent: 'writing-orchestrator', exe: 'writing-author',   rev: 'writing-reviewer' }
};

function replacePlaceholders(content, map) {
  return content
    .replace(/\{\{name\}\}/g, map.name)
    .replace(/\{\{description\}\}/g, map.desc)
    .replace(/\{\{agent\}\}/g, map.agent || '')
    .replace(/\{\{executor_name\}\}/g, map.exe || '')
    .replace(/\{\{reviewer_name\}\}/g, map.rev || '')
    .replace(/\{\{engine_type\}\}/g, map.engine || '')
    .replace(/\{\{backpressure\}\}/g, map.bp || '');
}

function processAgents() {
  const srcDir = path.join(TEMPLATE_DIR, 'agents');
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
  let count = 0;
  for (const file of files) {
    const map = AGENT_MAP[file];
    if (!map) { console.error(`MISSING MAP: ${file}`); process.exit(1); }
    map.bp = BACKPRESSURE[file] || '';
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const replaced = replacePlaceholders(content, map);
    for (const platform of PLATFORMS) {
      const out = path.join(OUT_BASE, platform, 'agents', `${map.name}.md`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, replaced, 'utf8');
      count++;
    }
  }
  console.log(`agents: ${files.length} templates × ${PLATFORMS.length} platforms = ${count} files`);
}

function processCommands() {
  const srcDir = path.join(TEMPLATE_DIR, 'commands');
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
  let count = 0;
  for (const file of files) {
    const map = COMMAND_MAP[file];
    if (!map) { console.error(`MISSING MAP: ${file}`); process.exit(1); }
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const replaced = replacePlaceholders(content, map);
    for (const platform of PLATFORMS) {
      const out = path.join(OUT_BASE, platform, 'commands', `${map.name}.md`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, replaced, 'utf8');
      count++;
    }
  }
  console.log(`commands: ${files.length} templates × ${PLATFORMS.length} platforms = ${count} files`);
}

// 主流程
processAgents();
processCommands();
console.log('\nTotal: ' + (Object.keys(AGENT_MAP).length + Object.keys(COMMAND_MAP).length) * PLATFORMS.length + ' files written');