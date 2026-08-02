"""Real Semantic/Project/Build analyzer integration coverage."""
import shutil
import subprocess
from pathlib import Path

import pytest

SCRIPT_DIR = Path(__file__).resolve().parent.parent / "scripts"
FIXTURE_DIR = Path(__file__).resolve().parent / "fixtures" / "IntegrationSmoke"
PROJECT = FIXTURE_DIR / "IntegrationSmoke.csproj"
SOURCE_FILES = sorted(FIXTURE_DIR.glob("*.cs"))


def _built(name: str) -> Path | None:
    analyzer_dir = SCRIPT_DIR / name
    candidates = sorted(
        analyzer_dir.glob(f"bin/*/*/{name}.dll"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


@pytest.mark.skipif(shutil.which("dotnet") is None, reason=".NET SDK is unavailable")
def test_semantic_project_and_build_contracts():
    required = ["csharp-semantic-analyzer", "csharp-project-analyzer"]
    missing = [name for name in required if _built(name) is None]
    if missing:
        pytest.skip(f"compiled analyzer(s) unavailable: {', '.join(missing)}")

    build_fixture = subprocess.run(
        ["dotnet", "build", str(PROJECT), "--nologo", "-v", "q"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=120,
    )
    assert build_fixture.returncode == 0, build_fixture.stdout + build_fixture.stderr

    import sys

    sys.path.insert(0, str(SCRIPT_DIR))
    from review.analyzer.fetcher import analyze_build, analyze_project, analyze_semantic

    files = [str(path.resolve()) for path in SOURCE_FILES]
    semantic_issues, semantic_extra = analyze_semantic(
        files,
        project_root=str(FIXTURE_DIR),
        incremental=False,
    )
    assert semantic_extra.get("compilation_error_count", 0) == 0
    assert any(issue.rule == "SEM_NULLFORGIVING" for issue in semantic_issues)

    project = analyze_project(files)
    assert project["tool"] == "csharp-project-analyzer"
    assert project["total_files"] == len(files)
    assert project["total_dependencies"] >= 1

    build_issues, build_info = analyze_build(
        PROJECT.name,
        str(FIXTURE_DIR),
        framework_type="modern",
        enable_netanalyzers=True,
    )
    assert build_info["injected"] is True
    assert not any(issue.severity == "error" for issue in build_issues)
