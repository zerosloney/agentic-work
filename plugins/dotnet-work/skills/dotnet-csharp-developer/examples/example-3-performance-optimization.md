# 示例 3：性能优化案例

## 场景

用户要求："产品列表 API 响应慢，1000+ 产品时超过 2 秒，需要优化到 200ms 以内"。

## 完整执行轨迹

### Step 0: 性能基线测量

```csharp
// 使用 BenchmarkDotNet 建立基线
[MemoryDiagnoser]
public class ProductQueryBenchmarks
{
    private AppDbContext _context = null!;

    [GlobalSetup]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=localhost;Database=ProductDb;...")
            .Options;
        _context = new AppDbContext(options);
    }

    [Benchmark(Baseline = true)]
    public async Task<List<Product>> GetAllProducts()
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Tags)
            .ToListAsync();
    }
}
```

### Step 1: 识别瓶颈

```csharp
// 启用 EF Core 日志查看实际 SQL
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(connectionString);
    options.LogTo(Console.WriteLine, LogLevel.Information);
    options.EnableSensitiveDataLogging();
    options.EnableDetailedErrors();
});

// 常见瓶颈：
// 1. N+1 查询（循环中访问导航属性）
// 2. 全表扫描（缺少索引）
// 3. 加载过多数据（未分页）
// 4. 客户端评估（不支持的 LINQ 翻译）
```

### Step 2: 优化查询

```csharp
// 优化前：N+1 问题
public async Task<List<ProductDto>> GetProductsSlow()
{
    var products = await _context.Products.ToListAsync(); // 查询 1
    return products.Select(p => new ProductDto
    {
        Name = p.Name,
        CategoryName = p.Category.Name,         // N 次查询！
        TagNames = p.Tags.Select(t => t.Name).ToList()  // N 次查询！
    }).ToList();
}

// 优化后：预加载 + 投影
public async Task<List<ProductDto>> GetProductsFast()
{
    return await _context.Products
        .AsNoTracking()                          // 只读查询不需要变更追踪
        .Include(p => p.Category)
        .Include(p => p.Tags)
        .Select(p => new ProductDto              // 投影减少数据传输
        {
            Name = p.Name,
            CategoryName = p.Category.Name,
            TagNames = p.Tags.Select(t => t.Name).ToList()
        })
        .ToListAsync();
}
```

### Step 3: 添加分页

```csharp
// DTOs/PagedResult.cs
public record PagedResult<T>(
    List<T> Items,
    int TotalCount,
    int PageNumber,
    int PageSize)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPrevious => PageNumber > 1;
    public bool HasNext => PageNumber < TotalPages;
}

// Service
public async Task<PagedResult<ProductDto>> GetProductsPaged(
    int pageNumber = 1, int pageSize = 20, CancellationToken ct = default)
{
    var query = _context.Products.AsNoTracking();
    
    var totalCount = await query.CountAsync(ct);
    
    var items = await query
        .OrderBy(p => p.Name)
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .Select(p => new ProductDto { /* ... */ })
        .ToListAsync(ct);
    
    return new PagedResult<ProductDto>(items, totalCount, pageNumber, pageSize);
}
```

### Step 4: 添加数据库索引

```csharp
// 在 DbContext 中添加索引
modelBuilder.Entity<Product>(entity =>
{
    entity.HasIndex(e => e.Name);
    entity.HasIndex(e => e.CategoryId);
    entity.HasIndex(e => e.Price);
    entity.HasIndex(e => new { e.CategoryId, e.Price }); // 复合索引
});

// 生成迁移
dotnet ef migrations add AddProductIndexes
dotnet ef database update
```

### Step 5: 添加缓存

```csharp
// Services/CachedProductService.cs
public class CachedProductService : IProductService
{
    private readonly IProductService _inner;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CachedProductService> _logger;
    
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public CachedProductService(
        IProductService inner, 
        IMemoryCache cache,
        ILogger<CachedProductService> logger)
    {
        _inner = inner;
        _cache = cache;
        _logger = logger;
    }

    public async Task<PagedResult<ProductDto>> GetProductsPaged(
        int pageNumber, int pageSize, CancellationToken ct)
    {
        var cacheKey = $"products:p{pageNumber}:s{pageSize}";
        
        if (_cache.TryGetValue(cacheKey, out PagedResult<ProductDto>? cached) && cached != null)
        {
            _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
            return cached;
        }
        
        var result = await _inner.GetProductsPaged(pageNumber, pageSize, ct);
        
        _cache.Set(cacheKey, result, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheDuration,
            SlidingExpiration = TimeSpan.FromMinutes(2)
        });
        
        return result;
    }
}

// 注册（使用 Scrutor 装饰器）
builder.Services.Decorate<IProductService, CachedProductService>();
```

### Step 6: 异步优化

```csharp
// 优化前：串行执行
public async Task<DashboardDto> GetDashboard()
{
    var totalProducts = await _context.Products.CountAsync();      // 等待
    var totalOrders = await _context.Orders.CountAsync();          // 等待
    var recentOrders = await _context.Orders                       // 等待
        .OrderByDescending(o => o.OrderDate)
        .Take(10)
        .ToListAsync();
    
    return new DashboardDto(totalProducts, totalOrders, recentOrders);
}

// 优化后：并行执行
public async Task<DashboardDto> GetDashboard()
{
    var productsTask = _context.Products.CountAsync();
    var ordersTask = _context.Orders.CountAsync();
    var recentTask = _context.Orders
        .OrderByDescending(o => o.OrderDate)
        .Take(10)
        .ToListAsync();
    
    await Task.WhenAll(productsTask, ordersTask, recentTask);
    
    return new DashboardDto(
        await productsTask, 
        await ordersTask, 
        await recentTask);
}
```

### Step 7: 验证优化效果

```csharp
// 优化后基准测试
[Benchmark]
public async Task<List<ProductDto>> GetProductsOptimized()
{
    return await _context.Products
        .AsNoTracking()
        .Select(p => new ProductDto { Name = p.Name })
        .Take(20)
        .ToListAsync();
}
```

### 验证（对应 SKILL.md Step 4a / 4a.5 / 4b）

```bash
# 4a 结构化构建验证
python plugins/dotnet-work/skills/dotnet-csharp-developer/scripts/build_check.py \
  --project <项目根>.csproj \
  --config Debug \
  --changed-files Services/ProductService.cs

# 4a.5 无独立测试工程 → 跳过；有则 dotnet test --no-build

# 性能专项验证（非 SKILL.md 标准步骤，性能优化场景必做）
dotnet run -c Release --project benchmarks/ProductBenchmarks.csproj  # BenchmarkDotNet

# 4b 静态审查（注意：AsNoTracking / Select 投影 / Take 分页不应被 review 标为问题）
python plugins/dotnet-work/skills/dotnet-csharp-developer/scripts/review_orchestrator.py \
  --target <项目根> --mode quick
```

- 性能优化验证重点：BenchmarkDotNet 报告确认响应时间达标（本例目标 <200ms）+ build/review 全过
- review 若对 AsNoTracking/投影报 warning 属误报（性能优化正当用法），评估后显式标注不修

## 优化前后对比

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 响应时间 | 2000ms+ | ~50ms | 40x |
| 数据库查询 | N+1 次 | 1 次 | 99%↓ |
| 数据传输 | 全表 | 投影+分页 | 95%↓ |
| 内存使用 | 高（全量加载） | 低（分页） | 90%↓ |

## 关键决策点

| 决策 | 选择 | 理由 |
|------|------|------|
| 变更追踪 | AsNoTracking | 只读查询不需要 |
| 缓存策略 | MemoryCache + 5分钟 | 产品数据变化不频繁 |
| 分页大小 | 默认 20 | 平衡性能与用户体验 |
| 索引策略 | 复合索引覆盖常用查询 | 减少全表扫描 |
