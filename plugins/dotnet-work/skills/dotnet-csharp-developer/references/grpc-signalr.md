# gRPC & SignalR

## gRPC

### Proto 定义

```protobuf
//Protos/order.proto
syntax = "proto3";
option csharp_namespace = "MyApp.Grpc";

package order;

service OrderService {
  rpc GetOrder (GetOrderRequest) returns (OrderReply);
  rpc CreateOrder (CreateOrderRequest) returns (OrderReply);
  rpc StreamOrders (StreamOrdersRequest) returns (stream OrderReply);
}

message GetOrderRequest {
  string order_id = 1;
}

message CreateOrderRequest {
  string customer_id = 1;
  repeated OrderItem items = 2;
}

message OrderReply {
  string order_id = 1;
  string status = 2;
  double total_amount = 3;
  repeated OrderItem items = 4;
}

message OrderItem {
  string product_id = 1;
  int32 quantity = 2;
  double price = 3;
}

message StreamOrdersRequest {
  string customer_id = 1;
}
```

### Server 实现

```csharp
public class GrpcOrderService : OrderService.OrderServiceBase
{
    private readonly IOrderRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<GrpcOrderService> _logger;

    public GrpcOrderService(IOrderRepository repository, IMapper mapper, ILogger<GrpcOrderService> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    public override async Task<OrderReply> GetOrder(GetOrderRequest request, ServerCallContext context)
    {
        if (!Guid.TryParse(request.OrderId, out var orderId))
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid order ID"));

        var order = await _repository.GetByIdAsync(orderId, context.CancellationToken);
        if (order == null)
            throw new RpcException(new Status(StatusCode.NotFound, $"Order {orderId} not found"));

        return _mapper.Map<OrderReply>(order);
    }

    public override async Task<OrderReply> CreateOrder(CreateOrderRequest request, ServerCallContext context)
    {
        var command = _mapper.Map<CreateOrderCommand>(request);
        var result = await _mediator.Send(command, context.CancellationToken);
        if (!result.IsSuccess)
            throw new RpcException(new Status(StatusCode.InvalidArgument, result.Error));

        return new OrderReply { OrderId = result.Value.ToString() };
    }

    public override async Task StreamOrders(StreamOrdersRequest request, IServerStreamWriter<OrderReply> responseStream, ServerCallContext context)
    {
        await foreach (var order in _repository.StreamByCustomerAsync(request.CustomerId, context.CancellationToken))
        {
            await responseStream.WriteAsync(_mapper.Map<OrderReply>(order));
        }
    }
}
```

### Client

```csharp
// Program.cs
builder.Services.AddGrpcClient<OrderService.OrderServiceClient>(o =>
{
    o.Address = new Uri("https://localhost:5001");
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
});

// 使用
public class OrderSyncService
{
    private readonly OrderService.OrderServiceClient _client;

    public OrderSyncService(OrderService.OrderServiceClient client) => _client = client;

    public async Task<OrderReply> GetOrderAsync(Guid orderId, CancellationToken ct)
    {
        return await _client.GetOrderAsync(new GetOrderRequest { OrderId = orderId.ToString() },
            cancellationToken: ct);
    }
}
```

### 配置

```csharp
// Program.cs
app.MapGrpcService<GrpcOrderService>();

// appsettings.json
"Kestrel": {
  "Endpoints": {
    "Grpc": {
      "Url": "https://localhost:5001",
      "Protocols": "Http2"
    },
    "Http": {
      "Url": "http://localhost:5000",
      "Protocols": "Http1"
    }
  }
}
```

## SignalR

### Hub 定义

```csharp
public interface IOrderHub
Task OrderUpdated(Guid orderId, string status);
Task NewOrderReceived(Guid orderId);
Task ReceiveNotification(string message);
```

```csharp
[Authorize]
public class OrderHub : Hub<IOrderHub>
{
    private readonly ILogger<OrderHub> _logger;

    public OrderHub(ILogger<OrderHub> logger) => _logger = logger;

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            _logger.LogInformation("User {UserId} connected", userId);
        }
        await base.OnConnectedAsync();
    }

    public async Task JoinOrderGroup(Guid orderId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"order-{orderId}");
    }

    public async Task LeaveOrderGroup(Guid orderId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order-{orderId}");
    }
}
```

### 服务端推送

```csharp
public class OrderNotificationService
{
    private readonly IHubContext<OrderHub, IOrderHub> _hubContext;

    public OrderNotificationService(IHubContext<OrderHub, IOrderHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyOrderUpdated(Guid orderId, string status)
    {
        await _hubContext.Clients.Group($"order-{orderId}")
            .OrderUpdated(orderId, status);
    }

    public async Task NotifyUser(Guid userId, string message)
    {
        await _hubContext.Clients.Group($"user-{userId}")
            .ReceiveNotification(message);
    }

    public async Task Broadcast(string message)
    {
        await _hubContext.Clients.All.ReceiveNotification(message);
    }
}
```

### Client (C#)

```csharp
public class OrderHubClient
{
    private HubConnection _connection;

    public event Action<Guid, string> OnOrderUpdated;
    public event Action<string> OnNotification;

    public async Task ConnectAsync(string hubUrl, string accessToken)
    {
        _connection = new HubConnectionBuilder()
            .WithUrl(hubUrl, options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(accessToken);
            })
            .WithAutomaticReconnect(new[] { TimeSpan.Zero, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(10) })
            .Build();

        _connection.On<Guid, string>("OrderUpdated", (orderId, status) => OnOrderUpdated?.Invoke(orderId, status));
        _connection.On<string>("ReceiveNotification", msg => OnNotification?.Invoke(msg));

        _connection.Reconnected += connectionId =>
        {
            Console.WriteLine($"Reconnected: {connectionId}");
            return Task.CompletedTask;
        };

        await _connection.StartAsync();
    }

    public async Task JoinOrderGroup(Guid orderId)
    {
        await _connection.InvokeAsync("JoinOrderGroup", orderId);
    }

    public async Task DisconnectAsync()
    {
        if (_connection != null)
            await _connection.StopAsync();
    }
}
```

### 配置

```csharp
// Program.cs
builder.Services.AddSignalR(o =>
{
    o.EnableDetailedErrors = builder.Environment.IsDevelopment();
    o.MaximumReceiveMessageSize = 1024 * 1024; // 1MB
})
AddMessagePackProtocol(); // 二进制协议，性能更优

// 生产环境需配置 Redis backplane
builder.Services.AddStackExchangeRedisCache(o =>
{
    o.Configuration = builder.Configuration.GetConnectionString("Redis");
});
builder.Services.AddSignalR().AddStackExchangeRedis(builder.Configuration.GetConnectionString("Redis"));

app.MapHub<OrderHub>("/hubs/order");
```

## 选择指南

| 场景 | 推荐 | 原因 |
|------|------|------|
| 服务间通信 | gRPC | 强类型、高性能、双向流 |
| 实时推送 (服务端→客户端) | SignalR | WebSocket 自动降级、Group 管理 |
| 文件/大流传输 | gRPC streaming | 分块传输、背压控制 |
| 聊天/通知/实时仪表盘 | SignalR | 连接管理、自动重连 |
| 浏览器→服务端实时 | SignalR | WebSocket 原生支持 |
| 跨语言服务调用 | gRPC | 多语言 proto 生成 |

## 安全

```csharp
// gRPC JWT 拦截器
public class AuthInterceptor : Interceptor
{
    public override async Task<TResponse> UnaryServerHandler<TRequest, TResponse>(
        TRequest request, ServerCallContext context, UnaryServerHandler<TRequest, TResponse> continuation)
    {
        var authHeader = context.RequestHeaders.FirstOrDefault(h => h.Key == "authorization");
        if (authHeader == null)
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Missing token"));
        // 验证 token...
        return await continuation(request, context);
    }
}

// SignalR 认证
[Authorize(JwtBearerDefaults.AuthenticationScheme)]
public class OrderHub : Hub { }
```
