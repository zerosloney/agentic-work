# agentic-work 跨平台插件仓库设计

**日期**：2026-07-26
**状态**：Draft（待用户评审）
**作者**：master0071（@master0071 npm scope）
**上游资产**：`D:\Code\agentic-skills\donet-work\`（重命名为 `dotnet-work/`）、`D:\Code\agentic-skills\loop-workflow\templates\`

---

## 1. 背景与目标

### 1.1 现状

- `donet-work/` 目录包含 4 个 .NET 开发技能（database-explorer、dotnet-code-review、dotnet-csharp-developer、winforms-dev-flow），每个技能以 Claude Skills 规范打包（`SKILL.md` + `references/` + `scripts/`）
- `loop-workflow/templates/` 包含 12 个 agent 模板（`coding/ralph/testing/writing` × 3 角色 + `ralph-loop/ralph-graph` 的 3 个变体）和 5 个 command 模板，所有模板都用 `{{name}}`、`{{description}}`、`{{executor_name}}`、`{{reviewer_name}}`、`{{backpressure}}`、`{{engine_type}}` 占位符
- 目录拼写问题：`donet-work`（少一个 t）→ 重命名为 `dotnet-work`

### 1.2 目标

将上述两个工作目录的内容，打包成兼容 **opencode** / **codebuddy** / **zcode** 三个 AI 编程平台的插件，发布到新的独立 git 仓库 `zerosloney/agentic-work`，npm scope `@master0071`。

**不涉及**：运行时 JavaScript hook 插件、CI/CD 流水线、版本升级迁移工具。

### 1.3 非目标

- 不发布到 npm registry（仅本地仓库，发布留给后续）
- 不做版本迁移/升级脚本（只做 install/uninstall）
- 不重写 `loop-workflow/templates/` 原文（仅做模板实例化）
- 不修改 `dotnet-work/` 内任何 SKILL.md / references / scripts 业务内容

---

## 2. 关键决策

| # | 决策点 | 选择 | 理由 |
|---|--------|------|------|
| 1 | 目录拼写 | 重命名 `donet-work` → `dotnet-work` | 与 .NET 命名约定一致 |
| 2 | 模板插值策略 | 预生成所有领域变体（12 agents + 5 commands） | 用户偏好；零运行时依赖 |
| 3 | 仓库布局 | 单仓双插件 + 平台子目录 | 与 `caveman4cn` 仓库同构；git 统一管理 |
| 4 | 市场名身份 | npm scope `@master0071` | 已有命名空间；与 caveman 同 scope |
| 5 | codebuddy 约定 | 与 opencode 同构（仓库根 `skills/agents/commands` + `.codebuddy-plugin/marketplace.json`） | 平台兼容 |
| 6 | zcode 约定 | 仓库根 `marketplace.json` + `.zcode-plugin/plugin.json`（与 caveman4cn 完全一致） | 已验证 |
| 7 | 仓库拆分 | 新建独立仓库 `zerosloney/agentic-work` | 不污染 caveman4cn；plugin 间共享 scope |
| 8 | 插件源布局 | `plugins/<plugin>/<platform>/...`（与 caveman 三层同构） | 复用已有安装脚本模式 |
| 9 | git 管理 | `D:\Code\agentic-skills\` 仓库根 init + 远端 `zerosloney/agentic-work`（待用户确认 GitHub owner 名是否正确） | 用户在环境内 |

---

## 3. 仓库顶层结构

```
agentic-work/                              # git repo: zerosloney/agentic-work
├── .gitignore
├── .editorconfig
├── AGENTS.md                               # 给开发 agent 的项目规约
├── README.md                               # 用户面向
├── LICENSE                                 # MIT
├── package.json                            # @master0071/agentic-work
├── marketplace.json                        # zcode 平台 manifest
├── .codebuddy-plugin/
│   └── marketplace.json                    # codebuddy 平台 manifest
├── plugins/
│   ├── dotnet-work/
│   │   ├── opencode/                       # opencode 源
│   │   │   ├── agents/                    # (空：dotnet-work 是 skills-only)
│   │   │   ├── commands/                  # (空)
│   │   │   └── skills/
│   │   │       ├── database-explorer/SKILL.md
│   │   │       ├── dotnet-code-review/SKILL.md
│   │   │       ├── dotnet-csharp-developer/SKILL.md
│   │   │       └── winforms-dev-flow/SKILL.md
│   │   ├── codebuddy/
│   │   │   ├── .codebuddy-plugin/plugin.json
│   │   │   ├── hooks/                     # (空)
│   │   │   └── skills/                    # 同 opencode 内容
│   │   └── zcode/
│   │       ├── .zcode-plugin/plugin.json
│   │       └── skills/                    # 同 opencode 内容
│   └── loop-workflow/
│       ├── opencode/
│       │   ├── agents/
│       │   │   ├── coding-orchestrator.md
│       │   │   ├── coding-builder.md
│       │   │   ├── coding-reviewer.md
│       │   │   ├── ralph-orchestrator.md
│       │   │   ├── ralph-worker.md
│       │   │   ├── ralph-reviewer.md
│       │   │   ├── test-orchestrator.md
│       │   │   ├── test-writer.md
│       │   │   ├── coverage-reviewer.md
│       │   │   ├── writing-orchestrator.md
│       │   │   ├── writing-author.md
│       │   │   └── writing-reviewer.md
│       │   └── commands/
│       │       ├── coding-loop.md
│       │       ├── ralph-loop.md
│       │       ├── ralph-graph.md
│       │       ├── test-loop.md
│       │       └── writing-loop.md
│       ├── codebuddy/                     # 同 opencode 结构 + .codebuddy-plugin/plugin.json
│       └── zcode/                          # 同 opencode 结构 + .zcode-plugin/plugin.json
└── scripts/
    ├── install-opencode.js
    ├── install-codebuddy.js
    └── install-zcode.js
```

---

## 4. manifest 文件格式

### 4.1 `package.json`（仓库根）

参考 `caveman4cn/package.json`，但 scope 改为 `@master0071/agentic-work`。bin 字段按平台列出（每个 install 脚本接受 `--plugin <name>` 参数选择具体插件）：

```json
{
  "name": "@master0071/agentic-work",
  "version": "0.1.0",
  "description": "...",
  "license": "MIT",
  "engines": { "node": ">=18" },
  "bin": {
    "agentic-work-opencode": "scripts/install-opencode.js",
    "agentic-work-codebuddy": "scripts/install-codebuddy.js",
    "agentic-work-zcode": "scripts/install-zcode.js"
  },
  "scripts": {
    "install:opencode": "node ./scripts/install-opencode.js",
    "install:codebuddy": "node ./scripts/install-codebuddy.js",
    "install:zcode": "node ./scripts/install-zcode.js",
    "install:all": "node ./scripts/install-opencode.js && node ./scripts/install-codebuddy.js && node ./scripts/install-zcode.js"
  },
  "files": [
    "plugins/",
    "scripts/",
    "marketplace.json",
    ".codebuddy-plugin/marketplace.json",
    "AGENTS.md",
    "README.md",
    "LICENSE"
  ]
}
```

> 每个 install 脚本默认处理两个插件（dotnet-work + loop-workflow），通过 `--plugin dotnet-work` 或 `--plugin loop-workflow` 过滤单个；`--uninstall` 与 `--dry-run` 沿用 caveman 模式。

### 4.2 `marketplace.json`（仓库根，zcode 用）

```json
{
  "name": "master0071",
  "description": "Agentic-work plugins (dotnet-work + loop-workflow) for zcode and codebuddy.",
  "owner": { "name": "master0071", "url": "https://github.com/master0071" },
  "plugins": [
    {
      "name": "dotnet-work-zcode",
      "source": "./plugins/dotnet-work/zcode",
      "description": ".NET development skills for ZCode",
      "version": "0.1.0",
      "category": "development",
      "tags": ["dotnet", "csharp", "development", "skills"],
      "strict": true
    },
    {
      "name": "loop-workflow-zcode",
      "source": "./plugins/loop-workflow/zcode",
      "description": "Orchestrated execute-review loops (coding/testing/writing/Ralph) for ZCode",
      "version": "0.1.0",
      "category": "workflow",
      "tags": ["workflow", "loop", "ralph", "orchestration"],
      "strict": true
    }
  ]
}
```

### 4.3 `.codebuddy-plugin/marketplace.json`（codebuddy 用）

结构与 4.2 类似，但 `name` 加 `-codebuddy` 后缀，`source` 指向 `plugins/<name>/codebuddy/`：

```json
{
  "name": "master0071",
  "description": "...",
  "owner": { "name": "master0071", "email": "master0071@users.noreply.github.com" },
  "plugins": [
    {
      "name": "dotnet-work-codebuddy",
      "description": "...",
      "version": "0.1.0",
      "source": "./plugins/dotnet-work/codebuddy",
      "category": "development",
      "author": { "name": "master0071", "url": "https://github.com/master0071" },
      "homepage": "https://github.com/master0071/agentic-work",
      "license": "MIT",
      "tags": ["dotnet", "csharp", "development"]
    },
    {
      "name": "loop-workflow-codebuddy",
      "source": "./plugins/loop-workflow/codebuddy",
      "description": "...",
      "version": "0.1.0",
      "category": "workflow",
      "author": { "name": "master0071" },
      "homepage": "https://github.com/master0071/agentic-work",
      "license": "MIT",
      "tags": ["workflow", "loop"]
    }
  ]
}
```

### 4.4 `plugins/<name>/zcode/.zcode-plugin/plugin.json`

```json
{
  "name": "dotnet-work-zcode",
  "version": "0.1.0",
  "description": "...",
  "keywords": ["dotnet", "csharp"],
  "commands": "commands",
  "agents": "agents",
  "skills": "skills",
  "hooks": "hooks/hooks.json"
}
```

> `hooks/hooks.json` 仅在存在时引用；dotnet-work 不提供 hook，留空或省略。

### 4.5 `plugins/<name>/codebuddy/.codebuddy-plugin/plugin.json`

类似 4.4，但 `skills` 字段是数组（codebuddy 支持显式列举）：

```json
{
  "name": "dotnet-work-codebuddy",
  "version": "0.1.0",
  "description": "...",
  "category": "Development",
  "commands": "commands",
  "agents": "agents",
  "skills": ["skills/database-explorer", "skills/dotnet-code-review", ...],
  "hooks": "hooks/hooks.json"
}
```

---

## 5. dotnet-work 转换规则

### 5.1 输入

`donet-work/` 重命名为 `dotnet-work/` 后保留 4 个 skill：

| skill 名 | SKILL.md 行数 | references/ 数 | scripts/ 数 |
|----------|--------------|---------------|-------------|
| `database-explorer` | 289 | 5 | 17（含 cli/core/tests） |
| `dotnet-code-review` | 436 | 9 | 14（含 csharp-* 子项目） |
| `dotnet-csharp-developer` | 123 | 5 | 0 |
| `winforms-dev-flow` | 393 | 18 | 4（含 tests） |

每个 skill 的 `references/` 与 `scripts/` 视为不可分割的资源，整体复制。

### 5.2 输出位置

每个 skill 复制到三个平台子目录：

```
plugins/dotnet-work/opencode/skills/<skill-name>/
plugins/dotnet-work/codebuddy/skills/<skill-name>/
plugins/dotnet-work/zcode/skills/<skill-name>/
```

三份内容**完全一致**（SKILL.md + references/ + scripts/），不做平台差异化。

### 5.3 manifest 引用

- `plugins/dotnet-work/zcode/.zcode-plugin/plugin.json`：`"skills": "skills"`（自动发现）
- `plugins/dotnet-work/codebuddy/.codebuddy-plugin/plugin.json`：`"skills": ["skills/<name>", ...]`（显式列举 4 个）
- `plugins/dotnet-work/opencode/`：opencode 通过 `<root>/.opencode/skills/<name>/SKILL.md` 约定自动发现，不需要 manifest

### 5.4 文件名 / 平台差异

- **三平台完全同源**：SKILL.md 内容（含 frontmatter）+ `references/` + `scripts/` 在三平台下字节级一致
- **opencode 兼容说明**：opencode 仅识别 `name/description/license/compatibility/metadata(string-to-string)` 五个 frontmatter 字段，其他未知字段忽略
  - `database-explorer` 的 `agent_created: true`、`version: 0.6.0` → opencode 忽略
  - `dotnet-csharp-developer` 的 `metadata` 含嵌套对象（author/version/domain/triggers/role/scope/output-format/related-skills）→ opencode 不识别嵌套结构，安装时打 warning 但不影响加载
  - 三个平台都接受这些额外字段（zcode/codebuddy 完全透传）
- **description 长度**：opencode 上限 1024 字符。实测当前 4 个 SKILL.md description 均在 300 字符以内，无截断需要

---

## 6. loop-workflow 模板实例化

### 6.1 输入

`loop-workflow/templates/agents/*.md` 12 个 + `loop-workflow/templates/commands/*.md` 5 个，全部含 `{{placeholder}}`。

### 6.2 占位符替换表

> 表中 `description` 字段省略号（`...`）仅作示意，实际替换内容来自对应模板的 frontmatter `description` 字段（与原模板保持一致），或由生成脚本按"角色 + 领域"重写。

| template | 替换为 `{{name}}` | `{{description}}` | `{{executor_name}}` | `{{reviewer_name}}` | `{{engine_type}}` |
|----------|------------------|-----------------|---------------------|---------------------|-------------------|
| `coding-orchestrator.md` | `coding-orchestrator` | "Coding-Loop 主控 Agent：编排 executor/reviewer，按 scope drift 零容忍门禁停止。" | `coding-builder` | `coding-reviewer` | (留空) |
| `coding-executor.md` | `coding-builder` | "Coding-Loop 受控编码 Builder：声明 scope 内编码、按根因分组修复、真实验证。" | — | — | — |
| `coding-reviewer.md` | `coding-reviewer` | "Coding-Loop 只读审查 Agent：scope drift 检测、根因归并、verdict 输出。" | — | — | — |
| `ralph-orchestrator.md` | `ralph-orchestrator` | "Ralph 主控 Agent：TaskList 编排，背压熔断门禁决定停止。" | `ralph-worker` | `ralph-reviewer` | `loop` |
| `ralph-executor.md` | `ralph-worker` | "Ralph Loop 执行者：单任务执行、运行验证、原样回报。" | — | — | — |
| `ralph-reviewer.md` | `ralph-reviewer` | "Ralph Loop 只读质量阀：accept_criteria 复核、verdict 输出。" | — | — | — |
| `testing-orchestrator.md` | `test-orchestrator` | "Test-Loop 主控 Agent：源码冻结，三项验证信号驱动停止。" | `test-writer` | `coverage-reviewer` | (留空) |
| `testing-executor.md` | `test-writer` | "Test-Loop 执行者：仅写测试、源码冻结、回报三项信号。" | — | — | — |
| `testing-reviewer.md` | `coverage-reviewer` | "Test-Loop 只读质量阀：三项信号 + 源码冻结双保险。" | — | — | — |
| `writing-orchestrator.md` | `writing-orchestrator` | "Writing-Loop 主控 Agent：写作边界，三项质量信号驱动停止（弱门禁）。" | `writing-author` | `writing-reviewer` | (留空) |
| `writing-executor.md` | `writing-author` | "Writing-Loop 执行者：仅写文档、术语一致、链接可达。" | — | — | — |
| `writing-reviewer.md` | `writing-reviewer` | "Writing-Loop 只读质量阀：术语漂移/死链/代码示例三项扫描。" | — | — | — |

`{{backpressure}}` 占位符替换为各 agent 内嵌的 backpressure 配置块（来自原 agent 模板的「## 执行规则」末尾的 `{{backpressure}}` 上下文）。详见 6.3。

### 6.3 `{{backpressure}}` 替换内容

**coding-orchestrator**（MAX_CYCLES=8，STALL_MAX=2）：

```text
### 背压（coding 域）
- MAX_CYCLES = 8（>8 轮未 DONE 强制停止）
- STALL_MAX = 2（连续 2 轮任务状态签名无变化 → STALL）
- 失败计数达到 3 → 立即 ESCALATE
- 风险评估默认 medium；用户描述含"生产 / 安全 / 数据迁移"→ high
```

**testing-orchestrator**（MAX_CYCLES=8，STALL_MAX=2）：

```text
### 背压（testing 域）
- MAX_CYCLES = 8（>8 轮未 DONE 强制停止）
- STALL_MAX = 2（连续 2 轮任务状态签名无变化 → STALL）
- 三项信号必须全达标：coverage.lines ≥ 80%、mutation_score ≥ 60%、empty_assertions_count == 0
- 失败计数达到 3 → 立即 ESCALATE
```

**writing-orchestrator**（MAX_CYCLES=6，STALL_MAX=2，弱门禁）：

```text
### 背压（writing 域）
- MAX_CYCLES = 6（>6 轮未 DONE 强制停止）
- STALL_MAX = 2（连续 2 轮任务状态签名无变化 → STALL）
- 三项信号必须全达标：terminology_drift_count == 0、broken_links_count == 0、code_example_errors == 0
- 失败计数达到 2 → 立即 ESCALATE（弱门禁，retry_on_failure=false）
```

**ralph-orchestrator**（MAX_CYCLES=10，STALL_MAX=3）：

```text
### 背压（ralph 域）
- MAX_CYCLES = 10（>10 轮未 DONE 强制停止）
- STALL_MAX = 3（连续 3 轮状态签名无变化 → STALL）
- 失败计数达到 max_failures → 立即 ESCALATE（默认 max_failures=3）
```

### 6.4 command 模板占位符替换

| template | `{{name}}` | `{{description}}` | `{{agent}}` | `{{executor_name}}` | `{{reviewer_name}}` |
|----------|------------|-------------------|------------|---------------------|---------------------|
| `coding-loop.md` | `coding-loop` | "Coding-Loop: 受控编码/审查闭环" | `coding-orchestrator` | `coding-builder` | `coding-reviewer` |
| `ralph-loop.md` | `ralph-loop` | "Ralph-Loop: 通用编排执行审查闭环（线性）" | `ralph-orchestrator` | `ralph-worker` | `ralph-reviewer` |
| `ralph-graph.md` | `ralph-graph` | "Ralph-Graph: 通用编排执行审查闭环（DAG 路由表）" | `ralph-orchestrator` | `ralph-worker` | `ralph-reviewer` |
| `testing-loop.md` | `test-loop` | "Test-Loop: 三项验证信号驱动的测试编写闭环（源码冻结）" | `test-orchestrator` | `test-writer` | `coverage-reviewer` |
| `writing-loop.md` | `writing-loop` | "Writing-Loop: 文档写作质量信号闭环（写作边界）" | `writing-orchestrator` | `writing-author` | `writing-reviewer` |

### 6.5 输出位置

每个实例化的 agent 与 command 同步复制到三个平台子目录：

```
plugins/loop-workflow/opencode/agents/<name>.md
plugins/loop-workflow/opencode/commands/<name>.md
plugins/loop-workflow/codebuddy/agents/<name>.md
plugins/loop-workflow/codebuddy/commands/<name>.md
plugins/loop-workflow/zcode/agents/<name>.md
plugins/loop-workflow/zcode/commands/<name>.md
```

共 12 agents × 3 平台 = 36 个 agent 文件，5 commands × 3 平台 = 15 个 command 文件。

### 6.6 frontmatter 平台差异化

agents 在三平台上的 frontmatter `description` / `mode` / `temperature` / `steps` / `permission` 完全相同。commands 在三平台上的 frontmatter 完全相同（agent 字段指向同名的实例化 agent）。

---

## 7. 安装脚本设计

### 7.1 `scripts/install-opencode.js`

参考 `caveman4cn` 的 `install-{platform}.js` 风格。opencode 的 skills/agents/commands 是 markdown 文件，**通过本地配置目录发现**，不从 npm 包自动加载——所以安装脚本把内容复制到 `~/.config/opencode/{skills,agents,commands}/`：

```js
// 伪代码
const PLUGINS = [
  { name: 'dotnet-work', srcRoot: 'plugins/dotnet-work/opencode' },
  { name: 'loop-workflow', srcRoot: 'plugins/loop-workflow/opencode' }
];
const HOME = process.env.USERPROFILE || process.env.HOME;
const TARGET = path.join(HOME, '.config', 'opencode');

// 对每个 plugin：
//  1. 复制 skills/<name>/ → TARGET/skills/<name>/（含 SKILL.md + references/ + scripts/）
//  2. 复制 agents/<name>.md → TARGET/agents/<name>.md
//  3. 复制 commands/<name>.md → TARGET/commands/<name>.md
//  4. （可选）追加到 ~/.config/opencode/opencode.json 的 plugin 段：
//       "plugin": ["@master0071/agentic-work"]  ← 让 opencode 通过 npm 也加载
```

> **优先级**：脚本默认只复制到 `~/.config/opencode/`，由 opencode 自动发现；不写 `~/.config/opencode/opencode.json`（除非用户传 `--npm-link`）。`--uninstall` 反向删除已复制文件。

### 7.2 `scripts/install-codebuddy.js`

参考 `caveman4cn/scripts/install-codebuddy.js`：

```js
// 伪代码
const HOME = process.env.USERPROFILE || process.env.HOME;
const TARGET_DIR = path.join(HOME, '.codebuddy', 'plugins');

for (const plugin of PLUGINS) {
  const src = path.join(__dirname, '..', 'plugins', plugin.name, 'codebuddy');
  const dest = path.join(TARGET_DIR, `${plugin.name}-codebuddy`);
  // 1. deleteDirRecursive(dest)
  // 2. copyDirRecursive(src, dest)
  // 3. ensureMarketplaceManifest() —— 写 ~/.codebuddy/plugins/.codebuddy-plugin/marketplace.json
  // 4. codebuddy plugin marketplace add <TARGET_DIR> --name master0071
  // 5. codebuddy plugin marketplace update master0071
  // 6. codebuddy plugin install <plugin.name>-codebuddy@master0071
}
```

### 7.3 `scripts/install-zcode.js`

参考 `caveman4cn/scripts/install-zcode.js`：

```js
// 伪代码
const HOME = process.env.USERPROFILE || process.env.HOME;
const PLUGIN_DIR = path.join(HOME, '.zcode', 'cli', 'plugins');

for (const plugin of PLUGINS) {
  const PLUGIN_ROOT = path.join(PLUGIN_DIR, 'cache', 'master0071', `${plugin.name}-zcode/0.1.0`);
  const SRC = path.join(__dirname, '..', 'plugins', plugin.name, 'zcode');

  // 1. 复制 SRC → PLUGIN_ROOT（含 .zcode-plugin/, skills/, commands/, agents/, hooks/）
  // 2. 注册到 PLUGIN_DIR/marketplaces/master0071/marketplace.json（plugins 数组追加条目）
  // 3. 创建 PLUGIN_DIR/data/<plugin.name>-zcode@master0071 启用标记
}
```

---

## 8. .gitignore

```
node_modules/
.DS_Store
*.log
.cache/
.opencode/
.codebuddy/
```

> 注：`.codebuddy/` 仅排除用户本地缓存，不排除仓库内的 `.codebuddy-plugin/`（它是仓库元数据）。

---

## 9. 执行步骤（高层）

> 详细实现计划在 writing-plans 阶段输出。

1. **重命名** `donet-work/` → `dotnet-work/`（本地 git move）
2. **创建仓库结构**：在 `D:\Code\agentic-skills\` 根目录下新建顶层 manifest 与 scripts 骨架
3. **dotnet-work 转换**：为每个 skill 在三个平台子目录生成完整副本
4. **loop-workflow 实例化**：编写一次性脚本生成 12 agents + 5 commands 的所有平台版本
5. **写 manifests**：仓库根 `marketplace.json`、`.codebuddy-plugin/marketplace.json`、每个平台子目录的 plugin.json
6. **写安装脚本**：三个 `install-{platform}.js`，复用 caveman4cn 模式
7. **写 README.md + AGENTS.md + LICENSE**：标准三件套
8. **git init + 首次提交**：init 仓库、提交所有源
9. **自检**：dry-run 三个 install 脚本，确保复制路径正确

---

## 10. 风险与权衡

| 风险 | 缓解 |
|------|------|
| SKILL.md description 长度超过 1024 | 截断/改写，保持关键触发词 |
| SKILL.md 内 `references/` 中存在相对路径引用，跨平台复制可能断链 | 三平台 SKILL.md 一致；不重新生成路径，保持原始相对引用 |
| `donet-work` 拼写错误导致 git 误操作 | 提交前用 `git mv` 而非删除+创建；并在 commit message 里说明 |
| opencode 的 markdown 插件（agents/commands）与 zcode 的 `.zcode-plugin/` 目录格式在权限语法上有微差 | 三平台分别保留原 frontmatter，仅 `name/description/temperature/steps/permission` 复用 |
| loop-workflow 实例化产物多（36 个 agent + 15 个 command = 51 个 .md 文件），易遗漏 | 用一次性脚本生成，输出 manifest 报告每个文件 |

---

## 11. 验收标准

- 仓库根 `git status` 干净，所有源文件就位
- 三个安装脚本在 dry-run 模式下打印成功路径
- 三个 manifest（zcode / codebuddy / package.json）JSON 格式合法
- 12 + 5 = 17 个实例化产物 + 4 个 dotnet skills 在三个平台子目录下各生成齐全
- 重命名后 `donet-work` 不再存在

---

## 12. 后续（不在本次实现范围）

- npm publish 到 registry（依赖 npm 账号与 token）
- 版本升级迁移工具（v0.1 → v0.2）
- 单元测试：template 实例化的占位符替换正确性
- CI：自动 dry-run install 脚本并验证退出码