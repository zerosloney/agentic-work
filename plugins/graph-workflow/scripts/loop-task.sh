#!/usr/bin/env bash
# loop-task.sh — Loop Engineering 任务入口 + 状态初始化（HANDBACK 模型）
#
# 脚本只负责:参数校验 → 初始化 state JSON → 打印 STATE 路径并 HANDBACK。
# 命令绑定的编排 agent(graph-workflow-orchestrator)拿到 handback 后,
# 在同一 agent 调用内驱动有界轮次(MAX_ITER/BUDGET_S/STALL_LIMIT 由 agent 自查,
# 脚本启动时校验合法性作 fail-fast 兜底)。脚本不 spawn agent、不强制每轮兜底。
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
validate_loop_limits || exit $?

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

PROJECT_ROOT="${PROJECT_ROOT:-${PWD:-$SCRIPT_DIR/../..}}"
PROJECT_ROOT="$(cd "$PROJECT_ROOT" 2>/dev/null && pwd)" || {
  echo "错误: PROJECT_ROOT 不存在或不可访问: $PROJECT_ROOT" >&2
  exit 64
}

VCS="$(detect_vcs)"
echo "  [safety] VCS=$VCS"
record_rollback_point

echo "▶ Loop Engineering 状态就绪 (MAX_ITER=$MAX_ITER, BUDGET_S=${BUDGET_S}s, STALL_LIMIT=$STALL_LIMIT) — 由编排者自查执行"

# ─── MOCK self-test：单次执行，验证 init→statectl 往返链路 ───
# 生产路径(非 MOCK)不跑闭环;编排 agent 在自己的会话里驱动有界轮次。
if [ "$MOCK" = "1" ]; then
  echo ""
  echo "===== MOCK self-test ====="
  if [ "${MOCK_STALL:-0}" = "1" ]; then
    patch '{"phase":"exec","progress_delta":0,"status":"fail","goal_met":false,"review":"pending"}'
    final_reason="MOCK: 已写入 stall 状态(anti-lazy 由编排者自查)"
  else
    patch '{"phase":"exec","progress_delta":0.3,"status":"pass","goal_met":true,"review":"approved","next_action":"done"}'
    # 仅 MOCK 自检时复用 VERIFY_CMD(若有),验证客观校验链路
    if [ -n "$VERIFY_CMD" ]; then
      if run_verify; then
        patch '{"status":"done"}'
        final_reason="MOCK: DONE 目标达成且 VERIFY_CMD 通过"
      else
        final_reason="MOCK: VERIFY_CMD 未过(生产路径由编排者自查)"
      fi
    else
      patch '{"status":"done"}'
      final_reason="MOCK: DONE 状态写入成功"
    fi
  fi
  echo ""
  echo "──────── $final_reason ────────"
  echo "---- 最终状态 ----"
  wpath_state="$(wpath "$STATE")"
  if [ -f "$STATE" ]; then
    jq '.' "$wpath_state" 2>/dev/null || cat "$STATE"
  fi
  exit 0
fi

# ─── HANDBACK：交由命令绑定的编排 agent 续驱 ───
echo ""
echo "  [orchestrator] 状态文件已就绪,等待命令编排 agent 接管"
echo "  [orchestrator] STATE=$STATE"
echo "  [orchestrator] 请读取 $STATE 并按 agents/orchestrator.md 职责驱动有界闭环"
echo ""
echo "──────── HANDBACK: 已初始化并交由编排者驱动 ────────"
echo "    (脚本不 spawn agent;MAX_ITER/BUDGET_S/STALL_LIMIT 由编排者自查)"
