# 现代 C# 模式

## 文件范围命名空间和主构造函数

```csharp
namespace MyApp.Domain;

// 主构造函数 (C# 12)
public class ProductService(IProductRepository repository, ILogger<ProductService> logger)
{
    public async Task<Product?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        logger.LogInformation("正在获取产品 {ProductId}", id);
        return await repository.GetByIdAsync(id, ct);
    }
}

// 带主构造函数的 Record
public record Product(int Id, string Name, decimal Price)
{
    public bool IsExpensive => Price > 100m;
}
```

## Record 类型和模式匹配

```csharp
// 不可变 Record
public record Customer(int Id, string Name, string Email);

// 带验证的 Record：用静态工厂 + 校验，避免与主构造函数（secondary ctor）冲突
public record OrderRequest(int ProductId, int Quantity)
{
    public static OrderRequest Create(int productId, int quantity)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(productId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        return new OrderRequest(productId, quantity);
    }
}

// 用 Record 做模式匹配
public decimal CalculateDiscount(Customer customer, Order order) => customer switch
{
    { Id: > 1000 } => order.Total * 0.2m,          // 优质客户
    { Name: "VIP" } => order.Total * 0.3m,          // VIP
    _ when order.Total > 500 => order.Total * 0.1m, // 大额订单
    _ => 0m
};

// 列表模式 (C# 11+)
public string DescribeItems(int[] items) => items switch
{
    [] => "空",
    [var single] => $"单个项目: {single}",
    [var first, .., var last] => $"多个项目，从 {first} 到 {last}",
    _ => "未知"
};
```

## 可空引用类型

```csharp
#nullable enable

public class UserService
{
    // 非可空参数和返回类型
    public User CreateUser(string email, string name)
    {
        ArgumentNullException.ThrowIfNull(email);
        ArgumentNullException.ThrowIfNull(name);

        return new User { Email = email, Name = name };
    }

    // 可空返回类型
    public User? FindUserByEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        return _repository.Find(email);
    }

    // required 修饰符 (C# 11)
    public class User
    {
        public required string Email { get; init; }
        public required string Name { get; init; }
        public string? PhoneNumber { get; init; } // 可选
    }
}

// 空包容运算符 (谨慎使用)
var user = FindUserById(id)!; // 仅确定时使用

// 空合并赋值
_cache ??= new Dictionary<string, object>();
```

## 现代集合模式

```csharp
// 集合表达式 (C# 12)
int[] numbers = [1, 2, 3, 4, 5];
List<string> names = ["Alice", "Bob", "Charlie"];

// 展开运算符
int[] moreNumbers = [..numbers, 6, 7, 8];
string[] allNames = [..names, "David"];

// 只读集合
public IReadOnlyList<Product> Products { get; } = [product1, product2];

// 用 Frozen 集合提升性能
using System.Collections.Frozen;

private static readonly FrozenDictionary<string, int> StatusCodes =
    new Dictionary<string, int>
    {
        ["Active"] = 1,
        ["Inactive"] = 2,
        ["Pending"] = 3
    }.ToFrozenDictionary();
```

## 表达式体成员

```csharp
public class Product
{
    private decimal _price;

    // 表达式体属性
    public decimal Price
    {
        get => _price;
        init => _price = value > 0 ? value : throw new ArgumentException();
    }

    // 表达式体方法
    public decimal GetPriceWithTax(decimal taxRate) => _price * (1 + taxRate);

    // 表达式体构造函数 (带验证)
    public Product(string name) => Name = !string.IsNullOrWhiteSpace(name)
        ? name
        : throw new ArgumentException(nameof(name));

    public required string Name { get; init; }
}
```

## 字符串插值和原始字符串

```csharp
// 原始字符串字面量 (C# 11)
var json = """
    {
        "name": "Product",
        "price": 99.99,
        "available": true
    }
    """;

// 插值原始字符串
var productJson = $$"""
    {
        "id": {{product.Id}},
        "name": "{{product.Name}}",
        "price": {{product.Price}}
    }
    """;

// UTF-8 字符串字面量
ReadOnlySpan<byte> utf8 = "Hello"u8;
```

## 全局 Using 指令

```csharp
// GlobalUsings.cs
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading;
global using System.Threading.Tasks;
global using Microsoft.Extensions.Logging;
global using Microsoft.Extensions.DependencyInjection;
```

## 源生成器 (准备)

```csharp
// 用分部类做源生成器
public partial class UserRepository
{
    // 生成器在此添加方法
}

// 示例: JsonSerializer 源生成
using System.Text.Json.Serialization;

[JsonSerializable(typeof(Product))]
[JsonSerializable(typeof(List<Product>))]
internal partial class AppJsonContext : JsonSerializerContext
{
}

// 使用
var json = JsonSerializer.Serialize(product, AppJsonContext.Default.Product);
```

## C# 13 新特性（.NET 9）

```csharp
// params 集合：不再限于数组，支持 Span<T> / IEnumerable<T> 等任何有 Add 方法的集合
public void Concat<T>(params ReadOnlySpan<T> items)
{
    foreach (var item in items) Console.Write(item);
}
// 调用：Concat(1, 2, 3) — 编译器合成存储，零分配

// new lock 对象：System.Threading.Lock 比 Monitor 更快
// lock 语句识别 Lock 类型，自动用新 API
private readonly Lock _sync = new();
public void Update()
{
    lock (_sync) { /* 临界区 */ }
}

// \e 转义：ESCAPE 字符（替代 \u001b / \x1b）
var ansiColor = "\e[31m红字\e[0m";

// partial properties：源生成器场景（如 MVVM Toolkit）可分部声明属性
public partial class ViewModel
{
    public partial string Name { get; set; }  // 声明
}
// 另一分部文件提供实现（常由源生成器生成）

// 重载解析优先级：库作者标记优选重载（OverloadResolutionPriority）
[OverloadResolutionPriority(1)]
public static T Read<T>(ReadOnlySpan<byte> s) where T : struct => default;
[OverloadResolutionPriority(0)]  // 旧重载降级，不破坏既有调用
public static T Read<T>(byte[] b) where T : struct => default;
```

## C# 14 新特性（.NET 10 LTS）

```csharp
// field 上下文关键字：属性访问器内访问编译器合成的后备字段，无需显式声明
public class Service
{
    public string Message
    {
        get;
        set => field = value ?? throw new ArgumentNullException(nameof(value));
    }
}
// 注意：类内若有名为 field 的字段会遮蔽；用 @field 或 this.field 消歧

// extension members：新语法声明扩展属性/方法/静态成员/运算符
// 取代旧 static 方法 + this 参数 的扩展方法语法
public static class EnumerableExt
{
    extension<TSource>(IEnumerable<TSource> source)
    {
        public bool IsEmpty => !source.Any();           // 扩展属性
        public IEnumerable<TSource> Where(Func<TSource, bool> p) { ... }  // 扩展方法
    }
    extension<TSource>(IEnumerable<TSource>)  // 接收类型 only = 静态扩展成员
    {
        public static IEnumerable<TSource> Identity => Enumerable.Empty<TSource>();
    }
}

// null 条件赋值：?. / ?[] 可在赋值左侧
customer?.Order = GetCurrentOrder();  // customer 非空才赋值，右表达式才求值

// partial 构造函数和事件：源生成器可分部实现
public partial class Entity
{
    public partial Entity(int id);  // 声明
}

//nameof 支持未绑定泛型：nameof(List<>) == "List"
var typeName = nameof(List<>);

// lambda 参数修饰符无需显式类型
TryParse<int> parse = (text, out result) => int.TryParse(text, out result);
```

> C# 13/14 的 ref struct 增强（`allows ref struct` 泛型约束、ref struct 实现接口、async/iterator 内 ref local）属高性能场景，详见 `references/performance.md`。

## 用 Record 实现可区分联合

> 注意：以下为 **discriminated union（可区分联合）风格**的另一种 `Result<T>` 实现，与 `error-handling.md` 中作为权威定义的属性式 `record Result<T>`（`Success(T)` / `Failure(string)` 静态工厂 + `IsSuccess` / `Value` / `Error` 属性）是**两套不同的 API**。
> 二者不可混用：调用方需与定义方对齐。若只需标准 Result 模式，请以 `error-handling.md` 的属性式定义为准。

```csharp
// Result 模式（可区分联合风格）
public abstract record Result<T>
{
    public record Success(T Value) : Result<T>;
    public record Failure(string Error) : Result<T>;
}

// 使用
public Result<User> GetUser(int id) =>
    _repository.Find(id) is User user
        ? new Result<User>.Success(user)
        : new Result<User>.Failure("User not found");

// 对结果做模式匹配
var message = GetUser(id) switch
{
    Result<User>.Success(var user) => $"找到: {user.Name}",
    Result<User>.Failure(var error) => $"错误: {error}",
    _ => "未知"
};
```

## 快速参考

| 特性 | C# 版本 | 示例 |
|------|---------|------|
| 文件范围命名空间 | C# 10 | `namespace MyApp;` |
| 主构造函数 | C# 12 | `class Service(ILogger logger)` |
| required 成员 | C# 11 | `public required string Name { get; init; }` |
| 原始字符串字面量 | C# 11 | `var s = """ 多行 """;` |
| 列表模式 | C# 11 | `[1, 2, .., var last]` |
| 集合表达式 | C# 12 | `int[] x = [1, 2, 3];` |
| `params` 集合 | C# 13 | `void M(params ReadOnlySpan<T> items)` |
| `System.Threading.Lock` | C# 13 | `private readonly Lock _sync = new();` |
| `\e` 转义 | C# 13 | `"\e[31m"` |
| partial properties | C# 13 | `public partial string Name { get; set; }` |
| `field` 关键字 | C# 14 | `set => field = value ?? throw ...;` |
| extension members | C# 14 | `extension<T>(IEnumerable<T> s) { ... }` |
| null 条件赋值 | C# 14 | `obj?.Prop = value;` |
| Init-only 属性 | C# 9 | `public string Name { get; init; }` |
| Record 类型 | C# 9 | `record Person(string Name);` |

> 版本对应：C# 12 = .NET 8，C# 13 = .NET 9，C# 14 = .NET 10。按项目 `<TargetFramework>` 选可用特性。
