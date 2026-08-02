---
description: "用自然语言描述一个任务,自动初始化状态并启动 Loop Engineering 闭环(编排者管有界循环与决策 + 三角色协作)"
agent: graph-workflow-orchestrator
subtask: false
---

用户请求:{{input}}

请按以下流程处理:

1. 解析用户的任务,提炼出:
   - `objective`:一句话任务目标(客观、可验证)
   - `goal_criteria`:如何判定任务完成(量化优先,例如"登录成功且 E2E 测试通过")

2. 调用 Bash 执行脚本启动闭环:
   ```bash
   bash scripts/loop-task.sh "<objective>" "<goal_criteria>"
   ```
   (若用户未给出完成标准,第二参数可省略,由 reviewer 依据客观指标判定)

   可用环境变量覆盖硬约束:
   ```bash
   MAX_ITER=5 BUDGET_S=120 bash scripts/loop-task.sh "<objective>" "<goal_criteria>"
   ```

3. 当前命令由 `graph-workflow-orchestrator` 执行。脚本只负责初始化状态并返回状态路径；脚本不会自行 spawn agent。编排者拿到 handback 后继续驱动有界闭环，需要:
   - 读取脚本附带的 `$STATE` 状态文件(`task_type=task, version=1`)
   - 按 `agents/orchestrator.md` 的职责执行
   - 每轮结束写回状态，并在同一 agent 调用内遵守 `MAX_ITER/BUDGET_S/STALL_LIMIT`

4. 闭环结束后,把 `task_id` 与最终状态回显给用户,并说明可用 `/loop-review` 复盘进展。

注意:
- 闭环的硬约束(MAX_ITER/BUDGET_S/STALL_LIMIT)由编排者在同一 agent 调用内执行,不要绕过硬约束。
