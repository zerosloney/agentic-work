# 后台任务

## IHostedService（内置）

```csharp
// 简单后台服务
public class QueueProcessingService : BackgroundService
{
    private readonly ILogger<QueueProcessingService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromSeconds(30);

    public QueueProcessingService(ILogger<QueueProcessingService> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Queue processing service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingItemsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing queue");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task ProcessPendingItemsAsync(CancellationToken ct)
    {
        // 处理逻辑
    }
}

// 注册
builder.Services.AddHostedService<QueueProcessingService>();
```

## Hangfire（推荐用于复杂场景）

```csharp
// 安装：dotnet add package Hangfire.AspNetCore
// 安装：dotnet add package Hangfire.SqlServer

// 配置
builder.Services.AddHangfire(config =>
    config.UseSqlServerStorage(builder.Configuration.GetConnectionString("Hangfire")));
builder.Services.AddHangfireServer();

// 使用
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] = { new AdminAuthorizationFilter() }
});

// 一次性任务
BackgroundJob.Enqueue(() => Console.WriteLine("Fire-and-forget"));

// 延迟任务
BackgroundJob.Schedule(() => Console.WriteLine("Delayed"), TimeSpan.FromDays(1));

// 周期性任务
RecurringJob.AddOrUpdate("daily-cleanup", () => Cleanup(), Cron.Daily);

// 延续任务
BackgroundJob.ContinueJobWith(parentId, () => NextStep());
```

## Channel（高性能队列）

```csharp
// 定义队列
public class BackgroundTaskQueue
{
    private readonly Channel<Func<CancellationToken, ValueTask>> _queue;

    public BackgroundTaskQueue(int capacity = 100)
    {
        _queue = Channel.CreateBounded<Func<CancellationToken, ValueTask>>(
            new BoundedChannelOptions(capacity)
            {
                FullMode = BoundedChannelFullMode.Wait
            });
    }

    public async ValueTask QueueAsync(Func<CancellationToken, ValueTask> workItem)
    {
        await _queue.Writer.WriteAsync(workItem);
    }

    public async ValueTask<Func<CancellationToken, ValueTask>> DequeueAsync(CancellationToken ct)
    {
        return await _queue.Reader.ReadAsync(ct);
    }
}

// 消费者服务
public class QueuedProcessorService : BackgroundService
{
    private readonly BackgroundTaskQueue _queue;
    private readonly ILogger<QueuedProcessorService> _logger;

    public QueuedProcessorService(BackgroundTaskQueue queue, ILogger<QueuedProcessorService> logger)
    {
        _queue = queue;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var workItem = await _queue.DequeueAsync(stoppingToken);
            await workItem(stoppingToken);
        }
    }
}
```

## 选择指南

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| 简单定时任务 | BackgroundService | 内置，无需额外依赖 |
| 复杂调度 | Hangfire | 支持 Cron、重试、持久化 |
| 高吞吐队列 | Channel | 高性能，低 GC 压力 |
| 一次性延迟任务 | BackgroundTask | 简单场景够用 |
