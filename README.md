# @master0071/agentic-work

Agentic-work plugins for **CodeBuddy** and **ZCode**.

## Plugins

| Plugin          | Description                                                                                       | Type    |
|-----------------|---------------------------------------------------------------------------------------------------|---------|
| `dotnet-work`   | .NET development skills: database-explorer, dotnet-code-review, dotnet-csharp-developer, winforms-dev-flow | skills  |
| `graph-workflow` | Orchestrated execute-review loops: 6 agents + 3 commands (Coding-Loop + Ralph-Loop/Ralph-Graph)    | agents + commands |

## Installation

### From source (this repo)

```sh
# Install all platforms
npm run install:all

# Or per-platform
npm run install:codebuddy    # copies to ~/.codebuddy/plugins/<name>-codebuddy/
npm run install:zcode        # copies to ~/.zcode/cli/plugins/cache/master0071/<name>-zcode/

# Per-plugin flag
node scripts/install-zcode.js --plugin dotnet-work
node scripts/install-zcode.js --plugin graph-workflow

# Dry-run (preview without writing)
node scripts/install-zcode.js --dry-run

# Uninstall
node scripts/install-zcode.js --uninstall
```

### Single-plugin scope

```sh
npm install -g @master0071/agentic-work
```

Then invoke the per-platform wrappers installed by `@master0071/agentic-work`:

```sh
agentic-work-codebuddy     # installs for CodeBuddy
agentic-work-zcode         # installs for ZCode
```

(`agentic-work-codebuddy`, `agentic-work-zcode` are provided via `package.json` `bin`.)

## Marketplace

Both plugins ship under the `master0071` marketplace for CodeBuddy and ZCode:

- CodeBuddy: `~/.codebuddy/plugins/.codebuddy-plugin/marketplace.json`
- ZCode: `~/.zcode/cli/plugins/marketplaces/master0071/marketplace.json`

## Cross-platform content equality

Each plugin's `skills/`, `agents/`, `commands/` live at the **plugin root** and are the single source of truth. Platform subdirs (`codebuddy/`, `zcode/`) contain only their platform manifest. Install scripts copy from the shared location, so content stays consistent by definition.

## Repository structure

```
agentic-work/
├── package.json                          # @master0071/agentic-work
├── marketplace.json                      # zcode marketplace
├── .codebuddy-plugin/marketplace.json    # codebuddy marketplace
├── plugins/
│   ├── dotnet-work/
│   │   ├── codebuddy/
│   │   │   └── .codebuddy-plugin/plugin.json
│   │   ├── zcode/
│   │   │   └── .zcode-plugin/plugin.json
│   │   └── skills/                       # ← single source of truth
│   │       ├── database-explorer/
│   │       ├── dotnet-code-review/
│   │       ├── dotnet-csharp-developer/
│   │       └── winforms-dev-flow/
│   └── graph-workflow/
│       ├── codebuddy/
│       │   └── .codebuddy-plugin/plugin.json
│       ├── zcode/
│       │   └── .zcode-plugin/plugin.json
│       ├── agents/                       # ← single source of truth
│       └── commands/                     # ← single source of truth
└── scripts/
    ├── install-codebuddy.js
    └── install-zcode.js
```

## License

MIT © master0071
