# Build all Roslyn analyzers so engine.py can run them as DLLs (fast path)
# instead of `dotnet run` (which re-JITs on every call).
# Run from the skill root:  powershell -File scripts/build-analyzers.ps1
$ErrorActionPreference = "Stop"
# Analyzer projects live beside this script under the skill's scripts/ tree.
$root = $PSScriptRoot
$analyzers = @(
    "csharp-ast-analyzer",
    "csharp-semantic-analyzer",
    "csharp-project-analyzer"
)
foreach ($name in $analyzers) {
    $proj = Join-Path $root "$name\$name.csproj"
    Write-Host "Building $name..." -NoNewline
    $frameworkArgs = @()
    if ($name -eq "csharp-semantic-analyzer") {
        $sdkMajor = [int]((dotnet --version).Split('.')[0])
        $frameworkArgs = if ($sdkMajor -ge 8) { @("-f", "net8.0") } else { @("-f", "net6.0") }
    }
    # Use Process.ExitCode instead of relying on $LASTEXITCODE across a
    # redirected native-process pipeline.
    $process = Start-Process -FilePath "dotnet" `
        -ArgumentList (@("build", $proj, "-c", "Debug", "--nologo", "-v", "q") + $frameworkArgs) `
        -NoNewWindow -Wait -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAILED (exit $($process.ExitCode))" -ForegroundColor Red
        exit $process.ExitCode
    }
}
Write-Host "All analyzers built. engine.py will use the DLL fast path." -ForegroundColor Green
