"""Runtime integration coverage for the compiled Roslyn analyzer path.

The regular unit suite remains usable without the .NET SDK or build artifacts.
When the SDK and the analyzer DLL are available (as in CI after the build
step), this test verifies both the raw analyzer contract and the Python
fetcher-to-CodeIssue adapter.
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

SCRIPT_DIR = Path(__file__).resolve().parent.parent / "scripts"
ANALYZER_DIR = SCRIPT_DIR / "csharp-ast-analyzer"
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "RuntimeSmoke.cs"


def _built_analyzer() -> Path | None:
    candidates = sorted(
        ANALYZER_DIR.glob("bin/*/*/csharp-ast-analyzer.dll"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


@pytest.mark.skipif(shutil.which("dotnet") is None, reason=".NET SDK is unavailable")
def test_compiled_ast_analyzer_and_fetcher_contract():
    dll = _built_analyzer()
    if dll is None:
        pytest.skip("compiled AST analyzer is unavailable; run build-analyzers first")

    result = subprocess.run(
        ["dotnet", str(dll), str(FIXTURE)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=60,
    )
    assert result.returncode == 0, result.stderr

    payload = json.loads(result.stdout)
    assert payload["tool"] == "csharp-ast-analyzer"
    assert payload["files_scanned"] == 1
    assert any(
        diagnostic["code"] == "LEGACY_async_void"
        for diagnostic in payload["diagnostics"]
    )

    sys.path.insert(0, str(SCRIPT_DIR))
    from review.analyzer.fetcher import analyze_ast

    issues = analyze_ast([str(FIXTURE)], project_root=str(FIXTURE.parent))
    assert any(issue.rule == "LEGACY_async_void" for issue in issues)

    with tempfile.TemporaryDirectory(prefix="dotnet-review-no-project-") as temp_dir:
        isolated_fixture = Path(temp_dir) / FIXTURE.name
        shutil.copy2(FIXTURE, isolated_fixture)
        cli_result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT_DIR / "review.py"),
                "--target",
                temp_dir,
                "--skip-project",
                "--legacy-compat",
                "--format",
                "json",
                "--output-mode",
                "summary",
                "--fail-on",
                "none",
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=120,
            cwd=temp_dir,
        )
        assert cli_result.returncode == 0, cli_result.stderr
        report = json.loads(cli_result.stdout)
        integrity = report["review_integrity"]
        assert "semantic" not in integrity["layers_executed"]
        assert {
            "layer": "semantic",
            "reason": "no project or solution context",
        } in integrity["layers_skipped"]
        assert "semantic_compilation_errors" not in integrity

        sarif_result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT_DIR / "review.py"),
                "--target",
                temp_dir,
                "--skip-project",
                "--legacy-compat",
                "--format",
                "sarif",
                "--fail-on",
                "none",
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=120,
            cwd=temp_dir,
        )
        assert sarif_result.returncode == 0, sarif_result.stderr
        sarif = json.loads(sarif_result.stdout)
        assert sarif["version"] == "2.1.0"
        assert len(sarif["runs"]) == 1
        assert sarif["runs"][0]["tool"]["driver"]["name"] == "dotnet-code-review"
        assert sarif["runs"][0]["results"]
