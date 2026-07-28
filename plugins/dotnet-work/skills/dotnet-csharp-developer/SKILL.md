---
name: dotnet-csharp-developer
description: "用 .NET 8+、ASP.NET Core API、Blazor、Entity Framework Core 编写现代 C#。Clean Architecture 分层、gRPC/SignalR 实时通信、微服务 (Dapr/Orleans/Service Fabric)。优化 .NET 应用，实现企业级模式，确保全面测试。在构建 C# 应用、重构、性能优化或复杂 .NET 解决方案时使用。"
when_to_use: |
  用户需要构建 ASP.NET Core API、实现 EF Core 数据访问、创建 Blazor 应用、性能优化、C# 重构时使用。
  触发词："C#"、".NET"、"ASP.NET"、"Blazor"、"EF Core"、"Web API"、"实体框架"、"性能优化"。
license: MIT
metadata:
  author: master0071
  version: 1.0.0
  category: development
---

# C# / .NET 开发者

## 核心理念

**现代 C# 优先**：默认 .NET 8 LTS + C# 12（主构造函数、文件范围命名空间、record、集合表达式、可空引用类型）。专注高性能 Web API、云原生方案、整洁架构。先确认项目实际 TargetFramework，再决定可用语言特性——不假设 .NET 9 / C# 13。

## Constraints（红线）

越界即停，停下来问用户。

1. **先确认目标框架**：读 `.csproj` 的 `<TargetFramework>`，按项目实际版本决定可用 C# 特性。不臆造版本，不默认 net8.0。
2. **可空引用类型强制开启**：所有项目 `<Nullable>enable</Nullable>`。无正当理由（如迁移遗留代码）不关闭，关闭时显式标注范围与原因。
3. **异步 I/O 不可阻塞**：所有 I/O 用 `async/await`，禁止 `.Result` / `.Wait()` / `GetAwaiter().GetResult()`。异步方法必须接受 `CancellationToken`。
4. **分层不可越级**：`API → Application → Domain ← Infrastructure`。Domain 不依赖任何外层；API 不直调 Infrastructure；EF Core 实体不直接出现在 API 响应（用 DTO 映射）。
5. **错误处理用 Result 模式**：业务错误用 `Result<T>` / `OneOf<T>`，不用异常做控制流。全局异常中间件兜底未处理异常。
6. **依赖注入不可 new**：所有服务经 DI 容器获取，构造函数注入。配置用 `IOptions<T>` 强类型，不用字符串 key。
7. **不臆造依赖**：所需 NuGet 包/项目引用不存在时停下来问用户，不自动 `dotnet add package`（除非用户明确授权）。.csproj 引用变更需用户确认。

## 快速查找

> 按需加载，不要全量读。标准任务只加载 L1-core（见 §References）。

| 需要查 | 加载 |
|--------|------|
| Step 4a 结构化构建验证 | `python scripts/build_check.py --project <.csproj>` |
| Step 4b 静态审查 + triage | `python scripts/review_orchestrator.py --target <项目根> --mode quick` |
| C# 12 语法（record、模式匹配、主构造函数、集合表达式） | `references/modern-csharp.md` |
| ASP.NET Core Minimal API / Controller / Program.cs / 中间件管道 | `references/aspnet-core.md` |
| EF Core DbContext / 实体配置 / 迁移 / 查询模式 | `references/entity-framework.md` |
| DI 生命周期 / 注册方式 / IOptions | `references/dependency-injection.md` |
| Result 模式 / 全局异常 / FluentValidation | `references/error-handling.md` |
| Blazor 组件 / WASM / 互操作 | `references/blazor.md`（用户说 Blazor 时） |
| CQRS + MediatR / Pipeline Behavior | `references/cqrs-mediatr.md`（用户说 CQRS 时） |
| JWT / OAuth2 / Identity / 策略授权 | `references/authentication-authorization.md`（用户说认证时） |
| Serilog 结构化日志 / Sink / Enricher | `references/logging-with-serilog.md`（用户说日志时） |
| 性能优化（Span<T>、async、池化、GC） | `references/performance.md`（L2，用户主动要求） |
| 单元测试 / 集成测试 / Mock / BenchmarkDotNet | `references/testing.md`（L2，用户主动要求） |
| 自定义中间件 | `references/middleware-patterns.md`（L2） |
| BackgroundService / 定时任务 / 队列 | `references/background-tasks.md`（L2） |
| Docker / GitHub Actions / Azure 部署 | `references/deployment-and-ci.md`（L2） |
| Clean Architecture / CQRS / MediatR Pipeline | `references/clean-architecture.md`（L2） |
| gRPC 双向流 / SignalR 实时推送 | `references/grpc-signalr.md`（L2） |
| 微服务 (Dapr/Orleans/Service Fabric) / Saga | `references/microservices.md`（L2） |

## 架构分层（统一）

```
API (Endpoints/Controllers)  →  Application (Service/Handler)  →  Domain (Entity/ValueObject)
                                       ↓
                            Infrastructure (DbContext/Repository/HttpClient)
```

- **API**：Minimal API 或 Controller，只做请求解析 → 调 Application → 返回 DTO。不含业务逻辑。
- **Application**：业务用例编排（Service / Command Handler），调 Domain + Infrastructure。
- **Domain**：实体、值对象、领域事件。无外部依赖（不引用 EF Core / ASP.NET Core）。
- **Infrastructure**：`DbContext`、Repository 实现、外部 HTTP 客户端。实现 Application 层接口。

> 简单项目可合并 Application + Infrastructure 到单项目；分层不可省略 Domain。详细规范见 `references/aspnet-core.md`。

## Procedure

### Step 0. 项目初始化与评估

1. **确认目标框架** — 读 `.csproj` 的 `<TargetFramework>`，确认 .NET 版本与可用 C# 语言版本
2. **评估现有架构** — 审查项目结构（项目数、引用关系）、NuGet 包、`Program.cs` 注册方式
3. **识别技术栈** — EF Core 版本、认证方案、日志框架、序列化配置
4. **加载 L1-core** — 见 §References，标准任务必读 5 个文件

### Step 0a. 最小输入门

> 缺少 1/2/3 时先问用户；**缺少 4（项目根）时阻断，不进入 Step 1**——无项目根则 `dotnet build` 无法验证，交付物不可验证。

| # | 确认项 | 选项/示例 | 获取方式 |
|---|--------|----------|----------|
| 1 | **业务功能** | "产品管理 CRUD API" / "订单查询服务" | 用户描述 |
| 2 | **实体 / 字段来源** | 现有 Entity / 表 schema / 用户字段清单 | 现有代码、DB、用户提供 |
| 3 | **目标框架** | net8.0 / net6.0（从 .csproj 读，不臆造） | 读 `.csproj` |
| 4 | **项目根 + 目标目录** | `.sln` / `.csproj` 所在目录 + 写入路径 | 用户指定；无法推断时问 |

### Step 1. 需求分析与设计

1. **提取业务实体** — 从需求识别核心实体、关系（一对多/多对多）、不变量
2. **设计领域模型** — 创建实体类、值对象、枚举、DTO（用 record + 集合表达式）
3. **规划 API 契约** — 定义端点路径、HTTP 方法、请求/响应 DTO、状态码
4. **选择设计模式** — 按场景选 Repository / CQRS / Strategy；简单 CRUD 不强加模式

### Step 2. 数据层实现

1. **配置 DbContext** — 注册实体、配置关系、设置连接字符串（从 `IConfiguration` 读，不硬编码）
2. **实体配置** — Fluent API 优先（`IEntityTypeConfiguration<T>`），Data Annotations 次之
3. **Repository** — 定义接口在 Application 层，实现在 Infrastructure 层（如需）
4. **生成迁移** — `dotnet ef migrations add <Name>` → `dotnet ef database update`

> EF Core 完整模式见 `references/entity-framework.md`。

### Step 3. 业务逻辑 + API 层

1. **Application 服务** — 实现业务逻辑、输入验证（FluentValidation）、调用 Domain + Infrastructure
2. **配置 DI** — 注册服务生命周期（Scoped 默认；Singleton 无状态；Transient 轻量无状态）
3. **API 端点** — Minimal API 或 Controller；输入绑定 → 调 Application → 返回 DTO
4. **中间件** — 全局异常处理、请求日志、Swagger / OpenAPI、健康检查 `/health`

> 完整模式见 `references/aspnet-core.md` + `references/dependency-injection.md` + `references/error-handling.md`。

### Step 4. 自审与验证

```
┌─────────────── 内层：自审（自动）───────────────┐
│  4a  build_check.py 构建验证（结构化输出）    │
│   ↓                                            │
│  4b  review_orchestrator.py 静态审查 + triage  │
│   ↓                                            │
│  4c  按 agent_next_action 决策 → 修复 → 重审      │
└────────────────────────────────────────────────┘
                      ↓ 全过
┌─────────────── 外层：用户反馈 ──────────────────┐
│  5   交付 → 用户反馈 → 回 Step 改 → 重跑 4a/4b   │
└────────────────────────────────────────────────┘
```

#### 4a. 结构化构建验证

```bash
python skill://dotnet-csharp-developer/scripts/build_check.py \
  --project <项目根>.csproj \
  --config Debug \
  --changed-files <本次修改的文件列表>
```

- 输出 JSON：`pass`, `errors`, `warnings`, `new_errors`, `pre_existing_errors`
- 必须零 error（`exit_code 0` 或 `2` 仅 warning 可接受）
- `--changed-files` 启用新旧错误区分：只修复 `new_errors`；`pre_existing_errors` 交付时列出
- 失败时只修复本次生成/修改导致的错误；预先存在的错误交付时明确列出

#### 4b. 静态审查 + triage 解读

构建通过后，调用 **review_orchestrator.py**（封装 dotnet-code-review skill）：

```bash
python skill://dotnet-csharp-developer/scripts/review_orchestrator.py \
  --target <项目根> \
  --mode quick
```

- `quick` 模式：compact + top 10，~200-500 token 当量
- `full` 模式：json + top 20 + context bundles，需要深度分析时用
- 输出在 review.py 原始 JSON 基础上注入 `csharp_developer_triage`：
  - `must_fix`：error 级问题（必须修复）
  - `should_fix`：warning 级问题（建议修复）
  - `sec_errors_present`：SEC\* error 标志（强制修复门）
  - `agent_next_action`：直接驱动 Step 4c 决策
- 详细审查协议、triage 解读、修复建议规则见 dotnet-code-review SKILL.md §2.2 / §4.1

> 若 dotnet-code-review skill 未启用，review_orchestrator.py 返回 `exit 3` + `agent_next_action: "escalate"`，跳过此步，交付时在「未覆盖项」中说明"未做静态审查"。

#### 4c. 按 agent_next_action 决策

| agent_next_action | Agent 行为 |
|-------------------|-----------|
| `fix_sec_errors` | 有 SEC\* error → Step 2/3 修安全问题 → 重跑 4a+4b |
| `fix_errors` | 有非 SEC error → Step 2/3 修代码 → 重跑 4a+4b |
| `fix_warnings` | 仅 warning → 评估后修或显式标注 → 可进 Step 5 |
| `deliver` | 无 error → 进 Step 5 交付 |
| `escalate` | review.py 不可用 → 跳过，交付时说明 |

- 安全类（SEC\*）问题**强制修复**——交付前不可留 error 级 SEC
- 修正后**重跑 4a + 4b**，避免引入新问题

### Step 5. 用户反馈循环

- **5a** 自审 + review 全过后交付：文件清单 + 关键架构决策 + build/review 命令 + 未覆盖项
- **5b** 用户反馈 → 识别影响环节 → 回对应 Step 改 → 重跑 4a/4b → 再次交付
- **终止** ✅ build 通过 + review 无 error + 用户确认；⏸ 用户说「先这样」

## dotnet CLI 速查

| 场景 | 命令 |
|------|------|
| 创建 Web API | `dotnet new webapi -n MyApi --use-controllers` |
| 创建类库 | `dotnet new classlib -n MyLibrary` |
| 创建 xUnit 测试 | `dotnet new xunit -n MyTests` |
| 添加 NuGet 包 | `dotnet add package PackageName` |
| 添加项目引用 | `dotnet add reference ../OtherProject` |
| 还原依赖 | `dotnet restore` |
| 构建 | `dotnet build --configuration Release` |
| 运行 | `dotnet run --environment Development` |
| 测试 | `dotnet test --collect:"XPlat Code Coverage"` |
| EF 迁移 | `dotnet ef migrations add MigrationName` |
| EF 更新数据库 | `dotnet ef database update` |
| 发布 | `dotnet publish -c Release -o ./publish` |
| 清理 | `dotnet clean` |
| 格式化 | `dotnet format` |
| 代码分析 | `dotnet build /p:TreatWarningsAsErrors=true` |

## References

> 按需加载，不要全量读。标准任务只需 **L1-core**（5 个核心文件，每次加载）+ **L1-conditional**（按场景触发，0–4 个文件）+ **L2**（高级，用户主动要求时才读）。

### L1-core — 核心必读（每个任务都要加载）

| 文件 | 用途 | 加载时机 |
|------|------|---------|
| `references/modern-csharp.md` | C# 12 语法：record、模式匹配、主构造函数、集合表达式、可空类型、原始字符串字面量 | 任何代码生成任务的语法基线 |
| `references/aspnet-core.md` | Minimal API / Controller、Program.cs 结构、中间件管道、端点映射、路由 | 任何 ASP.NET Core Web 项目 |
| `references/entity-framework.md` | DbContext 配置、Fluent API 实体配置、迁移、查询模式、并发 | 任何涉及数据访问的任务 |
| `references/dependency-injection.md` | DI 生命周期（Transient/Scoped/Singleton）、注册方式、构造函数注入、IOptions | 任何需要服务注册的任务 |
| `references/error-handling.md` | Result 模式、全局异常中间件、ProblemDetails、FluentValidation、Polly 重试熔断 | 任何业务逻辑实现 |

### L1-conditional — 按场景加载（特定条件触发才读）

| 文件 | 触发条件 |
|------|---------|
| `references/blazor.md` | 用户说 "Blazor" / "WASM" / "交互式组件" / Razor 组件 |
| `references/cqrs-mediatr.md` | 用户说 "CQRS" / "MediatR" / "命令查询分离" / "Pipeline Behavior" |
| `references/authentication-authorization.md` | 用户说 "JWT" / "登录" / "认证" / "授权" / "Token" / "Identity" |
| `references/logging-with-serilog.md` | 用户说 "日志" / "Serilog" / "结构化日志" / "日志配置" |

### L2 — 高级功能手册（按需加载，标准流程不读）

> ⚠️ **以下文件是高级/专门化场景，标准开发流程不加载。仅当用户主动要求对应功能时才读取。**

| 文件 | 触发条件 |
|------|---------|
| `references/performance.md` | 用户要求性能优化 / 高并发 / Span<T> / 减 GC / 内存调优 / BenchmarkDotNet |
| `references/testing.md` | 用户要求写测试 / xUnit / NUnit / Mock / 集成测试 / 覆盖率 |
| `references/middleware-patterns.md` | 用户要求自定义中间件 / 管道顺序 / 工厂式中间件 |
| `references/background-tasks.md` | 用户要求后台任务 / 定时任务 / BackgroundService / 队列处理 / Quartz.NET |
| `references/deployment-and-ci.md` | 用户要求部署 / Docker / CI/CD / GitHub Actions / Azure / 发布 |
| `references/clean-architecture.md` | 用户要求 Clean Architecture / 分层架构 / 领域驱动 / DDD / MediatR Pipeline / 领域事件 |
| `references/grpc-signalr.md` | 用户要求 gRPC / SignalR / 实时通信 / WebSocket / 双向流 / 服务端推送 |
| `references/microservices.md` | 用户要求微服务 / Dapr / Orleans / Service Fabric / Saga / 分布式事务 / OpenTelemetry |

## Examples

> 遇到类似任务时，按场景只读一个最接近的样例。

| 用户原话 / 场景 | 读取 |
|----------------|------|
| "帮我创建一个产品管理 API，支持 CRUD，用 EF Core + SQL Server" / 从零搭 API | `examples/example-1-web-api-from-scratch.md` |
| "现有项目要加订单功能，含 Order/OrderItem，关联现有 Product" / 新增实体 + 迁移 | `examples/example-2-ef-core-migration.md` |
| "产品列表 API 慢，1000+ 产品 >2 秒，优化到 200ms" / 性能优化 | `examples/example-3-performance-optimization.md` |

## Failure handling

| 错误 | Agent 行为 |
|------|-----------|
| `build_check.py` exit 3（fatal） | 按输出的 `fatal` 字段处理：无 .csproj 问用户路径；dotnet 缺失告知安装 |
| `build_check.py` exit 2（build error） | 按 `errors` 列表修复；`new_errors` 必须修，`pre_existing_errors` 交付时列出 |
| `review_orchestrator.py` exit 3 | review.py 不可用，跳过 Step 4b，交付时说明 |
| `review_orchestrator.py` exit 1 + `sec_errors_present: true` | 必须修复 SEC\* error（见 Step 4c），不可跳过 |
| `review_orchestrator.py` exit 1（其他 error） | 按 `must_fix` 列表修复 → 重跑 4a+4b |
| "Unable to resolve project" / "No project was found" | 问用户项目根路径，cd 到含 `.csproj` 的目录 |
| "The project file could not be loaded" | 检查 `.csproj` XML 语法；列出错误行 |
| "There are no frameworks specified" | 在 `.csproj` 添加 `<TargetFramework>`（版本问用户） |
| "Unable to find package" | 确认包名拼写、NuGet 源配置；问用户是否添加私有源 |
| EF Core "No migrations configuration" | 运行 `dotnet ef migrations add Initial`；确认已引用 `Microsoft.EntityFrameworkCore.Design` |
| "Unable to create an object of type" | DbContext 缺无参构造或 `IDesignTimeDbContextFactory`；添加工厂 |
| Build warning as error | 修复警告，或经用户同意后 `<TreatWarningsAsErrors>false</TreatWarningsAsErrors>` |
| 用户未指定 TargetFramework 且无 .csproj | **停下来问**，不默认 net8.0；裸脚本/工具代码用 `console` 模板 |
| 需要 NuGet 包但项目未引用 | **停下来问**用户是否授权 `dotnet add package`（Constraint #7） |

## 不要用于

- 任务与 C# 或 .NET 无关（用通用编程 skill）
- **WinForms + DevExpress 业务窗体生成** → 用 `winforms-dev-flow` skill（该场景有专用三层架构 + Designer 模板）
- **数据库连接探索 / SQL 查询 / 表结构查看** → 用 `database-explorer` skill（本 skill 只在 EF Core 代码层用其结果）
- **代码质量审查作为主诉求** → 用 `dotnet-code-review` skill（本 skill 在 Step 4b 调用它，但不替代审查主诉求）
- 需要 C/C++、Java、Go 等非 .NET 语言
