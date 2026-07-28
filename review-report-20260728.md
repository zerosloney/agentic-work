# agentic-workflow 审查报告 — 2026-07-28

## 审查结论

整体健康度：**中等偏差**。核心编排能力（agents/commands/skills frontmatter、permission 映射、versioning 同步）扎实，但 AGENTS.md 声明的 3 个 hook 完全缺失、2 个 skill 无人引用、`_shared/` 在 4 个平台安装后链接断裂——文档契约与实现存在系统性缺口。

---

## 发现的问题

### 布局不变量
- ✅ 平台目录结构符合 AGENTS.md 约定（`zcode/agents`、`codebuddy/agents`、`trae/agents`、`qoder/agents`、`qwencode/agents`）。
- ⚠️ AGENTS.md "agentic-workflow" 章节用 `agents-zcode/`、`agents-codebuddy/` 描述目录，实际目录是 `zcode/agents/`、`codebuddy/agents/`（与"Layout invariants"全局章节一致，仅 agentic-workflow 局部章节措辞过时）。
- ✅ commands 共享在 `commands/`，manifest 指向正确。
- ✅ templates 不提交（仓库无 templates/）。

### Agent 一致性
- ✅ 6 个 agent 的 zcode↔trae/qoder/qwencode body 完全一致。
- ✅ permission 映射全部正确（builder/worker→acceptEdits，orchestrator→default，reviewer→plan）。
- ✅ 所有非 zcode 平台 agent 有 HTML 同步注释。
- ⚠️ `codebuddy/agents/coding-orchestrator.md` 与 zcode 版有 2 处差异：
  1. `_shared/` 路径写成 `../agents/_shared/`（codebuddy 适配），但安装后该路径断裂（见 Install 类）。
  2. "Completion promise 检查"段落与上下文间距的空行差异（纯排版，P2）。
- ⚠️ `codebuddy/agents/ralph-orchestrator.md` 同样有 `_shared/` 路径差异（同上断裂问题）。

### Commands
- ✅ 5 个 command 文件齐全，引用的 agent 名（coding-orchestrator、ralph-orchestrator）全部存在。
- ✅ command 内引用的 `.loop-cli/state/*.json` 路径与 validate-state.js schema 对齐。

### Skills
- ✅ ~~scope-drift-detector 与 root-cause-grouper 冗余问题已修复~~（commit 见下）。深层根因：两 skill 的逻辑（scope drift 三级判定、根因分组铁律）已内联在 `coding-reviewer` body（scope drift 检测步骤）和 `coding-builder` body（"根因分组修复"章节），SKILL.md 是重复副本，无 agent/command 引用。已删除冗余副本，保持单一事实源。

### Hooks
- ❌ **AGENTS.md "Hooks" 章节声明的 3 个 hook 在 agentic-workflow 插件中完全不存在**：
  - `block-forbidden-scope.js`（PreToolUse Write/Edit）
  - `validate-state-write.js`（PreToolUse Write）
  - `check-verification-on-stop.js`（Stop）
  全仓库仅 `plugins/graph-workflow/hooks/validate-state-write.js` 存在。agentic-workflow 既无 `hooks/` 目录，zcode manifest 也无 `hooks` 字段。

### userConfig
- ❌ **zcode manifest 完全没有 userConfig 字段**。AGENTS.md 声明 max_cycles（默认 10）、risk_level（默认 medium）、auto_escalate（默认 true）三项配置，实现为零。

### Versioning
- ✅ 所有平台 manifest version=0.1.0，SKILL.md version=0.1.0，marketplace.json=0.1.0，`bump-version.js --all --check` 全部 in sync。

### Install
- ✅ 6 个 install/materialize dry-run 全部 exit 0、不写文件。
- ❌ **`_shared/` 在 codebuddy/trae/qoder/qwencode 安装后断裂**：
  - zcode install 复制 `zcode/agents/`（含 `_shared/` 子目录）→ 正常。
  - codebuddy materialize 跳过所有平台目录（含 zcode），只 overlay 6 个 agent 文件 → dest `agents/` 下无 `_shared/`，agent 引用 `../agents/_shared/field-map.md` 断裂。
  - trae/qoder/qwencode 各自的 `agents/` 目录下无 `_shared/`（仅 zcode 有），install 只复制各自平台目录 → 安装后 agent 引用 `_shared/` 断裂。
- ⚠️ qwencode manifest 缺 `description` 字段（其他平台都有），轻量不一致。

### 其他
- ✅ scripts/setup-ralph-pipeline.sh 存在。
- ⚠️ 仓库根无 `hooks/` 目录（AGENTS.md Hooks 章节描述的"事件驱动自动化"对 agentic-workflow 而言是纯文档承诺）。

---

## 缺口清单（带优先级）

| # | 优先级 | 问题 | 根因 | 建议修复 | 影响文件 |
|---|--------|------|------|----------|----------|
| G1 | **P0 → ✅ 部分修复** | 3 个 hook 完全缺失 | AGENTS.md 承诺未实现；深层根因：forbidden_scope/verification 状态活在 orchestrator prompt 内存，hook（独立进程）读不到 | **已落地可落地子集**（commit `0cfb871`）：`validate-state-write.js` 真实现（PreToolUse 校验 `.loop-cli/state/*.json`）+ hooks.json + zcode manifest hooks 字段 + AGENTS.md 重写标注另两个未实现的根因与升级路径。block-forbidden-scope / check-verification-on-stop 不写假门禁，升级路径已记入文档（需扩展 state schema 持久化 scope/verification） | hooks/validate-state-write.js + hooks/hooks.json + zcode manifest + AGENTS.md |
| G2 | **P1** | `_shared/` 在 4 平台安装后断裂 | codebuddy materialize 跳过平台目录；trae/qoder/qwencode 各自 agents 目录无 `_shared` | materialize 复制 `_shared/`；trae/qoder/qwencode 的 agent 改用与 zcode 一致的相对引用 + install 脚本复制 `_shared` | materialize.js + 3 平台 agent + install 脚本 |
| G3 | **P1 → ✅ 已修复** | 2 个 skill 冗余 | 深层根因：skill 逻辑已内联在 agent body，SKILL.md 是重复副本无人引用 | **删除** `skills/scope-drift-detector/` + `skills/root-cause-grouper/`（逻辑保留在内联处），AGENTS.md Skills 章节改写说明已内联 | 删 2 目录 + AGENTS.md |
| G4 | **P1** | userConfig 三项未实现 | manifest 缺字段 | zcode manifest 补 `userConfig` 块；agent 内读取逻辑（若需要） | zcode manifest + 相关 agent |
| G5 | **P2** | codebuddy coding-orchestrator 排版空行差异 | 手动同步遗漏 | 统一空行 | codebuddy/agents/coding-orchestrator.md |
| G6 | **P2** | AGENTS.md agentic-workflow 章节目录名过时 | 文档漂移 | `agents-zcode/`→`zcode/agents/` 等措辞校正 | AGENTS.md |
| G7 | **P2** | qwencode manifest 缺 description | 轻量不一致 | 补 description 字段 | .qwen-plugin/qwen-extension.json |

---

## 本次拟修复项

本轮聚焦**可逆、范围小、不跨 3+ 业务文件**的项，避免触发 STOP 线：

- **F1（G6, P2）**：修订 AGENTS.md agentic-workflow 章节，目录名校正为 `zcode/agents/`、`codebuddy/agents/`。单文件文档改动。
- **F2（G7, P2）**：qwencode manifest 补 `description` 字段。单文件。
- **F3（G5, P2）**：codebuddy coding-orchestrator 排版空行对齐 zcode 版。单文件。

**本轮不修复（需用户决策或跨 STOP 线）：**
- ~~G1（P0 hook 缺失）~~：**已部分修复**（commit `0cfb871`），见上。剩余 block-forbidden-scope / check-verification-on-stop 需扩展 state schema 持久化 scope/verification 状态，属数据迁移 + 公共契约变更，待后续。
- G2（P1 `_shared` 断裂）：修复需同时改 materialize.js + 3 平台 agent 路径 + install 脚本，跨 5+ 业务文件，触发 STOP 线。建议拆为独立任务。
- ~~G3（P1 skill 孤儿）~~：**已修复**（commit 见下），深层根因是冗余非孤儿，删除副本保持单一事实源。
- G4（P1 userConfig）：补 manifest 字段本身小，但 agent 是否需要读取逻辑未明，需用户确认实现深度。
