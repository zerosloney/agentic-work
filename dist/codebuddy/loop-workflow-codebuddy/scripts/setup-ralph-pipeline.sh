#!/bin/bash
# setup-ralph-pipeline.sh — 创建 Ralph Pipeline 初始状态文件
# Usage: setup-ralph-pipeline.sh PROMPT [--max-iterations N] [--completion-promise TEXT]

set -euo pipefail

# JSON string escape (bash-native; no jq dep — Git Bash / minimal envs lack it).
json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"     # \  → \\  (first, else later steps double-escape)
  s="${s//\"/\\\"}"     # "  → \"
  s="${s//$'\n'/\\n}"   # LF → \n
  s="${s//$'\r'/\\r}"   # CR → \r
  s="${s//$'\t'/\\t}"   # TAB→ \t
  printf '%s' "$s"
}

PROMPT_PARTS=()
MAX_ITERATIONS=0
COMPLETION_PROMISE=""

# Parse options and positional arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --max-iterations)
      if [[ -z "$2" || ! "$2" =~ ^[0-9]+$ ]]; then
        echo "❌ Error: --max-iterations requires a positive integer" >&2
        exit 1
      fi
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --completion-promise)
      if [[ -z "$2" ]]; then
        echo "❌ Error: --completion-promise requires a value" >&2
        exit 1
      fi
      COMPLETION_PROMISE="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: setup-ralph-pipeline.sh PROMPT [--max-iterations N] [--completion-promise TEXT]"
      echo ""
      echo "Arguments:"
      echo "  PROMPT                    Pipeline 任务描述"
      echo "  --max-iterations N       最大轮次上限（0=默认10）"
      echo "  --completion-promise TEXT 完成咒语，agent 输出 <promise>TEXT</promise> 即完成"
      exit 0
      ;;
    -*)
      echo "❌ Error: Unknown option: $1" >&2
      exit 1
      ;;
    *)
      PROMPT_PARTS+=("$1")
      shift
      ;;
  esac
done

PROMPT="${PROMPT_PARTS[*]}"

if [[ -z "$PROMPT" ]]; then
  echo "❌ Error: No prompt provided" >&2
  exit 1
fi

# Escape for JSON; build the full completion_promise JSON value (null | "escaped").
PROMPT_ESC="$(json_escape "$PROMPT")"
if [[ -n "$COMPLETION_PROMISE" ]]; then
  COMPLETION_PROMISE_JSON="\"$(json_escape "$COMPLETION_PROMISE")\""
else
  COMPLETION_PROMISE_JSON="null"
fi

# Create state directory
mkdir -p .loop-cli/state

# Write initial state file.
# printf '%s' (not %i/%d) keeps MAX_ITERATIONS validated integer literal; args are
# already JSON-escaped so printf does not re-interpret them. Avoids heredoc which
# would expand ` ` ` / $() in PROMPT.
printf '%s\n' \
'{' \
'  "version": 1,' \
'  "prompt": "'"${PROMPT_ESC}"'",' \
'  "max_iterations": '"${MAX_ITERATIONS}"',' \
'  "completion_promise": '"${COMPLETION_PROMISE_JSON}"',' \
'  "outer_iteration": 0,' \
'  "tasks": [],' \
'  "consecutive_failures": 0,' \
'  "stall_counter": 0,' \
'  "fail_history": [],' \
'  "round": 0,' \
'  "stop_reason": null' \
'}' > .loop-cli/state/ralph-pipeline.json

echo "✅ Ralph Pipeline initialized: '$PROMPT'"
echo "   max_iterations: $MAX_ITERATIONS"
echo "   completion_promise: ${COMPLETION_PROMISE:-null}"