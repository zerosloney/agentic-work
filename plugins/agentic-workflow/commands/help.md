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
- `--max-iterations <n>` — 最大轮次上限（默认 10，硬上限 20：受 orchestrator 步数预算约束，传入 >20 会被钳制为 20 并报告；超过上限强制停止）
- `--completion-promise <text>` — 完成信号；agent 在输出末尾独占一行输出 `<promise>TEXT</promise>` 后，仍须通过全部完成门禁

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
- `--max-iterations <n>` — 最大轮次上限（默认 8，硬上限 20：受 orchestrator 步数预算约束，传入 >20 会被钳制为 20 并报告）
- `--completion-promise <text>` — 完成信号，不绕过审查、验证或范围门禁

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

### /cancel-pipeline

取消活跃管道（删除状态文件，同时解除 Stop hook 验证门禁）。覆盖全部三条管道。

**Usage:**
```
/cancel-pipeline            # 取消全部活跃管道
/cancel-pipeline coding     # 仅 coding-pipeline
/cancel-pipeline ralph      # 仅 ralph-pipeline
/cancel-pipeline graph      # 仅 ralph-graph
```

---

## Completion Promises

agent 在输出**末尾非空行**独占一行输出 `<promise>TEXT</promise>` 标签才触发完成信号。TEXT 必须与 `--completion-promise` 参数值完全一致；嵌在代码块、文件内容或输出中间位置的标签不算。该信号不能绕过任务完成、审查、验证、范围或 critical 门禁。

## State Files

| Pipeline | State 文件路径 |
|----------|---------------|
| coding-pipeline | `.loop-cli/state/coding-pipeline.json` |
| ralph-pipeline | `.loop-cli/state/ralph-pipeline.json` |
| ralph-graph | `.loop-cli/state/ralph-graph.json` |
