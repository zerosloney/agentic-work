# skill-radar

Skill observability for ZCode + CodeBuddy — passive, non-blocking telemetry that
records tool invocations, aggregates them, scores sessions, and recommends skill
tuning. Four phases, each a standalone script you run on demand.

## What it does

| Phase | Script | When | Output |
|-------|--------|------|--------|
| 1 — tracing | hooks (automatic) | every `Write`/`Edit`/`Bash` | JSONL traces |
| 2 — aggregation | `scripts/aggregate-traces.js` | on demand | console table + `--json` |
| 3 — feedback scoring | `scripts/feedback-scoring.js` | on demand | per-tool/skill/session scores |
| 4 — evolution | `scripts/evolve.js` | on demand | skill-tuning recommendations |
| — retention | `scripts/cleanup-traces.js` | on demand | deletes traces/signals older than N days |

## Quick start

```sh
# What happened recently?
node plugins/skill-radar/scripts/aggregate-traces.js --days 7

# Which tools/skills/sessions are struggling?
node plugins/skill-radar/scripts/feedback-scoring.js --days 7

# What should I tune?
node plugins/skill-radar/scripts/evolve.js --days 14

# Reclaim disk: drop traces/signals older than 30 days
node plugins/skill-radar/scripts/cleanup-traces.js --prune-days 30 --dry-run   # preview first
node plugins/skill-radar/scripts/cleanup-traces.js --prune-days 30             # then apply
```

All three read the same trace store and accept `--days N`, `--json --out <file>`,
`--data-dir <path>`, and (feedback/evolve) `--threshold <score>`.

## Data layout

Traces and signals are written under the plugin data dir, resolved in order:

1. `ZCODE_PLUGIN_DATA` (ZCode)
2. `CODEBUDDY_PLUGIN_DATA` (CodeBuddy)
3. `~/.skill-radar/` (fallback)

```
<data-dir>/
├── session.json          # current session_id (rewritten each SessionStart)
├── traces/
│   └── 2026-07-28.jsonl  # one line per tool invocation
└── signals/
    └── 2026-07-28.jsonl  # one line per Stop event
```

### Trace schema

```jsonc
{
  "ts": "2026-07-28T06:02:54.014Z",
  "event": "PostToolUse|PostToolUseFailure",
  "tool_name": "Edit",
  "session_id": "sess_...",
  "platform": "zcode",
  "skill": "dotnet-csharp-developer",   // present when inferable, else omitted
  "tool_input": { "file_path": "..." },
  "tool_input_size": 62,
  "tool_response_size": 40,
  "tool_response_excerpt": "...[N more]",
  "error": { "message": "...", "stack": null }  // failures only
}
```

The `skill` field is tagged at trace time by `scripts/lib/infer-skill.js` using
tool + input heuristics. Recognized skills:

| Pattern | Skill |
|---------|-------|
| `Bash` + `review-orchestrator`/`csharp-unified-analyzer` | `dotnet-code-review` |
| `Bash` + `dotnet`/`nuget`/`.csproj` | `dotnet-csharp-developer` |
| `Bash` + `sql`/`database`/`kingbase` | `database-explorer` |
| `Bash` + `winforms`/`devexpress` | `winforms-dev-flow` |
| `Edit`/`Write` on a path containing a skill name | that skill |
| `Edit`/`Write` on `*.cs`/`*.csproj`/`*.sln` | `dotnet-csharp-developer` |
| `Edit`/`Write` on `*.sql` | `database-explorer` |
| `Edit`/`Write` under `plugins/graph-workflow/` | `graph-workflow` |
| `Edit`/`Write` under `plugins/agentic-workflow/` | `agentic-workflow` |
| `Edit`/`Write` under `plugins/skill-radar/` | `skill-radar` |

Traces that don't match a known skill omit the field — they still aggregate
by tool/date, just not by skill.

## How scoring works

- **tool score** = `1 - failure_rate`
- **skill score** = same, computed over skill-tagged traces only
- **session score** = `1 - failure_rate`, minus a penalty of `0.15` per negative
  Stop signal (capped at `-0.3`)

Negative Stop signals come from `stop-signal.js`, which inspects the last
assistant message. To avoid false positives it strips code blocks, inline code,
and blockquotes before matching, and suppresses the whole message if it contains
resolution markers ("fixed", "now passes", "resolved", "no longer fails").

## Platform support

| Platform | Status | Notes |
|----------|--------|-------|
| ZCode | ✅ | Native `process` hooks, `${ZCODE_PLUGIN_ROOT}` |
| CodeBuddy | ✅ | Shell wrapper (`run-hook.cmd` + `observe.sh`), `hookSpecificOutput` |
| Trae / Qoder / Qwen Code | ⚠️ unsupported | Not verified yet |

## Design constraints

- **Never blocks.** Every hook exits 0 with `{}` on any error — observability
  must not interfere with the user's workflow.
- **No dependencies.** Plain Node.js stdlib only.
- **Append-only storage.** Nothing is deleted automatically (see roadmap below).

## Known limitations / roadmap

- **Session correlation assumes single active session.** `session.json` is a
  single file; concurrent ZCode windows will overwrite each other's session_id.
- **Error categorization is regex-based.** Failures are bucketed into
  permission/not_found/timeout/syntax/connection/resource/other by pattern —
  edge cases land in `other`.

See `AGENTS.md` (skill-radar section) for the internal Phase 1–4 roadmap and
field-level spec.
