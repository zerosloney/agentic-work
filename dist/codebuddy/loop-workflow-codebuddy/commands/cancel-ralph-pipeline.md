---
description: "Cancel active Ralph Pipeline"
allowed-tools: ["Bash(test -f .loop-cli/state/ralph-pipeline.json:*)", "Read(.loop-cli/state/ralph-pipeline.json)", "Bash(rm .loop-cli/state/ralph-pipeline.json)"]
hide-from-slash-command-tool: true
---

# Cancel Ralph Pipeline

To cancel the active Ralph Pipeline:

1. Check if `.loop-cli/state/ralph-pipeline.json` exists using Bash:
   ```
   test -f .loop-cli/state/ralph-pipeline.json && echo "EXISTS" || echo "NOT_FOUND"
   ```

2. **If NOT_FOUND**: Say "No active Ralph Pipeline found."

3. **If EXISTS**:
   - Read `.loop-cli/state/ralph-pipeline.json` to get the current round number from the `round:` field
   - Remove the file using Bash: `rm .loop-cli/state/ralph-pipeline.json`
   - Report: "Cancelled Ralph Pipeline (was at round N)"