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

## 覆盖率目标

| 层级 | 目标覆盖率 | 说明 |
|------|-----------|------|
| 核心业务逻辑 | ≥ 80% | 必须覆盖所有分支 |
| API 控制器 | ≥ 70% | 覆盖正常+异常路径 |
| 数据访问层 | ≥ 60% | 集成测试覆盖 |

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
