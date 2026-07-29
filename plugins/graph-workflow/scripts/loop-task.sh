#!/usr/bin/env bash
# loop-task.sh — Loop Engineering 任务入口 + 外层控制循环
# 适用于 ZCode 与 CodeBuddy 插件场景
set -uo pipefail

_N="/dev/null"

MAX_ITER="${MAX_ITER:-20}"
BUDGET_S="${BUDGET_S:-3600}"
STALL_LIMIT="${STALL_LIMIT:-3}"
VERIFY_CMD="${VERIFY_CMD:-}"
VERIFY_TIMEOUT="${VERIFY_TIMEOUT:-300}"
LOOP_VCS="${LOOP_VCS:-auto}"
MOCK="${MOCK:-0}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$SCRIPT_DIR/loop-state"
mkdir -p "$STATE_DIR"
CTL="$SCRIPT_DIR/statectl.sh"

source "$SCRIPT_DIR/loop-helpers.sh"

DESC="${1:-未命名任务}"
GOAL="${2:-目标由 reviewer 依据客观指标判定达成}"
TID=$(gen_task_id)
STATE="$STATE_DIR/$TID.json"
CREATED_AT="$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')"

STATE_VERSION=1
if [ -f "$STATE" ]; then
  EXISTING_VER="$(jq -r '.version // 0' "$(wpath "$STATE")" 2>/dev/null || echo 0)"
  if [ "$EXISTING_VER" != "$STATE_VERSION" ]; then
    echo "错误: 状态文件版本不匹配 (existing=$EXISTING_VER, current=$STATE_VERSION)" >&2
    exit 65
  fi
fi

INIT_JSON="$(jq -n \
  --arg task_id "$TID" \
  --arg objective "$DESC" \
  --arg goal_criteria "$GOAL" \
  --arg created_at "$CREATED_AT" \
  '{
    version: 1,
    task_id: $task_id,
    task_type: "task",
    objective: $objective,
    goal_criteria: $goal_criteria,
    iteration: 0,
    phase: "init",
    status: "pending",
    goal_met: false,
    progress_delta: 0,
    blocker: null,
    review: "pending",
    metrics: {},
    plan: "",
    review_notes: "",
    next_action: "orchestrate",
    history: [],
    created_at: $created_at
  }')"
pyrun create "$INIT_JSON" || { echo "错误: 初始化状态失败(既有 state 拒绝覆盖或校验不通过): $STATE" >&2; exit 73; }

echo "[loop-task] 已初始化任务 $TID"
echo "           目标 : $DESC"
echo "           达成 : $GOAL"
echo "           状态 : $STATE"

PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

VCS="$(detect_vcs)"
echo "  [safety] VCS=$VCS"
record_rollback_point

echo "▶ 启动 Loop Engineering 闭环 (MAX_ITER=$MAX_ITER, BUDGET_S=${BUDGET_S}s, STALL_LIMIT=$STALL_LIMIT) ..."

iter=0
stall=0
start=$(date +%s)
final_reason=""
prev_sig=""

while [ "$iter" -lt "$MAX_ITER" ]; do
  iter=$((iter+1))
  inc iteration 1
  echo ""
  echo "===== 迭代 $iter / $MAX_ITER ====="

  mark_time

  if [ "$MOCK" = "1" ]; then
    if [ "${MOCK_STALL:-0}" = "1" ]; then
      patch '{"phase":"exec","progress_delta":0,"status":"fail","goal_met":false,"review":"pending"}'
    else
      local_i=$(get iteration)
      if [ "$local_i" -ge 2 ]; then
        patch '{"phase":"review","progress_delta":0.4,"status":"pass","goal_met":true,"review":"approved","next_action":"done"}'
      else
        patch '{"phase":"exec","progress_delta":0.3,"status":"fail","goal_met":false,"review":"pending","next_action":"orchestrate"}'
      fi
    fi
  else
    echo "  [orchestrator] 等待编排者执行闭环..."
    echo "  [orchestrator] 状态文件: $STATE"
    echo "  [orchestrator] 请读取 $STATE 并按 orchestrator 职责执行"
    final_reason="HANDBACK: 已初始化并交由编排者驱动(脚本不自动 spawn 编排者进程,需外部 agent 读 $STATE 执行)"
    break
  fi

  cur_sig="$(state_sig)"
  if [ "$(lt progress_delta 0.01)" = "true" ] && ! changed_since_mark && [ "$cur_sig" = "$prev_sig" ]; then
    stall=$((stall+1))
    echo "  [anti-lazy] 无进展+无改动+状态未变 ($stall/$STALL_LIMIT)"
  else
    stall=0
  fi
  prev_sig="$cur_sig"
  if [ "$stall" -ge "$STALL_LIMIT" ]; then
    final_reason="ABORT: 连续 $stall 轮无进展,停滞熔断"
    break
  fi

  status_val=$(get status)
  goal_met_val=$(get goal_met)
  review_val=$(get review)
  if [ "$goal_met_val" = "true" ] && [ "$review_val" = "approved" ]; then
    if run_verify; then
      final_reason="DONE: 目标达成且评审通过"
      patch '{"status":"done"}'
      break
    else
      echo "  [verify] LLM 判达成但 VERIFY_CMD 校验未过 → 驳回,继续下一轮"
      patch '{"goal_met":false,"review":"changes_requested","review_notes":"VERIFY_CMD 客观校验未通过,需继续修复"}'
    fi
  fi

  case "$status_val" in
    blocked)
      final_reason="ABORT: 编排者报告 blocked → $(get blocker),转人工"
      break
      ;;
    *)
      echo "  [decide] status=$status_val, goal_met=$goal_met_val, review=$review_val → 继续下一轮"
      ;;
  esac

  elapsed=$(( $(date +%s) - start ))
  if [ "$elapsed" -gt "$BUDGET_S" ]; then
    final_reason="ABORT: 超出 BUDGET_S (${elapsed}s > ${BUDGET_S}s)"
    break
  fi
done

if [ -z "$final_reason" ]; then
  final_reason="ABORT: 达到 MAX_ITER ($MAX_ITER) 上限"
fi

echo ""
echo "──────── $final_reason ────────"
echo "---- 最终状态 ----"
wpath_state="$(wpath "$STATE")"
if [ -f "$STATE" ]; then
  jq '.' "$wpath_state" 2>/dev/null || cat "$STATE"
fi
