// infer-skill.js — map (tool_name, tool_input) to the likely skill.
//
// Shared by log-invocation.js (trace-time tagging) and evolve.js (post-hoc
// analysis). Single source of truth so the two never drift.
//
// Heuristic: tool + input context → skill id. Returns null when no skill
// applies (general ops: git, npm, docs). Patterns are intentionally coarse —
// false negative is cheap (skill = null), false positive corrupts per-skill
// metrics. Order matters: most specific first.

'use strict';

function inferSkill(toolName, toolInput) {
  if (!toolInput) return null;
  const inputStr = JSON.stringify(toolInput).toLowerCase();

  if (toolName === 'Bash') {
    // dotnet-code-review: explicit review orchestrator/analyzer invocation
    if (/review[-_]orchestrator|csharp-unified-analyzer|dotnet-code-review/.test(inputStr)) {
      return 'dotnet-code-review';
    }
    if (/\b(dotnet|nuget|\.csproj|\.sln|c#)\b/.test(inputStr)) return 'dotnet-csharp-developer';
    if (/\b(sql|mysql|postgres|sqlite|kingbase|database|query)\b/.test(inputStr)) return 'database-explorer';
    if (/\b(winforms|devexpress)\b/.test(inputStr)) return 'winforms-dev-flow';
    return null;
  }

  if (toolName === 'Edit' || toolName === 'Write') {
    const fp = (toolInput.file_path || '').toLowerCase();

    // Most specific first: path-segment match beats extension match.
    // e.g. plugins/dotnet-work/skills/dotnet-code-review/... → dotnet-code-review
    if (/dotnet-code-review/.test(fp)) return 'dotnet-code-review';
    if (/database-explorer/.test(fp)) return 'database-explorer';
    if (/dotnet-csharp-developer/.test(fp)) return 'dotnet-csharp-developer';
    if (/winforms-dev-flow/.test(fp)) return 'winforms-dev-flow';

    // Extension-based fallbacks (path didn't name a skill)
    if (/\.cs$/.test(fp) || /\.csproj$/.test(fp) || /\.sln$/.test(fp)) return 'dotnet-csharp-developer';
    if (/\.sql$/.test(fp)) return 'database-explorer';
    if (/winforms|devexpress|\.designer\.cs/.test(fp)) return 'winforms-dev-flow';

    // Plugin self-edits (observability + workflow tooling maintenance)
    if (/skill-radar[\\/]/.test(fp)) return 'skill-radar';
    if (/graph-workflow[\\/]/.test(fp)) return 'graph-workflow';
    if (/agentic-workflow[\\/]/.test(fp)) return 'agentic-workflow';

    return null;
  }

  return null;
}

module.exports = { inferSkill };
