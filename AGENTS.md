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
- ZCode agents live at `plugins/agentic-workflow/zcode/agents/` (with nested `permission:` frontmatter). `.zcode-plugin/plugin.json` points `"agents"` at this directory. Cross-agent reference docs live at plugin-root `_shared/` (`decomposition.md`, `field-map.md`), referenced by all platforms' orchestrators via `../_shared/`.
- CodeBuddy agents live at `plugins/agentic-workflow/codebuddy/agents/` (with flat `permissionMode` frontmatter). `.codebuddy-plugin/plugin.json` points `"agents"` at this directory.
- Shared commands live at `plugins/agentic-workflow/commands/`.
- Platform manifests: `.codebuddy-plugin/plugin.json`, `.zcode-plugin/plugin.json` at the plugin root.
- Templates source files (`agentic-workflow/templates/{agents,commands}/*.md` with `{{...}}` placeholders) are **not committed** — only the materialized outputs at the plugin root are.
- To add a new agent: create a file per platform that needs it — `zcode/agents/<name>.md`、`codebuddy/agents/<name>.md` 等。Body 必须一致，仅 frontmatter 按平台适配。
- To add a new command: create `plugins/agentic-workflow/commands/<name>.md`.

## skill-radar

- **Purpose**: skill observability — tool invocation tracing (Phase 1), aggregation (Phase 2), feedback (Phase 3), evolution (Phase 4).
- **MVP scope (Phase 1)**: PostToolUse + PostToolUseFailure hooks → JSONL traces. No aggregation, no feedback loop.
- **ZCode + CodeBuddy** supported. CodeBuddy uses shell wrapper (`run-hook.cmd` + `observe.sh`) with `CLAUDE_PLUGIN_ROOT` env var and `hookSpecificOutput` output format. Other platforms (Trae/Qoder/Qwen) marked `unsupported` until verified.
- Manifest: `.zcode-plugin/plugin.json` declares `"hooks": "hooks/hooks.zcode.json"`.
- Storage: data dir resolved in order `ZCODE_PLUGIN_DATA` → `CODEBUDDY_PLUGIN_DATA` → `~/.skill-radar/`. Traces at `<data-dir>/traces/<YYYY-MM-DD>.jsonl`, signals at `<data-dir>/signals/<YYYY-MM-DD>.jsonl`, session at `<data-dir>/session.json`.
- Session correlation: `SessionStart` generates uuid → `<data-dir>/session.json`; `log-invocation.js` reads it. CodeBuddy routes `session-start` → `session-start.js` via `observe.sh` dispatch (not `log-invocation.js`).
- Manifest: `.codebuddy-plugin/plugin.json` is version source of truth; `.zcode-plugin/plugin.json` derived.
- Hooks:
  - `session-start.js` — SessionStart: generate + persist session_id (原子写 tmp+rename，Windows rename 失败回退直写并清理 tmp)。
  - `log-invocation.js` — PostToolUse + PostToolUseFailure: append JSONL trace (with `skill` tag via `infer-skill.js`).
  - `stop-signal.js` — Stop: detect negative signal in last assistant message, append to `signals/<date>.jsonl`.
  - `observe.sh` — CodeBuddy wrapper: dispatches `session-start`/`post-tool-use[-failure]`/`stop` to the matching Node script; normalizes kebab-case event args to canonical schema names; **所有分支统一传 `--platform codebuddy`**（三个 hook 脚本据此输出 `hookSpecificOutput` 格式，缺省仍为 ZCode flat `{}`）。
  - Hook stdin 读取统一走 `scripts/lib/read-stdin.js`（3s 硬超时 + destroy stdin）——平台不关 stdin 也不挂（CodeBuddy cmd→sh→node 链无平台侧 timeout）。
- Trace schema:
  ```jsonc
  {
    "ts": "2026-07-28T06:02:54.014Z",
    "event": "PostToolUse|PostToolUseFailure",
    "tool_name": "Edit",
    "session_id": "sess_...",
    "platform": "zcode",
    "skill": "dotnet-csharp-developer",   // present when inferable, else omitted
    "tool_input": { "file_path": "...", "old_string": "...", "new_string": "..." },
    "tool_input_size": 62,
    "tool_response_size": 40,
    "tool_response_excerpt": "...[N more]",
    "error": { "message": "...", "stack": null }
  }
  ```
- Phase 2 (aggregation): `plugins/skill-radar/scripts/aggregate-traces.js` — reads JSONL traces, outputs console summary + JSON report. Supports `--days N`, `--json`, `--out <file>`, `--data-dir <path>`. Metrics: invocation count, success/failure rate, avg response size, unique sessions, **top errors grouped by category** (via `categorize-error.js`, so ENOENT on different paths collapses to one `not_found` row with a sample message), daily breakdown, **per-skill breakdown** (count/failure_rate/unique_sessions, grouped by trace-time `skill` tag).
- Phase 3 (feedback scoring): `plugins/skill-radar/scripts/feedback-scoring.js` — reads traces + Stop signals, computes per-tool, **per-skill**, and per-session scores. Tool/skill score = 1 - failure_rate. Session score = failure-based score minus signal penalty (Stop hook detects error/incompleteness in last assistant message, each negative signal = -0.15 penalty, max -0.3). Stop hook strips code blocks/inline code/blockquotes and suppresses messages with resolution markers ("fixed"/"now passes"/"resolved") to reduce false positives. Supports `--days N`, `--json --out`, `--threshold`. Stop hook: `hooks/stop-signal.js` — writes to `signals/<date>.jsonl`, never blocks.
- Phase 4 (evolution): `plugins/skill-radar/scripts/evolve.js` — reads traces + signals, identifies high-failure tools/skills, categorizes error patterns (permission/not_found/timeout/syntax/connection/resource/other), generates actionable recommendations. **Consumes Stop signals**: negative signals attributed to skills via session→skill mapping, surfaced as a note in skill recommendations. Skill inference shared via `scripts/lib/infer-skill.js` (single source of truth for trace-time tagging + offline analysis); covers dotnet-csharp-developer, dotnet-code-review, database-explorer, winforms-dev-flow, graph-workflow, agentic-workflow, skill-radar self-edits. Error categorization shared via `scripts/lib/categorize-error.js`; JSONL loading shared via `scripts/lib/load-jsonl.js` (UTC filename-date parsing — fixes local-tz boundary drift). Manual trigger (`node evolve.js`), human reviews before applying. Supports `--days N`, `--json --out`, `--threshold`. Output: per-tool + per-skill recommendations with severity (high/medium), dominant error pattern, negative signal count, and suggested action.
- Retention: `plugins/skill-radar/scripts/cleanup-traces.js` — deletes traces/signals older than `--prune-days N` (UTC filename-date cutoff). `--dry-run` previews. Shared libs under `scripts/lib/` (`infer-skill.js`, `categorize-error.js`, `load-jsonl.js`, `read-stdin.js`).

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
- **statectl 防护**:`scripts/statectl.sh` 写命令(create/ensure/set/patch/inc/append)持 mkdir 文件锁(死锁自愈、超时 exit 75)，写前做 enum/类型廉价校验(不合法拒写，非完整 schema，权威校验仍靠 `node scripts/validate-state.js`)；`create` 对既有非空 state 默认拒绝覆盖(exit 73)，重建需显式 `--force`，两入口脚本(loop-task.sh/graph-run.sh)对 create 失败即退。
- **运行时产物**:`scripts/loop-state/task-*.json` + `.loop-marker` — 已被根 `.gitignore` 忽略(G-003 修复)。勿手动提交。
- **复盘命令**:`commands/loop-review.md` — 扫描 loop-state 输出汇总(完成/转人工/进行中)。底层脚本 `scripts/loop-review.sh`。
- **安全红线**:executor/fixer 受 bash 白名单约束(禁止通用解释器裸调用 `node`/`python -e`、不可逆删除、远程推送/历史改写、提权等)。白名单外命令需推进时 → 设 `status:"blocked"` + `blocker` 交人工。
- **版本**:`0.1.1`(early development)。

## Skills

可复用的工作说明，每个 skill 是一个目录 + `SKILL.md`。

```
plugins/<name>/skills/<skill-name>/SKILL.md
```

agentic-workflow 当前无独立 skill。此前的 `scope-drift-detector` 与 `root-cause-grouper` 已删除——两者的规则（scope drift 检测的三级判定 PASS/WARN/FAIL、根因分组修复铁律）已直接内联在对应 agent body（`coding-reviewer` 的 scope drift 检测步骤、`coding-builder` 的"根因分组修复"章节），SKILL.md 是重复副本，无任何 agent/command 引用，构成冗余。删除以保持单一事实源。

## Hooks

事件驱动自动化，写在 `plugins/<name>/hooks/hooks.<platform>.json` + `plugins/<name>/hooks/*.js`。ZCode manifest 通过 `"hooks": "hooks/hooks.zcode.json"` 字段声明（全部插件已按平台后缀统一命名，仓库源目录不再存在无后缀的 `hooks.json`）。

**平台覆盖**：agentic-workflow 的 hooks 已支持 **ZCode + CodeBuddy + Qwen Code + Trae + Qoder** 全部五平台，同一组 Node 脚本、五份平台配置：

- ZCode：`hooks/hooks.zcode.json`（`type: "process"` + `${ZCODE_PLUGIN_ROOT}`），`.zcode-plugin/plugin.json` 通过 `"hooks": "hooks/hooks.zcode.json"` 声明。
- CodeBuddy：`hooks/hooks.codebuddy.json`（`type: "command"` + `node "${CODEBUDDY_PLUGIN_ROOT}/hooks/X.js"`），`.codebuddy-plugin/plugin.json` 声明。CodeBuddy 在 Windows 强制用 Git Bash 执行 command hook，Node 脚本直调即可无需 wrapper；退出码 2 + stderr 即阻断（PreToolUse 拦工具 / Stop 拦停止），与脚本既有契约一致。
- Qwen Code：`hooks/hooks.qwencode.json`（**顶层事件键**，无 `hooks` 包裹层；`type: "command"` + `node "${CLAUDE_PLUGIN_ROOT}/hooks/X.js"` + `timeout` 毫秒），`.qwen-plugin/qwen-extension.json` 通过 `"hooks": "hooks/hooks.qwencode.json"` 声明。要点：file-based hook 文件里**只有 `${CLAUDE_PLUGIN_ROOT}`** 会被替换（`${extensionPath}` 等不生效）；PreToolUse matcher 用 Qwen 工具名 `WriteFile|Edit`；退出码 2 + stderr 阻断，契约同上。`install-qwencode.js` 选择性拷贝 hooks/（仅 `*.js` + `hooks.qwencode.json`），避免其他平台配置变体落入 Qwen 自动发现路径。
- Trae：`hooks/hooks.trae.json`（**模板**，非直接加载）—— Trae 没有插件级 hooks，只认全局 `~/.trae-cn/hooks.json` / 项目 `.trae/hooks.json`，且命令里无 PLUGIN_ROOT 变量。`install-trae.js` 安装时把模板的 `${TRAE_PLUGIN_ROOT}` 替换为实际安装目录后**幂等合并**进全局 hooks.json（自有条目按 `agentic-workflow-trae` 路径标记识别，重装先剔除再追加，卸载同标记移除）。Trae 在 Windows 默认用 PowerShell 跑 command hook，Node 直调可用；timeout 单位秒；工具名就是 `Write|Edit`；退出码 2 + stderr 阻断（PreToolUse deny / Stop block），Stop 额外有 `loop_limit`（默认5）防无限阻断循环。注意：全局 hook 对本机所有工作区生效，脚本对非 pipeline 项目 fail-open（无 `.loop-cli/state/` 即退 0），不干扰其他项目。
- Qoder：`hooks/hooks.qoder.json`（**包裹格式** `{ "hooks": ... }` + `node "${QODER_PLUGIN_ROOT}/hooks/X.js"` + `timeout` 秒），`.qoder-plugin/plugin.json` 通过 `"hooks": "hooks/hooks.qoder.json"` 显式声明（manifest 支持覆盖目录约定，同 `agents` 字段机制），仓库源目录可直接 `qodercli plugins install`。`install-qoder.js` 拷贝时额外落一份 `hooks/hooks.json`（目录约定自动发现，双保险；选择性拷贝排除其余四平台变体）。**激活前提**：Qoder 只加载注册在 `~/.qoder/plugins/installed_plugins_v2.json` 的插件（`~/.qoder/plugins/` 是注册表+cache，非扫描目录），纯拷贝不生效，须 `qodercli plugins install <dir>` 注册（影响整个插件而非仅 hooks，install-qoder.js 尾注已提示）。工具名就是 `Write|Edit`；`${QODER_PLUGIN_ROOT}` 在 bash 下由 shell 运行时展开、PowerShell 下由 CLI 预替换；退出码 2 + stderr 阻断（PreToolUse deny / Stop block），契约同上。至此**五平台 hook 强制全覆盖**。

当前 agentic-workflow 的 hooks：

| Hook | 事件 | 脚本 | 状态 | 作用 |
|------|------|------|------|------|
| `validate-state-write` | PreToolUse (Write\|Edit) | `hooks/validate-state-write.js` | ✅ 已实现 | 写入 `.loop-cli/state/*.json` 前做廉价前置校验：JSON 可解析、`version` ∈ {1,2}、该 version 的必填顶层字段存在。失败退出 2 拒绝写入；非 state 文件 / Edit 片段 / 内部错误 fail-open 退出 0。**非完整 schema**——orchestrator 写完后仍须跑 `node scripts/validate-state.js <file>` 做权威校验。 |
| `block-forbidden-scope` | PreToolUse (Write\|Edit) | `hooks/block-forbidden-scope.js` | ✅ 已实现 | 读取所有 `.loop-cli/state/*.json` 的 `forbidden_scope`（string[] glob），拦截任何 Write/Edit 的 `file_path` 命中 pattern 的写入（exit 2）。glob 语义：`dir/*` 目录前缀、`*.ext` 扩展名、`**/x/*` 深度通配、精确路径。无活跃 pipeline 或无 forbidden_scope 字段时 fail-open。**前提**：orchestrator 初始化时把声明边界的 forbidden_scope 持久化到 state（仅 coding 域，ralph 域无声明边界）。 |
| `check-verification-on-stop` | Stop | `hooks/check-verification-on-stop.js` | ✅ 已实现 | 读取所有活跃 pipeline（`stop_reason` 为 null）的 `verification_status`，非 `pass` 则阻止会话停止（exit 2）。pipeline 显式 retired（stop_reason 非空）不 gate。**前提**：orchestrator 每轮 JUDGE 时更新 `verification_status`（null=未验证 / pass / fail / missing）。 |

Hook 脚本遵循 stdin/stdout 契约：stdin 读 JSON 工具载荷，stderr 输出诊断，退出码 0=允许、2=拒绝。参考实现见 `plugins/graph-workflow/hooks/validate-state-write.js`（graph 域 state 校验，同模式）。

## userConfig（仅 ZCode）

ZCode 支持用户在设置界面配置插件参数，无需改文件。

agentic-workflow 当前**未使用** ZCode userConfig。此前的表格（`max_cycles` / `risk_level` / `auto_escalate`）与实现脱节，已删除。这三个参数的实际实现路径：

| 参数 | 实际实现 |
|------|----------|
| 最大轮次 | agent 硬编码（coding `MAX_CYCLES=8`、ralph `MAX_CYCLES=10`），且 command 的运行时参数 `max_iterations > 0` 可覆盖（见 `coding-pipeline.md` / `ralph-pipeline.md` 的状态初始化） |
| 风险等级 | `risk_level` 由 orchestrator 通过 prompt 注入给 reviewer（coding-reviewer 有 `risk_level=low` lite mode / `risk_level=high` 高风险加强分支），来源是 command 调用上下文，非持久化配置 |
| 自动上报 | `auto_escalate` 无对应逻辑，ESCALATE 停止条件由 `fail_history` 达 `max_failures` 触发（硬编码），非可配置 |

若未来要让这些参数真正可配置，需：zcode manifest 加 `userConfig` 块（type/title/default）+ agent 读取配置注入路径（ZCode userConfig 注入机制需先验证，仓库内无实例可参考）。

## Install scripts

- Each `scripts/install-<platform>.js` accepts: `--plugin <name>`, `--uninstall`, `--dry-run`.
- They MUST be idempotent: re-running install replaces existing content.
- Uninstall MUST remove all files created by install (full install dirs for codebuddy/zcode/trae/qoder).
- Scripts copy from `plugins/<name>/` (shared content) and the root platform manifests from `plugins/<name>/.codebuddy-plugin/`, `plugins/<name>/.zcode-plugin/`, `plugins/<name>/.trae-plugin/`, or `plugins/<name>/.qoder-plugin/`.
- 所有平台安装目标统一为 `agents/`（平台根目录）。
- **Qoder 特例**：`install-qoder.js` 的拷贝仅是暂存 —— Qoder 只加载注册在 `~/.qoder/plugins/installed_plugins_v2.json` 的插件，需 `qodercli plugins install <dir>` 激活（脚本收尾已提示；待修项见 reports/audit-2026-07-29-06.md 后记 P1-Q1）。
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

Plugin-root `_shared/` (e.g. `plugins/agentic-workflow/_shared/`) holds cross-agent reference material (the platforms only scan top-level files in `agents/` and `commands/`, so `_shared/` is safely ignored):

- `_shared/decomposition.md` — task complexity estimation & decomposition rules, referenced by `coding-orchestrator.md`, `ralph-orchestrator.md`, and the three command templates.
- `_shared/field-map.md` — state JSON field ↔ `=== X ===` injection mapping for each loop variant.

Orchestrator bodies reference these via `../_shared/` — 这个相对路径以**安装后布局**为准(install/materialize 将 `<platform>/agents/` 展平为根 `agents/`、`_shared/` 拷到根同级，`../_shared/` 正确解析)。仓库内从 `<platform>/agents/` 浏览时断链为已知且可接受，勿改为 `../../_shared/`(会弄断全部五平台安装布局)。

## Versioning

- **Single source of truth**: each plugin's `.codebuddy-plugin/plugin.json` `version` field is the authoritative version. All other locations (`.zcode-plugin/plugin.json`, `.trae-plugin/plugin.json`, `.qoder-plugin/plugin.json`, `.qwen-plugin/qwen-extension.json`, `skills/*/SKILL.md` YAML frontmatter, root `.codebuddy-plugin/marketplace.json` entry, root `marketplace.json` `<plugin>-zcode` entry) are derived from it.
- **Bump with one command**: `node scripts/bump-version.js --plugin <name> --set <new-version>` updates the manifest and propagates to all sites. Without `--set`, the script syncs all sites to match the manifest (idempotent).
- **Check in CI**: `node scripts/bump-version.js --all --check` exits non-zero on drift. Run before committing.
- **Install scripts** (`install-zcode.js`, `install-codebuddy.js`, `install-trae.js`, `install-qoder.js`, `install-qwencode.js`) read the version from the manifest at runtime via `lib/plugin-version.js` — never hardcode `PLUGIN_VERSION`.
- Bump the version on **any** skill content change (new rule, breaking SKILL.md rewrite, new reference file). Patch (0.1.0 → 0.1.1) for fixes/minor additions; minor (0.1.x → 0.2.0) for new features; major (0.x → 1.0.0) only when declaring stable.
- `0.x` = early development. `1.0.0+` = declared stable. Do not declare `1.0.0` while known integrity gaps exist.

## Marketplace

The `agentic-work` marketplace is used for CodeBuddy installation. Each repo uses its own marketplace name to avoid conflicts — `caveman4cn` uses `master0071`, agentic-work uses `agentic-work`.

- Both CodeBuddy and ZCode `source` paths point at `./plugins/<name>/`. 所有平台 manifest `"agents"` 字段指向 `<platform>/agents`，安装时统一展平为 `agents/`。
