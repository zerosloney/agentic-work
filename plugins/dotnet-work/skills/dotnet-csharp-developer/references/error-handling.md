# 错误处理最佳实践

## Result 模式（推荐）

```csharp
// Result 类型定义
public record Result<T>
{
    public bool IsSuccess { get; init; }
    public T? Value { get; init; }
    public string? Error { get; init; }

    public static Result<T> Success(T value) => new() { IsSuccess = true, Value = value };
    public static Result<T> Failure(string error) => new() { IsSuccess = false, Error = error };
}

// 使用示例
public async Task<Result<Order>> GetOrderAsync(int id)
{
    var order = await _repository.GetByIdAsync(id);
    if (order == null)
        return Result<Order>.Failure($"Order {id} not found");

    return Result<Order>.Success(order);
}

// 调用方
var result = await GetOrderAsync(1);
if (!result.IsSuccess)
{
    _logger.LogWarning("Failed to get order: {Error}", result.Error);
    return NotFound();
}
```

## 全局异常处理

```csharp
// Program.cs
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        
        logger.LogError(exception, "Unhandled exception");

        context.Response.StatusCode = exception switch
        {
            ValidationException => StatusCodes.Status400BadRequest,
            NotFoundException => StatusCodes.Status404NotFound,
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status500InternalServerError
        };

        await context.Response.WriteAsJsonAsync(new
        {
            error = exception.Message,
            statusCode = context.Response.StatusCode
        });
    });
});
```

## 自定义异常

```csharp
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
    public NotFoundException(string entityName, object key)
        : base($"Entity \"{entityName}\" ({key}) was not found.") { }
}

public class ValidationException : Exception
{
    public List<string> Errors { get; }

    public ValidationException(List<string> errors)
        : base("Validation failed")
    {
        Errors = errors;
    }
}

// 使用
var order = await _repository.GetByIdAsync(id)
    ?? throw new NotFoundException(nameof(Order), id);
```

## 重试策略（Polly）

```csharp
// 安装：Install-Package Polly
using Polly;
using Polly.Retry;

// 定义重试策略
var retryPolicy = Policy
    .Handle<SqlException>(ex => ex.Number == -2) // 超时
    .WaitAndRetryAsync(
        retryCount: 3,
        sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
        onRetry: (exception, timeSpan, retryCount, context) =>
        {
            logger.LogWarning(exception, 
                "Retry {RetryCount} after {TimeSpan}s", retryCount, timeSpan.TotalSeconds);
        });

// 使用
var result = await retryPolicy.ExecuteAsync(async () =>
    await _httpClient.GetAsync("https://api.example.com/data"));
```

## 熔断策略

```csharp
var circuitBreaker = Policy
    .Handle<HttpRequestException>()
    .CircuitBreakerAsync(
        exceptionsAllowedBeforeBreaking: 3,
        durationOfBreak: TimeSpan.FromSeconds(30),
        onBreak: (exception, duration) => 
            logger.LogWarning("Circuit open for {Duration}s", duration.TotalSeconds),
        onReset: () => 
            logger.LogInformation("Circuit reset"));

// 组合策略
var combined = Policy.WrapAsync(retryPolicy, circuitBreaker);
```

## 异步错误处理

```csharp
try
{
    await _service.DoWorkAsync();
}
catch (OperationCanceledException)
{
    _logger.LogInformation("Operation was cancelled");
    throw; // 重新抛出，不要吞掉
}
catch (Exception ex) when (ex is not ValidationException)
{
    _logger.LogError(ex, "Unexpected error");
    throw;
}
```

## 日志最佳实践

```csharp
// 结构化日志
_logger.LogInformation("Processing order {OrderId} for customer {CustomerId}", orderId, customerId);

// 错误日志
_logger.LogError(ex, "Failed to process order {OrderId}", orderId);

// 性能日志
using (_logger.BeginScope(new Dictionary<string, object> { ["OrderId"] = orderId }))
{
    _logger.LogInformation("Starting order processing");
    // ...
}
```
