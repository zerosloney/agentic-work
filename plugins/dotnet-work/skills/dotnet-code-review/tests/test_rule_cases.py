"""Fixture-driven positive/negative regression tests for analyzer rules."""
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

import pytest
import yaml

SCRIPT_DIR = Path(__file__).resolve().parent.parent / "scripts"
CASES = Path(__file__).resolve().parent / "rule-cases.yml"
ANALYZER_DIR = SCRIPT_DIR / "csharp-ast-analyzer"


def _built_analyzer() -> Path | None:
    candidates = sorted(
        ANALYZER_DIR.glob("bin/*/*/csharp-ast-analyzer.dll"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


@pytest.mark.skipif(shutil.which("dotnet") is None, reason=".NET SDK is unavailable")
def test_ast_rule_positive_negative_cases():
    dll = _built_analyzer()
    if dll is None:
        pytest.skip("compiled AST analyzer is unavailable; run build-analyzers first")

    cases = yaml.safe_load(CASES.read_text(encoding="utf-8"))
    assert cases, "rule-cases.yml must contain at least one case"

    with tempfile.TemporaryDirectory(prefix="dotnet-review-rule-cases-") as temp_dir:
        files = []
        expected_by_file = {}
        for index, case in enumerate(cases):
            for polarity in ("positive", "negative"):
                path = Path(temp_dir) / f"case_{index}_{polarity}.cs"
                path.write_text(case[polarity], encoding="utf-8")
                files.append(str(path))
                expected_by_file[path.name] = (
                    case["id"] if polarity == "positive" else None
                )

        result = subprocess.run(
            ["dotnet", str(dll), *files],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=120,
        )
        assert result.returncode == 0, result.stderr
        diagnostics = json.loads(result.stdout)["diagnostics"]
        rules_by_file: dict[str, set[str]] = {}
        for diagnostic in diagnostics:
            rules_by_file.setdefault(Path(diagnostic["file"]).name, set()).add(
                diagnostic["code"]
            )

        for filename, expected_rule in expected_by_file.items():
            observed = rules_by_file.get(filename, set())
            if expected_rule:
                assert expected_rule in observed, (
                    f"positive case {filename} did not emit {expected_rule}: {observed}"
                )
            else:
                positive_rules = {
                    case["id"] for case in cases
                }
                assert not (observed & positive_rules), (
                    f"negative case {filename} emitted {observed & positive_rules}"
                )
