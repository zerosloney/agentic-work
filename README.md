# @master0071/agentic-work

Multi-platform AI-coding plugins for **ZCode, CodeBuddy, Trae, Qoder, Qwen Code**. Each plugin ships as a set of agents, skills, commands, and hooks. Platform manifests adapt frontmatter to each host; shared content (agent/skill/command bodies) stays the single source of truth.

## Plugins

| Plugin | Type | ZCode | CodeBuddy | Trae | Qoder | Qwen |
|--------|------|:-----:|:---------:|:----:|:-----:|:----:|
| `dotnet-work` | skills (C# / WinForms / .NET review / DB explore) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `agentic-workflow` | agents + commands (Coding-Pipeline + Ralph-Pipeline/Ralph-Graph) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `graph-workflow` | agents + commands (Loop + Graph Engineering, unattended) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `skill-radar` | hooks (skill observability: trace → aggregate → score → evolve) | ✓ | ✓ | ✓ | ✓ | ✓ |

Coverage reflects what the install scripts actually register. `skill-radar` reached five-platform parity on 2026-07-30 (Trae hooks merge into the project-level `.trae/hooks.json` by default; Qoder auto-discovers the wrapper config as `hooks.json`; Qwen Code uses top-level event keys).

## Per-plugin docs

- `plugins/dotnet-work/` — skill routing matrix and cross-skill collaboration (see `AGENTS.md` "dotnet-work").
- `plugins/agentic-workflow/` — orchestrator/worker/reviewer agents + pipeline commands.
- `plugins/graph-workflow/README.md` — Loop vs Graph entry points, three-role collaboration, hard-constraint model.
- `plugins/skill-radar/README.md` — four phases (tracing / aggregation / scoring / evolution) + data layout.

## Installation

### From source (this repo)

```sh
# ZCode + CodeBuddy only (scripted npm entry)
npm run install:all

# Per-platform (all five hosts)
node scripts/install-zcode.js
node scripts/install-codebuddy.js
node scripts/install-trae.js
node scripts/install-qoder.js
node scripts/install-qwencode.js

# Per-plugin flag (any platform script)
node scripts/install-zcode.js --plugin dotnet-work
node scripts/install-qoder.js --plugin agentic-workflow

# Dry-run (preview without writing)
node scripts/install-zcode.js --dry-run

# Uninstall
node scripts/install-zcode.js --uninstall
```

> Note: `install-trae/qoder/qwencode` install all four plugins including `skill-radar`. Trae hooks are **project-scoped by default** (merged into `<project>/.trae/hooks.json` when a project root is detectable from cwd); pass `--global` to write the machine-wide `~/.trae-cn/hooks.json`, or `--project-only` to fail when no project root is found.

### From npm

```sh
npm install -g @master0071/agentic-work

agentic-work-codebuddy     # installs for CodeBuddy
agentic-work-zcode         # installs for ZCode
```

(`agentic-work-codebuddy`, `agentic-work-zcode` are provided via `package.json` `bin`. Trae/Qoder/Qwen still need a direct `node scripts/install-<platform>.js` call.)

## Verification

Before committing, run all dry-runs (all must exit 0):

```sh
node scripts/install-codebuddy.js --dry-run
node scripts/install-zcode.js --dry-run
node scripts/install-trae.js --dry-run
node scripts/install-qoder.js --dry-run
node scripts/install-qwencode.js --dry-run
node scripts/materialize-codebuddy.js --dry-run
```

Version sync check (`.codebuddy-plugin/plugin.json` version is authoritative):

```sh
node scripts/bump-version.js --all --check    # exits non-zero on drift
```

Manifest / frontmatter / dependency checks (all must exit 0):

```sh
node scripts/validate-manifest.js                 # schema + capabilities + version consistency
node scripts/generate-platform-agents.js --check  # agent frontmatter vs derived profiles
node scripts/resolve-deps.js                      # deps existence / semver / cycles
```

State-file validation (agentic-workflow + graph-workflow):

```sh
node scripts/validate-state.js .loop-cli/state/coding-pipeline.json
```

State v1→v2 migration (both state families, auto-detected; writes `.bak` first):

```sh
node scripts/migrate-state.js <state-file> --dry-run   # preview
node scripts/migrate-state.js <state-file>             # in-place
```

Secret storage for `sensitive` plugin config (env var → OS keychain):

```sh
node scripts/lib/secret-store.js set my-plugin.api_key <value>
node scripts/lib/secret-store.js get my-plugin.api_key
```

## Marketplace

Plugins ship under a per-host marketplace:

- CodeBuddy: `agentic-work` marketplace → `~/.codebuddy/plugins/.codebuddy-plugin/marketplace.json`
- ZCode: `master0071` marketplace → `~/.zcode/cli/plugins/marketplaces/master0071/marketplace.json`

(Each repo uses its own marketplace name to avoid conflicts.)

## Cross-platform content model

Each plugin's `skills/`, `agents/`, `commands/` live at the **plugin root** as the single source of truth. Per-platform subtrees hold **platform-specific copies with adapted frontmatter** (ZCode nested `permission:` / CodeBuddy flat `permissionMode` / Trae `platform: trae` / Qoder `permissionMode` / Qwen Code `approvalMode` + `tools`). Agent **bodies must stay identical** across platforms — only frontmatter differs. Install scripts copy from the platform subtree and flatten `agents/` to the install root.

## Repository structure

```
agentic-work/
├── package.json                          # @master0071/agentic-work
├── marketplace.json                      # ZCode marketplace (master0071)
├── .codebuddy-plugin/marketplace.json    # CodeBuddy marketplace (agentic-work)
├── AGENTS.md                             # layout invariants, per-plugin rules, hook contracts
├── plugins/
│   ├── dotnet-work/                      # 4 skills, 5-platform manifests
│   ├── agentic-workflow/                 # 6 agents + 5 commands + hooks, 5 platforms
│   ├── graph-workflow/                   # 5 agents + 3 commands + state scripts, ZCode+CodeBuddy
│   └── skill-radar/                      # tracing hooks + 4 analysis scripts, ZCode+CodeBuddy
└── scripts/
    ├── install-{codebuddy,zcode,trae,qoder,qwencode}.js
    ├── materialize-codebuddy.js
    ├── validate-state.js
    └── bump-version.js
```

## License

MIT © master0071
