#!/usr/bin/env bash
# loop-review.sh — 复盘命令(纯 bash + jq)
# 扫描 loop-state/*.json,输出人类可读的任务汇总
set -uo pipefail

_N="/dev/null"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$SCRIPT_DIR/loop-state"
TARGET="${1:-}"

if ! command -v jq >/dev/null 2>&1; then
  echo "错误: 未找到 jq。请先安装 jq。" >&2
  exit 127
fi

if [ -n "$TARGET" ]; then
  files=("$TARGET")
else
  mapfile -t files < <(cd "$STATE_DIR" 2>/dev/null && ls -1 task-*.json 2>/dev/null | sort)
  files=("${files[@]/#/$STATE_DIR/}")
fi

if [ "${#files[@]}" -eq 0 ] || [ -z "${files[0]:-}" ]; then
  echo "没有找到任何任务状态文件。"
  exit 0
fi

echo ""
echo "===== Loop Review · 共 ${#files[@]} 个任务 ====="
echo ""

done_c=0; blocked_c=0; running_c=0; total=0

for fp in "${files[@]}"; do
  [ -z "$fp" ] && continue
  [ -f "$fp" ] || { echo "! 文件不存在: $fp"; continue; }

  if ! fields=$(jq -r '[
      (.task_id // "?"),
      (.objective // "(无描述)"),
      (.goal_criteria // "-"),
      (.iteration // 0),
      (.status // "?"),
      (.goal_met // false),
      (.review // "?"),
      (.phase // "?"),
      (.progress_delta // 0),
      (if (.metrics // {}) | length > 0 then (.metrics | tostring) else "-" end),
      (.created_at // "-")
    ] | @tsv' "$fp" 2>/dev/null); then
    echo "! 读取失败(非合法 JSON): $fp"
    continue
  fi

  IFS=$'\t' read -r tid obj goal it status gm rv phase delta metrics created <<< "$fields"
  total=$((total+1))

  if [ "$status" = "blocked" ]; then
    blocked_c=$((blocked_c+1))
  elif [ "$gm" = "true" ] && [ "$rv" = "approved" ]; then
    done_c=$((done_c+1))
  else
    running_c=$((running_c+1))
  fi

  echo "# $tid"
  echo "  描述 : $obj"
  [ "$goal" != "-" ] && echo "  达成 : $goal"
  echo "  轮次 : $it  | 状态: $status  | 目标达成: $gm  | 评审: $rv"
  echo "  阶段 : $phase  | 末轮进展: $delta"
  [ "$metrics" != "-" ] && echo "  指标 : $metrics"
  [ "$created" != "-" ] && echo "  创建 : $created"
  echo "  --------------------------------------------"
done

echo ""
echo "----- 汇总 -----"
echo "  完成(goal_met & approved) : $done_c"
echo "  转人工(blocked)           : $blocked_c"
echo "  进行中/未达标             : $running_c"
echo "  合计                      : $total"
