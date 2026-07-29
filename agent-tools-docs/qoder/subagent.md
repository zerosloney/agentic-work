# qoder / subagent

> Source: https://docs.qoder.com/zh/extensions/subagent
> Fetched: 2026-07-29 20:24:46

---

复制页面

自定义智能体（Custom Agent）是 Qoder 中专门用于处理特定任务的 AI Agent。你可以创建自定义智能体来扩展 Qoder 的能力，每个智能体拥有独立的上下文窗口、工具权限和系统提示词。目前自定义智能体的调度方式是通过 subagent 的方式进行管理。

## [​](#创建自定义智能体) 创建自定义智能体

### [​](#方式1-使用-create-agent-推荐) 方式1：使用 create-agent（推荐）

Qoder 提供了内置的 `create-agent` 技能，可以通过交互式引导帮助你快速创建符合规范的自定义智能体。
**使用方式**：

Copy

Copy

```
/create-agent <您的诉求，例如代码审查专家>
```

`create-agent` 会引导你完成以下步骤：

* 定义智能体的名称和描述
* 选择需要的工具权限
* 自动生成系统提示词模板
* 将智能体文件保存到正确的位置

如果你是第一次创建自定义智能体，建议使用 `/create-agent` 来自动生成配置文件，这样可以确保格式正确并包含所有必要的字段。

### [​](#方式2-手动创建) 方式2：手动创建

你也可以手动在以下位置创建一个 `.md` 文件：

| 位置 | 路径 | 作用域 |
| --- | --- | --- |
| 用户级 | `~/.qoder/agents/<agentName>.md` | 所有项目 |
| 项目级 | `${project}/.qoder/agents/<agentName>.md` | 仅当前项目 |

文件需要包含 frontmatter 区块定义基本信息，以及系统提示词内容：

```
---
name: code-review
description: 代码审查专家，检查代码质量和安全性
tools: Read, Grep, Glob, Bash
model: "[ModelName](modelId)"
skills: 
 - {skillName1}
 - {skillName2}
mcpServers:
 - {mcpServerName1}
 - {mcpServerName2}
---

你是一位资深代码审查员，负责确保代码质量。

审查清单：
1. 代码可读性
2. 命名规范
3. 错误处理
4. 安全性检查
5. 测试覆盖
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 自定义智能体的唯一标识名称 |
| `description` | 是 | 简短描述功能和专长，用于模型自动选择 |
| `model` | 否 | 指定运行模型，不设置时跟随对话中的模型选择 |
| `tools` | 否 | 允许使用的工具列表，用逗号分隔 |
| `skills` | 否 | 允许的技能列表 |
| `mcpServers` | 否 | 允许的mcp服务列表 |

#### [​](#mcp-服务器) MCP 服务器

自定义智能体支持配置 MCP（Model Context Protocol）服务器，让智能体能够调用外部工具和服务。在智能体配置中添加 `mcpServers` 字段即可关联 MCP 服务器，扩展智能体的能力边界。

#### [​](#模型配置) 模型配置

自定义智能体支持指定运行模型。在 Quest 视图下的 **Setting → Agents** 页面中，选择目标智能体后点击 **Change Model** 即可切换模型，为不同角色的智能体分配最合适的模型。

#### [​](#支持的工具列表) 支持的工具列表

| 工具名称 | 说明 |
| --- | --- |
| `Bash` | 在您的环境中执行 shell 命令 |
| `Edit` | 对特定文件进行有针对性的编辑 |
| `Write` | 创建或覆盖文件 |
| `Glob` | 检索文件 |
| `Grep` | 检索文件内容 |
| `Read` | 读取文件的内容 |
| `WebFetch` | 从指定的 URL 获取内容 |
| `WebSearch` | 执行带有域过滤的 Web 搜索 |

## [​](#在-ide-中使用) 在 IDE 中使用

有以下两种触发方式：

### [​](#方式1-自动触发) 方式1：自动触发

在 Chat 面板中，用自然语言描述任务，模型会根据 description 自动识别意图并选择合适的自定义智能体：

Copy

Copy

```
帮我审查这个接口的实现
```

模型将自动识别并调用 `code-review` 智能体。

### [​](#方式2-手动触发) 方式2：手动触发

输入 `/agent-name` 手动触发指定的智能体：

Copy

Copy

```
/code-review
```

## [​](#详细文档) 详细文档

关于自定义智能体的完整指南，包括自动创建、CLI 中的使用方式等，请参阅 [CLI 使用文档](/zh/cli/subagent)。

[上一页](/zh/user-guide/chat/computer-use-agent)[Skills

下一页](/zh/extensions/skills)
