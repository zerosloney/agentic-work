# zcode / plugin

> Source: https://zcode.z.ai/cn/docs/plugin
> Fetched: 2026-07-29 20:25:00

---

核心功能复制全文

# Plugin

Plugin 用来扩展 ZCode 的能力。一个插件可以把技能、命令、子智能体、MCP 服务器等能力打包在一起，让团队把可复用的工具沉淀成统一的扩展包，在同一个工作台里一键启用。

![ZCode 插件管理页面](/content/docs/v2/screenshots/zcode-docs-20260613-plugin-management.png)

> **Beta** — 插件管理仍处于 Beta 阶段，流程和可用来源后续可能调整。

---

## 插件里有什么

一个插件可以同时包含多种能力。ZCode 会根据插件目录里的内容自动识别它包含哪些组件，并在列表中以标签或数量的形式展示：

| 组件 | 说明 |
| --- | --- |
| **Skill（技能）** | 教 Agent 如何完成特定任务的技能文件 |
| **Command（命令）** | 可通过 `/` 调用的快捷命令 |
| **Agent（子智能体）** | 随插件一起注册的子智能体 |
| **MCP 服务器** | 随插件注册的外部工具服务，会出现在 MCP 列表的 **Plugin MCP 服务器** 分组中 |
| **Hook（钩子）** | 在特定事件触发的自动化钩子 |
| **LSP** | 语言服务，为对应语言提供补全、诊断等能力 |

启用插件后，它附带的可运行组件——技能、命令和 MCP 服务器——会注册到当前工作台；停用后这些组件也会一起停用。

---

## 浏览与安装插件

进入 **设置 -> 插件管理**，切换到 **Marketplace** 标签即可发现插件。目录会按 marketplace 来源分组展示，顶部有推荐区，支持跨来源搜索，每个来源分页加载。

> 插件管理需要在打开工作区后才可用。如果提示「打开一个工作区以管理插件」，先打开任意项目 / 工作区即可。列表没及时更新时，点右上角的 **刷新** 重新拉取最新插件与市场信息。

找到想要的插件后，点卡片右侧的 **获取** 按钮即可安装，状态会依次变为「安装中…」和「已安装」。新装的插件默认启用，组件立即可用。

![插件管理 · 发现页：推荐区与按来源分组的插件目录](/content/docs/v2/screenshots/plugin-discover-20260701.png)

点击任意插件可打开详情页，ZCode 会加载它实际包含的技能、命令、子智能体和 MCP 服务器，并附上简短说明，让你在安装前先看清它会带来哪些能力。

### 导入自定义 marketplace 源

你不必局限于内置目录。在 **Marketplace** 标签里，点击搜索框旁的 **+** 按钮即可添加自己的 marketplace 源：

1. 点击 **+**，打开「添加 marketplace」弹层。
2. 粘贴一个 marketplace 源——GitHub 仓库（例如 `owner/repo` 或其链接）、Git URL，或本地路径。
3. 点击 **添加**（或按回车）。

添加成功后，该来源发布的插件会以它的名称分组出现在目录中，你可以像其他插件一样浏览并安装。如果某个来源添加失败，输入框会保留并提示错误，方便你修正。

> 想自己做一个插件或搭建团队市场？见下方 [开发自己的插件](#develop)，里面有插件目录结构、`plugin.json` / `marketplace.json` 的字段速查和完整 JSON 用例。

---

## 内置插件

ZCode 内置了一批 **官方插件**。其中两个开箱即用、默认启用；其余随包内置，需要时再开启即可。

| 插件 | 能力 | 默认状态 |
| --- | --- | --- |
| **document-skills** | 用于生成 DOCX、PDF 等文档的内置技能 | 默认启用 |
| **skill-creator** | 创建和编辑你自己的本地技能 | 默认启用 |
| **android-emulator** | Android 开发工作流与模拟器自动化 | 默认关闭 |
| **ios-simulator** | iOS 开发工作流与模拟器自动化（macOS） | 默认关闭 |
| **restore-legacy-sessions** | 迁移并恢复旧版本的会话 | 默认关闭 |

其中最值得一提的是 **android-emulator** 和 **ios-simulator** 这两个移动开发插件——启用后，ZCode Agent 就能直接驱动 Android 模拟器或 iOS 模拟器，把构建运行、安装启动、界面验证等环节都放进同一条对话流里，不必再在 IDE、模拟器和命令行之间来回切换，移动开发体验更连贯、更高效。

---

## 管理插件

**Installed（已安装）** 标签会列出本机的插件。每个插件会展示名称、版本、来源标签，以及它包含的技能、命令、MCP 等组件数量。

![插件管理 · 已安装列表：内置插件与启用开关](/content/docs/v2/screenshots/plugin-installed-20260701.png)

在这里可以完成几件事：

* 通过顶部搜索框按插件名称或描述筛选。
* 按启用 / 停用状态筛选。
* 查看插件来源标签，例如 `官方`，或你导入的某个 marketplace 名称。
* 通过右侧开关启用或停用插件。
* 点击插件条目，查看它包含的具体技能、命令、MCP 等组件，并可在此卸载。内置官方插件只能停用，不能卸载。

由于插件变更需要重新加载 Agent 运行环境，启用或停用插件后，ZCode 会自动刷新受影响的技能和会话，让改动生效。停用插件后，它的全部组件会立即从会话中移除，再次启用即可恢复。

---

## 配置插件

有些插件需要你先提供参数才能工作，例如默认设备、开关或路径。在 **Installed（已安装）** 标签中点开插件，进入详情弹窗，展开底部的 **高级信息**，在 **配置** 区填写可填项——必填项会标注「必填」，填完点 **保存配置**。

标记为敏感的项（例如 API 密钥）会提示「该值需要安全存储接入后才能配置」，当前暂不支持在界面里直接填写。遇到这类插件，按其说明在系统层面准备好密钥即可。

---

## 装好的插件怎么用

插件启用后，它带来的能力会自动出现在客户端对应位置，无需额外设置：

| 能力 | 在哪里用 |
| --- | --- |
| **技能** | 合适时机会自动触发；也可在输入框输入 `/`，从「技能」分组手动选用。在 **设置 -> 技能** 的「Plugin 技能」分组可统一查看。 |
| **命令** | 在输入框输入 `/`，从「命令」分组选用，可输入关键词搜索命令或技能。 |
| **子智能体** | 会话中可被自动调度执行任务；在 **设置 -> 子智能体** 的「插件子智能体」分组可查看（来自插件，只读）。 |
| **MCP 服务器** | 在 **设置 -> MCP** 中显示为 **Plugin MCP 服务器**，随插件启停自动加载。 |

---

## 开发自己的插件

只需会写 JSON 和 Markdown，不用改 ZCode 本体。做好后，通过上面的 [导入自定义 marketplace 源](#custom-marketplace) 把本地目录加进来，即可在客户端里直接安装测试。

### 一个插件长什么样

插件就是一个文件夹：根目录放一份清单 `plugin.json`，再按需放各类组件目录（全部可选）。

```
my-plugin/
├── .zcode-plugin/
│   └── plugin.json    清单（唯一必需）
├── commands/          斜杠命令，每个一个 .md
├── skills/            技能，每个子目录含 SKILL.md
├── agents/            子智能体 .md
├── hooks/hooks.json   钩子
└── .mcp.json          MCP 服务声明
```

清单位置按优先级查找：`.zcode-plugin/plugin.json`（推荐）→ `.claude-plugin/plugin.json`（兼容 Claude Code）。

五种组件的写法：

| 组件 | 格式与位置 |
| --- | --- |
| **命令** | `commands/*.md`，YAML frontmatter + 正文；正文用 `$ARGUMENTS` 接收参数 |
| **技能** | `skills/<名>/SKILL.md`，frontmatter 写清 `name` / `description`，描述越准越易被自动触发 |
| **子智能体** | `agents/*.md`，frontmatter 必填 `name` / `description`，正文即其 system prompt |
| **Hooks** | `hooks/hooks.json`，在特定事件时机自动执行；随插件启停，详见 [Hooks](/cn/docs/hooks) |
| **MCP 服务** | 根目录 `.mcp.json` 或清单 `mcpServers`，接入外部工具，键名自动加命名空间避免冲突 |

最小清单只需要一个 `name`：

```
{
  "name": "hello-world",
  "version": "0.1.0",
  "description": "我的第一个插件"
}
```

### plugin.json 字段速查

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `name` | ✅ | 插件名，须匹配 `^[a-z0-9][a-z0-9._-]{0,127}$`（小写字母 / 数字开头，可含 `. _ -`，1–128 字符） |
| `version` |  | 版本号，缺省 `0.0.0`，建议语义化版本 |
| `description` |  | 一句话描述，显示在插件管理界面 |
| `author` |  | 作者，可写字符串或对象 `{ name, email, url }` |
| `homepage` / `repository` |  | 主页与仓库地址 |
| `license` |  | 许可证，如 `MIT` |
| `keywords` |  | 关键词数组 |
| `commands` / `skills` / `hooks` / `mcpServers` / `agents` |  | 各类组件声明，可写目录路径字符串、路径数组或内联对象 |
| `dependencies` |  | 依赖的其他插件，写 `name@market` 或同市场内裸 `name` |
| `userConfig` |  | 用户可配置项（见下表） |

> 清单里写了 `channels` / `lspServers` / `outputStyles` / `settings` 这几个字段时，当前运行时**仅登记、不执行**，会给出诊断提示，不影响其它组件加载。

`userConfig` 里的每一项都会出现在插件详情弹窗的 **配置** 区，供用户在界面里填写：

| 字段 | 含义 |
| --- | --- |
| `type` | 类型：`string` / `number` / `boolean` / `directory` / `file` |
| `title` | 界面上显示的标题 |
| `description` | 配置项说明 |
| `default` | 默认值 |
| `required` | 布尔；是否必填，界面标「必填」 |
| `sensitive` | 布尔；敏感值，界面打码且暂不支持在界面直接填写 |

敏感配置（`sensitive`）的值可以在 MCP 声明里用 `${user_config.键}` 引用。

### marketplace.json 字段速查

「插件市场」是一份目录清单，告诉客户端有哪些插件可装、各自在哪。

**顶层字段：**

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `name` | ✅ | 市场名，命名规则同插件名 |
| `description` |  | 市场描述 |
| `plugins` | ✅ | 插件条目数组（见下表） |
| `pluginRoot` |  | 解析各条目 `source` 时的基准目录，相对市场根目录 |
| `allowCrossMarketplaceDependenciesOn` |  | 允许跨市场依赖的市场名数组 |

**`plugins[]` 每个条目：**

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `name` | ✅ | 插件名 |
| `source` |  | 插件代码在哪。最常用是相对路径字符串，也可写对象（见下表） |
| `description` / `version` |  | 展示用描述与版本 |
| `category` / `tags` |  | 分类（字符串）与标签（字符串数组），便于检索 |
| `dependencies` |  | 依赖的其他插件，写 `name@market` 或同市场内裸 `name` |
| `strict` |  | 布尔；对该条目做更严格的校验 |

**`source` 的几种写法：**

| 写法 | 含义 |
| --- | --- |
| `"./plugins/hello"` | 最常用。相对市场根目录的子目录（插件与市场同仓库） |
| `{ "source": "directory", "path": "/abs/path" }` | 本地绝对路径目录 |
| `{ "source": "github", "repo": "owner/repo", "path": "subdir", "ref": "main" }` | 从 GitHub 仓库取，可指定子目录与分支 |
| `{ "source": "git", "url": "https://...git", "path": "subdir", "ref": "..." }` | 从任意 Git 仓库取 |
| `{ "source": "file", "path": "..." }` | 读取一个本地清单文件 |
| `{ "source": "url", "url": "https://.../marketplace.json" }` | 指向一个 JSON 文件的 HTTP 地址，可带 `headers` |
| `{ "source": "npm", "package": "..." }` | 从 npm 包取 |

### 命令 .md 字段速查

`commands/*.md` 的 frontmatter 支持以下字段：

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `description` | ✅ | 命令描述（或正文非空即可） |
| `argument-hint` |  | 参数提示，如 `"[topic]"` |
| `allowed-tools` |  | 逗号分隔，限制该命令可用的工具 |
| `model` |  | 覆盖默认模型 |
| `skills` |  | 逗号分隔，自动挂载的技能 |
| `disable-noninteractive` |  | 布尔；是否在非交互模式下禁用 |

正文里 `$ARGUMENTS` 代表用户传入的全部参数，`$1` / `$2` 代表位置参数。命令名取自文件名，须匹配 `^[a-z0-9][a-z0-9_:-]{0,63}$`。

### 技能 SKILL.md 字段速查

`skills/<名>/SKILL.md` 的 frontmatter 支持以下字段：

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `name` | ✅ | 技能名，缺省取所在目录名 |
| `description` | ✅ | 触发说明，写清「什么时候用」；最长 1024 字符，越准越易被自动调用 |
| `when_to_use` |  | 补充触发时机描述 |
| `license` |  | 许可证 |
| `metadata` |  | 对象，可放 `author` / `version` 等附加信息 |

其余非白名单字段（如 `homepage`）会被忽略，不影响加载。

### 完整 JSON 用例

#### plugin.json（全字段）

```
{
  "name": "ios-simulator",
  "version": "1.2.0",
  "description": "iOS 模拟器开发循环：技能 + 命令 + MCP + 钩子",
  "author": { "name": "你的名字", "email": "you@example.com", "url": "https://example.com" },
  "homepage": "https://example.com/ios-simulator",
  "repository": "https://github.com/your-team/ios-simulator",
  "license": "MIT",
  "keywords": ["ios", "simulator", "mobile"],
  "commands": "commands",
  "skills": ["skills", "extra-skills"],
  "agents": "agents",
  "hooks": "hooks/hooks.json",
  "mcpServers": ".mcp.json",
  "dependencies": ["skill-creator@zcode-plugins-official"],
  "userConfig": {
    "api_key": {
      "title": "API 密钥",
      "description": "访问第三方服务用",
      "type": "string",
      "required": true,
      "sensitive": true
    },
    "default_device": { "title": "默认设备", "type": "string", "default": "iPhone 16" },
    "max_retries": { "type": "number", "default": 3 },
    "verbose": { "type": "boolean", "default": false },
    "workspace_dir": { "type": "directory" },
    "config_file": { "type": "file" }
  }
}
```

`commands` / `skills` / `hooks` / `mcpServers` / `agents` 三种写法均可——目录字符串（如 `"commands"`）、路径数组（如 `["skills", "extra-skills"]`）、或直接内联对象。上例分别演示了字符串、数组与文件路径。

#### marketplace.json（全字段 + 所有 source 写法）

```
{
  "name": "my-market",
  "description": "团队内部插件市场",
  "pluginRoot": "plugins",
  "allowCrossMarketplaceDependenciesOn": ["zcode-plugins-official"],
  "plugins": [
    {
      "name": "hello-world",
      "source": "./hello-world",
      "description": "打招呼插件",
      "version": "0.1.0",
      "category": "demo",
      "tags": ["starter", "demo"],
      "strict": true
    },
    {
      "name": "from-github",
      "source": { "source": "github", "repo": "your-team/another", "path": "plugins/x", "ref": "main" },
      "dependencies": ["hello-world", "skill-creator@zcode-plugins-official"]
    },
    {
      "name": "from-git",
      "source": { "source": "git", "url": "https://git.example.com/x.git", "path": "sub", "ref": "v1.0" }
    },
    {
      "name": "from-dir",
      "source": { "source": "directory", "path": "/abs/path/to/plugin" }
    },
    {
      "name": "from-url",
      "source": { "source": "url", "url": "https://example.com/plugin-manifest.json", "headers": { "Authorization": "Bearer xxx" } }
    },
    {
      "name": "from-npm",
      "source": { "source": "npm", "package": "@scope/plugin" }
    }
  ]
}
```

设了 `pluginRoot` 后，相对 `source`（如 `"./hello-world"`）以它为基准解析，即 `plugins/hello-world`。

#### hooks/hooks.json

```
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run.sh\" start",
            "async": false,
            "shell": true,
            "timeout": 30,
            "statusMessage": "初始化中…"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "process",
            "command": "node",
            "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/check.js"],
            "timeoutMs": 5000,
            "statusMessage": "校验命令…"
          }
        ]
      }
    ],
    "PostToolUse": [
      { "hooks": [ { "type": "command", "command": "echo done" } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/cleanup.sh\"", "async": true } ] }
    ]
  }
}
```

当前支持 `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PermissionRequest`、`PostToolUse`、`PostToolUseFailure`、`Stop` 七个事件。每个事件下是 matcher 组数组；`process` 使用 argv 执行，`command` 使用 shell 字符串并支持 `async`。标准位置 `hooks/hooks.json` 会自动发现，不要再在 manifest 中重复指向同一文件。插件启用后 Hook 才进入新 session，完整语义见 [Hooks](/cn/docs/hooks)。

#### .mcp.json（stdio + http + sse）

```
{
  "mcpServers": {
    "ios-simulator": {
      "type": "stdio",
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/mcp/server.js"],
      "cwd": "${CLAUDE_PROJECT_DIR}",
      "env": {
        "IOS_SIM_ROOT": "${CLAUDE_PLUGIN_ROOT}",
        "IOS_SIM_DEVICE": "${user_config.default_device}"
      },
      "enabled": true,
      "timeoutMs": 60000
    },
    "remote-http": {
      "type": "http",
      "url": "https://mcp.example.com/api",
      "headers": { "Authorization": "Bearer ${user_config.api_key}" },
      "enabled": true,
      "timeoutMs": 30000
    },
    "remote-sse": {
      "type": "sse",
      "url": "https://mcp.example.com/sse",
      "headers": { "X-Token": "${user_config.api_key}" }
    }
  }
}
```

`type` 可省略——有 `command` 默认 `stdio`，有 `url` 默认 `http`。可用模板变量：

| 变量 | 含义 |
| --- | --- |
| `${CLAUDE_PLUGIN_ROOT}` | 插件根目录，亦可写 `${ZCODE_PLUGIN_ROOT}` |
| `${CLAUDE_PLUGIN_DATA}` | 插件数据目录 |
| `${CLAUDE_PROJECT_DIR}` | 当前工作目录 |
| `${user_config.键}` | 引用 `userConfig` 中对应配置项的值 |

服务键名会自动加命名空间 `plugin:<插件名>:<服务名>` 避免冲突。

### 在客户端本地测试

1. 本地建好插件目录，再写一份 `marketplace.json`，`plugins[].source` 用相对路径指向插件目录。
2. 打开 **设置 -> 插件管理 -> Marketplace** 标签页，点 **+** 填该目录的本地路径添加市场（本地路径需真实存在）。
3. 点 **获取** 安装、用开关启用，在会话里触发组件验证；改完代码刷新即可。

### 做一个市场分发给团队

把插件放进市场仓库的 `plugins/` 目录，根目录写 `marketplace.json` 列出条目，推到 GitHub。队友在 **Marketplace** 标签页点 **+** 填仓库地址，即可一次拿到全部插件。

> 自带的官方插件是最好的范例（skill-creator 最简，ios-simulator / android-emulator 最完整）。从纯技能插件起步，跑通后再加命令、Hooks、MCP。

**安全提示**：启用插件就是授予代码执行信任。已启用的第三方市场插件与官方插件一样，可以执行本地进程并读取继承的 Agent 环境变量。启用前请审查来源、`hooks/hooks.json` 和脚本，不信任时停用或卸载插件。

---

## 下一步

[#### Hooks

事件、输入输出契约与退出码的完整开发参考。](/cn/docs/hooks)[#### Command

了解 ZCode Agent 的内置命令，以及如何新建自定义命令。](/cn/docs/commands)[#### Skill

通过 Skill 让 Agent 掌握特定的工作方式。](/cn/docs/skill)[#### MCP 服务器

为 Agent 接入外部工具能力。](/cn/docs/mcp-services)

On this page

* [插件里有什么](#contents)
* [浏览与安装插件](#marketplace)
* [导入自定义 marketplace 源](#custom-marketplace)
* [内置插件](#built-in)
* [管理插件](#manage)
* [配置插件](#configure)
* [装好的插件怎么用](#using)
* [开发自己的插件](#develop)
* [一个插件长什么样](#structure)
* [plugin.json 字段速查](#plugin-json)
* [marketplace.json 字段速查](#marketplace-json)
* [命令 .md 字段速查](#command-frontmatter)
* [技能 SKILL.md 字段速查](#skill-frontmatter)
* [完整 JSON 用例](#examples)
* [plugin.json（全字段）](#example-plugin-json)
* [marketplace.json（全字段 + 所有 source 写法）](#example-marketplace-json)
* [hooks/hooks.json](#example-hooks-json)
* [.mcp.json（stdio + http + sse）](#example-mcp-json)
* [在客户端本地测试](#local-testing)
* [做一个市场分发给团队](#distribute)
* [下一步](#next-steps)
