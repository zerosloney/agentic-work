# 中间件模式

## 中间件执行顺序

```
请求 → ExceptionHandler → HTTPS → StaticFiles → Routing → Auth → 自定义中间件 → 端点
响应 ← 自定义中间件 ← 端点
```

## 自定义中间件

```csharp
// 方式 1：基于约定的中间件
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTimingMiddleware> _logger;

    public RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation("Request {Method} {Path} started", 
            context.Request.Method, context.Request.Path);

        try
        {
            await _next(context);
        }
        finally
        {
            sw.Stop();
            _logger.LogInformation("Request {Method} {Path} completed in {ElapsedMs}ms - Status {StatusCode}",
                context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds, context.Response.StatusCode);
        }
    }
}

// 注册
app.UseMiddleware<RequestTimingMiddleware>();
```

## 内联中间件

```csharp
// 简单场景使用内联中间件
app.Use(async (context, next) =>
{
    var requestId = Guid.NewGuid().ToString("N")[..8];
    context.Response.Headers["X-Request-Id"] = requestId;
    
    using (LogContext.PushProperty("RequestId", requestId))
    {
        await next();
    }
});
```

## 异常处理中间件

```csharp
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error");
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 400,
                Title = "Validation Error",
                Detail = ex.Message
            });
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found");
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 404,
                Title = "Not Found",
                Detail = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "Internal Server Error"
            });
        }
    }
}
```

## 条件中间件

```csharp
// 基于路径的条件中间件
app.UseWhen(context => context.Request.Path.StartsWithSegments("/api"), appBuilder =>
{
    appBuilder.UseMiddleware<ApiVersionMiddleware>();
});

// 基于环境的条件中间件
if (app.Environment.IsDevelopment())
{
    app.UseMiddleware<RequestLoggingMiddleware>();
}
```

## 中间件扩展方法（推荐模式）

```csharp
// 定义扩展方法
public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseRequestTiming(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestTimingMiddleware>();
    }

    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<GlobalExceptionMiddleware>();
    }
}

// 使用
app.UseRequestTiming();
app.UseGlobalExceptionHandler();
```

## 常用中间件清单

| 中间件 | 用途 | 注册顺序 |
|--------|------|---------|
| ExceptionHandler | 全局异常处理 | 1 |
| HTTPS Redirection | 强制 HTTPS | 2 |
| Static Files | 静态文件服务 | 3 |
| Routing | 路由匹配 | 4 |
| CORS | 跨域请求 | 5 |
| Authentication | 认证 | 6 |
| Authorization | 授权 | 7 |
| 自定义中间件 | 业务逻辑 | 8 |
| Endpoints | 端点路由 | 9 |

## 中间件 vs Filter

| 特性 | 中间件 | Filter |
|------|--------|--------|
| 执行范围 | 全局 | 控制器/动作级别 |
| 访问对象 | HttpContext | ActionContext |
| 执行时机 | 请求/响应全程 | MVC 管道内 |
| 适用场景 | 认证、日志、异常 | 验证、缓存、授权 |
