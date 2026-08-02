---
description: "用自然语言描述一个任务,自动初始化图状态并启动 Graph Engineering 闭环(档位 B:可声明 nodes/edges/state 图拓扑,与 /loop-task 平行入口,行为兼容默认图)"
agent: graph-workflow-graph-orchestrator
subtask: false
---

用户请求:{{input}}

请按以下流程处理:

1. 解析用户的任务,提炼出:
   - `objective`:一句话任务目标(客观、可验证)
   - `goal_criteria`:如何判定任务完成(量化优先,例如"登录成功且 E2E 测试通过")

2. 调用 Bash 执行脚本启动图闭环:
   ```bash
   bash scripts/graph-run.sh "<objective>" "<goal_criteria>"
   ```
   (若用户未给出完成标准,第二参数可省略,由 graph-orchestrator 依据客观指标判定)

   注入自定义图拓扑(可选,默认图等价于 /loop-task 行为):
   ```bash
   bash scripts/graph-run.sh "<objective>" "<goal_criteria>" --graph /path/to/graph.json
   ```
   `--graph` 文件格式见 `scripts/state-schema.json` 中 `graph` 字段的 schema。

   可用环境变量覆盖硬约束:
   ```bash
   MAX_ITER=5 BUDGET_S=120 bash scripts/graph-run.sh "<objective>" "<goal_criteria>"
   ```

3. 当前命令由 `graph-workflow-graph-orchestrator` 执行。脚本只负责初始化状态并返回状态路径；脚本不会自行 spawn agent。图编排者拿到 handback 后继续驱动有界闭环，需要:
   - 读取脚本附带的 `$STATE` 状态文件(`task_type=graph, version=2`)
   - 按 `agents/graph-orchestrator.md` 的职责执行
   - 读 state.graph → 按边路由节点 → 用 `bash scripts/statectl.sh graph-next` 算下一步 → 写 node_states
   - 每轮结束写回状态，并在同一 agent 调用内遵守 `MAX_ITER/BUDGET_S/STALL_LIMIT`

4. 闭环结束后,把 `task_id` 与最终状态回显给用户,并说明可用 `/loop-review` 复盘进展。

注意:
- 图拓扑是不可变的声明数据;prompt 里禁止"决定下一步去哪",必须用 `bash scripts/statectl.sh graph-next` 算。
- 与 `/loop-task` 完全兼容:`/graph-task` 不指定 `--graph` 时行为等价于 `/loop-task`(默认图就是 exec→review→fix 循环)。
- 闭环的硬约束(MAX_ITER/BUDGET_S/STALL_LIMIT)由图编排者在同一 agent 调用内执行,不要绕过硬约束。
