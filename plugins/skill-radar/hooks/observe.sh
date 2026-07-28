#!/usr/bin/env bash
# observe.sh — CodeBuddy hook wrapper for skill-radar
#
# CodeBuddy requires "type": "command" with shell scripts.
# This wrapper delegates to the Node.js observer script, which handles
# stdin reading, trace writing, and output formatting.
#
# Usage: observe.sh <event-name>
#   observe.sh session-start
#   observe.sh post-tool-use
#   observe.sh post-tool-use-failure
#   observe.sh stop

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
EVENT_NAME="${1:-unknown}"

# Delegate to Node.js observer
exec node "${SCRIPT_DIR}/log-invocation.js" --event "${EVENT_NAME}" --platform codebuddy
