# CQRS + MediatR 模式

## 架构概览

```
Command/Query → MediatR → Handler → 结果
                     ↓
              Pipeline Behaviors（验证/日志/缓存）
```

## 基础设置

```csharp
// Program.cs 注册
builder.Services.AddMediatR(cfg => 
    cfg.RegisterServicesFromAssembly(typeof(CreateOrderCommand).Assembly));

// Pipeline Behaviors（执行顺序 = 注册顺序）
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(CachingBehavior<,>));
```

## Command（写操作）

```csharp
// Command 定义
public record CreateOrderCommand(
    int CustomerId,
    List<OrderItemDto> Items
) : IRequest<OrderDto>;

// Handler 实现
public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly IOrderRepository _repo;
    private readonly IMapper _mapper;

    public CreateOrderHandler(IOrderRepository repo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
    }

    public async Task<OrderDto> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        var order = _mapper.Map<Order>(request);
        order.CalculateTotal();
        
        await _repo.AddAsync(order, ct);
        await _repo.SaveChangesAsync(ct);
        
        return _mapper.Map<OrderDto>(order);
    }
}

// 验证器（FluentValidation）
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.CustomerId).GreaterThan(0);
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.Quantity).GreaterThan(0);
            item.RuleFor(i => i.UnitPrice).GreaterThan(0);
        });
    }
}
```

## Query（读操作）

```csharp
// Query 定义
public record GetOrderQuery(int OrderId) : IRequest<OrderDto?>;

// Handler 实现
public class GetOrderHandler : IRequestHandler<GetOrderQuery, OrderDto?>
{
    private readonly IOrderRepository _repo;

    public GetOrderHandler(IOrderRepository repo)
    {
        _repo = repo;
    }

    public async Task<OrderDto?> Handle(GetOrderQuery request, CancellationToken ct)
    {
        var order = await _repo.GetByIdAsync(request.OrderId, ct);
        return order == null ? null : new OrderDto
        {
            Id = order.Id,
            Total = order.Total,
            // ...
        };
    }
}
```

## Pipeline Behaviors

```csharp
// 验证 Pipeline
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
        var results = await Task.WhenAll(_validators.Select(v => v.ValidateAsync(context, ct)));
        
        var failures = results.SelectMany(r => r.Errors).Where(f => f != null).ToList();
        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}

// 日志 Pipeline
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        _logger.LogInformation("Handling {RequestName}", typeof(TRequest).Name);
        var response = await next();
        _logger.LogInformation("Handled {RequestName}", typeof(TRequest).Name);
        return response;
    }
}
```

## 使用示例

```csharp
// Controller 中调用
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> Get(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetOrderQuery(id), ct);
        return result == null ? NotFound() : Ok(result);
    }
}
```
