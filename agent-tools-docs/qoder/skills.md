# qoder / skills

> Source: https://docs.qoder.com/zh/extensions/skills
> Fetched: 2026-07-29 20:24:49

---

复制页面

Skills 是 Qoder 中将专业知识打包成可复用功能的机制。每个 Skill 包含一个 `SKILL.md` 文件，定义技能的描述、指令和可选的辅助文件。无论是在 Qoder IDE 还是 CLI 中，Skills 的使用方式完全一致。
**核心特点**：

* **智能调用**：模型根据用户请求和 Skill 描述自主决定何时使用
* **模块化设计**：每个 Skill 专注解决特定类型的任务
* **灵活扩展**：支持用户级和项目级的自定义 Skill

## [​](#使用场景) 使用场景

**适合使用 Skill 的场景**：

* **复杂专业任务**：需要领域知识的工作流（代码审查、PDF 处理、API 设计）
* **标准化流程**：按固定步骤执行的任务（提交规范、部署流程）
* **团队知识共享**：打包最佳实践供团队使用
* **重复性工作**：频繁执行且需要专业指导的任务

## [​](#内置-skills) 内置 Skills

在 IDE 会话或 Quest 中输入 `/` 可调用内置功能（示例）：

| 名称 | 用途 |
| --- | --- |
| `/create-skill` | 引导创建新的 Skill |
| `/create-skill-ui` | 为 Skill 生成交互式 HTML Widget |
| `/vercel-deploy` | 一键 Vercel 部署（OAuth 与构建） |
| `/create-subagent` | 脚手架自定义子智能体 |
| `/canvas` | 在 Canvas 预览中创建或编辑 .canvas.tsx 视觉产物 |

### [​](#skill-ui) Skill UI

Skill UI 支持 Agent 在执行过程中直接渲染可交互的 HTML 组件，例如表单、图表、配置面板等。生成的组件内嵌在对话流中，你可以直接在会话内完成交互操作，无需跳转到外部页面。首次使用时需要让 Agent 为对应 Skill 创建界面。
在 Quest 的 Agent 模式中使用 `/create-skill-ui` 命令。Agent 会为指定 Skill 创建 HTML Widget 界面，你可以通过实时预览迭代设计后保存为模板文件。

### [​](#vercel-deploy) Vercel Deploy

`/vercel-deploy` 是 Quest 下的一键部署能力。通过自动化工作流，将你的 Web 项目部署到 Vercel，覆盖 CLI 安装、OAuth 授权、项目构建到正式上线的完整流程。
在 Quest 的对话中使用 `/vercel-deploy` 命令，Qoder 将自动启动部署工作流。首次部署时，Qoder 会引导你完成 Vercel OAuth 登录授权。按照提示在浏览器中完成账号关联即可。授权完成后，Qoder 将自动执行项目构建并部署到 Vercel 生产环境。部署成功后，你会获得一个可访问的线上链接。

* **需要 Vercel 账号**：部署前需确保你已注册 Vercel 账号。若尚未注册，可在授权流程中完成创建。
* **项目需为可构建的 Web 应用**：Vercel 支持 Next.js、React、Vue、Svelte 等主流框架。如果项目缺少有效的构建配置，部署可能会失败。建议在部署前确认项目可在本地正常构建。

## [​](#如何使用) 如何使用

可以有以下两种触发方式：

1. 自动触发：直接描述需求，模型会自动判断是否使用合适的 Skill：

   Copy

   Copy

   ```
   分析这个日志文件中的错误
   ```

   模型将自动识别并调用 `log-analyzer` Skill。
2. 手动触发：输入 `/skill-name` 手动触发：

   Copy

   Copy

   ```
   /log-analyzer
   ```

## [​](#创建技能-skills) 创建技能(Skills)

你可以通过以下三种方式创建或获取自定义 Skills:

### [​](#1-通过内置技能自动创建) 1. 通过内置技能自动创建

`create-skill` 是 Qoder 内置的技能创建助手。它通过交互式对话,引导你逐步创建符合规范的 SKILL.md 文件。
**使用方式**:

Copy

Copy

```
/create-skill <技能描述,例如:将 Word 文档转换为 PDF>
```

如果你不熟悉 SKILL.md 文件的编写规范,建议优先使用 `/create-skill` 来生成初始模板,然后根据实际需求进行调整优化。

**适用场景**: 快速创建自定义技能,无需了解技能文件的详细格式。

### [​](#2-通过-skills-cli-安装) 2. 通过 Skills CLI 安装

使用 [skills CLI](https://github.com/vercel-labs/skills) 可以一键安装来自 [skills.sh](https://skills.sh) 市场或 GitHub 的第三方 Skills。
在 Qoder IDE 的终端内执行以下命令:

Copy

Copy

```
# 从 skills.sh 市场安装
npx skills add vercel-labs/agent-browser -a qoder

# 从 GitHub 仓库安装指定技能
npx skills add https://github.com/anthropics/skills --skill skill-creator -a qoder
```

> 更多用法详见 [skills CLI 文档](https://github.com/vercel-labs/skills)。

**适用场景**: 安装社区共享的成熟技能,快速获得开箱即用的功能。

### [​](#3-手动创建) 3. 手动创建

如果你希望完全自定义技能,可以手动创建 SKILL.md 文件并放置到指定目录。
**步骤**:

1. 创建技能目录和 SKILL.md 文件
2. 将文件放置到以下路径之一:

| 位置 | 路径 | 作用域 |
| --- | --- | --- |
| 用户级 | `~/.qoder/skills/{skill-name}/SKILL.md` | 当前用户的所有项目 |
| 项目级 | `.qoder/skills/{skill-name}/SKILL.md` | 仅当前项目 |

3. 重启 Qoder IDE,在对话框内输入 `/` 即可查看已加载的 Skills 列表

> **提示**: 当用户级和项目级存在同名 Skill 时,项目级 Skill 优先级更高。

**适用场景**: 需要完全自定义技能内容,或将现有技能文件直接导入。

## [​](#场景示例) 场景示例

### [​](#日志分析) 日志分析

创建一个 `log-analyzer` Skill，当你说"分析这个日志"时自动激活，帮助识别错误、性能问题和异常模式。

### [​](#api-文档生成) API 文档生成

创建一个 `api-doc-generator` Skill，自动识别 API 端点并生成标准文档和 OpenAPI 规范。

### [​](#代码审查) 代码审查

创建一个 `code-reviewer` Skill，按照团队规范自动审查代码，检查潜在问题和最佳实践。

## [​](#详细文档) 详细文档

关于 Skills 的完整指南，包括如何创建、编写 SKILL.md、最佳实践和故障排查，请参阅 [Skills 完整文档](/zh/cli/Skills)。

[上一页](/zh/extensions/subagent)[Plugins

下一页](/zh/extensions/plugins)
