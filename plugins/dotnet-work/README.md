# dotnet-work

.NET 开发技能集 — 4 个 skill 覆盖 C# 编码、代码审查、数据库探索、WinForms 窗体开发。基于 .NET 8+ / ASP.NET Core / EF Core / WinForms + DevExpress。

## Skills

| Skill | 定位 | 何时用 |
|-------|------|--------|
| `dotnet-csharp-developer` | 写现代 C#（ASP.NET Core API / Blazor / EF Core / gRPC / 微服务） | "写 C# 代码/API/服务"、"重构"、"性能优化" |
| `dotnet-code-review` | C#/.NET 代码审查（Roslyn AST+语义 + dotnet build/format + 离线 CVE 库） | "审查/review/安全扫描/质量" |
| `database-explorer` | 数据库探索（SQL Server/MySQL/PostgreSQL/KingbaseES/SQLite） | "连数据库/查表/SQL/导出" |
| `winforms-dev-flow` | WinForms + DevExpress 业务窗体生成（.NET Framework 4.7.2） | "WinForms/DevExpress/窗体" |

完整路由决策树 + 跨 skill 协作图见本 README 下文（『跨 skill 协作』节）。

## dotnet-csharp-developer

构建 ASP.NET Core API、EF Core 数据访问、Blazor 应用、gRPC/SignalR 实时通信、微服务（Dapr/Orleans/Service Fabric）。遵循 Clean Architecture 分层。配套 `scripts/build_check`（构建验证）+ `scripts/review_orchestrator`（审查编排）。

## dotnet-code-review

基于 Roslyn 的静态分析：**6 维度**覆盖 — 安全（OWASP Top 10 / CWE 映射）、性能、可维护性、可测试性、最佳实践/可靠性、架构。**175 条自研规则**（AST 153 + 语义 22）+ NetAnalyzers CAxxxx（~500 条）动态注入。

两阶段协议：
1. **Triage** — 全量扫描，输出候选问题
2. **Verify** — 逐条复核，降级误报（参考 `references/review-verification-protocol.md`）

Agent 误报反馈闭环（`.dotnet-review/agent-verdicts.json`）+ SARIF 输出（GitHub Code Scanning 兼容）+ 9 条规则支持自动修复。

分析器结构（`scripts/review/analyzer/`）：
- `fetcher` — 拉取 diff/全量文件
- `triage` — 初筛
- `reporter` — 输出报告

## database-explorer

连接 5 种数据库（SQL Server / MySQL / PostgreSQL / KingbaseES / SQLite），支持结构探索、查询、CRUD SQL 生成、CSV 导出。

**安全机制**：
- 写操作（INSERT/UPDATE/DELETE/DROP/TRUNCATE）自动触发用户确认
- 密码经 keyring 存操作系统密钥链（Windows Credential Locker / macOS Keychain / Linux SecretService）
- 多语句 SQL 注入自动拦截
- 错误信息自动脱敏

## winforms-dev-flow

WinForms + DevExpress 业务窗体生成，面向 .NET Framework 4.7.2。支持创建（列表窗体、主从结构、编辑弹窗、查询/增删改查界面）与维护扩展（加列、导出按钮、泛型化改造、ORM 迁移、ucl 抽取）。

## 跨 skill 协作

已内建调用点（非用户手动切换）：
- `dotnet-csharp-developer` Step 4b → 调 `dotnet-code-review` 做自审
- `winforms-dev-flow` Step 0a/2 → 调 `database-explorer` 查表 schema 生成数据绑定

## 目录结构

```
dotnet-work/
├── skills/
│   ├── database-explorer/        # DB 连接/查询/导出
│   ├── dotnet-code-review/       # Roslyn 审查引擎 + references/
│   ├── dotnet-csharp-developer/  # C# 编码 + references/
│   └── winforms-dev-flow/        # WinForms + DevExpress
├── .codebuddy-plugin/plugin.json # version 权威源 (1.0.0)
├── .zcode-plugin/plugin.json
├── .trae-plugin/plugin.json
├── .qoder-plugin/plugin.json
└── .qwen-plugin/qwen-extension.json
```

## 平台支持

ZCode + CodeBuddy + Trae + Qoder + Qwen Code 五平台全覆盖。

## 版本

`1.0.0` — 声明稳定（4 skill 完整 + 跨 skill 协作打通）。版本以 `.codebuddy-plugin/plugin.json` 为权威源，`node scripts/bump-version.js --plugin dotnet-work --check` 校验同步。
