# qoder / hooks

> Source: https://docs.qoder.com/zh/extensions/hooks
> Fetched: 2026-07-29 20:24:55

---

复制页面

Hooks 让你可以在 Qoder IDE 和 JetBrains 插件执行的关键节点插入自定义逻辑，而无需修改任何代码。你只需编辑 JSON 配置文件，就能实现诸如：

* 在工具执行前拦截危险操作
* 写文件后自动跑 lint，保持代码风格一致
* Agent 完成任务时弹出桌面通知，不用一直盯着 IDE

与 Prompt 指令不同，Hooks 是确定性的——只要事件触发，脚本就一定执行，不受模型理解偏差的影响。

## [​](#支持的事件) 支持的事件

当前 IDE / JB 插件支持以下五种 Hook 事件：

| 事件名称 | 触发时机 | 可阻断 |
| --- | --- | --- |
| **UserPromptSubmit** | 用户提交 Prompt 后、Agent 处理前 | 是 |
| **PreToolUse** | 工具调用执行前 | 是 |
| **PostToolUse** | 工具调用成功后 | 否 |
| **PostToolUseFailure** | 工具调用失败后 | 否 |
| **Stop** | Agent 完成响应时 | 否 |

## [​](#快速开始) 快速开始

下面用一个例子，演示如何拦截 `rm -rf` 这类危险命令。

1

创建脚本

Copy

Copy

```
mkdir -p ~/.qoder/hooks
cat > ~/.qoder/hooks/block-rm.sh << 'EOF'
#!/bin/bash
input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command')

if echo "$command" | grep -q 'rm -rf'; then
  echo "危险命令已被阻止: $command" >&2
  exit 2
fi

exit 0
EOF
chmod +x ~/.qoder/hooks/block-rm.sh
```

2

添加配置

在 `~/.qoder/settings.json` 中添加：

Copy

Copy

```
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.qoder/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}
```

3

验证效果

打开 IDE，在 Qoder 插件面板中让 Agent 执行包含 `rm -rf` 的命令。Hook 会阻止执行，并把错误信息反馈给 Agent。

## [​](#适用场景) 适用场景

| 场景 | 对应事件 | 说明 |
| --- | --- | --- |
| 拦截危险命令 | PreToolUse | 在 Agent 执行 `rm -rf`、`DROP TABLE` 等命令前阻止 |
| 文件路径校验 | PreToolUse | 限制 Agent 只能在指定目录下创建 / 编辑文件 |
| 自动 Lint / 格式化 | PostToolUse | 每次写文件后自动执行 ESLint / Prettier |
| 日志审计 | PostToolUse | 记录 Agent 的所有工具调用，用于安全审计 |
| 失败监控告警 | PostToolUseFailure | 工具调用失败时发送告警或记录错误日志 |
| Prompt 内容审查 | UserPromptSubmit | 检测用户输入中是否包含敏感信息（密码、密钥等） |
| 自动注入上下文 | UserPromptSubmit | 自动在 Prompt 末尾追加项目规范或编码约定 |
| 桌面通知 | Stop | Agent 完成后弹出系统通知提醒用户 |

## [​](#工作原理) 工作原理

Hook 的使用流程可以概括为三步：**编写脚本 → 注册配置 → 自动生效**。
当 Agent 执行到某个生命周期节点时（如工具调用前），插件会检查配置中是否有对应的 Hook：

1. 插件在启动时加载所有 Hook 配置
2. Agent 运行过程中，到达某个事件节点（如 `PreToolUse`）
3. 插件遍历该事件下所有 Hook 分组，用 `matcher` 匹配当前上下文
4. 匹配成功的 Hook 按顺序执行对应的 shell 脚本
5. 脚本通过 `stdin` 接收事件上下文（JSON），通过 `exit code` 和 `stdout` 返回决策
6. 插件根据返回结果决定后续行为（放行 / 阻断）

## [​](#前置条件) 前置条件

* **jq**：示例脚本依赖 jq 解析 JSON。macOS 下执行 `brew install jq`，Linux 下执行 `apt install jq`。
* **脚本权限**：所有 Hook 脚本需要有可执行权限（`chmod +x`）。

## [​](#创建-hooks) 创建 Hooks

### [​](#1-确定需求-选择事件和匹配范围) 1. 确定需求：选择事件和匹配范围

首先明确你要在哪个节点介入，以及匹配什么条件：

Copy

Copy

```
我想在「什么时候」拦截/处理「什么操作」？
   ↓                        ↓
 选择事件                 编写 matcher
```

| 需求 | 事件 | matcher |
| --- | --- | --- |
| Agent 执行任何 Shell 命令前检查 | PreToolUse | `"Bash"` |
| Agent 写入或编辑文件后做处理 | PostToolUse | `"Write | Edit"` |
| Agent 工具调用失败时记录 | PostToolUseFailure | `"Bash"` 或不填 |
| 用户提交的所有 Prompt 做审查 | UserPromptSubmit | 不填（匹配所有） |
| Agent 停止时触发通知 | Stop | 不填（匹配所有） |
| 只拦截 MCP 工具 | PreToolUse | `"mcp__.*"` |

### [​](#2-编写-hook-脚本) 2. 编写 Hook 脚本

Hook 脚本是一个标准的 shell 脚本，遵循以下协议：
**输入**：通过 `stdin` 接收 JSON 格式的事件上下文
**输出**：通过 `exit code` 控制行为

Copy

Copy

```
exit 0   →  放行（继续执行）
exit 2   →  阻断（停止操作，stderr 注入对话）
其他值   →  错误（继续执行，stderr 展示给用户）
```

**脚本模板：**

Copy

Copy

```
#!/bin/bash

# 1. 读取 stdin 的 JSON 输入
input=$(cat)

# 2. 用 jq 提取你关心的字段
#    不同事件有不同的字段，具体见「事件参考」章节
tool_name=$(echo "$input" | jq -r '.tool_name')
tool_input=$(echo "$input" | jq -r '.tool_input')

# 3. 编写你的判断逻辑
if [ "$tool_name" = "Bash" ]; then
  command=$(echo "$input" | jq -r '.tool_input.command')

  # 检查是否包含危险操作
  if echo "$command" | grep -qE 'rm\s+-rf|DROP\s+TABLE'; then
    # 阻断：exit 2 + stderr 消息会反馈给 Agent
    echo "操作被拒绝: $command" >&2
    exit 2
  fi
fi

# 4. 放行
exit 0
```

除了 exit code，你还可以在 `exit 0` 时输出 JSON 来提供更精细的控制：

Copy

Copy

```
#!/bin/bash
input=$(cat)

# 输出 JSON 实现精细控制（仅 exit 0 时生效）
echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"该操作不被允许"}}'
exit 0
```

### [​](#3-注册到配置文件) 3. 注册到配置文件

将脚本路径写入配置文件的对应事件下：

Copy

Copy

```
{
  "hooks": {
    "事件名": [
      {
        "matcher": "匹配条件（可选）",
        "hooks": [
          {
            "type": "command",
            "command": "脚本路径"
          }
        ]
      }
    ]
  }
}
```

### [​](#4-测试与调试) 4. 测试与调试

可以直接在终端用管道模拟测试：

Copy

Copy

```
# 模拟 PreToolUse 事件
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"},"hook_event_name":"PreToolUse"}' \
  | ~/.qoder/hooks/block-rm.sh
echo "Exit code: $?"
```

检查 stderr 输出（阻断消息）：

Copy

Copy

```
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' \
  | ~/.qoder/hooks/block-rm.sh 2>&1
```

## [​](#配置-hooks) 配置 Hooks

### [​](#配置文件位置) 配置文件位置

Hook 配置从以下文件加载，多级配置会被**合并**执行（优先级从低到高）：

| 位置 | 作用域 | 优先级 | 可共享 | 说明 |
| --- | --- | --- | --- | --- |
| `~/.qoder/settings.json` | 用户级 | 1（最低） | 否 | 用户个人配置，对所有项目生效 |
| `.qoder/settings.json` | 项目级 | 2 | 是 | 可提交到 Git，团队共享 |
| `.qoder/settings.local.json` | 项目级（本地） | 3 | 否 | gitignore，个人开发配置 |

IDE / JB 插件与 CLI 共享同一套配置文件。当前版本暂不支持热加载，修改配置文件后需要**重启 IDE** 才能生效。

### [​](#配置格式) 配置格式

Copy

Copy

```
{
  "hooks": {
    "事件名": [
      {
        "matcher": "匹配条件",
        "hooks": [
          {
            "type": "command",
            "command": "要执行的命令"
          }
        ]
      }
    ]
  }
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `type` | 是 | 固定为 `"command"` |
| `command` | 是 | 要执行的 shell 命令或脚本路径 |
| `timeout` | 否 | 超时时间（秒），默认 30。当前版本不支持自定义，下个版本开放配置 |
| `matcher` | 否 | 匹配条件，不填则匹配该事件的所有触发 |

一个事件下可以配置多个 matcher 分组，每个分组可以包含多个 Hook 命令。

### [​](#matcher-匹配规则) matcher 匹配规则

`matcher` 用于过滤 Hook 的触发范围，不同事件匹配不同的字段（见各事件说明）。

| 写法 | 含义 | 示例 |
| --- | --- | --- |
| 不填或 `"*"` | 匹配所有 | 所有工具都会触发 |
| 精确值 | 精确匹配 | `"Bash"` 只在 Bash 工具时触发 |
| `|` 分隔 | 匹配多个值 | `"Write | Edit"` 在 Write 或 Edit 时触发 |
| 正则表达式 | 正则匹配 | `"mcp__.*"` 匹配所有 MCP 工具 |

### [​](#工具名映射) 工具名映射

Qoder 支持两套工具名——原生工具名与 Claude Code 兼容工具名。配置 Hook 时可使用任意一套，插件内部会统一映射后执行匹配。例如 `matcher: "Bash"` 和 `matcher: "run_in_terminal"` 等价。

| Qoder 原生名 | 兼容名 | 说明 |
| --- | --- | --- |
| `run_in_terminal` | `Bash` | 执行 shell 命令 |
| `read_file` | `Read` | 读取文件内容 |
| `create_file` | `Write` | 创建 / 写入文件 |
| `search_replace` | `Edit` | 编辑文件 |
| `delete_file` | - | 删除文件 |
| `grep_code` | `Grep` | 搜索文件内容 |
| `search_file` | `Glob` | 文件名匹配 |
| `list_dir` | `LS` | 列出目录 |
| `task` | `Task` | 启动子任务 / 子代理 |
| `Skill` | - | 调用技能 |
| `search_web` | `WebSearch` | 网页搜索 |
| `fetch_content` | `WebFetch` | 获取网页内容 |
| `todo_write` | `TodoWrite` | 写入 TODO |
| `ask_user_question` | - | 向用户提问 |
| `search_memory` | - | 搜索记忆 |
| `update_memory` | - | 更新记忆 |
| `switch_mode` | - | 切换模式 |
| `create_plan` | - | 创建计划 |
| `run_preview` | - | 预览 Web 应用 |
| `mcp__<server>__<tool>` | 同左 | MCP 工具 |

## [​](#编写-hook-脚本) 编写 Hook 脚本

Hook 脚本通过 stdin 接收 JSON 输入，通过 exit code 和 stdout 输出来控制行为。本节说明所有事件通用的输入输出格式，各事件的额外字段见 Hooks 事件。

### [​](#输入) 输入

Hook 脚本通过 **stdin** 接收 JSON 数据。所有事件都包含以下通用字段：

| 字段 | 说明 |
| --- | --- |
| `session_id` | 当前会话 ID |
| `cwd` | 当前工作目录 |
| `hook_event_name` | 触发的事件名称 |
| `transcript_path` | 会话上下文 JSON 文件路径 |

不同事件会在此基础上附加额外字段（见各 Hooks 事件）。
用 `jq` 解析输入：

Copy

Copy

```
#!/bin/bash
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
```

### [​](#输出) 输出

Hook 通过 exit code 和 stdout 控制行为。
**exit code** 决定基本行为：

| Exit Code | 含义 | 行为 |
| --- | --- | --- |
| `0` | 成功 | 继续执行，尝试解析 stdout JSON |
| `2` | 阻断 | 停止操作，stderr 内容注入对话（仅对支持阻断的事件生效） |
| 其他 | 错误 | 非阻断错误，stderr 显示给用户，继续执行 |

**stdout JSON**（仅 exit 0 时解析）可为部分事件提供精细控制，具体支持的字段见各事件说明。exit 非 0 时 stdout 被忽略。

### [​](#环境变量) 环境变量

Hook 脚本执行时，插件会注入部分环境变量供脚本使用。具体注入的环境变量列表待补充确认。

## [​](#hooks-事件) Hooks 事件

### [​](#userpromptsubmit) UserPromptSubmit

用户在 IDE 插件面板中提交 Prompt 后、Agent 开始处理前触发。可用于 Prompt 审查、内容过滤、自动补充上下文等场景。
**matcher 匹配：** 无匹配字段，该事件对所有用户输入统一触发。
**额外输入字段：**

Copy

Copy

```
{
  "session_id": "abc-123",
  "cwd": "/path/to/project",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "帮我写一个排序函数"
}
```

**阻止 Prompt 提交：** exit code 2，stderr 内容作为错误信息反馈给用户，Agent 不会处理该 Prompt。
**stdout JSON 输出字段（exit 0 时）：**

Copy

Copy

```
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "## 当前 Git 状态\n..."
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `hookSpecificOutput.hookEventName` | string | 固定为 `"UserPromptSubmit"` |
| `hookSpecificOutput.additionalContext` | string | 附加上下文信息，会注入到 Agent 的对话中 |

**示例：自动给 Prompt 补充项目规范**

Copy

Copy

```
#!/bin/bash
input=$(cat)
prompt=$(echo "$input" | jq -r '.prompt')

# 自动追加编码规范提醒
echo '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"请遵循项目 .editorconfig 中的编码规范。"}}'
exit 0
```

### [​](#pretooluse) PreToolUse

工具执行前触发。**可以阻止工具执行。** 这是最常用的 Hook 事件，适用于危险命令拦截、文件路径校验、权限检查等场景。
**matcher 匹配：** 工具名（如 `Bash`、`Write`、`Edit`、`Read`、`Glob`、`Grep`，MCP 工具名如 `mcp__server__tool`）
**额外输入字段：**

Copy

Copy

```
{
  "session_id": "abc-123",
  "cwd": "/path/to/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "rm -rf /tmp/build" }
}
```

**阻止工具执行：** exit code 2，stderr 内容作为错误返回给 Agent。完整示例见[快速开始](#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)。
**stdout JSON 输出字段（exit 0 时）：**

Copy

Copy

```
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Safe read operation",
    "updatedInput": { "command": "npm test --coverage" },
    "additionalContext": "Added coverage flag"
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `hookSpecificOutput.hookEventName` | string | 固定为 `"PreToolUse"` |
| `hookSpecificOutput.permissionDecision` | string | `"allow"`（放行）、`"deny"`（拒绝）或 `"ask"`（询问用户） |
| `hookSpecificOutput.permissionDecisionReason` | string | 决策原因，`deny` 或 `ask` 时展示给 Agent / 用户 |
| `hookSpecificOutput.updatedInput` | object | 修改后的工具输入参数（可选，用于改写工具调用） |
| `hookSpecificOutput.additionalContext` | string | 附加上下文信息（可选） |

### [​](#posttooluse) PostToolUse

工具执行成功后触发。不可阻断。适用于自动 lint、日志记录、结果分析等场景。
**matcher 匹配：** 工具名
**额外输入字段：**

Copy

Copy

```
{
  "session_id": "abc-123",
  "cwd": "/path/to/project",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": { "file_path": "/path/to/file.ts", "content": "..." },
  "tool_response": "File written successfully"
}
```

**stdout JSON 输出字段（exit 0 时）：**

Copy

Copy

```
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "feedback": "File formatted with Prettier. 3 issues auto-fixed."
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `hookSpecificOutput.hookEventName` | string | 固定为 `"PostToolUse"` |
| `hookSpecificOutput.feedback` | string | 反馈信息，会展示给用户（如 lint 结果摘要） |

### [​](#posttoolusefailure) PostToolUseFailure

工具调用失败后触发。不可阻断。适用于错误监控、失败重试提示、日志记录等场景。
**matcher 匹配：** 工具名
**额外输入字段：**

Copy

Copy

```
{
  "session_id": "abc-123",
  "cwd": "/path/to/project",
  "hook_event_name": "PostToolUseFailure",
  "tool_name": "Bash",
  "tool_input": { "command": "npm test" },
  "error": "Command exited with non-zero status code 1"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `error` | string | 工具执行的错误信息 |

### [​](#stop) Stop

Agent 完成响应后触发（主 Agent 无待执行的工具调用时）。不可阻断。适用于桌面通知、日志记录、任务状态汇报等场景。

当前版本 Stop 事件不支持阻断（即无法通过 exit 2 让 Agent 继续工作）。该能力计划在下个版本中支持。

**matcher 匹配：** 无匹配字段，该事件在 Agent 停止时统一触发。
**额外输入字段：**

Copy

Copy

```
{
  "session_id": "abc-123",
  "cwd": "/path/to/project",
  "hook_event_name": "Stop",
  "stop_hook_active": true,
  "last_assistant_message": "我已经完成了排序函数的编写。"
}
```

**stdout JSON 输出字段（exit 0 时，下个版本生效）：**

Copy

Copy

```
{
  "decision": "block",
  "reason": "Tests failing. Fix them before completing."
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `decision` | string | `"block"`（阻止停止，让 Agent 继续工作） |
| `reason` | string | 阻止的原因，会作为消息注入对话 |

## [​](#场景示例) 场景示例

### [​](#拦截危险命令) 拦截危险命令

在 Agent 执行 shell 命令前检查是否包含危险操作，如 `rm -rf`、`DROP TABLE` 等。
脚本 `~/.qoder/hooks/block-dangerous.sh`：

Copy

Copy

```
#!/bin/bash
input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command')

# 检查危险模式
if echo "$command" | grep -qE 'rm\s+-rf|DROP\s+TABLE|mkfs|dd\s+if='; then
  echo "危险命令已被阻止: $command" >&2
  exit 2
fi

exit 0
```

配置：事件 `PreToolUse`，matcher `Bash`，command `~/.qoder/hooks/block-dangerous.sh`。

### [​](#写文件后自动-lint) 写文件后自动 Lint

每次 Agent 写入或编辑文件后，自动执行 lint 检查。
脚本 `${project}/.qoder/hooks/auto-lint.sh`：

Copy

Copy

```
#!/bin/bash
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path')

# 只检查 JS/TS 文件
case "$file_path" in
  *.js|*.ts|*.jsx|*.tsx)
    npx eslint "$file_path" --fix 2>/dev/null
    ;;
esac

exit 0
```

配置：事件 `PostToolUse`，matcher `Write|Edit`，command `.qoder/hooks/auto-lint.sh`。

### [​](#工具失败时记录日志) 工具失败时记录日志

当 Agent 调用的工具执行失败时，自动记录到日志文件，便于排查问题。
脚本 `~/.qoder/hooks/log-failure.sh`：

Copy

Copy

```
#!/bin/bash
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
error=$(echo "$input" | jq -r '.error')
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$timestamp] $tool_name 执行失败: $error" >> ~/.qoder/hooks/failure.log

exit 0
```

配置：事件 `PostToolUseFailure`，无 matcher（匹配所有工具），command `~/.qoder/hooks/log-failure.sh`。

### [​](#agent-完成后桌面通知) Agent 完成后桌面通知

Agent 完成任务后弹出系统通知，适合长时间运行的任务。
脚本 `~/.qoder/hooks/notify-done.sh`（macOS）：

Copy

Copy

```
#!/bin/bash
input=$(cat)
message=$(echo "$input" | jq -r '.last_assistant_message // "任务已完成"' | head -c 100)

osascript -e "display notification \"$message\" with title \"Qoder Agent\""

exit 0
```

配置：事件 `Stop`，无 matcher，command `~/.qoder/hooks/notify-done.sh`。

### [​](#prompt-内容审查) Prompt 内容审查

在用户提交 Prompt 时，检查是否包含敏感信息（如密码、密钥等），防止意外泄露。
脚本 `~/.qoder/hooks/check-prompt.sh`：

Copy

Copy

```
#!/bin/bash
input=$(cat)
prompt=$(echo "$input" | jq -r '.prompt')

# 检查是否包含疑似密钥
if echo "$prompt" | grep -qiE '(password|secret|api_key|token)\s*[:=]\s*\S+'; then
  echo "检测到 Prompt 中可能包含敏感信息，请检查后重新提交" >&2
  exit 2
fi

exit 0
```

配置：事件 `UserPromptSubmit`，无 matcher，command `~/.qoder/hooks/check-prompt.sh`。

### [​](#完整配置示例) 完整配置示例

以下是一个包含所有五种事件的完整配置：

Copy

Copy

```
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.qoder/hooks/check-prompt.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.qoder/hooks/block-dangerous.sh"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".qoder/hooks/validate-file-path.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".qoder/hooks/auto-lint.sh"
          }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.qoder/hooks/log-failure.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.qoder/hooks/notify-done.sh"
          }
        ]
      }
    ]
  }
}
```

## [​](#注意事项) 注意事项

* **超时处理：** Hook 脚本默认超时 30 秒。超时后脚本将被终止，按放行处理。自定义超时时间将在下个版本中支持。
* **错误处理：** 脚本异常退出（exit code 非 0 且非 2）时，错误信息显示给用户，Agent 流程不受影响继续执行。
* **脚本权限：** 确保脚本具有可执行权限（`chmod +x`）。
* **配置合并：** 多级配置文件中的同一事件 Hook 按优先级从低到高依次执行，任一 Hook 返回阻断（exit 2）则终止后续执行。
* **jq 依赖：** 示例脚本依赖 `jq` 命令行工具来解析 JSON。请确保系统已安装 jq（macOS: `brew install jq`，Linux: `apt install jq`）。

[上一页](/zh/user-guide/chat/model-context-protocol)[Deeplinks

下一页](/zh/user-guide/deeplink)
