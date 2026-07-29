---
description: "Cancel active pipelines (coding-pipeline / ralph-pipeline / ralph-graph)"
allowed-tools: Bash(test:*), Bash(rm:*), Read
hide-from-slash-command-tool: true
---

# Cancel Pipeline

取消目标：$ARGUMENTS（可选：`coding` | `ralph` | `graph` | `all`；缺省 = 扫描全部活跃管道）

三条管道的状态文件：

| 目标 | State 文件 |
|------|-----------|
| coding | `.loop-cli/state/coding-pipeline.json` |
| ralph | `.loop-cli/state/ralph-pipeline.json` |
| graph | `.loop-cli/state/ralph-graph.json` |

执行步骤：

1. 确定目标集合：`$ARGUMENTS` 指定了目标则只处理对应文件；缺省或 `all` 则处理全部三个。
2. 逐个检查目标文件是否存在：
   ```
   test -f .loop-cli/state/<file> && echo "EXISTS" || echo "NOT_FOUND"
   ```
3. **全部 NOT_FOUND**：回复 "No active pipeline found."
4. **对每个 EXISTS 的文件**：
   - Read 该文件，取 `round`（或 graph 的 `outer_iteration`）与 `stop_reason`
   - 删除文件：`rm .loop-cli/state/<file>`
   - 报告一行："Cancelled <pipeline>（was at round N, stop_reason=<值|null>）"
5. 汇总提示：删除状态文件同时解除 `check-verification-on-stop` hook 对会话停止的门禁（该 hook 只 gate `stop_reason=null` 的活跃管道）。

不删除 `.loop-cli/state/` 目录本身与其他无关文件。
