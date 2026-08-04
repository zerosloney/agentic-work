# 示例 1：从零搭建 ASP.NET Core Web API

## 场景

用户要求："帮我创建一个产品管理 API，支持 CRUD 操作，使用 EF Core + SQL Server"。

## 完整执行轨迹

### Step 0: 项目初始化

```bash
# 创建项目
dotnet new webapi -n ProductApi --use-controllers
cd ProductApi

# 添加 NuGet 包
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package FluentValidation.DependencyInjectionExtensions
dotnet add package Serilog.AspNetCore
dotnet add package Swashbuckle.AspNetCore
```

### Step 1: 创建领域模型

```csharp
// Domain/Product.cs
namespace ProductApi.Domain;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

### Step 2: 创建 DTO

```csharp
// DTOs/ProductDto.cs
namespace ProductApi.DTOs;

public record CreateProductRequest(
    string Name,
    string? Description,
    decimal Price,
    int StockQuantity
);

public record UpdateProductRequest(
    string Name,
    string? Description,
    decimal Price,
    int StockQuantity
);

public record ProductResponse(
    int Id,
    string Name,
    string? Description,
    decimal Price,
    int StockQuantity,
    DateTime CreatedAt
);
```

### Step 3: 配置 DbContext

```csharp
// Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace ProductApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Price).HasPrecision(18, 2);
            entity.HasIndex(e => e.Name);
        });
    }
}
```

### Step 4: 实现验证器

```csharp
// Validators/ProductValidator.cs
using FluentValidation;

namespace ProductApi.Validators;

// Create 与 Update 的字段（Name/Price/StockQuantity）校验逻辑一致，共用同一组规则
public class ProductValidator : AbstractValidator<CreateProductRequest>
{
    public ProductValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0);
    }
}

public class UpdateProductValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0);
    }
}
```

### Step 5: 实现服务层

```csharp
// Services/ProductService.cs
namespace ProductApi.Services;

public interface IProductService
{
    Task<ProductResponse> CreateAsync(CreateProductRequest request, CancellationToken ct);
    Task<ProductResponse?> GetByIdAsync(int id, CancellationToken ct);
    Task<List<ProductResponse>> GetAllAsync(CancellationToken ct);
    Task<ProductResponse?> UpdateAsync(int id, UpdateProductRequest request, CancellationToken ct);
    Task<bool> DeleteAsync(int id, CancellationToken ct);
}

public class ProductService : IProductService
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductService> _logger;

    public ProductService(AppDbContext context, ILogger<ProductService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ProductResponse> CreateAsync(CreateProductRequest request, CancellationToken ct)
    {
        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            StockQuantity = request.StockQuantity
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Created product {ProductId}", product.Id);
        return MapToResponse(product);
    }

    public async Task<ProductResponse?> GetByIdAsync(int id, CancellationToken ct)
    {
        var product = await _context.Products.FindAsync(new object[] { id }, ct);
        return product == null ? null : MapToResponse(product);
    }

    public async Task<List<ProductResponse>> GetAllAsync(CancellationToken ct)
    {
        return await _context.Products
            .OrderBy(p => p.Name)
            .Select(p => MapToResponse(p))
            .ToListAsync(ct);
    }

    public async Task<ProductResponse?> UpdateAsync(int id, UpdateProductRequest request, CancellationToken ct)
    {
        var product = await _context.Products.FindAsync(new object[] { id }, ct);
        if (product == null) return null;

        product.Name = request.Name;
        product.Description = request.Description;
        product.Price = request.Price;
        product.StockQuantity = request.StockQuantity;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return MapToResponse(product);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct)
    {
        var product = await _context.Products.FindAsync(new object[] { id }, ct);
        if (product == null) return false;

        _context.Products.Remove(product);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    private static ProductResponse MapToResponse(Product p) => new(
        p.Id, p.Name, p.Description, p.Price, p.StockQuantity, p.CreatedAt);
}
```

### Step 6: 创建控制器

```csharp
// Controllers/ProductsController.cs
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace ProductApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _service;
    private readonly IValidator<CreateProductRequest> _createValidator;
    private readonly IValidator<UpdateProductRequest> _updateValidator;

    public ProductsController(
        IProductService service,
        IValidator<CreateProductRequest> createValidator,
        IValidator<UpdateProductRequest> updateValidator)
    {
        _service = service;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpPost]
    public async Task<ActionResult<ProductResponse>> Create(
        CreateProductRequest request, CancellationToken ct)
    {
        var validation = await _createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(validation.Errors);

        var result = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductResponse>> Get(int id, CancellationToken ct)
    {
        var result = await _service.GetByIdAsync(id, ct);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductResponse>>> GetAll(CancellationToken ct)
    {
        return Ok(await _service.GetAllAsync(ct));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductResponse>> Update(
        int id, UpdateProductRequest request, CancellationToken ct)
    {
        var validation = await _updateValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(validation.Errors);

        var result = await _service.UpdateAsync(id, request, ct);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var success = await _service.DeleteAsync(id, ct);
        return success ? NoContent() : NotFound();
    }
}
```

### Step 7: 配置 Program.cs

```csharp
// Program.cs
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();
builder.Host.UseSerilog();

// 服务注册
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// DI
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddValidatorsFromAssemblyContaining<ProductValidator>();

var app = builder.Build();

// 中间件
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### Step 8: 生成迁移并运行

```bash
# 生成迁移
dotnet ef migrations add InitialCreate

# 更新数据库（需要连接字符串）
dotnet ef database update

# 运行
dotnet run
```

### Step 9: 测试

```bash
# 创建测试项目
dotnet new xunit -n ProductApi.Tests
cd ProductApi.Tests
dotnet add reference ../ProductApi
dotnet add package Microsoft.AspNetCore.Mvc.Testing
dotnet add package Moq
dotnet add package FluentAssertions
```

```csharp
// Tests/ProductServiceTests.cs
public class ProductServiceTests
{
    [Fact]
    public async Task CreateAsync_ValidProduct_ReturnsProduct()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);
        var logger = Mock.Of<ILogger<ProductService>>();
        var service = new ProductService(context, logger);

        // Act
        var result = await service.CreateAsync(
            new CreateProductRequest("Test", "Desc", 10m, 5), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Test");
    }
}
```

### Step 10: 验证（对应 SKILL.md Step 4a / 4a.5 / 4b）

```bash
# 4a 结构化构建验证
python plugins/dotnet-work/skills/dotnet-csharp-developer/scripts/build_check.py \
  --project ProductApi/ProductApi.csproj \
  --config Debug \
  --changed-files ProductApi/Controllers/ProductsController.cs ProductApi/Services/ProductService.cs ProductApi/Validators/ProductValidator.cs

# 4a.5 测试（本项目有 ProductApi.Tests）
dotnet test ProductApi.sln --no-build --configuration Debug

# 4b 静态审查
python plugins/dotnet-work/skills/dotnet-csharp-developer/scripts/review_orchestrator.py \
  --target ProductApi \
  --mode quick
```

- 三步全过（build `pass:true` + test 0 失败 + review `agent_next_action:deliver`）→ 可交付
- review 报 SEC\* error → 必须修后再跑；非 SEC error → 修后重跑 4a+4a.5+4b
- 格式问题可补跑 `dotnet format ProductApi.sln --verify-no-changes`（非强制门）

## 关键决策点

| 决策 | 选择 | 理由 |
|------|------|------|
| 架构模式 | Controller + Service | 简单 CRUD，无需 CQRS |
| 验证 | FluentValidation | 与 ASP.NET Core 集成好 |
| 日志 | Serilog | 结构化日志，支持多输出 |
| ORM | EF Core | 标准选择，迁移支持好 |
| 测试 | xUnit + InMemory | 轻量，无需真实数据库 |
