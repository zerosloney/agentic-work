# AGENTS.md — agentic-work

This repo contains plugins for CodeBuddy and ZCode. Follow these rules when making changes.

## Layout invariants

- `plugins/<plugin-name>/` is a single plugin. Each plugin MUST have `codebuddy/` and `zcode/` platform subdirs (opencode has none — content is discovered from the plugin root).
- **Shared content** (`skills/`, `agents/`, `commands/`) lives at the **plugin root**, not inside platform subdirs. The platform subdirs contain ONLY platform-specific manifests and platform-specific agent overrides (see below).
- Platform manifests live only in their respective platform subdirs:
  - `zcode/.zcode-plugin/plugin.json`
  - `codebuddy/.codebuddy-plugin/plugin.json`
- Content inside `skills/`, `agents/`, `commands/` at the plugin root is the **single source of truth** — no duplication across platforms.

### CodeBuddy-specific agent overrides

When an agent's frontmatter uses fields CodeBuddy does not recognise (e.g. nested `permission:` blocks, `mode: subagent`, `temperature`, `steps`), put a CodeBuddy-adapted version in:

```
plugins/<name>/codebuddy/agents/<agent-name>.md
```

The install script copies agents from the plugin root, then overlays any codebuddy/agents/ files on top. Body content should be the same as the root version; only the frontmatter changes. Each override file starts with an HTML comment noting the sync requirement.

Permission mapping for codebuddy `permissionMode` (single-value enum):

| Source root `permission:` | codebuddy `permissionMode` |
|---------------------------|----------------------------|
| `edit: allow` (full)      | `acceptEdits`              |
| `edit: deny` + bash allow-list (orchestrator) | `default` |
| `edit: deny` + read-only  | `plan`                     |

Fine-grained bash allow-lists cannot be expressed in `permissionMode`; this is a known trade-off documented per file.

## dotnet-work

- Source: previously `donet-work/` (renamed, typo fixed).
- 4 skills: `database-explorer`, `dotnet-code-review`, `dotnet-csharp-developer`, `winforms-dev-flow`.
- Shared skills live at `plugins/dotnet-work/skills/<skill-name>/`.
- Platform manifests: `codebuddy/.codebuddy-plugin/plugin.json`, `zcode/.zcode-plugin/plugin.json`.
- When adding a new skill: create `<skill-name>/SKILL.md` + `references/` + `scripts/` under `plugins/dotnet-work/skills/`.

## loop-workflow

- Current published scope: **coding + ralph domains** (6 agents + 3 commands).
- Shared agents live at `plugins/loop-workflow/agents/`.
- Shared commands live at `plugins/loop-workflow/commands/`.
- Templates source files (`loop-workflow/templates/{agents,commands}/*.md` with `{{...}}` placeholders) are **not committed** — only the materialized outputs at the plugin root are.
- To add a new agent or command: create the `.md` file under `plugins/loop-workflow/agents/` or `plugins/loop-workflow/commands/`. No cross-platform copy needed — the install scripts handle it.

## Install scripts

- Each `scripts/install-<platform>.js` accepts: `--plugin <name>`, `--uninstall`, `--dry-run`.
- They MUST be idempotent: re-running install replaces existing content.
- Uninstall MUST remove all files created by install (full install dirs for codebuddy/zcode).
- Scripts copy from `plugins/<name>/` (shared content) and the relevant platform manifest from `plugins/<name>/<platform>/`.

## Verification

Before committing, run both dry-runs:

```sh
node scripts/install-codebuddy.js --dry-run
node scripts/install-zcode.js --dry-run
```

Both must exit 0 without writing any files.

## State validation

Orchestrators write JSON to `.loop-cli/state/*.json` each round. Validate the file before each write with:

```sh
node scripts/validate-state.js .loop-cli/state/coding-loop.json
node scripts/validate-state.js .loop-cli/state/ralph-loop.json
node scripts/validate-state.js .loop-cli/state/ralph-graph.json
```

Exits 0 on success; non-zero with diagnostics (unknown fields, type mismatches, duplicate ids, circular `depends_on`) on failure. Use `--loop <file>` or `--graph <file>` to disambiguate when `version` is missing.

## Shared documents

`agents/_shared/` holds cross-agent reference material (the platforms only scan top-level files in `agents/` and `commands/`, so `_shared/` is safely ignored):

- `agents/_shared/decomposition.md` — task complexity estimation & decomposition rules, referenced by `coding-orchestrator.md`, `ralph-orchestrator.md`, and the three command templates.
- `agents/_shared/field-map.md` — state JSON field ↔ `=== X ===` injection mapping for each loop variant.

## Marketplace

The `master0071` marketplace is shared with `caveman4cn`. To avoid conflicts, plugin names include the platform suffix (`dotnet-work-zcode`, `loop-workflow-codebuddy`, etc.) and live under `plugins/<name>/<platform>/` in this repo.