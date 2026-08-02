"""Solution-aware Semantic analyzer integration coverage."""
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT_DIR = Path(__file__).resolve().parent.parent / "scripts"
SOLUTION_DIR = Path(__file__).resolve().parent / "fixtures" / "SolutionSmoke"
SOLUTION = SOLUTION_DIR / "SolutionSmoke.sln"
APP_FILE = SOLUTION_DIR / "App" / "AppType.cs"
SEMANTIC_DIR = SCRIPT_DIR / "csharp-semantic-analyzer"
MSBUILD_SOLUTION_DIR = Path(__file__).resolve().parent / "fixtures" / "MsBuildWorkspaceSmoke"
MSBUILD_SOLUTION = MSBUILD_SOLUTION_DIR / "MsBuildWorkspaceSmoke.sln"
MSBUILD_PROJECT = MSBUILD_SOLUTION_DIR / "MsBuildWorkspaceSmoke" / "MsBuildWorkspaceSmoke.csproj"
MSBUILD_FILE = MSBUILD_SOLUTION_DIR / "MsBuildWorkspaceSmoke" / "WorkspaceType.cs"


def _built_semantic() -> Path | None:
    candidates = sorted(
        SEMANTIC_DIR.glob("bin/*/*/csharp-semantic-analyzer.dll"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


def _built_semantic_net8() -> Path | None:
    candidates = sorted(
        (SEMANTIC_DIR / "bin" / "Debug" / "net8.0").glob("csharp-semantic-analyzer.dll"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


@pytest.mark.skipif(shutil.which("dotnet") is None, reason=".NET SDK is unavailable")
def test_solution_project_reference_is_resolved():
    dll = _built_semantic()
    if dll is None:
        pytest.skip("compiled semantic analyzer is unavailable; run build-analyzers first")

    build = subprocess.run(
        ["dotnet", "build", str(SOLUTION), "--nologo", "-v", "q"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=120,
    )
    assert build.returncode == 0, build.stdout + build.stderr

    sys.path.insert(0, str(SCRIPT_DIR))
    from review.analyzer.fetcher import analyze_semantic

    issues, extra = analyze_semantic(
        [str(APP_FILE.resolve())],
        project_root=str(SOLUTION_DIR),
        incremental=False,
        solution_path=str(SOLUTION),
    )

    assert extra.get("compilation_error_count", 0) == 0
    assert any(issue.rule == "SEM_NULLFORGIVING" for issue in issues)


@pytest.mark.skipif(shutil.which("dotnet") is None, reason=".NET SDK is unavailable")
def test_msbuild_workspace_evaluates_conditions_generated_sources_and_redirected_outputs():
    dll = _built_semantic_net8()
    if dll is None:
        pytest.skip("net8 MSBuildWorkspace analyzer is unavailable; run build-analyzers first")

    build = subprocess.run(
        ["dotnet", "build", str(MSBUILD_SOLUTION), "--nologo", "-c", "Debug", "-v", "q"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=120,
    )
    assert build.returncode == 0, build.stdout + build.stderr

    generated = MSBUILD_SOLUTION_DIR / "artifacts" / "obj" / "Debug" / "Generated" / "WorkspaceGenerated.g.cs"
    output = MSBUILD_SOLUTION_DIR / "artifacts" / "bin" / "Debug" / "net8.0" / "MsBuildWorkspaceSmoke.dll"
    assert generated.exists()
    assert output.exists()

    sys.path.insert(0, str(SCRIPT_DIR))
    from review.analyzer.fetcher import analyze_semantic

    issues, extra = analyze_semantic(
        [str(MSBUILD_FILE.resolve())],
        project_root=str(MSBUILD_SOLUTION_DIR),
        incremental=False,
        solution_path=str(MSBUILD_SOLUTION),
    )

    assert extra.get("compilation_error_count", 0) == 0
    workspace = extra.get("semantic_workspace", {})
    assert workspace.get("used") is True
    assert workspace.get("evaluated_compile_items", 0) >= 3
    assert workspace.get("generated_compile_items", 0) >= 1
    assert any(issue.rule == "SEM_NULLFORGIVING" for issue in issues)
