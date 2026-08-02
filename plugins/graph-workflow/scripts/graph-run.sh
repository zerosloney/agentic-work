#!/usr/bin/env bash
# graph-run.sh — Graph Engineering 任务入口 + 图状态初始化(档位 B,HANDBACK 模型)
#
# 脚本只负责:参数校验 → 解析 --graph → 初始化 state JSON(version=2) → 打印 STATE 路径并 HANDBACK。
# 命令绑定的图编排 agent(graph-workflow-graph-orchestrator)拿到 handback 后,
# 在同一 agent 调用内按 graph 拓扑驱动有界轮次(MAX_ITER/BUDGET_S/STALL_LIMIT 由 agent 自查,
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

DESC="${1:-未命名图任务}"
GOAL="${2:-目标由 graph-orchestrator 依据客观指标判定达成}"
GRAPH_FILE=""

shift 2 2>/dev/null || true
while [ $# -gt 0 ]; do
  case "$1" in
    --graph)
      if [ "$#" -lt 2 ] || [ -z "${2:-}" ]; then
        echo "错误: --graph 需要一个 JSON 文件路径" >&2
        exit 64
      fi
      GRAPH_FILE="$2"
      shift 2
      ;;
    *)
      echo "错误: 未知参数: $1" >&2
      echo "用法: graph-run.sh [objective] [goal_criteria] [--graph graph.json]" >&2
      exit 64
      ;;
  esac
done

TID=$(gen_task_id)
STATE="$STATE_DIR/$TID.json"
CREATED_AT="$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')"

STATE_VERSION=2
if [ -f "$STATE" ]; then
  EXISTING_VER="$(jq -r '.version // 0' "$(wpath "$STATE")" 2>/dev/null || echo 0)"
  if [ "$EXISTING_VER" != "$STATE_VERSION" ]; then
    echo "错误: 状态文件版本不匹配 (existing=$EXISTING_VER, current=$STATE_VERSION)" >&2
    exit 65
  fi
fi

DEFAULT_GRAPH='{
  "entry": "exec-1",
  "nodes": [
    {"id": "exec-1",   "role": "executor"},
    {"id": "review-1", "role": "reviewer"},
    {"id": "fix-1",    "role": "fixer"}
  ],
  "edges": [
    {"from": "exec-1",   "to": "review-1"},
    {"from": "review-1", "to": "__done__",  "when": "approved"},
    {"from": "review-1", "to": "fix-1",     "when": "changes_requested"},
    {"from": "fix-1",    "to": "review-1"},
    {"from": "review-1", "to": "__abort__", "when": "blocked"}
  ]
}'

if [ -n "$GRAPH_FILE" ]; then
  if [ ! -f "$GRAPH_FILE" ]; then
    echo "错误: --graph 文件不存在: $GRAPH_FILE" >&2
    exit 64
  fi
  if ! GRAPH_JSON="$(jq -c . "$GRAPH_FILE" 2>/dev/null)"; then
    echo "错误: --graph 文件不是合法 JSON: $GRAPH_FILE" >&2
    exit 64
  fi
  if ! printf '%s' "$GRAPH_JSON" | jq -e '
    if (type != "object") then false
    elif ((.entry | type) != "string" or (.entry | length) == 0) then false
    elif ((.nodes | type) != "array" or (.nodes | length) == 0) then false
    elif ((.edges | type) != "array") then false
    else
      . as $g
      | ($g.nodes | map(.id)) as $ids
      | ($g.nodes | all(.[];
          type == "object"
          and (.id | type == "string" and length > 0)
          and (.role as $role | ["executor", "reviewer", "fixer"] | index($role) != null)
        )) as $nodes_ok
      | ($g.edges | all(.[];
          . as $edge
          | ($edge | type == "object")
          and ($edge.from | type == "string" and length > 0)
          and ($edge.to | type == "string" and length > 0)
          and ((($edge | has("when")) | not) or ($edge.when | type == "string"))
          and (($ids | index($edge.from)) != null)
          and (($edge.to == "__done__") or ($edge.to == "__abort__") or (($ids | index($edge.to)) != null))
        )) as $edges_ok
      | ($ids | unique | length) == ($ids | length)
      and ($ids | index($g.entry)) != null
      and $nodes_ok
      and $edges_ok
      and ($g.edges | any(.[]; .to == "__done__" or .to == "__abort__"))
    end
  ' >/dev/null 2>&1; then
    echo "错误: --graph 图定义非法: entry 必须存在,节点 ID 必须唯一且 role 合法,边必须引用已知节点或终点" >&2
    exit 64
  fi
else
  GRAPH_JSON="$DEFAULT_GRAPH"
fi

NODE_STATES_INIT="$(printf '%s' "$GRAPH_JSON" | jq -c '
  reduce (.nodes // [])[] as $n ({}; .[$n.id] = {status: "pending"})
')"

INIT_JSON="$(jq -n \
  --arg task_id "$TID" \
  --arg objective "$DESC" \
  --arg goal_criteria "$GOAL" \
  --arg created_at "$CREATED_AT" \
  --arg graph_file "${GRAPH_FILE:-}" \
  --argjson graph "$GRAPH_JSON" \
  --argjson node_states "$NODE_STATES_INIT" \
  '{
    version: 2,
    task_id: $task_id,
    task_type: "graph",
    objective: $objective,
    goal_criteria: $goal_criteria,
    created_at: $created_at,
    graph_file: $graph_file,
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
    graph: $graph,
    current_node: ($graph.entry // null),
    node_states: $node_states
  }')"
pyrun create "$INIT_JSON" || { echo "错误: 初始化状态失败(既有 state 拒绝覆盖或校验不通过): $STATE" >&2; exit 73; }

echo "[graph-run] 已初始化图任务 $TID"
echo "             目标 : $DESC"
echo "             达成 : $GOAL"
echo "             状态 : $STATE"
if [ -n "$GRAPH_FILE" ]; then
  echo "             拓扑 : 自定义图($GRAPH_FILE)"
else
  echo "             拓扑 : 默认图(exec→review→[fix↺]→done)"
fi

PROJECT_ROOT="${PROJECT_ROOT:-${PWD:-$SCRIPT_DIR/../..}}"
PROJECT_ROOT="$(cd "$PROJECT_ROOT" 2>/dev/null && pwd)" || {
  echo "错误: PROJECT_ROOT 不存在或不可访问: $PROJECT_ROOT" >&2
  exit 64
}

VCS="$(detect_vcs)"
echo "  [safety] VCS=$VCS"
record_rollback_point

echo "▶ Graph Engineering 图状态就绪 (MAX_ITER=$MAX_ITER, BUDGET_S=${BUDGET_S}s, STALL_LIMIT=$STALL_LIMIT) — 由图编排者自查执行"

# ─── MOCK self-test：单次执行,验证 init→statectl 往返链路 ───
# 生产路径(非 MOCK)不跑闭环;图编排 agent 在自己的会话里按 graph 拓扑驱动有界轮次。
if [ "$MOCK" = "1" ]; then
  echo ""
  echo "===== MOCK self-test ====="
  if [ "${MOCK_STALL:-0}" = "1" ]; then
    patch '{"phase":"exec","progress_delta":0,"status":"fail","goal_met":false,"review":"pending"}'
    final_reason="MOCK: 已写入 stall 状态(anti-lazy 由编排者自查)"
  else
    patch '{"phase":"review","progress_delta":0.4,"status":"pass","goal_met":true,"review":"approved","next_action":"done"}'
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

# ─── HANDBACK：交由命令绑定的图编排 agent 续驱 ───
echo ""
echo "  [graph-orchestrator] 图状态文件已就绪,等待命令图编排 agent 接管"
echo "  [graph-orchestrator] STATE=$STATE"
echo "  [graph-orchestrator] 请读取 $STATE 并按 agents/graph-orchestrator.md 职责按边路由驱动有界闭环"
echo ""
echo "──────── HANDBACK: 已初始化图任务并交由图编排者驱动 ────────"
echo "    (脚本不 spawn agent;MAX_ITER/BUDGET_S/STALL_LIMIT 由图编排者自查)"
