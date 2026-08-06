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
- **不同平台的 agent frontmatter 可能不兼容**（如 ZCode 支持嵌套 `permission:` 块、`mode`、`temperature`、`steps`，而 CodeBuddy 只认 flat `permissionMode`）。源仓库只保留**一份 baseline**:
  ```
  plugins/<name>/agents/*.md             ← 唯一源（ZCode frontmatter 作 baseline）
  ```
  其余 4 平台的 frontmatter 在**安装时由 `scripts/lib/derive-platform.js` 派生**（从 baseline 的嵌套 `permission:` 推导 PROFILE：editor/orchestrator/reviewer，再按平台模板生成 codebuddy/qoder 的 `permissionMode`、qwencode 的 `approvalMode`+`tools`、trae 的嵌套 permission + `platform: trae` 标记）。源仓库不再存在 `<platform>/agents/` 多份副本（旧设计 55 文件 → 现 11 文件）。Body 始终取自 baseline，派生只换 frontmatter。

  各平台 manifest 的 `"agents"` 字段指向**安装形态**（源与安装目录布局一致，均为根 `agents/`）：
  | 平台 | `"agents"` 字段形态 | 指向 | 备注 |
  |------|---------------------|------|------|
  | ZCode / Trae / CodeBuddy / Qwen Code | 字符串 `"agents"` | 根 `agents/` | 安装时 `deriveAgents()` 从 baseline 派生目标平台 frontmatter 写入 `<dest>/agents/` |
  | Qoder | 字符串数组（文件路径） | `["./agents/*.md", ...]` | Qoder 要求显式列出；源与安装形态一致，无需路径改写 |

Permission mapping for codebuddy/qoder `permissionMode` (single-value enum):

| Source root `permission:` | codebuddy/qoder `permissionMode` |
|---------------------------|----------------------------------|
| `edit: allow` (full)      | `acceptEdits`                    |
| `edit: deny` + bash allow-list (orchestrator) | `default` |
| `edit: deny` + read-only  | `plan`                           |

Trae 使用嵌套 `permission:` 块（同 ZCode），通过 `platform: trae` 标记识别。
Qwen Code 使用 `approvalMode`（`auto-edit`/`default`/`plan`/`yolo`/`bubble`）+ `tools` 允许列表。
Fine-grained bash allow-lists cannot be expressed in `permissionMode`/`approvalMode`; this is a known trade-off documented per file。

## 选择哪个 workflow 插件

仓库有两个编排插件，都做 execute→review→fix 循环，**两者都由命令绑定的编排 agent 在单会话内驱动有界轮次**（脚本/HOOK 作辅助）。区别在**编排模型与状态结构**。按场景选：

| 场景 | 选 | 原因 |
|------|----|------|
| 交互式编码，你在 loop 里盯着 | **agentic-workflow**（`/coding-pipeline`、`/ralph-pipeline`） | 轻量，单线 exec→review→fix，hook 门禁拦截危险写，你可中途介入 |
| 无人值守长任务，需声明式状态机/图拓扑 | **graph-workflow**（`/loop-task`、`/graph-task`） | 结构化 state（node_states/history）+ 图拓扑编排 + `/loop-review` 复盘 |
| 固定 exec→review→fix 流程 | 任一（graph-workflow `/loop-task` 默认图等价单线循环） | 两者默认都是单线闭环 |
| 自定义节点拓扑（多分支/条件路由/串行多阶段） | graph-workflow `/graph-task` + `--graph` | 声明式图编排（version=2 多节点 DAG + 边路由） |

**架构差异（决定选型）**：

| 维度 | agentic-workflow | graph-workflow |
|------|------------------|----------------|
| 循环驱动 | agent 自驱（单会话内多轮委派） | 命令 agent 单会话驱动有界轮次（脚本 init 后 HANDBACK，agent 续驱） |
| 编排模型 | 单线 exec→review→fix | 图拓扑（version=2 多节点 DAG + 边路由 + node_states）或默认图（version=1 单节点自环） |
| 约束执行者 | agent 内 `MAX_CYCLES` + hook 门禁 | 脚本启动校验（fail-fast）+ agent 自查 `MAX_ITER`/`BUDGET_S`/`STALL_LIMIT`/`VERIFY_CMD` |
| 状态持久化 | `.loop-cli/state/*.json`（每轮覆写） | `scripts/loop-state/task-*.json`（结构化 + node_states + history + `.loop-marker`） |
| 复盘 | 无独立命令 | `/loop-review` 扫 state 文件汇总 |
| 入口 | command 直接委派 orchestrator agent | command（frontmatter `agent:` 绑定编排者）调脚本 init → HANDBACK → 编排者续驱 |

**核心区别**：agentic-workflow 是轻量单线闭环；graph-workflow 是带结构化状态文件 + 可声明图拓扑 + 独立复盘命令的编排框架。两者隔离粒度相同（均会话内，无进程级 spawn），硬约束均靠 agent 自查 + 脚本/HOOK 辅助校验，不再有"外层脚本每轮强制兜底"的进程级隔离模型。

**不要混用**：两者状态 schema 不兼容（version=1 各自定义，路径不同），同一任务不要交叉使用。需要复盘两者产物分别用各自的 state 目录。

## dotnet-work

- Source: previously `donet-work/` (renamed, typo fixed).
- 4 skills: `database-explorer`, `dotnet-code-review`, `dotnet-csharp-developer`, `winforms-dev-flow`.
- Shared skills live at `plugins/dotnet-work/skills/<skill-name>/`.
- **Platform manifests (5 平台)** at plugin root: `.codebuddy-plugin/` (version 权威源), `.zcode-plugin/`, `.trae-plugin/`, `.qoder-plugin/`, `.qwen-plugin/qwen-extension.json`。dotnet-work 是 **skill-only** plugin,无 agents/commands 目录,qwen manifest 不应声明 `agents`/`commands` 字段。
- When adding a new skill: create `<skill-name>/SKILL.md` + `references/` + `scripts/` under `plugins/dotnet-work/skills/`.

### Skill 路由

主诉求→主 skill 速查（详见 `plugins/dotnet-work/README.md`):

| 用户说 | 主 skill |
|--------|---------|
| "写 C# 代码/API/服务" | `dotnet-csharp-developer` |
| "审查/review/安全扫描/质量" | `dotnet-code-review` |
| "连数据库/查表/SQL/导出" | `database-explorer` |
| "WinForms/DevExpress/窗体" | `winforms-dev-flow` |

跨 skill 协作（已内建调用点）：
- `dotnet-csharp-developer` Step 4b → 调 `dotnet-code-review` 做自审（通过 `scripts/review_orchestrator.py`）
- `winforms-dev-flow` Step 0a/2 → 调 `database-explorer` 查表 schema 生成数据绑定（通过 `python skill://database-explorer/scripts/db_tool.py explore ...`）

## agentic-workflow

- Current published scope: **coding + ralph domains** (6 agents + 5 commands).
- Agents live at `plugins/agentic-workflow/agents/` (single baseline with ZCode nested `permission:` frontmatter). All platform manifests point `"agents"` at `agents/`; other platforms' frontmatter is **derived at install time** by `scripts/lib/derive-platform.js`. Cross-agent reference docs live at plugin-root `_shared/` (`decomposition.md`, `field-map.md`), referenced by all platforms' orchestrators via `../_shared/`.
- Shared commands live at `plugins/agentic-workflow/commands/`.
- Platform manifests: `.codebuddy-plugin/plugin.json`, `.zcode-plugin/plugin.json` at the plugin root.
- Templates source files (`agentic-workflow/templates/{agents,commands}/*.md` with `{{...}}` placeholders) are **not committed** — only the materialized outputs at the plugin root are.
- To add a new agent: create **one** file `plugins/agentic-workflow/agents/<name>.md` with ZCode frontmatter (nested `permission:` block). 其余 4 平台 frontmatter 由 `scripts/lib/derive-platform.js` 在安装时自动派生，无需手动维护多份。
- To add a new command: create `plugins/agentic-workflow/commands/<name>.md`.

## skill-radar

- **Purpose**: skill observability — tool invocation tracing (Phase 1), aggregation (Phase 2), feedback (Phase 3), evolution (Phase 4).
- **MVP scope (Phase 1)**: PostToolUse + PostToolUseFailure hooks → JSONL traces. No aggregation, no feedback loop.
- **五平台全覆盖（2026-07-30 补齐）**：ZCode（`process` hooks）+ CodeBuddy（shell wrapper `run-hook.cmd` + `observe.sh`，`hookSpecificOutput` 格式）+ Trae（`hooks/trae/hooks.json` 模板，install-trae.js 合并到项目级 `.trae/hooks.json`）+ Qoder（`hooks/qoder/hooks.json` 包裹格式，install 时展平拷贝为 `hooks.json`）+ Qwen Code（`hooks/qwencode/hooks.json` 顶层事件键）。三个 Node 脚本统一接 `--platform <name>`；非 CodeBuddy 平台一律输出 flat `{}`。
- **运行时依赖**：hooks 脚本 `require ../scripts/lib/{infer-skill,read-stdin,discover-skills}.js` —— install 脚本必须拷贝 `scripts/` 目录（trae/qoder/qwencode 均已包含）。
- **Skill 推断双层架构（P1-7）**：`scripts/lib/infer-skill.js` = curated 规则（手工调优的 bash/扩展名/插件路径模式）+ `scripts/lib/discover-skills.js` 动态发现层（扫描 `plugins/*/skills/<name>/SKILL.md`，自动生成 path 规则 + 全词 bash hints，缓存到 `<data-dir>/skill-map.json`，按插件树 fingerprint 失效）。新 skill 无需改 infer-skill 即可被观测；发现失败静默回退到 curated 规则。
- Manifest: `.zcode-plugin/plugin.json` declares `"hooks": "hooks/hooks.json"`（源配置在 `hooks/zcode/hooks.json`，安装时展平）。
- Storage: data dir resolved in order `ZCODE_PLUGIN_DATA` → `CODEBUDDY_PLUGIN_DATA` → `~/.skill-radar/`. Traces at `<data-dir>/traces/<YYYY-MM-DD>.jsonl`, signals at `<data-dir>/signals/<YYYY-MM-DD>.jsonl`, session at `<data-dir>/session.json`.
- Session correlation: `SessionStart` generates uuid → `<data-dir>/session.json`; `log-invocation.js` reads it. CodeBuddy routes `session-start` → `session-start.js` via `observe.sh` dispatch (not `log-invocation.js`).
- Manifest: `.codebuddy-plugin/plugin.json` is version source of truth; `.zcode-plugin/plugin.json` derived.
- Hooks:
  - `session-start.js` — SessionStart: generate + persist session_id (原子写 tmp+rename，Windows rename 失败回退直写并清理 tmp)。
  - `log-invocation.js` — PostToolUse + PostToolUseFailure: append JSONL trace (with `skill` tag via `infer-skill.js`).
  - `stop-signal.js` — Stop: detect negative signal in last assistant message, append to `signals/<date>.jsonl`.
  - `observe.sh` — CodeBuddy wrapper: dispatches `session-start`/`post-tool-use[-failure]`/`stop` to the matching Node script; normalizes kebab-case event args to canonical schema names; **所有分支统一传 `--platform codebuddy`**（三个 hook 脚本据此输出 `hookSpecificOutput` 格式，缺省仍为 ZCode flat `{}`）。
  - **读 stdin 的 hook**（`log-invocation.js`、`stop-signal.js`）统一走 `scripts/lib/read-stdin.js`（3s 硬超时 + destroy stdin）——平台不关 stdin 也不挂（CodeBuddy cmd→sh→node 链无平台侧 timeout）。**不读 stdin 的 hook**（`session-start.js`，只写 session.json）无需该 helper。
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

- **Purpose**: Loop Engineering + Graph Engineering 双档位闭环 — 命令编排 agent 有界循环(MAX_ITER/BUDGET_S/STALL_LIMIT/VERIFY_CMD 由 agent 自查,入口脚本启动时校验合法性作 fail-fast) + 内层三角色(executor/reviewer/fixer)协作,无人值守长任务。
- **五平台已支持**: ZCode + CodeBuddy + Trae + Qoder + Qwen Code。三角色 agents 各平台 frontmatter 适配（ZCode/Trae 嵌套 `permission:`、CodeBuddy/Qoder flat `permissionMode`、Qwen Code `approvalMode` + `tools`），body 一致。install-trae/qoder/qwencode.js 的 PLUGINS 已登记 graph-workflow。
- **两个入口命令**:`commands/loop-task.md`(Loop Engineering,固定 exec→review→fix 循环,状态 version=1)、`commands/graph-task.md`(Graph Engineering 档位 B,声明式图拓扑,默认图等价 loop-task,状态 version=2)。两档位跨版本不兼容(旧状态读到不匹配 version 拒绝续跑,防漂移)。
- **三角色 agents**(ZCode/Trae 嵌套 `permission:` / CodeBuddy/Qoder flat `permissionMode` / Qwen Code `approvalMode` + `tools` 允许列表,body 一致仅 frontmatter 不同):
  - `orchestrator`(`permissionMode: default`) — 决策层,读状态拆步骤,用 Agent 工具委派 executor/reviewer/fixer,不直接写业务代码。`graph-orchestrator` 变体按 `state.graph` 拓扑 + `statectl graph-next` 边路由执行。
  - `executor`(`permissionMode: acceptEdits`) — 按 plan 实际执行(写代码/改文件/跑命令),写 `progress_delta`。
  - `reviewer`(`permissionMode: default`) — 确定性验证 + 语义审查,写 `status`/`goal_met`/`review`。有"零证据禁令":项目有验证手段但没跑 → 禁止判 pass。
  - `fixer`(`permissionMode: acceptEdits`) — 根因最小修复,修完回 orchestrator 重新委派 reviewer。
- **Manifest 单一真源**:`.codebuddy-plugin/plugin.json` version 字段权威;`.zcode-plugin/plugin.json` / 根 `marketplace.json` 条目派生。
- **Hooks**:
  - `validate-state-write` — PreToolUse (Write|Edit):写 `scripts/loop-state/*.json` 前做廉价前置校验(JSON 可解析 + 必填字段 + enum + version ∈ {1,2} + version↔task_type 交叉)。Edit 操作会物化 old_string/new_string 后校验最终态;非 state 文件 / 内部错误 fail-open 退出 0。stdin 读 3s 超时防平台不关 stdin 挂死。非完整 schema,写完后仍须跑独立校验脚本。
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

事件驱动自动化，源仓库组织为 `plugins/<name>/hooks/*.js`（**共享脚本**，全平台用同一份）+ `plugins/<name>/hooks/<platform>/hooks.json`（**按平台拆分的配置**，结构各异不可合并）。各平台 manifest 统一声明 `"hooks": "hooks/hooks.json"`——安装时 install 脚本把对应平台的 `hooks/<platform>/hooks.json` 展平拷贝到安装目录 `hooks/hooks.json`（JS 脚本一并拷贝）。

**源布局**（hooks 是唯一按平台拆目录的部分，其余 agents/commands/scripts 均单源）：
```
plugins/<name>/hooks/
  *.js                       ← 共享 Node 脚本（validate-state-write.js 等）
  zcode/hooks.json           ← 5 份平台配置，结构各异
  codebuddy/hooks.json
  trae/hooks.json
  qoder/hooks.json
  qwencode/hooks.json
  hooks.json                 ← (Claude Code 例外) 单一源,不展平
```

**平台覆盖**：agentic-workflow 的 hooks 已支持 **ZCode + CodeBuddy + Qwen Code + Trae + Qoder** 全部五平台，同一组 Node 脚本、五份平台配置：

- ZCode：`hooks/zcode/hooks.json`（`type: "process"` + `${ZCODE_PLUGIN_ROOT}`），`.zcode-plugin/plugin.json` 声明 `"hooks": "hooks/hooks.json"`，install-zcode.js 展平拷贝。
- CodeBuddy：`hooks/codebuddy/hooks.json`（`type: "command"` + `node "${CODEBUDDY_PLUGIN_ROOT}/hooks/X.js"`），`.codebuddy-plugin/plugin.json` 声明。CodeBuddy 在 Windows 强制用 Git Bash 执行 command hook，Node 脚本直调即可无需 wrapper；退出码 2 + stderr 即阻断（PreToolUse 拦工具 / Stop 拦停止），与脚本既有契约一致。
- Qwen Code：`hooks/qwencode/hooks.json`（**顶层事件键**，无 `hooks` 包裹层；`type: "command"` + `node "${CLAUDE_PLUGIN_ROOT}/hooks/X.js"` + `timeout` 毫秒），`.qwen-plugin/qwen-extension.json` 声明 `"hooks": "hooks/hooks.json"`。要点：file-based hook 文件里**只有 `${CLAUDE_PLUGIN_ROOT}`** 会被替换（`${extensionPath}` 等不生效）；PreToolUse matcher 用 Qwen 工具名 `WriteFile|Edit`；退出码 2 + stderr 阻断，契约同上。`install-qwencode.js` 选择性拷贝（仅 `*.js` + `qwencode/hooks.json`→`hooks.json`），避免其他平台配置落入 Qwen 自动发现路径。
- Trae：`hooks/trae/hooks.json`（**模板**，非直接加载）—— Trae 没有插件级 hooks，只认全局 `~/.trae-cn/hooks.json` / 项目 `.trae/hooks.json`，且命令里无 PLUGIN_ROOT 变量。`install-trae.js` 安装时把模板的 `${TRAE_PLUGIN_ROOT}` 替换为实际安装目录后**幂等合并**进目标 hooks.json（自有条目按 `<name>-trae` 路径标记识别，重装先剔除再追加，卸载同标记移除）。Trae 在 Windows 默认用 PowerShell 跑 command hook，Node 直调可用；timeout 单位秒；工具名就是 `Write|Edit`；退出码 2 + stderr 阻断（PreToolUse deny / Stop block），Stop 额外有 `loop_limit`（默认5）防无限阻断循环。注意：项目级 hook 仅对当前工作区生效，全局则对本机所有工作区；脚本对非 pipeline 项目 fail-open（无 `.loop-cli/state/` 即退 0），不干扰其他项目。
- Qoder：`hooks/qoder/hooks.json`（**包裹格式** `{ "hooks": ... }` + `node "${QODER_PLUGIN_ROOT}/hooks/X.js"` + `timeout` 秒），`.qoder-plugin/plugin.json` 声明 `"hooks": "./hooks/hooks.json"`，`install-qoder.js` 展平拷贝。**激活前提**：Qoder 只加载注册在 `~/.qoder/plugins/installed_plugins_v2.json` 的插件，须 `qodercli plugins install <staged-dir>` 注册（install-qoder.js 注册的是 **staged 目录**而非 repo 源——源 agents 是 zcode baseline frontmatter，Qoder 不认，staged 目录已派生为 Qoder 格式）。工具名就是 `Write|Edit`；`${QODER_PLUGIN_ROOT}` 在 bash 下由 shell 运行时展开、PowerShell 下由 CLI 预替换；退出码 2 + stderr 阻断（PreToolUse deny / Stop block），契约同上。
- Claude Code：`hooks/hooks.json`（**唯一例外——不展平**，源文件直接是 Claude 格式，`.claude-plugin/plugin.json` 引用 `./hooks/hooks.json` 直指源；`type: "command"` + `node "${CLAUDE_PLUGIN_ROOT}/hooks/X.js" --platform claude` + `timeout` 秒），`install-claude.js` 直接拷贝共享 `*.js` + 源 `hooks.json` 到 `<dest>/hooks/hooks.json`。要点：Claude Code 接受 flat `{}` 输出（与 ZCode 兼容），无需 `hookSpecificOutput` 包装；trace 数据靠 `--platform claude` 参数正确归属；命令变量只有 `${CLAUDE_PLUGIN_ROOT}` 会被替换。Install 到 `~/.claude/plugins/<name>/`。至此**六平台 hook 强制全覆盖**。

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
- **install-trae.js hooks 作用域（P1-4，2026-07-30 变更）**：默认项目级优先——从 cwd 上溯找到项目根（`.git`/`package.json`/`.trae`）则合并到 `<root>/.trae/hooks.json`；找不到项目根才回退全局 `~/.trae-cn/hooks.json` 并打印警告。`--project-only` 强制项目级（无项目根报错），`--global` 显式写全局。卸载按同一作用域解析移除标记条目。
- 所有平台安装目标统一为 `agents/`（平台根目录）。源仓库只有**一份 baseline** `plugins/<name>/agents/`（ZCode frontmatter），安装时各 install 脚本调 `scripts/lib/derive-platform.js` 的 `deriveAgents()` 派生目标平台 frontmatter 写入 `<dest>/agents/`（ZCode 直拷、codebuddy/trae/qoder/qwencode 派生）。
- **Qoder 特例**：`install-qoder.js` 先 stage（拷贝 + 派生 agents + 展平 hooks）到 `~/.qoder/plugins/<name>-qoder/<version>/`，再 `qodercli plugins install <staged-dir>` 注册——注册的是 **staged 目录**（已派生为 Qoder frontmatter），不是 repo 源（源是 zcode baseline，Qoder 不认）。Qoder 只加载注册在 `~/.qoder/plugins/installed_plugins_v2.json` 的插件。
- Hooks 安装：各 install 脚本把 `hooks/<platform>/hooks.json` 展平拷贝为 `<dest>/hooks/hooks.json` + 共享 `*.js`，不拷其他平台配置。

## Verification

Before committing, run all dry-runs:

```sh
node scripts/install-codebuddy.js --dry-run
node scripts/install-zcode.js --dry-run
node scripts/install-trae.js --dry-run
node scripts/install-qoder.js --dry-run
node scripts/install-qwencode.js --dry-run
node scripts/install-claude.js --dry-run
node scripts/materialize-codebuddy.js --dry-run
```

All must exit 0 without writing any files.

Manifest + platform frontmatter + dependency checks (all must exit 0):

```sh
node scripts/validate-manifest.js            # plugin.json schema + capabilities + hooks file shape + cross-platform version consistency
node scripts/resolve-deps.js                 # dependency existence / semver range / cycle detection
```

## Repo tooling (added 2026-07-30)

- **`scripts/validate-manifest.js`** (P0-1) — JSON Schema-ish validation of every `.<platform>-plugin/` manifest: name pattern, semver version, component path existence, hooks file shape per platform (qwen = top-level event keys), `capabilities` enum (P1-5), cross-platform version consistency with `.codebuddy-plugin` as authoritative source (P1-1). `--plugin <name>` / `--strict`.
- **`scripts/migrate-state.js`** (P0-2) — state v1→v2 migration for BOTH state families, auto-detected: graph-workflow `loop-state/task-*.json` (injects DEFAULT_GRAPH, phase→current_node) and agentic-workflow `.loop-cli/state/ralph-pipeline.json` (tasks[]→nodes{} + recomputed active_set). `--dry-run` / `--out` / `--no-backup`; in-place writes a `.bak` first.
- **`scripts/lib/derive-platform.js`** (P1-2，重构) — 安装时 agent frontmatter 派生库。从 baseline `agents/*.md`（ZCode 嵌套 `permission:`）推导 PROFILE（editor/orchestrator/reviewer），按平台模板生成 codebuddy/qoder 的 `permissionMode`+`tools`、qwencode 的 `approvalMode`+`tools` 列表、trae 的嵌套 permission + `platform: trae`。导出 `deriveAgents(srcDir, platform, destDir)` 供各 install 脚本调用；ZCode 直拷 baseline。取代了旧的 `generate-platform-agents.js`（源不再有多平台副本，drift check 无对象）+ `verify-agent-sync.js`（源只 1 份，无 sync 对象），两者已删。
- **`scripts/resolve-deps.js`** (P1-6) — plugin dependency resolution: spec parsing (`name[@market][@range]`), existence in marketplaces/repo, mini-semver range match (`^ ~ >= <= > < = *`), cross-marketplace allow-list check, cycle detection (three-color DFS). `--plugin` / `--json`.
- **`scripts/lib/secret-store.js`** (P1-3) — cross-platform secret storage for `sensitive: true` userConfig. Resolution: env var (key uppercased, non-alnum→`_`) → OS keychain (Windows Credential Manager via CredRead/CredWrite P/Invoke; macOS `security`; Linux `secret-tool`). Credential target `agentic-work:<key>`. CLI: `get|set|delete|has <key> [value]`; library: `getSecret/setSecret/deleteSecret`.
- **`capabilities` 字段约定（P1-5）**：每个 manifest 必须声明，enum：`file-read`/`file-write`/`bash-exec`/`network`/`hooks`/`agents`/`mcp`/`env-access`。validate-manifest 校验；marketplace/宿主可在安装时向用户展示。

## State validation

Orchestrators write JSON to `.loop-cli/state/*.json` each round. Validate the file before each write with:

```sh
node scripts/validate-state.js .loop-cli/state/coding-pipeline.json
node scripts/validate-state.js .loop-cli/state/ralph-pipeline.json
node scripts/validate-state.js .loop-cli/state/ralph-graph.json
```

Exits 0 on success; non-zero with diagnostics (unknown fields, type mismatches, duplicate ids, circular `depends_on`) on failure. Use `--loop <file>` or `--graph <file>` to disambiguate when `version` is missing.

## Agent body sync

源仓库每个 agent 只存**一份** baseline `<plugin>/agents/<name>.md`（ZCode frontmatter）。body sync 不再是问题——没有多份副本会漂移。各平台 frontmatter 由 `scripts/lib/derive-platform.js` 在安装时从这一份 baseline 派生，body 始终取自 baseline。

旧的 `scripts/verify-agent-sync.js`（比较多平台副本 body 哈希）已删——源只 1 份，无对象可比。`npm run verify:agents` 脚本条目同步移除。

## Shared documents

Plugin-root `_shared/` (e.g. `plugins/agentic-workflow/_shared/`) holds cross-agent reference material (the platforms only scan top-level files in `agents/` and `commands/`, so `_shared/` is safely ignored):

- `_shared/decomposition.md` — task complexity estimation & decomposition rules, referenced by `coding-orchestrator.md`, `ralph-orchestrator.md`, and the three command templates.
- `_shared/field-map.md` — state JSON field ↔ `=== X ===` injection mapping for each loop variant.

Orchestrator bodies reference these via `../_shared/` — 这个相对路径以**安装后布局**为准(install/materialize 将 `agents/` 拷到根 `agents/`、`_shared/` 拷到根同级，`../_shared/` 正确解析)。源仓库 `agents/` 与 `_shared/` 同级，仓库内浏览即解析正确。

## Versioning

- **Single source of truth**: each plugin's `.codebuddy-plugin/plugin.json` `version` field is the authoritative version. All other locations (`.zcode-plugin/plugin.json`, `.trae-plugin/plugin.json`, `.qoder-plugin/plugin.json`, `.qwen-plugin/qwen-extension.json`, `skills/*/SKILL.md` YAML frontmatter, `skills/*/pyproject.toml` literal `version = "..."` (files declaring `dynamic = ["version"]` are skipped — version sourced from module `__version__`), root `.codebuddy-plugin/marketplace.json` entry, root `marketplace.json` `<plugin>` entry) are derived from it.
- **Bump with one command**: `node scripts/bump-version.js --plugin <name> --set <new-version>` updates the manifest and propagates to all sites. Without `--set`, the script syncs all sites to match the manifest (idempotent).
- **Check in CI**: `node scripts/bump-version.js --all --check` exits non-zero on drift. Run before committing.
- **Install scripts** (`install-zcode.js`, `install-codebuddy.js`, `install-trae.js`, `install-qoder.js`, `install-qwencode.js`) read the version from the manifest at runtime via `lib/plugin-version.js` — never hardcode `PLUGIN_VERSION`.
- Bump the version on **any** skill content change (new rule, breaking SKILL.md rewrite, new reference file). Patch (0.1.0 → 0.1.1) for fixes/minor additions; minor (0.1.x → 0.2.0) for new features; major (0.x → 1.0.0) only when declaring stable.
- `0.x` = early development. `1.0.0+` = declared stable. Do not declare `1.0.0` while known integrity gaps exist.

## Marketplace

The `agentic-work` marketplace is used for CodeBuddy installation. Each repo uses its own marketplace name to avoid conflicts — `caveman4cn` uses `master0071`, agentic-work uses `agentic-work`.

- Both CodeBuddy and ZCode `source` paths point at `./plugins/<name>/`. 所有平台 manifest `"agents"` 字段指向根 `agents/`（源与安装形态一致），`"hooks"` 指向 `hooks/hooks.json`（安装时从 `hooks/<platform>/hooks.json` 展平）。
