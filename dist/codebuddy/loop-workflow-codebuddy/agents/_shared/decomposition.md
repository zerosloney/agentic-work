# 共享：任务复杂度评估与拆分

适用于所有 orchestrator agent 的初始化阶段。命令模板（`coding-pipeline`、`ralph-pipeline`、`ralph-graph`）的"初始化"步骤都应引用本文件，而非重复定义。

## 适用条件

单会话步数预算是硬约束（agent frontmatter `steps: 30`，每轮约 2-3 步）。任务规模超出预算时，闷头执行必然撞 `MAX_CYCLES` 硬终止。初始化阶段必须先评估每个任务的复杂度，对超标任务原地拆成子任务，让总规模落入预算。

## 何时拆（启发式判据，命中任一即标记"过大"）

1. **accept_criteria 过多**：单任务 `accept_criteria` > 3 条 → 按每 ≤3 条切分子任务。
2. **跨文件/跨模块**：预估触及文件数 > 5，或跨模块边界 > 2 → 按模块边界切分。
3. **依赖链过深**（仅 graph 模式）：任务在 DAG 中依赖链深度 > 3 → 在中间节点插入分解。loop 模式跳过此项。

## 怎么拆

- 在**初始化阶段**一次性完成，运行中不再触发拆分（避免破坏状态签名稳定性）。
- 拆出的子任务通过自身 `depends_on` 接入原有拓扑；用 `subtask_of` 标注溯源（仅追溯，不参与拓扑/停止逻辑）。
- **拆分边界不得跨越 forbidden_scope**（仅 coding 域有此约束）：任一子任务的 hard_scope 若触及 forbidden_scope → 立即停止拆分并询问用户，与 scope drift 零容忍铁律一致。
- 根因分组修复仍按原有规则执行（拆分针对的是任务规模，不是 issue 分组）。
- 原任务可被完全替换（删除原任务，由子任务链替代），也可保留为聚合占位。

## 预算核算兜底（硬守卫）

拆完后核算子任务总数 ≤ **`MAX_CYCLES × 0.75`**（coding：≤6，ralph：≤8，留 retry buffer）。超出则强制再拆当前最大的任务，直到达标。若已无法再拆（原子任务）仍超预算 → 立即停止委派，向用户报告"decomposition_overflow"，不闷头撞 `MAX_CYCLES`。

## 引用方

- `agents/coding-orchestrator.md` — coding 域（MAX_CYCLES=8，预算 ≤6）
- `agents/ralph-orchestrator.md` — ralph 域（MAX_CYCLES=10，预算 ≤8，含 graph 模式依赖链深度判据）
- `commands/coding-pipeline.md` — 初始化步骤 4
- `commands/ralph-pipeline.md` — 初始化步骤 4
- `commands/ralph-graph.md` — 初始化步骤 4