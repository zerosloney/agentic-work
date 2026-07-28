# Serilog 结构化日志

## 基础配置

```csharp
// 安装：dotnet add package Serilog.AspNetCore
// 可选：dotnet add package Serilog.Sinks.Seq
// 可选：dotnet add package Serilog.Sinks.Console

using Serilog;
using Serilog.Events;

// Program.cs 入口
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentName()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File("logs/app-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Starting application");
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog(); // 替换默认日志
    
    // ...
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
```

## appsettings.json 配置

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.EntityFrameworkCore.Database.Command": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} {Message:lj}{NewLine}{Exception}"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "logs/app-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30
        }
      }
    ],
    "Enrich": ["FromLogContext", "WithMachineName", "WithEnvironmentName"]
  }
}
```

## 结构化日志最佳实践

```csharp
// 推荐：结构化日志（属性可被索引和查询）
_logger.LogInformation("Processing order {OrderId} for customer {CustomerId}", orderId, customerId);

// 不推荐：字符串插值（属性不可索引）
_logger.LogInformation($"Processing order {orderId} for customer {customerId}");

// 复杂对象日志
_logger.LogInformation("Order created: {@Order}", order);
// @ 符号将对象序列化为 JSON

// 作用域日志
using (_logger.BeginScope(new Dictionary<string, object>
{
    ["OrderId"] = orderId,
    ["CustomerId"] = customerId
}))
{
    _logger.LogInformation("Starting order processing");
    // 此作用域内的所有日志都包含 OrderId 和 CustomerId
    _logger.LogInformation("Validating order");
    _logger.LogInformation("Order processed successfully");
}
```

## 异常日志

```csharp
try
{
    await _service.ProcessAsync(orderId, ct);
}
catch (ValidationException ex)
{
    _logger.LogWarning(ex, "Validation failed for order {OrderId}", orderId);
    throw;
}
catch (OperationCanceledException)
{
    _logger.LogInformation("Operation cancelled for order {OrderId}", orderId);
    throw;
}
catch (Exception ex)
{
    _logger.LogError(ex, "Failed to process order {OrderId}", orderId);
    throw;
}
```

## 性能日志

```csharp
// 使用 Stopwatch 记录性能
var sw = Stopwatch.StartNew();
await _service.DoWorkAsync();
sw.Stop();

if (sw.ElapsedMilliseconds > 1000)
{
    _logger.LogWarning("Slow operation detected: {ElapsedMs}ms", sw.ElapsedMilliseconds);
}
else
{
    _logger.LogDebug("Operation completed in {ElapsedMs}ms", sw.ElapsedMilliseconds);
}

// 或使用using 模式
using (LogContext.PushProperty("Operation", "ProcessOrder"))
{
    _logger.LogInformation("Starting operation");
    // ...
}
```

## 日志级别使用规范

| 级别 | 使用场景 | 示例 |
|------|---------|------|
| Verbose | 开发调试 | 方法入参、中间状态 |
| Debug | 开发诊断 | SQL 查询、缓存命中 |
| Information | 正常业务流程 | 订单创建、用户登录 |
| Warning | 可恢复异常 | 重试、降级、慢查询 |
| Error | 需要关注的异常 | 业务异常、外部服务失败 |
| Fatal | 应用崩溃 | 启动失败、不可恢复错误 |

## 敏感数据脱敏

```csharp
// 自定义脱敏 Enricher
public class SensitiveDataEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        if (logEvent.Properties.TryGetValue("Request", out var value) && value is ScalarValue scalar)
        {
            var masked = MaskSensitiveData(scalar.Value?.ToString());
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("RequestMasked", masked));
        }
    }

    private static string? MaskSensitiveData(string? input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        // 脱敏密码、Token 等
        return Regex.Replace(input, @"(password|token|key)\s*[:=]\s*\S+", "$1=***", RegexOptions.IgnoreCase);
    }
}
```
