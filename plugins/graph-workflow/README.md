# graph-workflow

Loop Engineering + Graph Engineering 双档位闭环:外层脚本管硬约束(MAX_ITER / BUDGET_S / STALL_LIMIT / VERIFY_CMD),内层三角色(executor / reviewer / fixer)协作完成任务。

适用于**无人值守**的长任务:你给目标和达成标准,脚本驱动 agent 反复执行→审查→修复直到收敛或熔断。

## 两个入口

| 命令 | 档位 | 拓扑 | 状态 version |
|------|------|------|--------------|
| `/loop-task` | Loop Engineering | 固定 `exec→review→fix↺` | `1` |
| `/graph-task` | Graph Engineering(档位 B) | 声明式图(`--graph` 文件,默认图等价 loop-task) | `2` |

选哪个:
- 流程固定(执行→审查→修复)→ `/loop-task`
- 需要自定义节点拓扑(多分支 / 条件路由 / 串行多阶段)→ `/graph-task` + `--graph graph.json`

## 三角色协作

```
        ┌─────────── loop-task.sh / graph-run.sh (外层硬约束) ───────────┐
        │  每轮 spawn 编排者 → 查硬约束 → 决定下一轮                       │
        └───────────────────────────┬───────────────────────────────────┘
                                    ▼
                         orchestrator / graph-orchestrator
                         (决策层,只读业务代码,委派子代理)
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
          executor              reviewer                fixer
        (执行/写代码)        (验证+语义审查)         (最小必要修复)
              │                     │                     │
              └──► next_action ─────►│                     │
                                    │ (fail/changes)      │
                                    └────────────────────►│
                                                          │ (修完回编排者)
                                                          └─► reviewer 复审
```

- **executor / fixer**:有文件读写 + shell 权限,但受**命令白名单**约束(见安全红线)。
- **reviewer**:只读业务代码,跑测试/编译/静态检查 + 语义审查,判 `status` / `goal_met` / `review`。
- **orchestrator / graph-orchestrator**:只读,不写业务代码,只拆步骤 + 委派 + 写状态。

## 硬约束参数(环境变量覆盖)

| 变量 | 默认 | 作用 |
|------|------|------|
| `MAX_ITER` | 20 | 最大轮次 |
| `BUDGET_S` | 3600 | 总预算秒数 |
| `STALL_LIMIT` | 3 | 连续无进展轮数,触发停滞熔断 |
| `VERIFY_CMD` | (空) | 客观验证命令;非空时 reviewer 判达成后必跑此命令,失败则驳回 |
| `VERIFY_TIMEOUT` | 300 | VERIFY_CMD 超时秒数 |
| `MOCK` | 0 | =1 用 mock 推进(测试用,不调真实 agent) |

示例:
```bash
MAX_ITER=5 BUDGET_S=120 VERIFY_CMD="npm test" bash scripts/loop-task.sh "目标" "达成标准"
```

## 状态文件

`scripts/loop-state/task-<timestamp>.json`,schema 见 `scripts/state-schema.json`。

关键字段:
- `version`: `1`(loop-task)/ `2`(graph-run),跨档位不兼容(防漂移)
- `iteration` / `phase` / `status` / `goal_met` / `review`:每轮推进
- `progress_delta`: `0~1`,本轮真实进展,Anti-Lazy 熔断依据
- `history[]`:跨轮上下文(最近 10 条),新进程靠它接续
- `graph` / `node_states` / `current_node`:仅 version=2

复盘:`/loop-review` 或 `bash scripts/loop-review.sh`。

## 安全红线(无人值守循环)

executor / fixer 的 bash 命令受白名单约束:

- ✅ 允许:文件查看/文本处理、git 只读操作、包管理与构建测试(`npm`/`pytest`/`tsc`/`cargo`/`go`/`make` 等)
- ❌ 禁止通用解释器裸调用(`node`/`python -e`):能执行任意代码,架空白名单。要跑脚本请写文件后用带入口的工具
- ❌ 禁止:不可逆删除(`rm -rf`)、远程推送/历史改写/清工作区(`git push`/`reset --hard`/`clean -x`)、网络下载后直接执行、提权(`sudo`)、危险磁盘操作(`dd`/`mkfs`)
- 需白名单外命令才能推进 → 设 `status:"blocked"` + `blocker`,交人工

## 目录结构

```
graph-workflow/
├── commands/          # /loop-task /graph-task /loop-review
├── zcode/agents/      # 5 角色(ZCode 嵌套 permission frontmatter)
├── codebuddy/agents/  # 5 角色(CodeBuddy flat permissionMode)
├── hooks/             # validate-state-write.js(PreToolUse,校验状态写入)
└── scripts/
    ├── loop-task.sh       # Loop 入口 + 外层循环(version=1)
    ├── graph-run.sh       # Graph 入口 + 外层图遍历(version=2)
    ├── loop-helpers.sh    # 共享硬约束 + VCS 抽象
    ├── loop-review.sh     # 复盘汇总
    ├── statectl.sh        # 状态读写助手(graph-next 边路由;写命令持文件锁+写前 enum 校验;create 默认拒绝覆盖既有 state,重建需 --force)
    └── state-schema.json  # 状态文件 schema
```

## 平台支持

| 平台 | 支持 |
|------|------|
| ZCode | ✅ |
| CodeBuddy | ✅ |
| Trae | ❌(install 脚本未登记,见 REVIEW G-002) |
| Qoder | ❌(同上) |
| Qwen Code | ❌(同上) |

## 已知缺口

详见 `REVIEW-<date>.md`。主要:三平台支持缺失、marketplace 未登记、AGENTS.md 未登记。
