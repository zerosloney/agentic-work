# AGENTS.md — agentic-work

This repo contains plugins for opencode / CodeBuddy / ZCode. Follow these rules when making changes.

## Layout invariants

- `plugins/<plugin-name>/` is a single plugin. Each plugin MUST have three platform subdirs: `opencode/`, `codebuddy/`, `zcode/`.
- Content inside `skills/`, `agents/`, `commands/` MUST be byte-identical across the three platforms.
- Platform manifests live only in their respective `<platform>/` subdir:
  - `zcode/.zcode-plugin/plugin.json`
  - `codebuddy/.codebuddy-plugin/plugin.json`
  - opencode has no per-plugin manifest; skills/agents/commands are discovered by name.

## dotnet-work

- Source: previously `donet-work/` (renamed, typo fixed).
- 4 skills: `database-explorer`, `dotnet-code-review`, `dotnet-csharp-developer`, `winforms-dev-flow`.
- When adding a new skill: create `<skill-name>/SKILL.md` + `references/` + `scripts/` once, then copy to all three platform subdirs.

## loop-workflow

- Current published scope: **coding + ralph domains** (6 agents + 3 commands × 3 platforms = 27 files).
- Source templates live at `loop-workflow/templates/{agents,commands}/*.md` using `{{...}}` placeholders. These are **not committed** — only the materialized outputs in `plugins/loop-workflow/<platform>/` are.
- `scripts/instantiate-templates.js` materializes templates into the three platform subdirs. To add a new domain (e.g. testing, writing, devops):
  1. Create the template files locally at `loop-workflow/templates/{agents,commands}/<name>.md` with `{{name}}`, `{{description}}`, `{{agent}}`/`{{executor_name}}`/`{{reviewer_name}}` placeholders. Orchestrators also use `{{backpressure}}`.
  2. Add entries to `AGENT_MAP` / `COMMAND_MAP` (and `BACKPRESSURE` for orchestrators) in `scripts/instantiate-templates.js`.
  3. Run `node scripts/instantiate-templates.js` (must have `loop-workflow/templates/` present locally).
  4. Commit the regenerated outputs in `plugins/loop-workflow/<platform>/`.

## Install scripts

- Each `scripts/install-<platform>.js` accepts: `--plugin <name>`, `--uninstall`, `--dry-run`.
- They MUST be idempotent: re-running install replaces existing content.
- Uninstall MUST remove all files created by install (skills/<name>/, agents/<file>.md, commands/<file>.md for opencode; full install dirs for codebuddy/zcode).

## Verification

Before committing, run all three dry-runs:

```sh
node scripts/install-opencode.js --dry-run
node scripts/install-codebuddy.js --dry-run
node scripts/install-zcode.js --dry-run
```

All three must exit 0 without writing any files.

## Marketplace

The `master0071` marketplace is shared with `caveman4cn`. To avoid conflicts, plugin names include the platform suffix (`dotnet-work-zcode`, `loop-workflow-codebuddy`, etc.) and live under `plugins/<name>/<platform>/` in this repo.