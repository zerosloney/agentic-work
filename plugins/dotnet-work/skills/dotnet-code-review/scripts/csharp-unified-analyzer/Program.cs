/// Unified C# Analyzer — combines AST + Semantic + Project analysis in one process.
/// Replaces csharp-ast-analyzer, csharp-semantic-analyzer, csharp-project-analyzer.
///
/// Usage: dotnet run -- --file-list <path> [--mode ast|semantic|project|all] [--solution <path>]
///
/// Output: JSON with { "tool": "unified", "phase": "all", "diagnostics": [...], "findings": [...] }

using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Text.Json.Serialization.Metadata;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

// ── Args ──
var files = new List<string>();
string mode = "all";
string? solutionPath = null;
string? fileListPath = null;

for (int i = 0; i < args.Length; i++)
{
    switch (args[i])
    {
        case "--file-list" when i + 1 < args.Length:
            fileListPath = args[++i];
            if (File.Exists(fileListPath))
                files.AddRange(File.ReadAllLines(fileListPath).Where(l => File.Exists(l.Trim())));
            break;
        case "--mode" when i + 1 < args.Length:
            mode = args[++i];
            break;
        case "--solution" when i + 1 < args.Length:
            solutionPath = args[++i];
            break;
        default:
            if (!args[i].StartsWith("--") && File.Exists(args[i]))
                files.Add(args[i]);
            break;
    }
}

files = files.Distinct().ToList();
if (files.Count == 0)
{
    Console.Error.WriteLine("{\"error\": \"No valid .cs files provided\"}");
    return 1;
}

var allDiagnostics = new List<DiagnosticItem>();
var allFindings = new List<object>();

// ── Phase 1: AST Analysis ──
if (mode is "ast" or "all")
{
    foreach (var file in files)
    {
        try
        {
            var code = File.ReadAllText(file);
            var tree = CSharpSyntaxTree.ParseText(code);
            var root = await tree.GetRootAsync();
            var walker = new AstPatternWalker(file);
            walker.Visit(root);
            foreach (var d in walker.Diagnostics)
                allDiagnostics.Add(d);
        }
        catch (Exception ex)
        {
            allDiagnostics.Add(new DiagnosticItem(
                code: "PARSE_ERROR",
                message: ex.Message,
                line: 1,
                severity: "info",
                source_file: file,
                source: "ast"
            ));
        }
    }
}

// ── Phase 2: Semantic Analysis ──
if (mode is "semantic" or "all")
{
    try
    {
        var compilation = CreateCompilation(files);
        if (compilation != null)
        {
            foreach (var tree in compilation.SyntaxTrees)
            {
                var semanticModel = compilation.GetSemanticModel(tree);
                var file = tree.FilePath;
                var root = await tree.GetRootAsync();
                var walker = new SemanticWalker(file, semanticModel);
                walker.Visit(root);
                foreach (var d in walker.Diagnostics)
                    allDiagnostics.Add(d);
            }
        }
    }
    catch (Exception ex)
    {
        allDiagnostics.Add(new DiagnosticItem(
            code: "SEM_ERROR",
            message: ex.Message,
            line: 0,
            severity: "info",
            source_file: "",
            source: "semantic"
        ));
    }
}

// ── Phase 3: Project Analysis ──
if (mode is "project" or "all")
{
    var projectWalker = new ProjectWalker(files);
    projectWalker.Analyze();
    foreach (var f in projectWalker.Findings)
        allFindings.Add(f);
}

// ── Output ──
var output = new UnifiedOutput(
    tool: "csharp-unified-analyzer",
    phase: mode,
    files_scanned: files.Count,
    diagnostics: allDiagnostics.Count > 0 ? allDiagnostics : null,
    findings: allFindings.Count > 0 ? allFindings : null,
    compilation_error_count: 0
);

Console.WriteLine(JsonSerializer.Serialize(output, AppJsonContext.Default.UnifiedOutput));
return 0;

// ── Helpers ──

CSharpCompilation? CreateCompilation(List<string> files)
{
    try
    {
        var trees = new List<SyntaxTree>();
        foreach (var f in files)
        {
            var code = File.ReadAllText(f);
            trees.Add(CSharpSyntaxTree.ParseText(code, path: f));
        }
        var references = new[]
        {
            MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
            MetadataReference.CreateFromFile(typeof(Console).Assembly.Location),
        };
        return CSharpCompilation.Create("review", trees, references,
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
    }
    catch
    {
        return null;
    }
}

// ── AST Walker ──

class AstPatternWalker : CSharpSyntaxWalker
{
    private readonly string _file;
    public List<DiagnosticItem> Diagnostics { get; } = new();

    public AstPatternWalker(string file) { _file = file; }

    public override void VisitUsingDirective(UsingDirectiveSyntax node)
    {
        var name = node.Name?.ToString() ?? "";
        if (name.StartsWith("Newtonsoft.Json"))
        {
            Add("BP023", "warning", "best-practice",
                $"Newtonsoft.Json using found in {_file}. Consider System.Text.Json for new code.");
        }
        if (name.StartsWith("System.Web"))
        {
            Add("BP021", "warning", "best-practice",
                "System.Web is legacy. Use ASP.NET Core packages.");
        }
        base.VisitUsingDirective(node);
    }

    public override void VisitObjectCreationExpression(ObjectCreationExpressionSyntax node)
    {
        var typeStr = node.Type.ToString();
        if (typeStr == "HttpClient")
        {
            Add("BP022", "warning", "best-practice",
                "new HttpClient() should be avoided. Use IHttpClientFactory or injected HttpClient.",
                node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
        }
        if (typeStr == "Thread")
        {
            Add("BP021", "warning", "best-practice",
                "new Thread() should use Task.Run or ThreadPool instead.",
                node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
        }
        if (typeStr.Contains("SqlConnection") && node.ArgumentList?.Arguments.Count > 0)
        {
            Add("SEC001", "error", "security",
                "SQL connection with inline connection string. Use IConfiguration.",
                node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
        }
        base.VisitObjectCreationExpression(node);
    }

    public override void VisitAttribute(AttributeSyntax node)
    {
        var name = node.Name.ToString();
        if (name.Contains("Authorize") && node.ArgumentList?.Arguments.Count > 0)
        {
            foreach (var arg in node.ArgumentList.Arguments)
            {
                var exprStr = arg.Expression.ToString();
                if (exprStr.StartsWith("\"") && exprStr.EndsWith("\"") && exprStr.Length > 2)
                {
                    Add("SEC003", "warning", "security",
                        $"Hardcoded role/policy in [Authorize]: {exprStr}. Consider using policy names.",
                        node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
                }
            }
        }
        base.VisitAttribute(node);
    }

    public override void VisitLiteralExpression(LiteralExpressionSyntax node)
    {
        if (node.IsKind(SyntaxKind.StringLiteralExpression))
        {
            var value = node.Token.ValueText ?? "";
            if (Regex.IsMatch(value, @"(password|pwd|secret|key|token|connectionstring)\s*=\s*\w+", RegexOptions.IgnoreCase)
                && !node.Parent?.ToString().Contains("nameof(") == true)
            {
                Add("SEC002", "error", "security",
                    "Possible hardcoded secret in string literal.",
                    node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
            }
        }
        base.VisitLiteralExpression(node);
    }

    public override void VisitMethodDeclaration(MethodDeclarationSyntax node)
    {
        var methodName = node.Identifier.Text;
        // LEGACY_BP007: sync-over-async
        if (node.Body != null)
        {
            var bodyStr = node.Body.ToString();
            if (bodyStr.Contains(".Result") || bodyStr.Contains(".Wait()") || bodyStr.Contains("GetAwaiter().GetResult()"))
            {
                Add("BP007", "error", "best-practice",
                    $"Method '{methodName}' blocks on async code (.Result/.Wait()). Use await instead.",
                    node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
            }
        }
        // async void
        if (node.Modifiers.Any(SyntaxKind.AsyncKeyword) && node.ReturnType is PredefinedTypeSyntax pred && pred.Keyword.IsKind(SyntaxKind.VoidKeyword))
        {
            Add("BP008", "error", "best-practice",
                $"Method '{methodName}' is async void. Use async Task instead.",
                node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
        }
        base.VisitMethodDeclaration(node);
    }

    public override void VisitInvocationExpression(InvocationExpressionSyntax node)
    {
        var exprStr = node.Expression.ToString();
        if (exprStr.EndsWith(".ConfigureAwait(false)") == false &&
            (exprStr.Contains(".Result") || exprStr.Contains(".Wait()")))
        {
            Add("BP007", "warning", "best-practice",
                "Blocking on async code detected. Use await instead.",
                node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
        }
        base.VisitInvocationExpression(node);
    }

    private void Add(string code, string severity, string category, string message, int? line = null)
    {
        Diagnostics.Add(new DiagnosticItem(
            code: code,
            message: message,
            line: line ?? 1,
            severity: severity,
            source_file: _file,
            source: "ast",
            category: category
        ));
    }
}

// ── Semantic Walker ──

class SemanticWalker : CSharpSyntaxWalker
{
    private readonly string _file;
    private readonly SemanticModel _model;
    public List<DiagnosticItem> Diagnostics { get; } = new();

    public SemanticWalker(string file, SemanticModel model)
    {
        _file = file;
        _model = model;
    }

    public override void VisitMethodDeclaration(MethodDeclarationSyntax node)
    {
        var symbol = _model.GetDeclaredSymbol(node);
        if (symbol != null)
        {
            // SEM001: Unused parameter
            foreach (var param in symbol.Parameters)
            {
                var refs = node.DescendantNodes().OfType<IdentifierNameSyntax>()
                    .Where(i => i.Identifier.Text == param.Name);
                if (!refs.Any())
                {
                    Add("SEM001", "warning", "semantic",
                        $"Parameter '{param.Name}' appears unused.",
                        node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
                }
            }
            // SEM002: Method too many parameters
            if (symbol.Parameters.Length > 5)
            {
                Add("SEM002", "warning", "semantic",
                    $"Method '{symbol.Name}' has {symbol.Parameters.Length} parameters (max 5).",
                    node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
            }
        }
        base.VisitMethodDeclaration(node);
    }

    public override void VisitPropertyDeclaration(PropertyDeclarationSyntax node)
    {
        var symbol = _model.GetDeclaredSymbol(node);
        if (symbol is IPropertySymbol prop)
        {
            // SEM003: Public set without validation
            if (prop.SetMethod?.DeclaredAccessibility == Accessibility.Public &&
                prop.GetMethod?.DeclaredAccessibility == Accessibility.Public &&
                !node.Modifiers.Any(SyntaxKind.PrivateKeyword) &&
                !node.Modifiers.Any(SyntaxKind.ProtectedKeyword) &&
                !node.Modifiers.Any(SyntaxKind.InternalKeyword))
            {
                // Check if class has validation attributes
                var parentClass = node.FirstAncestorOrSelf<ClassDeclarationSyntax>();
                if (parentClass != null)
                {
                    var hasValidation = parentClass.DescendantNodes()
                        .OfType<AttributeSyntax>()
                        .Any(a => a.Name.ToString().Contains("Validator"));
                    if (!hasValidation)
                    {
                        Add("SEM003", "info", "semantic",
                            $"Public set on '{prop.Name}' without validation.",
                            node.GetLocation().GetLineSpan().StartLinePosition.Line + 1);
                    }
                }
            }
        }
        base.VisitPropertyDeclaration(node);
    }

    private void Add(string code, string severity, string category, string message, int line)
    {
        Diagnostics.Add(new DiagnosticItem(
            code: code,
            message: message,
            line: line,
            severity: severity,
            source_file: _file,
            source: "semantic",
            category: category
        ));
    }
}

// ── Project Walker ──

class ProjectWalker
{
    private readonly List<string> _files;
    public List<object> Findings { get; } = new();

    public ProjectWalker(List<string> files) { _files = files; }

    public void Analyze()
    {
        // ARCH001: Detect potential God Classes
        foreach (var file in _files)
        {
            try
            {
                var code = File.ReadAllText(file);
                var tree = CSharpSyntaxTree.ParseText(code);
                var root = tree.GetRoot();
                var classDecls = root.DescendantNodes().OfType<ClassDeclarationSyntax>();
                foreach (var cls in classDecls)
                {
                    var memberCount = cls.Members.Count;
                    if (memberCount > 20)
                    {
                        Findings.Add(new Dictionary<string, object>
                        {
                            ["file"] = file,
                            ["line"] = cls.GetLocation().GetLineSpan().StartLinePosition.Line + 1,
                            ["code"] = "ARCH001",
                            ["severity"] = "warning",
                            ["category"] = "architecture",
                            ["message"] = $"Class '{cls.Identifier.Text}' has {memberCount} members (threshold 20). Consider splitting.",
                            ["source"] = "project"
                        });
                    }
                }
            }
            catch { /* skip unparseable files */ }
        }

        // LAYER001: Detect potential layer violations (simplified)
        foreach (var file in _files)
        {
            var code = File.ReadAllText(file);
            if (code.Contains("using") && code.Contains("DAL") && code.Contains("UI"))
            {
                Findings.Add(new Dictionary<string, object>
                {
                    ["file"] = file,
                    ["line"] = 1,
                    ["code"] = "LAYER001",
                    ["severity"] = "error",
                    ["category"] = "architecture",
                    ["message"] = "Potential layer violation: UI references DAL directly.",
                    ["source"] = "project"
                });
            }
        }
    }
}

// ── AOT-safe JSON serialization ──
[JsonSourceGenerationOptions(WriteIndented = true, PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
[JsonSerializable(typeof(UnifiedOutput))]
[JsonSerializable(typeof(DiagnosticItem))]
internal partial class AppJsonContext : JsonSerializerContext { }

record DiagnosticItem(string code, string message, int line, string severity, string source_file, string? source = null, string? suggestion = null, string? category = null);

record UnifiedOutput(
    string tool,
    string phase,
    int files_scanned,
    List<DiagnosticItem>? diagnostics,
    List<object>? findings,
    int compilation_error_count
);
