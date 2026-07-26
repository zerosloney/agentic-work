# 共享：State 字段 ↔ Agent 输入契约映射

Orchestrator 在每轮注入子 agent 的 `=== X ===` 段落，必须可追溯到 state JSON 字段或明确标记为"派生"。

## Coding Loop (version=1)

state 路径：`.loop-cli/state/coding-loop.json`

| 注入段落 | 来源 | 必填？ |
|---------|------|--------|
| `=== 当前任务 ===` | `tasks[task_id]` | 是（DELEGATE 时） |
| `=== 声明边界 ===` | 用户声明（运行期确定） | 是 |
| `=== Baseline ===` | 用户声明（git_ref/git_status_snapshot/fingerprint/none） | 是 |
| `=== 项目脚本 ===` | 用户/项目探测 | 是 |
| `=== Risk Level ===` | 派生（每轮评估） | 否 |
| `=== Critical Checkpoints ===` | `critical_checkpoints[]` | 否 |
| `=== Detected Stack ===` | 派生（项目探测） | 否 |
| `=== Scripts Gap ===` | 派生（脚本探测） | 否 |
| `=== 本轮 diff ===` | 派生（git diff vs baseline） | 是（reviewer） |
| `=== 执行者检查结果 ===` | builder 输出 JSON（不持久化） | 是（reviewer） |
| `=== prior_cycles_summary ===` | `prior_cycles_summary` | 否 |

## Ralph Loop (version=1)

state 路径：`.loop-cli/state/ralph-loop.json`

| 注入段落 | 来源 | 必填？ |
|---------|------|--------|
| `=== 目标 ===` | 用户声明（运行期确定） | 是 |
| `=== 当前任务 ===` | `tasks[task_id]` | 是 |
| `=== 已知上下文 ===` | 用户/前置任务产出（运行期确定） | 是 |
| `=== 验证命令 ===` | 派生（领域 backpressure 配置） | 是 |
| `=== 执行者产出 ===` | worker 输出 JSON（不持久化） | 是（reviewer） |
| `=== 本轮变更 ===` | 派生（git diff 或文件清单） | 是（reviewer） |

## Ralph Graph (version=2)

state 路径：`.loop-cli/state/ralph-graph.json`

| 注入段落 | 来源 | 必填？ |
|---------|------|--------|
| `=== 目标 ===` | 用户声明（运行期确定） | 是 |
| `=== 当前任务 ===` | `nodes[node_id]` | 是 |
| `=== 已知上下文 ===` | 用户/前置节点产出 | 是 |
| `=== 验证命令 ===` | 派生 | 是 |
| `=== 执行者产出 ===` | worker 输出 JSON | 是（reviewer） |
| `=== 本轮变更 ===` | 派生 | 是（reviewer） |

## 引用方

- `agents/coding-orchestrator.md`
- `agents/ralph-orchestrator.md`
- `commands/coding-loop.md`
- `commands/ralph-loop.md`
- `commands/ralph-graph.md`

## 校验

每轮写入 state 前，运行：

```sh
node scripts/validate-state.js .loop-cli/state/coding-loop.json
```

或集成到 orchestrator 的 write 步骤（在 state write 之前自动跑）。