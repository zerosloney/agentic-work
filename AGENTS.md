# AGENTS.md — agentic-work

This repo contains plugins for opencode / CodeBuddy / ZCode. Follow these rules when making changes.

## Layout invariants

- `plugins/<plugin-name>/` is a single plugin. Each plugin MUST have three platform subdirs: `opencode/`, `codebuddy/`, `zcode/`.
- **Shared content** (`skills/`, `agents/`, `commands/`) lives at the **plugin root**, not inside platform subdirs. The platform subdirs (`opencode/`, `codebuddy/`, `zcode/`) contain ONLY platform-specific manifests.
- Platform manifests live only in their respective platform subdirs:
  - `zcode/.zcode-plugin/plugin.json`
  - `codebuddy/.codebuddy-plugin/plugin.json`
  - opencode has no per-plugin manifest; skills/agents/commands are discovered by name from the plugin root.
- Content inside `skills/`, `agents/`, `commands/` at the plugin root is the **single source of truth** — no duplication across platforms.

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
- Uninstall MUST remove all files created by install (skills/<name>/, agents/<file>.md, commands/<file>.md for opencode; full install dirs for codebuddy/zcode).
- Scripts copy from `plugins/<name>/` (shared content) and the relevant platform manifest from `plugins/<name>/<platform>/`.

## Verification

Before committing, run all three dry-runs:

```sh
node scripts/install-opencode.js --dry-run
node scripts/install-codebuddy.js --dry-run
node scripts/install-zcode.js --dry-run
```

All three must exit 0 without writing any files.

## Hooks (loop-workflow)

`plugins/loop-workflow/hooks/` contains lifecycle hooks for the loop-workflow plugin:

| File               | Trigger时机              |
|--------------------|----------------------------|
| `pre-execute.js`  | Before agent/command runs  |
| `post-execute.js` | After agent/command runs   |

Each hook file exports `{ onInstall(context) }`, `{ onUninstall(context) }`, etc. The `context` object contains `logger`, `platform`, `command`, and `result` (post-execute only). Hooks are registered via `hooks/index.js` `register(context)` which maps events to handlers.

## Marketplace

The `master0071` marketplace is shared with `caveman4cn`. To avoid conflicts, plugin names include the platform suffix (`dotnet-work-zcode`, `loop-workflow-codebuddy`, etc.) and live under `plugins/<name>/<platform>/` in this repo.