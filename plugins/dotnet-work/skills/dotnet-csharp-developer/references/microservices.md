# 微服务架构

## 技术选型

| 技术 | 定位 | 适用场景 |
|------|------|---------|
| Dapr | 运行时 sidecar | 构建块抽象（发布/订阅、状态管理、绑定） |
| Orleans | 虚拟 Actor 框架 | 有状态分布式计算（游戏/IoT/金融） |
| Service Fabric | 平台级编排 | 有状态/无状态服务托管（Azure 原生） |

## Dapr

### 核心构建块

```csharp
// 1. 服务调用
var httpClient = DaprClient.CreateInvokeHttpClient("order-service");
var response = await httpClient.GetAsync("/api/orders/123");
var order = await response.Content.ReadFromJsonAsync<OrderDto>();

// 2. 发布/订阅
await daprClient.PublishEventAsync("rabbitmq-pubsub", "order-created", new
{
    orderId = order.Id,
    customerId = order.CustomerId
});

// 3. 状态管理
await daprClient.SaveStateAsync("redis-state", $"order-{order.Id}", order);
var saved = await daprClient.GetStateAsync<OrderDto>("redis-state", $"order-{order.Id}");

// 4. 绑定 (外部系统触发)
app.MapPost("/binding-trigger", async (HttpContext context) =>
{
    var payload = await context.Request.ReadFromJsonAsync<BindingPayload>();
    // 处理来自 Kafka/SQS/Cron 等的触发
    return Results.Ok();
});
```

### Dapr + ASP.NET Core 集成

```csharp
// Program.cs
builder.Services.AddControllers().AddDapr();

// 订阅消息
[Topic("rabbitmq-pubsub", "order-created")]
[HttpPost("handle-order-created")]
public async Task HandleOrderCreated([FromBody] OrderCreatedEvent evt)
{
    _logger.LogInformation("Order {OrderId} created", evt.OrderId);
    // 处理事件
}

// Dapr 配置 (dapr/config.yaml)
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: appconfig
spec:
  tracing:
    samplingRate: "1"
    zipkin:
      endpointAddress: http://zipkin:9411/api/v2/spans
```

### 部署 (Kubernetes)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  template:
    metadata:
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "order-service"
        dapr.io/app-port: "80"
    spec:
      containers:
      - name: order-service
        image: myregistry/order-service:latest
```

## Orleans

### Grain 接口

```csharp
public interface IOrderGrain : IGrainWithStringKey
{
    Task<OrderState> GetStateAsync();
    Task SubmitOrderAsync(List<OrderItem> items);
    Task CancelAsync(string reason);
}

public interface ICustomerGrain : IGrainWithStringKey
{
    Task AddOrder(Guid orderId);
    Task<IReadOnlyList<Guid>> GetOrdersAsync();
}
```

### Grain 实现

```csharp
[Reentrant]
public class OrderGrain : Grain, IOrderGrain
{
    private readonly IPersistentState<OrderState> _state;
    private readonly ILogger<OrderGrain> _logger;

    public OrderGrain(
        [PersistentState("order", "orders-store")]
        IPersistentState<OrderState> state,
        ILogger<OrderGrain> logger)
    {
        _state = state;
        _logger = logger;
    }

    public Task<OrderState> GetStateAsync() => Task.FromResult(_state.State);

    public async Task SubmitOrderAsync(List<OrderItem> items)
    {
        if (_state.State.Status != OrderStatus.Pending)
            throw new InvalidOperationException("Order already submitted");

        _state.State.Items = items.ToArray();
        _state.State.Status = OrderStatus.Submitted;
        _state.State.SubmittedAt = DateTime.UtcNow;
        await _state.WriteStateAsync();

        // 通知 Customer grain
        var customerGrain = GrainFactory.GetGrain<ICustomerGrain>(_state.State.CustomerId.ToString());
        await customerGrain.AddOrder(this.GetPrimaryKey());
    }

    public async Task CancelAsync(string reason)
    {
        _state.State.Status = OrderStatus.Cancelled;
        _state.State.CancellationReason = reason;
        await _state.WriteStateAsync();
    }
}
```

### Silo 配置

```csharp
// Program.cs
builder.Host.UseOrleans(silo =>
{
    silo.UseLocalhostClustering();
    silo.AddMemoryGrainStorage("orders-store");
    silo.Configure<GrainCollectionOptions>(options =>
    {
        options.CollectionAge = TimeSpan.FromHours(2);
    });
});
```

### 客户端调用

```csharp
public class OrderService
{
    private readonly IGrainFactory _grainFactory;

    public OrderService(IGrainFactory grainFactory) => _grainFactory = grainFactory;

    public async Task<Guid> CreateOrder(Guid customerId, List<OrderItem> items)
    {
        var orderId = Guid.NewGuid();
        var grain = _grainFactory.GetGrain<IOrderGrain>(orderId.ToString());
        await grain.SubmitOrderAsync(items);
        return orderId;
    }
}
```

## Service Fabric

### 有状态服务

```csharp
public class OrderService : StatefulService
{
    public OrderService(StatefulServiceContext context)
        : base(context) { }

    protected override IEnumerable<ServiceReplicaListener> CreateServiceReplicaListeners()
    {
        return new[]
        {
            new ServiceReplicaListener(context =>
                new KestrelCommunicationListener(context, "ServiceEndpoint", (url, listener) =>
                {
                    return new WebHostBuilder()
                        .UseKestrel()
                        .ConfigureServices(services => services.AddSingleton(StateManager))
                        .UseStartup<Startup>()
                        .UseUrls(url)
                        .Build();
                }))
        };
    }

    protected override async Task RunAsync(CancellationToken cancellationToken)
    {
        var store = await StateManager.GetOrAddAsync<IReliableDictionary<Guid, OrderState>>("orders");
        while (!cancellationToken.IsCancellationRequested)
        {
            using var tx = StateManager.CreateTransaction();
            // 可靠集合操作
            await Task.Delay(TimeSpan.FromSeconds(1), cancellationToken);
        }
    }
}
```

### 无状态服务

```csharp
public class ApiService : StatelessService
{
    public ApiService(StatelessServiceContext context)
        : base(context) { }

    protected override IEnumerable<ServiceInstanceListener> CreateServiceInstanceListeners()
    {
        return new[]
        {
            new ServiceInstanceListener(context =>
                new KestrelCommunicationListener(context, "ServiceEndpoint", (url, listener) =>
                {
                    return new WebHostBuilder()
                        .UseKestrel()
                        .UseStartup<Startup>()
                        .UseUrls(url)
                        .Build();
                }))
        };
    }
}
```

## 跨服务通信模式

| 模式 | 实现 | 适用 |
|------|------|------|
| 同步 REST | HttpClient + Polly | 简单查询 |
| 同步 gRPC | 强类型 RPC | 低延迟服务间调用 |
| 异步消息 | RabbitMQ / Kafka / Azure Service Bus | 事件驱动、最终一致 |
| Saga | 编排/编排 | 分布式事务 |

## 分布式事务 (Saga)

```csharp
// 编排式 Saga
public class OrderSaga : MassTransitStateMachine<OrderSagaState>
{
    public State Submitted { get; private set; }
    public State InventoryReserved { get; private set; }
    public State Completed { get; private set; }
    public State Failed { get; private set; }

    public Event<OrderSubmitted> OrderSubmitted { get; private set; }
    public Event<InventoryReserved> InventoryReservedEvent { get; private set; }
    public Event<PaymentProcessed> PaymentProcessed { get; private set; }

    public OrderSaga()
    {
        InstanceState(x => x.CurrentState);

        Initially(
            When(OrderSubmitted)
                .Then(context => context.Instance.OrderId = context.Data.OrderId)
                .Publish(context => new ReserveInventory(context.Data.OrderId, context.Data.Items))
                .TransitionTo(Submitted));

        During(Submitted,
            When(InventoryReservedEvent)
                .Publish(context => new ProcessPayment(context.Instance.OrderId))
                .TransitionTo(InventoryReserved),
            When(InventoryReservationFailed)
                .Publish(context => new CancelOrder(context.Instance.OrderId))
                .TransitionTo(Failed));

        During(InventoryReserved,
            When(PaymentProcessed)
                .Publish(context => new CompleteOrder(context.Instance.OrderId))
                .TransitionTo(Completed),
            When(PaymentFailed)
                .Publish(context => new ReleaseInventory(context.Instance.OrderId))
                .Publish(context => new CancelOrder(context.Instance.OrderId))
                .TransitionTo(Failed));
    }
}
```

## 可观测性

```csharp
// OpenTelemetry
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddSqlClientInstrumentation()
            .AddRedisInstrumentation()
            .AddOtlpExporter(o => o.Endpoint = new Uri("http://jaeger:4317"));
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddProcessInstrumentation()
            .AddOtlpExporter(o => o.Endpoint = new Uri("http://prometheus:9090"));
    });
```

## 选择决策树

```
需要分布式计算？
├── 是，有状态 → Orleans
├── 是，无状态 → Dapr (构建块) 或 Service Fabric
└── 否 → 单体/模块化单体

需要平台托管？
├── Azure → Service Fabric
├── K8s → Dapr
└── 自托管 → Orleans
```
