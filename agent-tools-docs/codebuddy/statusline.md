# codebuddy / statusline

> Source: https://www.codebuddy.cn/docs/cli/statusline
> Fetched: 2026-07-29 20:24:38

---

# 状态行配置 [​](#状态行配置)

> 为 CodeBuddy Code 创建自定义状态行以显示上下文信息

通过自定义状态行让 CodeBuddy Code 更具个性化，状态行显示在 CodeBuddy Code 界面的底部，类似于 Oh-my-zsh 等 shell 中的终端提示符(PS1)的工作方式。

## 创建自定义状态行 [​](#创建自定义状态行)

您可以选择以下方式之一：

* 运行 `/statusline` 让 CodeBuddy Code 帮助您设置自定义状态行。默认情况下,它会尝试复制您终端的提示符,但您可以向 CodeBuddy Code 提供有关所需行为的额外说明,例如 `/statusline 用橙色显示模型名称`
* 直接在您的 `.codebuddy/settings.json` 中添加 `statusLine` 命令：

json

```
{
  "statusLine": {
    "type": "command",
    "command": "~/.codebuddy/statusline.sh",
    "padding": 0 // 可选： 设置为 0 让状态行延伸到边缘
  }
}
```

## 工作原理 [​](#工作原理)

* 状态行在对话消息更新时更新
* 更新最多每 300ms 运行一次
* 命令输出的第一行 stdout 成为状态行文本
* 支持 ANSI 颜色代码来设置状态行样式
* CodeBuddy Code 通过 stdin 以 JSON 格式向您的脚本传递有关当前会话的上下文信息（模型、目录等）

## JSON 输入结构 [​](#json-输入结构)

您的状态行命令通过 stdin 接收 JSON 格式的结构化数据：

json

```
{
  "hook_event_name": "Status",
  "session_id": "abc123...",
  "transcript_path": "/path/to/transcript.json",
  "cwd": "/current/working/directory",
  "model": {
    "id": "gpt-5",
    "display_name": "GPT-5"
  },
  "workspace": {
    "current_dir": "/current/working/directory",
    "project_dir": "/original/project/directory"
  },
  "version": "2.9.0",
  "output_style": {
    "name": "default"
  },
  "cost": {
    "total_cost_usd": 0.01234,
    "total_duration_ms": 45000,
    "total_api_duration_ms": 2300,
    "total_lines_added": 156,
    "total_lines_removed": 23
  }
}
```

## 示例脚本 [​](#示例脚本)

### 简单状态行 [​](#简单状态行)

bash

```
#!/bin/bash
# 从 stdin 读取 JSON 输入
input=$(cat)

# 使用 jq 提取值
MODEL_DISPLAY=$(echo "$input" | jq -r '.model.display_name')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir')

echo "[$MODEL_DISPLAY] 📁 ${CURRENT_DIR##*/}"
```

### Git 感知状态行 [​](#git-感知状态行)

bash

```
#!/bin/bash
# 从 stdin 读取 JSON 输入
input=$(cat)

# 使用 jq 提取值
MODEL_DISPLAY=$(echo "$input" | jq -r '.model.display_name')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir')

# 如果在 git 仓库中显示 git 分支
GIT_BRANCH=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current 2>/dev/null)
    if [ -n "$BRANCH" ]; then
        GIT_BRANCH=" | 🌿 $BRANCH"
    fi
fi

echo "[$MODEL_DISPLAY] 📁 ${CURRENT_DIR##*/}$GIT_BRANCH"
```

### 带颜色的中文状态行 [​](#带颜色的中文状态行)

bash

```
#!/bin/bash
# 从 stdin 读取 JSON 输入
input=$(cat)

# 使用 jq 提取值
MODEL_DISPLAY=$(echo "$input" | jq -r '.model.display_name')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir')
SESSION_ID=$(echo "$input" | jq -r '.session_id' | cut -c1-8)

# ANSI 颜色代码
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

# 获取 git 分支
GIT_BRANCH=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current 2>/dev/null)
    if [ -n "$BRANCH" ]; then
        GIT_BRANCH=" ${GREEN}on${NC} ${YELLOW}$BRANCH${NC}"
    fi
fi

echo -e "${BLUE}[$MODEL_DISPLAY]${NC} 📁 ${GREEN}${CURRENT_DIR##*/}${NC}$GIT_BRANCH ${BLUE}(${SESSION_ID})${NC}"
```

### 显示成本和统计信息 [​](#显示成本和统计信息)

bash

```
#!/bin/bash
# 从 stdin 读取 JSON 输入
input=$(cat)

# 提取值
MODEL_DISPLAY=$(echo "$input" | jq -r '.model.display_name')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir')
TOTAL_COST=$(echo "$input" | jq -r '.cost.total_cost_usd')
LINES_ADDED=$(echo "$input" | jq -r '.cost.total_lines_added')
LINES_REMOVED=$(echo "$input" | jq -r '.cost.total_lines_removed')

# 格式化成本
COST_STR=""
if [ "$TOTAL_COST" != "null" ] && [ "$TOTAL_COST" != "0" ]; then
    COST_STR=$(printf " | 💰 \$%.4f" "$TOTAL_COST")
fi

# 格式化代码统计
STATS=""
if [ "$LINES_ADDED" != "null" ] && [ "$LINES_ADDED" != "0" ]; then
    STATS=" | +$LINES_ADDED -$LINES_REMOVED"
fi

echo "[$MODEL_DISPLAY] 📁 ${CURRENT_DIR##*/}$COST_STR$STATS"
```

### Python 示例 [​](#python-示例)

python

```
#!/usr/bin/env python3
import json
import sys
import os
import subprocess

# 从 stdin 读取 JSON
data = json.load(sys.stdin)

# 提取值
model = data['model']['display_name']
current_dir = os.path.basename(data['workspace']['current_dir'])

# 检查 git 分支
git_branch = ""
try:
    branch = subprocess.check_output(
        ['git', 'branch', '--show-current'],
        stderr=subprocess.DEVNULL
    ).decode('utf-8').strip()
    if branch:
        git_branch = f" | 🌿 {branch}"
except:
    pass

# ANSI 颜色代码
BLUE = '\033[0;34m'
GREEN = '\033[0;32m'
NC = '\033[0m'

print(f"{BLUE}[{model}]{NC} 📁 {GREEN}{current_dir}{NC}{git_branch}")
```

### Node.js 示例 [​](#node-js-示例)

javascript

```
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 从 stdin 读取 JSON
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    const data = JSON.parse(input);
    
    // 提取值
    const model = data.model.display_name;
    const currentDir = path.basename(data.workspace.current_dir);
    
    // 检查 git 分支
    let gitBranch = '';
    try {
        const branch = execSync('git branch --show-current', { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        }).trim();
        if (branch) {
            gitBranch = ` | 🌿 ${branch}`;
        }
    } catch (e) {
        // 不是 git 仓库或无法读取分支
    }
    
    // ANSI 颜色
    const BLUE = '\x1b[0;34m';
    const GREEN = '\x1b[0;32m';
    const NC = '\x1b[0m';
    
    console.log(`${BLUE}[${model}]${NC} 📁 ${GREEN}${currentDir}${NC}${gitBranch}`);
});
```

### 助手函数方法 [​](#助手函数方法)

对于更复杂的 bash 脚本，您可以创建助手函数：

bash

```
#!/bin/bash
# 读取一次 JSON 输入
input=$(cat)

# 常见提取的助手函数
get_model_name() { echo "$input" | jq -r '.model.display_name'; }
get_model_id() { echo "$input" | jq -r '.model.id'; }
get_current_dir() { echo "$input" | jq -r '.workspace.current_dir'; }
get_project_dir() { echo "$input" | jq -r '.workspace.project_dir'; }
get_version() { echo "$input" | jq -r '.version'; }
get_cost() { echo "$input" | jq -r '.cost.total_cost_usd'; }
get_duration() { echo "$input" | jq -r '.cost.total_duration_ms'; }
get_lines_added() { echo "$input" | jq -r '.cost.total_lines_added'; }
get_lines_removed() { echo "$input" | jq -r '.cost.total_lines_removed'; }
get_session_id() { echo "$input" | jq -r '.session_id'; }

# 使用助手函数
MODEL=$(get_model_name)
DIR=$(get_current_dir)
COST=$(get_cost)

# 格式化成本
if [ "$COST" != "null" ] && [ "$COST" != "0" ]; then
    COST_DISPLAY=$(printf " | 💰 \$%.4f" "$COST")
else
    COST_DISPLAY=""
fi

echo "[$MODEL] 📁 ${DIR##*/}$COST_DISPLAY"
```

### 完整的中文示例 [​](#完整的中文示例)

bash

```
#!/bin/bash
# ~/.codebuddy/statusline.sh
# CodeBuddy Code 中文状态行示例

# 从 stdin 读取 JSON 输入
input=$(cat)

# 提取基本信息
MODEL=$(echo "$input" | jq -r '.model.display_name')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir')
DIR_NAME=${CURRENT_DIR##*/}

# ANSI 颜色
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Git 信息
GIT_INFO=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current 2>/dev/null)
    if [ -n "$BRANCH" ]; then
        # 检查是否有未提交的更改
        if ! git diff-index --quiet HEAD -- 2>/dev/null; then
            STATUS="*"
        else
            STATUS=""
        fi
        GIT_INFO=" ${GREEN}分支${NC} ${YELLOW}$BRANCH$STATUS${NC}"
    fi
fi

# 成本信息
COST=$(echo "$input" | jq -r '.cost.total_cost_usd')
COST_INFO=""
if [ "$COST" != "null" ] && [ "$COST" != "0" ]; then
    COST_INFO=$(printf " ${CYAN}成本${NC} \$%.4f" "$COST")
fi

# 输出状态行
echo -e "${BLUE}[$MODEL]${NC} 📁 ${GREEN}$DIR_NAME${NC}$GIT_INFO$COST_INFO"
```

## 高级示例 [​](#高级示例)

### 显示当前时间和会话时长 [​](#显示当前时间和会话时长)

bash

```
#!/bin/bash
input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name')
DIR=$(echo "$input" | jq -r '.workspace.current_dir')
DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms')

# 格式化时长
if [ "$DURATION_MS" != "null" ] && [ "$DURATION_MS" != "0" ]; then
    DURATION_SEC=$((DURATION_MS / 1000))
    DURATION_MIN=$((DURATION_SEC / 60))
    DURATION_SEC=$((DURATION_SEC % 60))
    TIME_INFO=$(printf " | ⏱️ %dm%ds" "$DURATION_MIN" "$DURATION_SEC")
else
    TIME_INFO=""
fi

# 当前时间
CURRENT_TIME=$(date +"%H:%M:%S")

echo "[$MODEL] 📁 ${DIR##*/}$TIME_INFO | 🕐 $CURRENT_TIME"
```

### 根据成本显示不同颜色 [​](#根据成本显示不同颜色)

bash

```
#!/bin/bash
input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name')
DIR=$(echo "$input" | jq -r '.workspace.current_dir')
COST=$(echo "$input" | jq -r '.cost.total_cost_usd')

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 根据成本选择颜色
if [ "$COST" != "null" ]; then
    if (( $(echo "$COST < 0.01" | bc -l) )); then
        COST_COLOR=$GREEN
    elif (( $(echo "$COST < 0.1" | bc -l) )); then
        COST_COLOR=$YELLOW
    else
        COST_COLOR=$RED
    fi
    COST_DISPLAY=$(printf "${COST_COLOR}\$%.4f${NC}" "$COST")
else
    COST_DISPLAY=""
fi

echo -e "[$MODEL] 📁 ${DIR##*/} | 💰 $COST_DISPLAY"
```

## 提示 [​](#提示)

* 保持状态行简洁 - 它应该适合一行
* 使用 emoji（如果您的终端支持）和颜色使信息易于浏览
* 在 Bash 中使用 `jq` 进行 JSON 解析（参见上面的示例）
* 通过使用模拟 JSON 输入手动运行脚本来测试您的脚本：

  bash

  ```
  echo '{"model":{"display_name":"测试"},"workspace":{"current_dir":"/test"}}' | ./statusline.sh
  ```
* 如果需要，考虑缓存昂贵的操作（如 git status)
* 确保脚本输出是有效的 UTF-8,以正确显示中文和 emoji

## 常用 ANSI 颜色代码 [​](#常用-ansi-颜色代码)

bash

```
# 文本颜色
BLACK='\033[0;30m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'

# 粗体颜色
BOLD_BLACK='\033[1;30m'
BOLD_RED='\033[1;31m'
BOLD_GREEN='\033[1;32m'
BOLD_YELLOW='\033[1;33m'
BOLD_BLUE='\033[1;34m'
BOLD_PURPLE='\033[1;35m'
BOLD_CYAN='\033[1;36m'
BOLD_WHITE='\033[1;37m'

# 背景颜色
BG_BLACK='\033[40m'
BG_RED='\033[41m'
BG_GREEN='\033[42m'
BG_YELLOW='\033[43m'
BG_BLUE='\033[44m'
BG_PURPLE='\033[45m'
BG_CYAN='\033[46m'
BG_WHITE='\033[47m'

# 重置
NC='\033[0m' # No Color
```

## 故障排查 [​](#故障排查)

### 状态行不显示 [​](#状态行不显示)

* 检查脚本是否可执行： `chmod +x ~/.codebuddy/statusline.sh`
* 确保脚本输出到 stdout（不是 stderr)
* 验证 JSON 路径正确： `echo '{}' | ~/.codebuddy/statusline.sh`

### 中文或 emoji 显示乱码 [​](#中文或-emoji-显示乱码)

* 确保终端支持 UTF-8 编码
* 检查脚本文件保存为 UTF-8 格式
* 在脚本开头添加： `export LANG=zh_CN.UTF-8`

### 颜色不显示 [​](#颜色不显示)

* 检查终端是否支持 ANSI 颜色
* 确保使用 `echo -e` 来解释转义序列
* 验证颜色代码是否正确

### Git 信息不显示 [​](#git-信息不显示)

* 确保在 git 仓库中运行
* 检查 git 命令是否在 PATH 中
* 验证有权限读取 `.git` 目录

### 脚本执行缓慢 [​](#脚本执行缓慢)

* 缓存昂贵的操作（如 git status)
* 避免在状态行脚本中进行网络请求
* 使用后台进程更新缓存的信息

## 配置示例 [​](#配置示例)

### 用户级配置 [​](#用户级配置)

在 `~/.codebuddy/settings.json` 中：

json

```
{
  "statusLine": {
    "type": "command",
    "command": "~/.codebuddy/statusline.sh",
    "padding": 0
  }
}
```

### 项目级配置 [​](#项目级配置)

在 `.codebuddy/settings.json` 中：

json

```
{
  "statusLine": {
    "type": "command",
    "command": "./.codebuddy/statusline.sh"
  }
}
```

这允许不同项目使用不同的状态行样式。

## 实用工具推荐 [​](#实用工具推荐)

* **jq**: JSON 解析工具，必备
* **bc**：用于浮点数计算（成本比较）
* **git**：显示分支和状态信息
* **date**：显示时间信息

安装：

bash

```
# macOS
brew install jq bc

# Ubuntu/Debian
sudo apt-get install jq bc

# CentOS/RHEL
sudo yum install jq bc
```

## 相关资源 [​](#相关资源)

* [设置配置](./settings) - 了解完整的配置选项
* [Hooks 文档](./hooks) - 了解更多自定义功能
* [斜杠命令](./slash-commands) - 使用 `/statusline` 快速配置

---

*通过自定义状态行，让 CodeBuddy Code 更符合您的工作风格*
