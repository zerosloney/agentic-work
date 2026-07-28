# loop-helpers.sh — loop-task.sh 和 graph-run.sh 的共享硬约束与 VCS 抽象
# 由 loop-task.sh 和 graph-run.sh 在 set -uo pipefail 后 source。
# 本文件不单独运行;所有函数依赖调用者在环境中提供:
#   LH_STATE      — 状态文件完整路径(由调用者 set,本文件只是引用)
#   SCRIPT_DIR    — 调用者脚本所在目录(由调用者 set)
#   CTL          — statectl.sh 路径
#   PROJECT_ROOT  — 被管理的项目根目录(调用者 set)
#   MAX_ITER / BUDGET_S / STALL_LIMIT / VERIFY_CMD / VERIFY_TIMEOUT / LOOP_VCS — 调用者 shell 变量
set -uo pipefail

_N="/dev/null"

if ! command -v jq >/dev/null 2>&1; then
  echo "错误: 未找到 jq。请先安装 jq。" >&2
  exit 127
fi

gen_task_id() {
  local ns
  ns=$(date +%s%N 2>/dev/null)
  case "$ns" in
    *N) echo "task-$(date +%s)-$RANDOM-$RANDOM" ;;
    *)  echo "task-$ns" ;;
  esac
}

wpath() { cygpath -m "$1" 2>/dev/null || echo "$1"; }
pyrun() { bash "$CTL" "$(wpath "$STATE")" "$@"; }
get()   { pyrun get   "$1"; }
patch() { pyrun patch "$1"; }
inc()   { pyrun inc   "$1" "$2"; }
lt()    { pyrun lt    "$1" "$2"; }

CHANGE_MARKER="$SCRIPT_DIR/loop-state/.loop-marker"

detect_vcs() {
  if [ "$LOOP_VCS" != "auto" ]; then echo "$LOOP_VCS"; return; fi
  if git -C "$PROJECT_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo git
  elif [ -d "$PROJECT_ROOT/\$tf" ]; then
    echo tfvc
  else
    echo none
  fi
}

mark_time() { : > "$CHANGE_MARKER"; }

changed_since_mark() {
  [ "${MOCK:-0}" = "1" ] && return 1
  [ -f "$CHANGE_MARKER" ] || return 1
  local hit
  hit="$(find "$PROJECT_ROOT" \
    \( -path '*/loop-state' -o -path '*/.git' -o -path '*/.hg' -o -name '$tf' \
       -o -path '*/node_modules' -o -path '*/dist' -o -path '*/bin' -o -path '*/obj' \
       -o -path '*/build' -o -path '*/target' -o -path '*/__pycache__' \
       -o -path '*/venv' -o -path '*/.venv' -o -path '*/.cache' \
       -o -name '*.pyc' -o -name '*.log' -o -name '*.lock' \) -prune -o \
    -type f -newer "$CHANGE_MARKER" -print 2>/dev/null | head -n1)"
  [ -n "$hit" ]
}

record_rollback_point() {
  case "$VCS" in
    git)
      local ref; ref="$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null || echo '')"
      [ -n "$ref" ] && echo "  [safety] 回滚点(git): git reset --hard $ref  (未提交改动请先 git stash)"
      ;;
    tfvc)
      echo "  [safety] TFVC 工作区:无法可靠自动记录回滚点(离线)。建议开跑前手动 tf shelve 备份未签入改动。" ;;
    *)
      echo "  [safety] 无 VCS:executor/fixer 可写文件,建议开跑前手动备份工作区。" ;;
  esac
}

VERIFY_TIMEOUT="${VERIFY_TIMEOUT:-300}"
run_verify() {
  [ -z "$VERIFY_CMD" ] && return 0
  if command -v timeout >/dev/null 2>&1; then
    ( cd "$PROJECT_ROOT" && timeout "$VERIFY_TIMEOUT" bash -c "$VERIFY_CMD" ) >/dev/null 2>&1
  elif command -v gtimeout >/dev/null 2>&1; then
    ( cd "$PROJECT_ROOT" && gtimeout "$VERIFY_TIMEOUT" bash -c "$VERIFY_CMD" ) >/dev/null 2>&1
  else
    echo "  [verify] 警告: 未找到 timeout/gtimeout,VERIFY_CMD 无超时保护(挂起会卡到 BUDGET_S)"
    ( cd "$PROJECT_ROOT" && eval "$VERIFY_CMD" ) >/dev/null 2>&1
  fi
}

state_sig() {
  pyrun get phase | tr -d '\n'; printf '|'
  pyrun get status | tr -d '\n'; printf '|'
  pyrun get goal_met | tr -d '\n'; printf '|'
  pyrun get review | tr -d '\n'; printf '|'
  pyrun get progress_delta | tr -d '\n'
}
