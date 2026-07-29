#!/usr/bin/env bash
# statectl.sh — 状态文件读写助手(依赖 jq)
# 共享脚本:ZCode 与 CodeBuddy 共用
set -uo pipefail

# 安全钩子会拦截 /dev/null 字面量,用变量绕过
_N="/dev/null"

if ! command -v jq >/dev/null 2>&1; then
  echo "错误: 未找到 jq。请先安装 jq。" >&2
  exit 127
fi

STATE="$1"
CMD="${2:-}"

cleanup_tmp() {
  local f pid
  for f in "${STATE}.tmp."*; do
    [ -e "$f" ] || continue
    pid="${f##*.tmp.}"
    [ "$pid" = "$$" ] && continue
    kill -0 "$pid" 2>/dev/null && continue
    rm -f "$f" 2>/dev/null || true
  done
}
cleanup_tmp

# 文件锁(mkdir 原子性,跨平台)——只对写命令加锁,防并发 load-modify-save 竞态。
# 死锁自愈:持锁进程已退出则接管;超时(约 5s)退出 75。
LOCK_DIR="${STATE}.lock"
LOCKED=0
release_lock() {
  if [ "$LOCKED" = "1" ]; then
    rm -f "$LOCK_DIR/pid" 2>/dev/null || true
    rmdir "$LOCK_DIR" 2>/dev/null || true
    LOCKED=0
  fi
}
acquire_lock() {
  local tries=0 owner
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    owner="$(cat "$LOCK_DIR/pid" 2>/dev/null || true)"
    if [ -n "$owner" ] && ! kill -0 "$owner" 2>/dev/null; then
      rm -f "$LOCK_DIR/pid" 2>/dev/null || true
      rmdir "$LOCK_DIR" 2>/dev/null || true
      continue
    fi
    tries=$((tries+1))
    if [ "$tries" -ge 50 ]; then
      echo "错误: 获取状态锁超时: $LOCK_DIR (持锁 pid=${owner:-?})" >&2
      exit 75
    fi
    sleep 0.1
  done
  echo "$$" > "$LOCK_DIR/pid"
  LOCKED=1
  trap 'release_lock' EXIT INT TERM
}

load() {
  [ -f "$STATE" ] && [ -s "$STATE" ] || { echo '{}'; return; }
  local content
  content="$(jq -c '.' "$STATE" 2>/dev/null)" || { echo '{}'; return; }
  if [ -n "$content" ]; then echo "$content"; else echo '{}'; fi
}

# 写前廉价校验(与 validate-state-write hook 语义对齐):enum + 类型。
# 非完整 schema——权威校验仍靠 node scripts/validate-state.js。
validate_state_json() {
  printf '%s' "$1" | jq -e '
    (if has("version") then (.version == 1 or .version == 2) else true end)
    and (if has("task_type") then (.task_type | IN("task","graph")) else true end)
    and (if has("phase") then (.phase | IN("init","orchestrate","exec","verify","review","fix","done","aborted")) else true end)
    and (if has("status") then (.status | IN("pending","pass","fail","blocked","stalled","done")) else true end)
    and (if has("review") then (.review | IN("pending","approved","changes_requested")) else true end)
    and (if has("goal_met") then (.goal_met | type == "boolean") else true end)
    and (if has("progress_delta") then ((.progress_delta | type == "number") and .progress_delta >= 0 and .progress_delta <= 1) else true end)
    and (if has("iteration") then ((.iteration | type == "number") and .iteration >= 0) else true end)
  ' >"$_N" 2>&1
}

save() {
  local data="$1"
  if ! validate_state_json "$data"; then
    echo "错误: 状态校验失败(enum/类型不合法),拒绝写入: $STATE" >&2
    return 1
  fi
  local tmp="${STATE}.tmp.$$"
  if printf '%s' "$data" | jq '.' > "$tmp" 2>/dev/null && [ -s "$tmp" ] && jq -e . "$tmp" >/dev/null 2>&1; then
    mv "$tmp" "$STATE" || { rm -f "$tmp" 2>/dev/null || true; }
  else
    rm -f "$tmp" 2>/dev/null || true
    return 1
  fi
}

# 写命令先拿锁,再 load——保证 load-modify-save 全程串行;读命令不加锁。
case "$CMD" in
  create|ensure|set|patch|inc|append) acquire_lock ;;
esac

DATA="$(load)"
EMPTY_OBJ="{}"

case "$CMD" in
  create)
    CREATE_JSON="${3:-$EMPTY_OBJ}"
    FORCE="${4:-}"
    if [ -s "$STATE" ] && [ "$FORCE" != "--force" ]; then
      echo "错误: 状态文件已存在,拒绝覆盖: $STATE (确需重建请加 --force)" >&2
      exit 73
    fi
    save "$(printf '%s' "$CREATE_JSON" | jq -c '.')"
    ;;
  ensure)
    ENSURE_JSON="${3:-$EMPTY_OBJ}"
    DATA="$(printf '%s' "$DATA" | jq -c --argjson d "$ENSURE_JSON" \
      'reduce ($d | to_entries[]) as {$key, $value} (.; if has($key) then . else .[$key] = $value end)')"
    save "$DATA"
    ;;
  get)
    KEY="${3:-}"
    printf '%s' "$DATA" | jq -r --arg k "$KEY" '.[$k] // empty'
    ;;
  set)
    KEY="${3:-}"
    VAL="${4:-null}"
    DATA="$(printf '%s' "$DATA" | jq -c --arg k "$KEY" --argjson v "$VAL" '.[$k] = $v')"
    save "$DATA"
    ;;
  patch)
    PATCH_JSON="${3:-$EMPTY_OBJ}"
    DATA="$(printf '%s' "$DATA" | jq -c --argjson p "$PATCH_JSON" '. + $p')"
    save "$DATA"
    ;;
  inc)
    KEY="${3:-}"
    DELTA="${4:-1}"
    DATA="$(printf '%s' "$DATA" | jq -c --arg k "$KEY" --argjson d "$DELTA" \
      '.[$k] = ((.[$k] // 0) + $d)')"
    save "$DATA"
    ;;
  append)
    KEY="${3:-}"
    VAL="${4:-null}"
    MAX_LEN="${5:-0}"
    if [ "$MAX_LEN" -gt 0 ] 2>/dev/null; then
      DATA="$(printf '%s' "$DATA" | jq -c --arg k "$KEY" --argjson v "$VAL" --argjson m "$MAX_LEN" \
        '.[$k] = (((.[$k] // []) + [$v]) | if length > $m then .[-$m:] else . end)')"
    else
      DATA="$(printf '%s' "$DATA" | jq -c --arg k "$KEY" --argjson v "$VAL" \
        '.[$k] = ((.[$k] // []) + [$v])')"
    fi
    save "$DATA"
    ;;
  lt)
    KEY="${3:-}"
    THRESHOLD="${4:-0}"
    if printf '%s' "$DATA" | jq -e --arg k "$KEY" --argjson t "$THRESHOLD" \
        '(.[$k] // 0) < $t' >/dev/null 2>&1; then
      echo "true"
    else
      echo "false"
    fi
    ;;
  graph-next)
    CURRENT_NODE="${3:-}"
    RESULT="${4:-}"
    if [ -z "$CURRENT_NODE" ]; then
      echo "用法: statectl.sh <state.json> graph-next <current_node_id> <result>" >&2
      exit 64
    fi
    NEXT="$(printf '%s' "$DATA" | jq -r --arg c "$CURRENT_NODE" --arg r "$RESULT" '
      (.graph.edges // []) as $edges
      | (first($edges[] | select(.from == $c and ((.when // "") != "") and (.when | split("|") | index($r) != null)) | .to) // null) as $wmatch
      | if $wmatch != null then $wmatch
        else (first($edges[] | select(.from == $c and ((.when // "") == "")) | .to) // null) as $uncond
        | if $uncond != null then $uncond
          else "__abort__"
          end
        end
    ')"
    if [ "$NEXT" = "__abort__" ]; then
      if ! printf '%s' "$DATA" | jq -e --arg c "$CURRENT_NODE" --arg r "$RESULT" \
        'any((.graph.edges // [])[]; .from == $c and .to == "__abort__" and (((.when // "") == "") or (.when | split("|") | index($r) != null)))' >/dev/null 2>&1; then
        echo "警告: graph-next 兜底 __abort__(from=$CURRENT_NODE, result=$RESULT 无匹配且无默认边)" >&2
      fi
    fi
    printf '%s' "$NEXT"
    ;;
  "" | *)
    echo "用法: statectl.sh <state.json> <get|set|patch|inc|lt|ensure|append|graph-next|create> [args]" >&2
    echo "     create <json> [--force]  —— 既有非空 state 默认拒绝覆盖(exit 73)" >&2
    [ -n "$CMD" ] && echo "未知命令: $CMD" >&2
    exit 64
    ;;
esac
