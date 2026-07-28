# 部署与 CI/CD

## Docker 部署

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 复制 csproj 并还原依赖（利用 Docker 缓存层）
COPY ["ProductApi/ProductApi.csproj", "ProductApi/"]
RUN dotnet restore "ProductApi/ProductApi.csproj"

# 复制源码并构建
COPY . .
WORKDIR "/src/ProductApi"
RUN dotnet build "ProductApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ProductApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# 非 root 用户运行
USER $APP_UID
ENTRYPOINT ["dotnet", "ProductApi.dll"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__Default=Server=db;Database=ProductDb;...
    depends_on:
      - db
      - redis

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "Your_Strong_Password"
      ACCEPT_EULA: "Y"
    volumes:
      - sql-data:/var/opt/mssql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  sql-data:
```

## GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  DOTNET_VERSION: '8.0.x'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore --configuration Release

      - name: Test
        run: dotnet test --no-build --configuration Release --collect:"XPlat Code Coverage"

      - name: Code Review
        run: |
          cd plugins/dotnet-work/skills/dotnet-code-review
          python scripts/review.py --target ../../../src --format compact --output-mode summary

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: '**/coverage.cobertura.xml'

  docker-build:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
```

## 健康检查

```csharp
// 安装：dotnet add package Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore

// 配置
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database")
    .AddCheck("self", () => HealthCheckResult.Healthy())
    .AddRedis(redisConnection, "redis");

// 使用
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
```

## 配置管理

```csharp
// 环境变量配置
builder.Configuration.AddEnvironmentVariables("MYAPP_");

// 密钥管理（开发环境）
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>();
}

// Azure Key Vault（生产环境）
if (builder.Environment.IsProduction())
{
    builder.Configuration.AddAzureKeyVault(
        new Uri($"https://{builder.Configuration["KeyVault:Name"]}.vault.azure.net/"),
        new DefaultAzureCredential());
}
```

## 生产环境最佳实践

| 实践 | 说明 |
|------|------|
| 环境变量 | 敏感配置通过环境变量注入 |
| HTTPS | 强制 HTTPS，使用 HSTS |
| CORS | 严格限制允许的来源 |
| 速率限制 | 使用 AspNetCoreRateLimit |
| 响应压缩 | 启用 Brotli/Gzip |
| 日志 | 结构化日志输出到 stdout |
| 健康检查 | /health、/health/ready 端点 |
