#!/usr/bin/env bash
# observe.sh — CodeBuddy hook wrapper for skill-radar
#
# CodeBuddy requires "type": "command" with shell scripts.
# Dispatches by event name to the matching Node.js script:
#   - session-start          → session-start.js
#   - post-tool-use          → log-invocation.js (PostToolUse)
#   - post-tool-use-failure  → log-invocation.js (PostToolUseFailure)
#   - stop                   → stop-signal.js
#
# Usage: observe.sh <event-name>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
EVENT_NAME="${1:-unknown}"

case "${EVENT_NAME}" in
  session-start)
    exec node "${SCRIPT_DIR}/session-start.js"
    ;;
  post-tool-use|post-tool-use-failure)
    exec node "${SCRIPT_DIR}/log-invocation.js" --event "${EVENT_NAME}" --platform codebuddy
    ;;
  stop)
    exec node "${SCRIPT_DIR}/stop-signal.js"
    ;;
  *)
    echo "observe.sh: unknown event '${EVENT_NAME}'" >&2
    exit 0  # never block
    ;;
esac
