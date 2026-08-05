# 测试最佳实践

## 测试框架选择

| 框架 | 适用场景 | 推荐版本 |
|------|---------|---------|
| xUnit | 新项目首选，社区活跃 | 2.4+ |
| NUnit | 迁移项目，属性丰富 | 3.13+ |
| MSTest | 微软生态，企业环境 | 3.0+ |

## xUnit 标准模式

```csharp
public class OrderServiceTests
{
    private readonly Mock<IOrderRepository> _mockRepo;
    private readonly OrderService _sut; // System Under Test

    public OrderServiceTests()
    {
        _mockRepo = new Mock<IOrderRepository>();
        _sut = new OrderService(_mockRepo.Object);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingOrder_ReturnsOrder()
    {
        // Arrange
        var orderId = 1;
        var expected = new Order { Id = orderId, Total = 100m };
        _mockRepo.Setup(r => r.GetByIdAsync(orderId)).ReturnsAsync(expected);

        // Act
        var result = await _sut.GetByIdAsync(orderId);

        // Assert
        result.Should().NotBeNull();
        result.Total.Should().Be(100m);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateOrder_InvalidCustomerId_ThrowsArgumentException(int customerId)
    {
        // Arrange & Act
        Action act = () => _sut.CreateOrder(customerId, new List<OrderItem>());

        // Assert
        act.Should().Throw<ArgumentException>()
           .WithMessage("*customerId*");
    }
}
```

## 测试命名规范

```
{Method}_{Scenario}_{ExpectedResult}

示例：
- GetByIdAsync_ExistingOrder_ReturnsOrder
- GetByIdAsync_OrderNotFound_ReturnsNull
- CreateOrder_InvalidCustomerId_ThrowsArgumentException
```

## Mock 最佳实践

```csharp
// 推荐：使用 Moq + FluentAssertions
var mockRepo = new Mock<IOrderRepository>();
mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>()))
        .ReturnsAsync((int id) => new Order { Id = id });

// 验证调用
mockRepo.Verify(r => r.SaveAsync(It.Is<Order>(o => o.Total > 100)), Times.Once);

// 推荐：使用 NSubstitute（更简洁语法）
var subRepo = Substitute.For<IOrderRepository>();
subRepo.GetByIdAsync(1).Returns(new Order { Id = 1 });
```

## 集成测试

### WebApplicationFactory 基础

```csharp
public class OrderApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrderApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetOrder_ValidId_Returns200()
    {
        var response = await _client.GetAsync("/api/orders/1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

> **Program 类可见性**：.NET 6+ 需在测试项目加 `<InternalsVisibleTo Include="MyApp.Tests" />`（或在 `Program.cs` 加 `public partial class Program { }`），否则 `WebApplicationFactory<Program>` 找不到入口点。

### WebApplicationFactory 进阶：替换服务

```csharp
public class OrderApiTests : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            // 替换真实 DbContext 为测试用（见下 Testcontainers / SQLite）
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseSqlite("DataSource=:memory:"));

            // 替换外部服务（如 HttpClient → mock handler）
            services.RemoveAll<HttpMessageHandler>();
            services.AddSingleton<HttpMessageHandler>(_ => new MockHandler());
        });
    }
}
```

### 数据库：为什么不用 EF Core InMemory 做集成测试

EF Core 官方明确：**InMemory provider 不是关系数据库模拟器**。它忽略事务、约束、外键、SQL 翻译差异。用它做「集成测试」会漏掉真实数据库才暴露的问题（级联删除、唯一约束、类型映射）。

替代方案（按真实度递增）：

```csharp
// 方案 A：SQLite in-memory（轻量，关系语义，无 Docker 依赖）
services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite("DataSource=file::memory:?cache=shared"));  // 需保连接打开

// 方案 B：Testcontainers（真实 SQL Server/PostgreSQL，Docker 容器，最贴近生产）
// NuGet: Testcontainers.MsSql 或 Testcontainers.PostgreSql
public class DbFixture : IAsyncLifetime
{
    public readonly MsSqlContainer Container = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();

    public async Task InitializeAsync() => await Container.StartAsync();
    public Task DisposeAsync() => Container.DisposeAsync().AsTask();
}

public class OrderRepoTests : IClassFixture<DbFixture>, IAsyncLifetime
{
    private readonly AppDbContext _db;
    public OrderRepoTests(DbFixture fixture)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(fixture.Container.GetConnectionString())
            .Options;
        _db = new(options);
    }
    public async Task InitializeAsync() => await _db.Database.EnsureCreatedAsync();
    public Task DisposeAsync() => _db.DisposeAsync().AsTask();
}
```

- **单元测试**（服务逻辑，无 DB 依赖）→ Mock repository，或 SQLite in-memory
- **集成测试**（仓储 + 真实 SQL 翻译）→ Testcontainers（CI 有 Docker）或 SQLite（本地快跑）
- **契约测试**（API 端到端）→ WebApplicationFactory + Testcontainers

## 覆盖率

### 目标

| 层级 | 目标覆盖率 | 说明 |
|------|-----------|------|
| 核心业务逻辑 | ≥ 80% | 必须覆盖所有分支 |
| API 控制器 | ≥ 70% | 覆盖正常+异常路径 |
| 数据访问层 | ≥ 60% | 集成测试覆盖 |

### 工具链：Coverlet + ReportGenerator

```bash
# 收集覆盖率（Coverlet，通过 VSTest 集成，无需改测试代码）
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage

# 生成 HTML 报告（ReportGenerator）
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:"./coverage/**/coverage.cobertura.xml" \
  -targetdir:"./coverage-report" -reporttypes:Html

# 打开 ./coverage-report/index.html 查看行级覆盖
```

CI 集成（GitHub Actions）：`coverage.cobertura.xml` 上传为 artifact，配合 `MinimumCoverage` threshold 门禁（如 `< 70% 失败`）。

## BenchmarkDotNet 性能基准

```csharp
[MemoryDiagnoser]
public class StringConcatBenchmarks
{
    [Benchmark(Baseline = true)]
    public string StringConcat()
    {
        var result = "";
        for (int i = 0; i < 100; i++)
            result += i.ToString();
        return result;
    }

    [Benchmark]
    public string StringBuilder()
    {
        var sb = new StringBuilder();
        for (int i = 0; i < 100; i++)
            sb.Append(i);
        return sb.ToString();
    }
}
```
