# AGENTS.md — agentic-work

This repo contains plugins for CodeBuddy and ZCode. Follow these rules when making changes.

## Layout invariants

- `plugins/<plugin-name>/` is a single plugin. Each plugin lives at the root level — no `codebuddy/` or `zcode/` platform subdirectories for manifests.
- **Shared content** (`skills/`, `agents/`, `commands/`, `scripts/`) lives at the **plugin root**.
- **Platform manifests** live at the plugin root:
  - `.zcode-plugin/plugin.json`
  - `.codebuddy-plugin/plugin.json`
- Content inside `skills/`, `agents/`, `commands/` at the plugin root is the **single source of truth** — no duplication across platforms.
- The only remaining platform-specific content is **CodeBuddy agent overrides** (for frontmatter incompatibility), kept at:
  ```
  plugins/<name>/codebuddy/agents/<agent-name>.md
  ```
  The `codebuddy/` subdir holds **agent overrides only** — it no longer contains a manifest. The materializer skips `codebuddy/` during the shared copy (so no manifest or stray files leak into `dist/`) and overlays its `agents/*.md` afterward.

### CodeBuddy-specific agent overrides

When an agent's frontmatter uses fields CodeBuddy does not recognise (e.g. nested `permission:` blocks, `mode: subagent`, `temperature`, `steps`), put a CodeBuddy-adapted version in:

```
plugins/<name>/codebuddy/agents/<agent-name>.md
```

The install script copies agents from the plugin root, then overlays any `codebuddy/agents/` files on top. Body content should be the same as the root version; only the frontmatter changes. Each override file starts with an HTML comment noting the sync requirement.

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
- Platform manifests: `.codebuddy-plugin/plugin.json`, `.zcode-plugin/plugin.json` at the plugin root.
- When adding a new skill: create `<skill-name>/SKILL.md` + `references/` + `scripts/` under `plugins/dotnet-work/skills/`.

## loop-workflow

- Current published scope: **coding + ralph domains** (6 agents + 5 commands).
- Shared agents live at `plugins/loop-workflow/agents/`.
- Shared commands live at `plugins/loop-workflow/commands/`.
- Platform manifests: `.codebuddy-plugin/plugin.json`, `.zcode-plugin/plugin.json` at the plugin root.
- Templates source files (`loop-workflow/templates/{agents,commands}/*.md` with `{{...}}` placeholders) are **not committed** — only the materialized outputs at the plugin root are.
- To add a new agent or command: create the `.md` file under `plugins/loop-workflow/agents/` or `plugins/loop-workflow/commands/`. No cross-platform copy needed — the install scripts handle it.

## Install scripts

- Each `scripts/install-<platform>.js` accepts: `--plugin <name>`, `--uninstall`, `--dry-run`.
- They MUST be idempotent: re-running install replaces existing content.
- Uninstall MUST remove all files created by install (full install dirs for codebuddy/zcode).
- Scripts copy from `plugins/<name>/` (shared content) and the root platform manifests from `plugins/<name>/.codebuddy-plugin/` or `plugins/<name>/.zcode-plugin/`.
- `scripts/materialize-codebuddy.js` is a pure-assembly sibling (accepts `--plugin <name>`, `--dry-run`; **no** `--uninstall` — delete `dist/codebuddy/` to revert). It shares the same copy+overlay logic as `install-codebuddy.js` via `scripts/lib/materialize.js`, so the two paths produce identical plugin trees.

## CodeBuddy dist artifacts

`dist/codebuddy/<name>-codebuddy/` is a **generated, committed** artifact — a self-contained CodeBuddy plugin tree (manifest + `skills/`/`commands/`/`agents/` with the codebuddy agent overrides already applied) that `.codebuddy-plugin/marketplace.json` `source` points at verbatim. This is required because CodeBuddy consumes `source` directly: the plugin root `agents/` may carry CodeBuddy-incompatible frontmatter (`mode`/`temperature`/`steps`/nested `permission`).

- Produced by `node scripts/materialize-codebuddy.js`.
- After editing any shared content (`plugins/<name>/`) or codebuddy agent overrides (`plugins/<name>/codebuddy/agents/`), re-run the script and commit the `dist/` changes alongside the source changes — keep dist in sync with sources.
- The assembly rules (wipe → copy shared minus platform subdirs → copy codebuddy manifest → overlay codebuddy agents) live in `scripts/lib/materialize.js`.

## Verification

Before committing, run all three dry-runs:

```sh
node scripts/install-codebuddy.js --dry-run
node scripts/install-zcode.js --dry-run
node scripts/materialize-codebuddy.js --dry-run
```

All must exit 0 without writing any files. After source edits that affect plugin content, also run `node scripts/materialize-codebuddy.js` (non-dry-run) and commit the regenerated `dist/`.

## State validation

Orchestrators write JSON to `.loop-cli/state/*.json` each round. Validate the file before each write with:

```sh
node scripts/validate-state.js .loop-cli/state/coding-pipeline.json
node scripts/validate-state.js .loop-cli/state/ralph-pipeline.json
node scripts/validate-state.js .loop-cli/state/ralph-graph.json
```

Exits 0 on success; non-zero with diagnostics (unknown fields, type mismatches, duplicate ids, circular `depends_on`) on failure. Use `--loop <file>` or `--graph <file>` to disambiguate when `version` is missing.

## Shared documents

`agents/_shared/` holds cross-agent reference material (the platforms only scan top-level files in `agents/` and `commands/`, so `_shared/` is safely ignored):

- `agents/_shared/decomposition.md` — task complexity estimation & decomposition rules, referenced by `coding-orchestrator.md`, `ralph-orchestrator.md`, and the three command templates.
- `agents/_shared/field-map.md` — state JSON field ↔ `=== X ===` injection mapping for each loop variant.

## Marketplace

The `agentic-work` marketplace is used for CodeBuddy installation. Each repo uses its own marketplace name to avoid conflicts — `caveman4cn` uses `master0071`, agentic-work uses `agentic-work`.

- CodeBuddy `source` paths point at `./dist/codebuddy/<name>-codebuddy/` — the committed, materialized plugin trees (see "CodeBuddy dist artifacts" above). This lets users `codebuddy plugin install <id>@agentic-work` directly from the repo.
- ZCode `source` paths point at `./plugins/<name>/` (install script copies to the user's plugin cache).
