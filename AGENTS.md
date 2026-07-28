# AGENTS.md — agentic-work

This repo contains plugins for CodeBuddy and ZCode. Follow these rules when making changes.

## Layout invariants

- `plugins/<plugin-name>/` is a single plugin. Each plugin lives at the root level — no `codebuddy/` or `zcode/` platform subdirectories for manifests.
- **Shared content** (`skills/`, `agents/`, `commands/`, `scripts/`) lives at the **plugin root**.
- **Platform manifests** live at the plugin root:
  - `.zcode-plugin/plugin.json`
  - `.codebuddy-plugin/plugin.json`
  - `.trae-plugin/plugin.json`
  - `.qoder-plugin/plugin.json`
  - `.qwen-plugin/qwen-extension.json`
- 各平台 manifest 字段按各自 schema 要求，允许不一致（如 `author`、`description`、`keywords` 等字段在不同平台 manifest 中可有不同子集）。
- Content inside `skills/`, `agents/`, `commands/` at the plugin root is the **single source of truth** for ZCode（ZCode 直接使用根 `agents/`，无需单独子目录）。
- **不同平台的 agent frontmatter 可能不兼容**（如 ZCode 支持嵌套 `permission:` 块、`mode`、`temperature`、`steps`，而 CodeBuddy 只认 flat `permissionMode`）。每个平台有独立的 agents 目录：
  ```
  plugins/<name>/zcode/agents/             ← ZCode 版本（嵌套 permission，单 source of truth）
  plugins/<name>/codebuddy/agents/         ← CodeBuddy 版本（permissionMode 单值）
  plugins/<name>/trae/agents/              ← Trae 版本（嵌套 permission + platform: trae）
  plugins/<name>/qoder/agents/             ← Qoder 版本（permissionMode 单值）
  plugins/<name>/qwencode/agents/          ← Qwen Code 版本（approvalMode + tools 允许列表）
  ```
  各平台的 manifest（`.zcode-plugin/plugin.json`、`.codebuddy-plugin/plugin.json` 等）通过 `"agents"` 字段指向对应的目录。Body 内容应保持一致，仅 frontmatter 不同。每个非 ZCode 平台的 agent 文件开头需加 HTML 注释注明同步要求。

Permission mapping for codebuddy/qoder `permissionMode` (single-value enum):

| Source root `permission:` | codebuddy/qoder `permissionMode` |
|---------------------------|----------------------------------|
| `edit: allow` (full)      | `acceptEdits`                    |
| `edit: deny` + bash allow-list (orchestrator) | `default` |
| `edit: deny` + read-only  | `plan`                           |

Trae 使用嵌套 `permission:` 块（同 ZCode），通过 `platform: trae` 标记识别。
Qwen Code 使用 `approvalMode`（`auto-edit`/`default`/`plan`/`yolo`/`bubble`）+ `tools` 允许列表。
Fine-grained bash allow-lists cannot be expressed in `permissionMode`/`approvalMode`; this is a known trade-off documented per file。

## dotnet-work

- Source: previously `donet-work/` (renamed, typo fixed).
- 4 skills: `database-explorer`, `dotnet-code-review`, `dotnet-csharp-developer`, `winforms-dev-flow`.
- Shared skills live at `plugins/dotnet-work/skills/<skill-name>/`.
- Platform manifests: `.codebuddy-plugin/plugin.json`, `.zcode-plugin/plugin.json` at the plugin root.
- When adding a new skill: create `<skill-name>/SKILL.md` + `references/` + `scripts/` under `plugins/dotnet-work/skills/`.

### Skill 路由

完整路由决策树 + 跨 skill 协作图见 `plugins/dotnet-work/README.md`。主诉求→主 skill 速查：

| 用户说 | 主 skill |
|--------|---------|
| "写 C# 代码/API/服务" | `dotnet-csharp-developer` |
| "审查/review/安全扫描/质量" | `dotnet-code-review` |
| "连数据库/查表/SQL/导出" | `database-explorer` |
| "WinForms/DevExpress/窗体" | `winforms-dev-flow` |

跨 skill 协作（已内建调用点）：`dotnet-csharp-developer` Step 4b 调 `dotnet-code-review`；`winforms-dev-flow` Step 0a/2 调 `database-explorer` 查 schema。

## agentic-workflow

- Current published scope: **coding + ralph domains** (6 agents + 5 commands).
- ZCode agents live at `plugins/agentic-workflow/agents-zcode/` (with nested `permission:` frontmatter). `.zcode-plugin/plugin.json` points `"agents"` at this directory.
- CodeBuddy agents live at `plugins/agentic-workflow/agents-codebuddy/` (with flat `permissionMode` frontmatter). `.codebuddy-plugin/plugin.json` points `"agents"` at this directory.
- Shared commands live at `plugins/agentic-workflow/commands/`.
- Platform manifests: `.codebuddy-plugin/plugin.json`, `.zcode-plugin/plugin.json` at the plugin root.
- Templates source files (`agentic-workflow/templates/{agents,commands}/*.md` with `{{...}}` placeholders) are **not committed** — only the materialized outputs at the plugin root are.
- To add a new agent: create a file per platform that needs it — `agents-zcode/<name>.md`、`agents-codebuddy/<name>.md` 等。Body 必须一致，仅 frontmatter 按平台适配。
- To add a new command: create `plugins/agentic-workflow/commands/<name>.md`.

## skill-radar

- **Purpose**: skill observability — tool invocation tracing (Phase 1), aggregation (Phase 2), feedback (Phase 3), evolution (Phase 4).
- **MVP scope (Phase 1)**: PostToolUse + PostToolUseFailure hooks → JSONL traces. No aggregation, no feedback loop.
- **ZCode + CodeBuddy** supported. CodeBuddy uses shell wrapper (`run-hook.cmd` + `observe.sh`) with `CLAUDE_PLUGIN_ROOT` env var and `hookSpecificOutput` output format. Other platforms (Trae/Qoder/Qwen) marked `unsupported` until verified.
- Manifest: `.zcode-plugin/plugin.json` declares `"hooks": "hooks/hooks.json"`.
- Storage: `ZCODE_PLUGIN_DATA/traces/<YYYY-MM-DD>.jsonl` (falls back to `~/.skill-radar/traces/`).
- Session correlation: `SessionStart` generates uuid → `ZCODE_PLUGIN_DATA/session.json`; `log-invocation.js` reads it.
- Manifest: `.codebuddy-plugin/plugin.json` is version source of truth; `.zcode-plugin/plugin.json` derived.
- Hooks:
  - `session-start.js` — SessionStart: generate + persist session_id.
  - `log-invocation.js` — PostToolUse + PostToolUseFailure: append JSONL trace.
- Trace schema:
  ```jsonc
  {
    "ts": "2026-07-28T06:02:54.014Z",
    "event": "PostToolUse|PostToolUseFailure",
    "tool_name": "Edit",
    "session_id": "sess_...",
    "platform": "zcode",
    "tool_input": { "file_path": "...", "old_string": "...", "new_string": "..." },
    "tool_input_size": 62,
    "tool_response_size": 40,
    "tool_response_excerpt": "...[N more]",
    "error": { "message": "...", "stack": null }
  }
  ```
- Phase 2 (aggregation): `plugins/skill-radar/scripts/aggregate-traces.js` — reads JSONL traces, outputs console summary + JSON report. Supports `--days N`, `--json`, `--out <file>`, `--data-dir <path>`. Metrics: invocation count, success/failure rate, avg response size, unique sessions, top errors, daily breakdown.
- Phase 3 (feedback scoring): `plugins/skill-radar/scripts/feedback-scoring.js` — reads traces + Stop signals, computes per-tool and per-session scores. Tool score = 1 - failure_rate. Session score = failure-based score minus signal penalty (Stop hook detects error/incompleteness in last assistant message, each negative signal = -0.15 penalty, max -0.3). Supports `--days N`, `--json --out`, `--threshold`. Stop hook: `hooks/stop-signal.js` — writes to `signals/<date>.jsonl`, never blocks.
- Phase 4 (evolution): `plugins/skill-radar/scripts/evolve.js` — reads traces, identifies high-failure tools/skills, categorizes error patterns (permission/not_found/timeout/syntax/connection/resource/other), generates actionable recommendations. Skill inference: maps tool+input context to likely skill via heuristics (Bash+dotnet → dotnet-csharp-developer, Edit+.cs → dotnet-csharp-developer, Bash+sql → database-explorer). Manual trigger (`node evolve.js`), human reviews before applying. Supports `--days N`, `--json --out`, `--threshold`. Output: per-tool + per-skills recommendations with severity (high/medium), dominant error pattern, and suggested action.

## graph-workflow

- **Purpose**: Loop Engineering + Graph Engineering 双档位闭环 — 外层脚本硬约束(MAX_ITER/BUDGET_S/STALL_LIMIT/VERIFY_CMD) + 内层三角色(executor/reviewer/fixer)协作,无人值守长任务。
- **ZCode + CodeBuddy** 已支持;Trae/Qoder/QwenCode 未支持(install 脚本 PLUGINS 未登记,且缺三平台 manifest + agents,见 REVIEW G-002)。
- **两个入口命令**:`commands/loop-task.md`(Loop Engineering,固定 exec→review→fix 循环,状态 version=1)、`commands/graph-task.md`(Graph Engineering 档位 B,声明式图拓扑,默认图等价 loop-task,状态 version=2)。两档位跨版本不兼容(旧状态读到不匹配 version 拒绝续跑,防漂移)。
- **三角色 agents**(ZCode 嵌套 `permission:` / CodeBuddy flat `permissionMode`,body 一致仅 frontmatter 不同):
  - `orchestrator`(`permissionMode: plan`) — 决策层,读状态拆步骤,用 Agent 工具委派 executor/reviewer/fixer,不直接写业务代码。`graph-orchestrator` 变体按 `state.graph` 拓扑 + `statectl graph-next` 边路由执行。
  - `executor`(`permissionMode: auto-edit`) — 按 plan 实际执行(写代码/改文件/跑命令),写 `progress_delta`。
  - `reviewer`(`permissionMode: plan`) — 确定性验证 + 语义审查,写 `status`/`goal_met`/`review`。有"零证据禁令":项目有验证手段但没跑 → 禁止判 pass。
  - `fixer`(`permissionMode: auto-edit`) — 根因最小修复,修完回 orchestrator 重新委派 reviewer。
- **Manifest 单一真源**:`.codebuddy-plugin/plugin.json` version 字段权威;`.zcode-plugin/plugin.json` / 根 `marketplace.json` 条目派生。
- **Hooks**:
  - `validate-state-write` — PreToolUse (Write|Edit):写 `scripts/loop-state/*.json` 前做廉价前置校验(JSON 可解析 + 必填字段 + enum + version ∈ {1,2})。Edit 片段 / 非 state 文件 / 内部错误 fail-open 退出 0。非完整 schema,写完后仍须跑独立校验脚本。
- **状态 schema**:`plugins/graph-workflow/scripts/state-schema.json` — version=1 单节点自环 / version=2 图编排。字段:task_id/task_type/objective/goal_criteria/iteration/phase/status/goal_met/progress_delta/review/graph/node_states/current_node/history 等。
- **运行时产物**:`scripts/loop-state/task-*.json` + `.loop-marker` — 已被根 `.gitignore` 忽略(G-003 修复)。勿手动提交。
- **复盘命令**:`commands/loop-review.md` — 扫描 loop-state 输出汇总(完成/转人工/进行中)。底层脚本 `scripts/loop-review.sh`。
- **安全红线**:executor/fixer 受 bash 白名单约束(禁止通用解释器裸调用 `node`/`python -e`、不可逆删除、远程推送/历史改写、提权等)。白名单外命令需推进时 → 设 `status:"blocked"` + `blocker` 交人工。
- **版本**:`0.1.0`(early development)。

## Skills

可复用的工作说明，每个 skill 是一个目录 + `SKILL.md`。Agent 通过 frontmatter 的 `skills` 字段自动加载。

```
plugins/<name>/skills/<skill-name>/SKILL.md
```

当前 agentic-workflow 的 skills：

| Skill | 用途 | 被谁引用 |
|-------|------|---------|
| `scope-drift-detector` | 检测 diff 是否越界 | reviewer, worker, orchestrator |
| `root-cause-grouper` | 把多个 issue 归并到同一根因组 | builder, reviewer, orchestrator |

## Hooks

事件驱动自动化，写在 `hooks/hooks.json` + `hooks/scripts/*.js`。

当前 agentic-workflow 的 hooks：

| Hook | 事件 | 脚本 | 作用 |
|------|------|------|------|
| `block-forbidden-scope` | PreToolUse (Write/Edit) | `block-forbidden-scope.js` | 禁止修改 forbidden_scope 内文件 |
| `validate-state-write` | PreToolUse (Write) | `validate-state-write.js` | 写入 state JSON 前校验 schema |
| `check-verification-on-stop` | Stop | `check-verification-on-stop.js` | 验证未通过时阻止停止 |

Hook 脚本遵循 stdin/stdout 契约：stdin 读 JSON，stdout 输出结果，退出码 0=允许、2=拒绝。

## userConfig（仅 ZCode）

ZCode 支持用户在设置界面配置插件参数，无需改文件。

当前 agentic-workflow 的 userConfig：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `max_cycles` | number | 10 | 覆盖默认最大轮次限制 |
| `risk_level` | string | medium | 默认风险等级 |
| `auto_escalate` | boolean | true | 达到失败阈值时自动上报 |

## Install scripts

- Each `scripts/install-<platform>.js` accepts: `--plugin <name>`, `--uninstall`, `--dry-run`.
- They MUST be idempotent: re-running install replaces existing content.
- Uninstall MUST remove all files created by install (full install dirs for codebuddy/zcode/trae/qoder).
- Scripts copy from `plugins/<name>/` (shared content) and the root platform manifests from `plugins/<name>/.codebuddy-plugin/`, `plugins/<name>/.zcode-plugin/`, `plugins/<name>/.trae-plugin/`, or `plugins/<name>/.qoder-plugin/`.
- 所有平台安装目标统一为 `agents/`（平台根目录）。
- 源目录为 `<platform>/agents/`，安装时通过 RENAME_MAP 展平为 `agents/`。
- CodeBuddy manifest 指向 `codebuddy/agents`，materialize 时 overlay 到 `agents/`。

## Verification

Before committing, run all dry-runs:

```sh
node scripts/install-codebuddy.js --dry-run
node scripts/install-zcode.js --dry-run
node scripts/install-trae.js --dry-run
node scripts/install-qoder.js --dry-run
node scripts/install-qwencode.js --dry-run
node scripts/materialize-codebuddy.js --dry-run
```

All must exit 0 without writing any files.

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

## Versioning

- **Single source of truth**: each plugin's `.codebuddy-plugin/plugin.json` `version` field is the authoritative version. All other locations (`.zcode-plugin/plugin.json`, `.trae-plugin/plugin.json`, `.qoder-plugin/plugin.json`, `.qwen-plugin/qwen-extension.json`, `skills/*/SKILL.md` YAML frontmatter, root `.codebuddy-plugin/marketplace.json` entry) are derived from it.
- **Bump with one command**: `node scripts/bump-version.js --plugin <name> --set <new-version>` updates the manifest and propagates to all sites. Without `--set`, the script syncs all sites to match the manifest (idempotent).
- **Check in CI**: `node scripts/bump-version.js --all --check` exits non-zero on drift. Run before committing.
- **Install scripts** (`install-zcode.js`, `install-codebuddy.js`, `install-trae.js`, `install-qoder.js`, `install-qwencode.js`) read the version from the manifest at runtime via `lib/plugin-version.js` — never hardcode `PLUGIN_VERSION`.
- Bump the version on **any** skill content change (new rule, breaking SKILL.md rewrite, new reference file). Patch (0.1.0 → 0.1.1) for fixes/minor additions; minor (0.1.x → 0.2.0) for new features; major (0.x → 1.0.0) only when declaring stable.
- `0.x` = early development (current: `0.1.0`). `1.0.0+` = declared stable. Do not declare `1.0.0` while known integrity gaps exist.

## Marketplace

The `agentic-work` marketplace is used for CodeBuddy installation. Each repo uses its own marketplace name to avoid conflicts — `caveman4cn` uses `master0071`, agentic-work uses `agentic-work`.

- Both CodeBuddy and ZCode `source` paths point at `./plugins/<name>/`. 所有平台 manifest `"agents"` 字段指向 `<platform>/agents`，安装时统一展平为 `agents/`。
