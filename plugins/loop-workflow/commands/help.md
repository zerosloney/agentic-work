---
description: "Explain Ralph Pipeline / Coding Pipeline plugins and available commands"
---

# Pipeline Plugin Help

## Available Commands

### /ralph-pipeline <PROMPT> [OPTIONS]

通用编排执行审查管道（线性）。把请求拆解为 TaskList，每轮委派 worker → reviewer → judge。

**Usage:**
```
/ralph-pipeline "Refactor the cache layer"
/ralph-pipeline "Add tests" --max-iterations 20
/ralph-pipeline "Build API" --max-iterations 15 --completion-promise "DONE"
```

**Options:**
- `--max-iterations <n>` — 最大轮次上限（默认 10，超过强制停止）
- `--completion-promise <text>` — 完成咒语，agent 输出 `<promise>TEXT</promise>` 即判定完成

**How it works:**
1. 拆解请求为 TaskList（带依赖关系）
2. 每轮选一个可执行任务 → ralph-worker 执行 → ralph-reviewer 审查
3. PASS → 标记完成，推进下一任务；NEEDS_FIX → 回退重试
4. 所有任务完成 → DONE；达到上限 → MAX_CYCLES

---

### /coding-pipeline <PROMPT> [OPTIONS]

受控编码/审查管道（编程领域专用）。在 coding-orchestrator 编排下，strict scope 控制 + 根因分组修复。

**Usage:**
```
/coding-pipeline "Fix the auth bug"
/coding-pipeline "Add input validation" --max-iterations 15
```

**Options:**
- `--max-iterations <n>` — 最大轮次上限（默认 8）
- `--completion-promise <text>` — 完成咒语

**Key differences from ralph-pipeline:**
- Scope drift 零容忍 — 越界一行即 FAIL
- 根因分组修复 — 同一根因的 issues 一组一次修
- 真实验证 — 每轮必须跑 lint/typecheck/build/test

---

### /ralph-graph <PROMPT> [OPTIONS]

DAG 路由表驱动的执行审查管道。适用于有明确依赖关系的多步骤任务。

**Usage:**
```
/ralph-graph "Deploy microservices" --sop deploy.json
```

**Options:**
- `--sop <name>` — 指定路由表文件（`.loop-cli/routing-tables/<name>.json`）

---

### /cancel-ralph-pipeline

取消当前活动的 Ralph Pipeline（删除状态文件）。

**Usage:**
```
/cancel-ralph-pipeline
```

---

## Completion Promises

agent 输出 `<promise>TEXT</promise>` 标签即可触发完成判定。TEXT 必须与 `--completion-promise` 参数值完全一致。

## State Files

| Pipeline | State 文件路径 |
|----------|---------------|
| coding-pipeline | `.loop-cli/state/coding-pipeline.json` |
| ralph-pipeline | `.loop-cli/state/ralph-pipeline.json` |
| ralph-graph | `.loop-cli/state/ralph-graph.json` |