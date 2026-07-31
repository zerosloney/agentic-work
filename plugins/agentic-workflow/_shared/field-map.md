# 共享：State 字段 ↔ Agent 输入契约映射

Orchestrator 在每轮注入子 agent 的 `=== X ===` 段落，必须可追溯到 state JSON 字段或明确标记为"派生"。

## Coding Pipeline (version=1)

state 路径：`.loop-cli/state/coding-pipeline.json`

| 注入段落 | 来源 | 必填？ |
|---------|------|--------|
| `=== 当前任务 ===` | `tasks[task_id]` | 是（DELEGATE 时） |
| `=== 声明边界 ===` | 用户声明（运行期确定）；其中 forbidden_scope 持久化到 `forbidden_scope` 字段供 hook 强制 | 是 |
| `=== Baseline ===` | 用户声明（git_ref/git_status_snapshot/fingerprint/none） | 是 |
| `=== 项目脚本 ===` | 用户/项目探测 | 是 |
| `=== Risk Level ===` | 派生（每轮评估） | 否 |
| `=== Critical Checkpoints ===` | `critical_checkpoints[]` | 否 |
| `=== Detected Stack ===` | 派生（项目探测） | 否 |
| `=== Scripts Gap ===` | 派生（脚本探测） | 否 |
| `=== 本轮 diff ===` | 派生（git diff vs baseline） | 是（reviewer） |
| `=== 执行者检查结果 ===` | builder 输出 JSON；其验证结论持久化到 `verification_status` 供 hook 门禁 | 是（reviewer） |
| `=== prior_cycles_summary ===` | `prior_cycles_summary` | 否 |

Hook 协同字段（持久化给平台 hook 读，非注入段落）：

| 字段 | 写入时机 | 消费者 |
|------|----------|--------|
| `forbidden_scope` | orchestrator 初始化时从声明边界写入一次（仅 coding 域） | `hooks/block-forbidden-scope.js`（PreToolUse 拦截越界 Write/Edit） |
| `verification_status` | orchestrator 每轮 JUDGE 时更新 | `hooks/check-verification-on-stop.js`（Stop 门禁，活跃 pipeline 未 pass 则阻止） |

## Ralph Pipeline (version=1)

state 路径：`.loop-cli/state/ralph-pipeline.json`

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

- **直接**：`zcode/agents/coding-orchestrator.md`（body `=== X ===` 段落按上表注入,经 `../_shared/` 引用）
- **直接**：`zcode/agents/ralph-orchestrator.md`（同上,含 graph 模式节点版本）

> **间接**：`commands/coding-pipeline.md` / `commands/ralph-pipeline.md` / `commands/ralph-graph.md` 经 orchestrator agent body 间接消费本映射（commands 自身不读 `_shared/`）。

## 校验

每轮写入 state 前，运行：

```sh
node scripts/validate-state.js .loop-cli/state/coding-pipeline.json
```

或集成到 orchestrator 的 write 步骤（在 state write 之前自动跑）。

## 注入段落转义规则

Orchestrator 把上下文注入子 agent 时用 `=== X ===\n{content}` 段落标记。如果 `{content}` 本身含裸 `===`（如 markdown 标题、代码块引用、文档片段），注入边界会被破坏——子 agent 可能提前截断或误解析段落。

- **orchestrator 端**：注入前，对 content 中每行做前缀检查；若行首（trim 后）以 `===` 开头，缩进一级（加 `> ` 或 `  ` 前缀），使内容与段落标记不混淆。
- **worker/reviewer 端**：收到 `=== X ===` 段落后，只读取到下一个 `===` 标记或文件末尾之间的内容；标记本身不作为内容的一部分。
- **极端情况**：若 content 无法安全转义（如大量 `===` 散布），改为 JSON 结构化注入（query 字段传 `{"section":"X","content":...}`），不拼接文本段落。