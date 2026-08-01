#!/usr/bin/env bash
# Build all Roslyn analyzers so engine.py can run them as DLLs (fast path)
# instead of `dotnet run` (which re-JITs on every call).
# Run from the skill root:  bash scripts/build-analyzers.sh
set -e
# Analyzer projects live beside this script under the skill's scripts/ tree.
ROOT="$(cd "$(dirname "$0")" && pwd)"
for name in csharp-ast-analyzer csharp-semantic-analyzer csharp-project-analyzer; do
    proj="$ROOT/$name/$name.csproj"
    echo -n "Building $name... "
    framework_args=()
    if [[ "$name" == "csharp-semantic-analyzer" ]]; then
        sdk_major="$(dotnet --version | cut -d. -f1)"
        if [[ "$sdk_major" -ge 8 ]]; then framework_args=(-f net8.0); else framework_args=(-f net6.0); fi
    fi
    if dotnet build "$proj" -c Debug --nologo -v q "${framework_args[@]}" >/dev/null 2>&1; then
        echo "OK"
    else
        echo "FAILED"
        exit 1
    fi
done
echo "All analyzers built. engine.py will use the DLL fast path."
