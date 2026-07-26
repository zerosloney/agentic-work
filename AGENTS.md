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
- Templates source files (`loop-workflow/templates/{agents,commands}/*.md` with `{{...}}` placeholders) are **not committed** — only the materialized outputs in `plugins/loop-workflow/<platform>/` are.
- To add a new agent or command: create the `.md` file directly under all three of `plugins/loop-workflow/{opencode,codebuddy,zcode}/{agents,commands}/`. The three copies MUST be byte-identical (Layout invariant above). Do not introduce a generator — the cross-platform copy is a manual two-minute operation for new files.

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