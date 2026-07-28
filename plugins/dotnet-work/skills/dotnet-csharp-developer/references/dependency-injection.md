# 依赖注入最佳实践

## 服务生命周期

| 生命周期 | 说明 | 适用场景 |
|---------|------|---------|
| Transient | 每次请求创建新实例 | 轻量服务、无状态服务 |
| Scoped | 同一请求内共享 | DbContext、业务服务 |
| Singleton | 全局单例 | 配置服务、缓存、日志 |

## 注册示例

```csharp
// Program.cs
builder.Services.AddTransient<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();

// DbContext（推荐 Scoped）
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
```

## 构造函数注入（推荐）

```csharp
public class OrderService : IOrderService
{
    private readonly IOrderRepository _repository;
    private readonly ILogger<OrderService> _logger;
    private readonly IMapper _mapper;

    // 主构造函数（C# 12）
    public OrderService(
        IOrderRepository repository,
        ILogger<OrderService> logger,
        IMapper mapper)
    {
        _repository = repository;
        _logger = logger;
        _mapper = mapper;
    }
}
```

## 选项模式（IOptions<T>）

```csharp
// 定义选项类
public class OrderSettings
{
    public int MaxItemsPerOrder { get; set; } = 100;
    public decimal FreeShippingThreshold { get; set; } = 99.99m;
}

// 注册
builder.Services.Configure<OrderSettings>(
    builder.Configuration.GetSection("OrderSettings"));

// 使用
public class OrderService : IOrderService
{
    private readonly OrderSettings _settings;

    public OrderService(IOptions<OrderSettings> options)
    {
        _settings = options.Value;
    }

    public bool QualifiesForFreeShipping(decimal orderTotal)
    {
        return orderTotal >= _settings.FreeShippingThreshold;
    }
}
```

## 条件注册

```csharp
// 根据环境注册不同实现
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddTransient<IEmailService, FakeEmailService>();
}
else
{
    builder.Services.AddTransient<IEmailService, SmtpEmailService>();
}
```

## 装饰器模式

```csharp
// 使用 Scrutor 库实现装饰器
builder.Services.Decorate<IOrderService, CachedOrderService>();
builder.Services.Decorate<IOrderService, LoggingOrderService>();

// 执行顺序：Logging → Cached → 原始 OrderService
```

## 常见错误

| 错误 | 说明 | 解决方案 |
|------|------|---------|
| 循环依赖 | A 依赖 B，B 依赖 A | 引入中间服务或事件 |
| Captive Dependency | Singleton 依赖 Scoped | 使用 IServiceScopeFactory |
| 过多构造函数参数 | 超过 5-6 个 | 考虑拆分服务或使用外观模式 |
| 手动 new 服务 | `new OrderService()` | 始终通过 DI 容器获取 |
