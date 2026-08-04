# 示例 2：EF Core 迁移实战

## 场景

用户要求："现有项目需要添加订单功能，包含 Order 和 OrderItem 两个表，与现有 Product 表关联"。

## 完整执行轨迹

### Step 0: 评估现有项目

```bash
# 检查现有 DbContext
# 检查现有迁移历史
dotnet ef migrations list

# 检查连接字符串
cat appsettings.json | grep ConnectionStrings
```

### Step 1: 添加新实体

```csharp
// Domain/Order.cs
namespace ProductApi.Domain;

public class Order
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal TotalAmount { get; set; }
    
    // 导航属性
    public List<OrderItem> Items { get; set; } = new();
}

public enum OrderStatus
{
    Pending,
    Confirmed,
    Shipped,
    Delivered,
    Cancelled
}

// Domain/OrderItem.cs
public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    
    // 导航属性
    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
```

### Step 2: 更新 DbContext

```csharp
// Data/AppDbContext.cs（更新）
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 现有 Product 配置...
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
        });

        // Order 配置
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.HasMany(e => e.Items)
                  .WithOne(i => i.Order)
                  .HasForeignKey(i => i.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // OrderItem 配置
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.HasOne(i => i.Product)
                  .WithMany()
                  .HasForeignKey(i => i.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // 复合唯一索引：一个订单中同一产品只能出现一次
            entity.HasIndex(i => new { i.OrderId, i.ProductId }).IsUnique();
        });
    }
}
```

### Step 3: 生成迁移

```bash
# 生成迁移
dotnet ef migrations add AddOrderTables

# 预览迁移 SQL（可选，用于审查）
dotnet ef migrations script -o migration.sql

# 检查迁移是否正确
dotnet ef migrations has-pending-model-changes
```

### Step 4: 审查生成的迁移文件

```csharp
// Migrations/20240101000000_AddOrderTables.cs（自动生成）
// 检查要点：
// 1. 表名是否正确
// 2. 列类型是否匹配
// 3. 外键关系是否正确
// 4. 索引是否合理
// 5. 级联删除是否符合预期
```

### Step 5: 更新数据库

```bash
# 开发环境更新
dotnet ef database update

# 生产环境建议生成 SQL 脚本审查后执行
dotnet ef migrations script -idempotent -o deploy.sql
```

### Step 6: 添加种子数据（可选）

```csharp
// Data/SeedData.cs
public static class SeedData
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (await context.Orders.AnyAsync()) return;

        var orders = new List<Order>
        {
            new()
            {
                CustomerId = 1,
                Status = OrderStatus.Delivered,
                TotalAmount = 299.99m,
                Items = new List<OrderItem>
                {
                    new() { ProductId = 1, Quantity = 2, UnitPrice = 99.99m },
                    new() { ProductId = 2, Quantity = 1, UnitPrice = 100.01m }
                }
            }
        };

        context.Orders.AddRange(orders);
        await context.SaveChangesAsync();
    }
}
```

### Step 7: 处理常见迁移问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| "Pending model changes" | 模型与迁移不同步 | 重新 `dotnet ef migrations add` |
| 空迁移 | 模型无变化 | 确认实体已添加到 DbContext |
| 外键冲突 | 级联删除循环 | 设置 `DeleteBehavior.Restrict` |
| 列已存在 | 重复迁移 | 检查迁移历史，可能需要回滚 |

### Step 8: 验证（对应 SKILL.md Step 4a / 4a.5 / 4b）

```bash
# 4a 结构化构建验证（迁移改动不直接产生编译 error，但实体类改动会）
python plugins/dotnet-work/skills/dotnet-csharp-developer/scripts/build_check.py \
  --project <项目根>.csproj \
  --config Debug \
  --changed-files Domain/Order.cs Domain/OrderItem.cs Data/AppDbContext.cs

# 4a.5 无独立测试工程 → 跳过；有则 dotnet test --no-build

# 迁移专项验证（非 SKILL.md 标准步骤，EF 迁移场景必做）
dotnet ef migrations has-pending-model-changes   # 应返回无 pending
dotnet ef migrations script -o review.sql        # 审查生成的 SQL

# 4b 静态审查
python plugins/dotnet-work/skills/dotnet-csharp-developer/scripts/review_orchestrator.py \
  --target <项目根> --mode quick
```

- 迁移场景验证重点：`has-pending-model-changes` 无输出 + `script` SQL 审查列类型/外键/索引合理
- 迁移不可逆（已 apply 到生产库），交付前务必 `migrations script -idempotent` 生成幂等 SQL 人工审

## 关键决策点

| 决策 | 选择 | 理由 |
|------|------|------|
| 级联删除 | Order → OrderItem 级联 | 删除订单时自动删除明细 |
| 产品外键 | Restrict | 防止误删已下单的产品 |
| 唯一索引 | OrderId + ProductId | 防止同一产品重复添加 |
| 精度 | HasPrecision(18,2) | 货币计算精确 |
