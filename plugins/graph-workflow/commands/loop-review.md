---
description: "复盘所有或指定的 Loop 任务状态与进展"
---

用户请求:{{input}}

调用 Bash 执行复盘脚本:

```bash
# 复盘全部任务
bash scripts/loop-review.sh

# 或指定单个任务状态文件
bash scripts/loop-review.sh <状态文件路径>
```

将输出整理后回显给用户,并明确标注哪些任务:
- **已完成**(goal_met=true 且 review=approved)
- **转人工**(status=blocked)
- **进行中/未达标**(其余)

状态文件位于 `scripts/loop-state/task-<timestamp>.json`,复盘脚本会自动扫描该目录。
