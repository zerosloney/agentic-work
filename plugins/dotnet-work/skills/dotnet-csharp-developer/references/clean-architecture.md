# Clean Architecture

## 分层结构

```
Presentation (API/UI)
    ↓
Application (Use Cases / CQRS)
    ↓
Domain (Entities / Value Objects / Events)
    ↑
Infrastructure (Persistence / External Services)
```

**核心规则**: 依赖方向向内。Domain 零外部引用。

## Domain 层

```csharp
// 实体
public class Order : BaseEntity
{
    public Guid Id { get; private set; }
    public OrderStatus Status { get; private set; }
    private readonly List<OrderItem> _items = [];
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    public static Order Create(Customer customer)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            Status = OrderStatus.Pending,
        };
        order.AddDomainEvent(new OrderCreatedEvent(order.Id));
        return order;
    }

    public void AddItem(Product product, int quantity)
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException("Cannot modify submitted order");
        var existing = _items.FirstOrDefault(i => i.ProductId == product.Id);
        if (existing != null)
            existing.IncreaseQuantity(quantity);
        else
            _items.Add(new OrderItem(product.Id, product.Price, quantity));
        AddDomainEvent(new OrderItemAddedEvent(Id, product.Id));
    }

    public Money TotalAmount => _items.Aggregate(Money.Zero(), (sum, item) => sum + item.Subtotal);
}

// 值对象
public record Money(decimal Amount, string Currency)
{
    public static Money Zero() => new(0, "USD");
    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency)
            throw new DomainException("Cannot add different currencies");
        return new Money(a.Amount + b.Amount, a.Currency);
    }
}

// 领域事件
public record OrderCreatedEvent(Guid OrderId) : IDomainEvent;
public record OrderItemAddedEvent(Guid OrderId, Guid ProductId) : IDomainEvent;
```

## Application 层

```csharp
// 接口（依赖反转）
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddAsync(Order order, CancellationToken ct);
}

public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken ct);
}

// Command / Handler
public record CreateOrderCommand(Guid CustomerId, List<OrderItemDto> Items) : IRequest<Result<Guid>>;

public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IOrderRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateOrderHandler(IOrderRepository repository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        var customer = await _repository.GetCustomerAsync(request.CustomerId, ct)
            ?? throw new NotFoundException(nameof(Customer), request.CustomerId);

        var order = Order.Create(customer);
        foreach (var item in request.Items)
        {
            var product = await _repository.GetProductAsync(item.ProductId, ct)
                ?? throw new NotFoundException(nameof(Product), item.ProductId);
            order.AddItem(product, item.Quantity);
        }

        await _repository.AddAsync(order, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        return Result.Success(order.Id);
    }
}

// Pipeline Behavior (验证)
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var context = new ValidationContext<TRequest>(request);
        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();
        if (failures.Count != 0)
            throw new ValidationException(failures);
        return await next();
    }
}
```

## Infrastructure 层

```csharp
// EF Core 配置
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(50);
        builder.HasMany(o => o.Items).WithOne().HasForeignKey(i => i.OrderId);
        builder.OwnsOne(o => o.TotalAmount, money =>
        {
            money.Property(m => m.Amount).HasColumnName("TotalAmount");
            money.Property(m => m.Currency).HasColumnName("Currency");
        });
    }
}

// Repository 实现
public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _context;

    public OrderRepository(AppDbContext context) => _context = context;

    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }

    public async Task AddAsync(Order order, CancellationToken ct)
    {
        await _context.Orders.AddAsync(order, ct);
    }
}
```

## 项目引用规则

| 项目 | 引用 |
|------|------|
| Domain | 无（零依赖） |
| Application | Domain |
| Infrastructure | Domain, Application |
| API | Application, Infrastructure（仅用于 DI 注册） |

## DI 注册

```csharp
// Program.cs
builder.Services.AddApplication();    // MediatR + FluentValidation + Pipeline Behaviors
builder.Services.AddInfrastructure(builder.Configuration);  // DbContext + Repos + External Services
```

```csharp
// Infrastructure/DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(opts =>
            opts.UseSqlServer(config.GetConnectionString("Default")));
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<AppDbContext>());
        return services;
    }
}
```

## CQRS + MediatR 集成

| 组件 | 职责 |
|------|------|
| Command | 写操作，返回 Result<T> |
| Query | 读操作，返回 DTO |
| Handler | 业务编排，调 Repository |
| Pipeline Behavior | 横切关注点（验证/日志/性能/事务） |

## 与三层架构对比

| 维度 | 三层 | Clean Architecture |
|------|------|-------------------|
| 依赖方向 | 上层→下层 | 外层→内层（Domain 无依赖） |
| Domain | 贫血模型 + 业务在 Service | 富血模型 + 领域事件 |
| 可测试性 | 需 mock Infrastructure | Domain 纯内存测试，零 mock |
| 适用场景 | 简单 CRUD | 复杂业务规则 + 长期演进 |
