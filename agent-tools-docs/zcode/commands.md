# zcode / commands

> Source: https://zcode.z.ai/cn/docs/commands
> Fetched: 2026-07-29 20:25:02

---

核心功能复制全文

# Command

Command 用来快速调用 ZCode Agent 的内置能力，也可以保存常用提示词。把重复使用的代码审查、提交说明、发布检查、文件解释等提示词保存成命令后，就可以在输入框里通过 `/` 快速调用。

Command 围绕 **ZCode Agent** 工作流设计。日常在 ZCode 里使用时，可以把团队反复使用的任务提示词沉淀成命令，让自研 Agent 更稳定地执行固定流程。

![ZCode Agent 调用命令](/content/docs/v2/screenshots/zcode-docs-20260612-command-picker.webp)

---

## 在 ZCode Agent 中使用

1. 在输入框输入 `/`，打开命令面板。面板分为 **命令** 和 **技能** 两个分组，可以继续输入关键字筛选。
2. 选择要使用的命令，或继续输入命令名进行筛选。
3. 如果命令需要参数，可以在命令后继续补充路径、模块名或说明。

ZCode Agent 当前内置两个命令：

| 命令 | 用途 |
| --- | --- |
| `/goal` | 查看、设置、替换、暂停、恢复或清除当前会话目标，适合持续执行的长任务 |
| `/compact` | 压缩当前对话上下文，保留关键信息，适合长对话继续推进时使用 |

例如，在长任务中可以用 `/compact` 整理上下文；需要让 Agent 围绕一个长期目标持续推进时，可以用 `/goal` 设置目标。需要调用技能时，使用 `$` 或在 `/` 面板的 **技能** 分组中选择。

---

## 新建 Command

在 ZCode 设置中进入 **命令** 页面，点击新建命令后填写以下内容：

![新建命令](/content/docs/v2/screenshots/zcode-docs-20260612-command-create-form.webp)

| 字段 | 说明 |
| --- | --- |
| **作用域** | 选择 **用户**（所有工作区可用）或 **工作区**（仅当前项目可用） |
| **名称** | 命令名称，保存后可通过 `/command-name` 调用 |
| **描述** | 可选，显示在命令选择器中的简短说明 |
| **参数提示** | 可选，用来提示参数格式，例如 `<file-path>` |
| **提示词** | 命令真正发送给 Agent 的提示词内容 |

自定义命令以 `.md` 文件形式保存在 `~/.zcode/commands` 目录（工作区级命令保存在项目目录下）。保存后在任务输入框中通过 `/command-name` 即可调用。

---

## 从外部 Agent 导入命令

如果你已经在 Claude Code 等外部 Agent 中维护了一批命令，不需要在 ZCode 里重新创建。在 **命令** 页面右上角点击 **从外部 Agent 导入命令**，即可把外部 Agent 已有的命令直接导入到 ZCode 中。

![从外部 Agent 导入命令](/content/docs/v2/screenshots/zcode-docs-20260613-command-import-external.png)

1. 在 ZCode 设置中进入 **命令** 页面。
2. 点击右上角的 **从外部 Agent 导入命令**。
3. 选择要导入的外部 Agent 命令，确认后即可导入到 ZCode。

导入后的命令会和自建命令一样保存在命令列表中，通过 `/command-name` 调用；你也可以在 ZCode 内继续修改名称、描述、参数提示或提示词内容。

---

## 使用建议

如果只是保存一段简单提示词，使用 Command 即可；如果流程需要脚本、模板或示例文件，可以考虑使用 Skill。

---

## 下一步

[#### ZCode Agent

了解如何在 ZCode 中与 Agent 对话、选择模型并控制执行模式。](/cn/docs/agents)

On this page

* [在 ZCode Agent 中使用](#use-in-zcode-agent)
* [新建 Command](#create-command)
* [从外部 Agent 导入命令](#import-from-external-agent)
* [使用建议](#usage-notes)
* [下一步](#next-steps)
