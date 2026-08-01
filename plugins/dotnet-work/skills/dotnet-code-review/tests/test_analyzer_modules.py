"""E2E tests for analyzer/ subpackage (fetcher, triage, reporter).

Tests verify:
- Module imports work after refactor
- Triage classification and suppression logic
- Report assembly produces valid structure
- Complexity analysis (compat API)
"""
import sys
import os
import json
import pytest
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add scripts/ to sys.path so we can import review modules
SCRIPT_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPT_DIR))

from review.models import CodeIssue
from review.analyzer.triage import (
    classify_rule,
    suppress_ast_semantic_overlap,
    apply_suppressions,
    load_suppressions,
    load_verdicts,
    apply_verdicts,
    _matches_suppression,
    _glob_match,
    _rule_family,
)
from review.analyzer.reporter import build_report
from review.evidence import build_review_integrity
from review.scoring import calculate_score
from review.diff_baseline import compute_diff
from review.cli import _calculate_exit_code
from review.output import format_json
from review.analyzer.fetcher import (
    dotnet_available,
    dotnet_sdk_meets_minimum,
    _normalize_review_path,
    _chunk_file_args,
    _write_file_list,
)
from review.engine import analyze_complexity
from review.cache import inputs_fingerprint, load_result_cache, save_result_cache
from review.test_quality import analyze_test_quality
from review.security import analyze_security_text, enrich_security_metadata
from review.specialized import analyze_specialized
from review.configuration import apply_team_config, load_rule_packages
from review.pr_comments import render_github_comments, render_azure_comments
from review.history import build_trend_report, format_trend_markdown


# ============================================================
# Fixtures
# ============================================================


@pytest.fixture
def sample_issue():
    """Create a sample CodeIssue for testing."""
    return CodeIssue(
        file="src/Services/OrderService.cs",
        line=42,
        column=0,
        severity="error",
        category="security",
        rule="SEC001",
        message="SQL injection risk",
        source="ast",
        suggestion="Use parameterized query",
    )


@pytest.fixture
def sample_issues():
    """Create a list of sample CodeIssues."""
    return [
        CodeIssue(file="a.cs", line=10, column=0, severity="error", category="security",
                  rule="SEC001", message="SQL injection", source="ast", suggestion="Fix"),
        CodeIssue(file="a.cs", line=20, column=0, severity="warning", category="best-practice",
                  rule="BP021", message="Use Task.Run", source="ast", suggestion="Fix"),
        CodeIssue(file="b.cs", line=5, column=0, severity="info", category="style",
                  rule="S001", message="TODO without author", source="style", suggestion="Add author"),
        CodeIssue(file="a.cs", line=10, column=0, severity="error", category="security",
                  rule="SEC001", message="SQL injection", source="semantic", suggestion="Fix"),
        CodeIssue(file="c.cs", line=100, column=0, severity="warning", category="architecture",
                  rule="ARCH001", message="God class", source="project", suggestion="Split"),
    ]


# ============================================================
# Triage: classify_rule
# ============================================================


class TestClassifyRule:
    """Test rule classification into categories."""

    def test_security_rules(self):
        assert classify_rule("SEC001") == "security"
        assert classify_rule("LEGACY_SEC_hardcoded_secret") == "security"

    def test_best_practice_rules(self):
        assert classify_rule("BP021") == "best-practice"
        assert classify_rule("LEGACY_BP007_sync_wait") == "best-practice"
        assert classify_rule("CA1050") == "best-practice"

    def test_complexity_rules(self):
        assert classify_rule("CC001") == "complexity"
        assert classify_rule("LEGACY_CC001_complexity") == "complexity"

    def test_performance_rules(self):
        assert classify_rule("P021") == "performance"
        assert classify_rule("LEGACY_P001_perf") == "performance"

    def test_style_rules(self):
        assert classify_rule("S001") == "style"
        assert classify_rule("IDE0001") == "style"

    def test_semantic_rules(self):
        assert classify_rule("SEM001") == "semantic"
        assert classify_rule("EF001") == "reliability"

    def test_architecture_rules(self):
        assert classify_rule("ARCH001") == "architecture"
        assert classify_rule("LAYER001") == "architecture"

    def test_compiler_rules(self):
        assert classify_rule("CS0168") == "reliability"

    def test_duplication_rules(self):
        assert classify_rule("DUP001") == "best-practice"

    def test_unknown_rule_defaults(self):
        assert classify_rule("UNKNOWN_RULE") == "best-practice"


# ============================================================
# Triage: AST/SEM overlap suppression
# ============================================================


class TestSuppressAstSemanticOverlap:
    """Test AST issue suppression when semantic confirms."""

    def test_suppresses_matching_ast_issue(self):
        ast = [CodeIssue(file="a.cs", line=10, severity="error", category="security",
                         rule="SEC001", message="test", source="ast", suggestion="")]
        sem = [CodeIssue(file="a.cs", line=10, severity="error", category="security",
                          rule="SEC001", message="test", source="semantic", suggestion="")]
        filtered, count = suppress_ast_semantic_overlap(ast, sem)
        assert count == 1
        assert len(filtered) == 0

    def test_keeps_non_matching_ast_issue(self):
        ast = [CodeIssue(file="a.cs", line=10, severity="error", category="security",
                         rule="SEC001", message="test", source="ast", suggestion="")]
        sem = [CodeIssue(file="b.cs", line=20, severity="error", category="security",
                          rule="SEC002", message="test", source="semantic", suggestion="")]
        filtered, count = suppress_ast_semantic_overlap(ast, sem)
        assert count == 0
        assert len(filtered) == 1

    def test_empty_inputs(self):
        assert suppress_ast_semantic_overlap([], []) == ([], 0)
        # When semantic is empty, all AST issues are kept
        mock_issue = MagicMock()
        result, count = suppress_ast_semantic_overlap([mock_issue], [])
        assert count == 0
        assert len(result) == 1

    def test_different_lines_not_suppressed(self):
        ast = [CodeIssue(file="a.cs", line=10, severity="error", category="security",
                         rule="SEC001", message="test", source="ast", suggestion="")]
        sem = [CodeIssue(file="a.cs", line=20, severity="error", category="security",
                          rule="SEC001", message="test", source="semantic", suggestion="")]
        filtered, count = suppress_ast_semantic_overlap(ast, sem)
        assert count == 0
        assert len(filtered) == 1


# ============================================================
# Triage: User suppressions
# ============================================================


class TestApplySuppressions:
    """Test user-defined suppression logic."""

    def test_suppresses_matching_rule(self, sample_issues):
        suppressions = [{"rule": "SEC001", "reason": "false positive"}]
        kept, count = apply_suppressions(sample_issues, suppressions, "/tmp")
        # sample_issues has 2 SEC001 issues (one ast, one semantic)
        assert count == 2
        assert len(kept) == len(sample_issues) - 2
        assert all(i.rule != "SEC001" for i in kept)

    def test_no_suppressions(self, sample_issues):
        kept, count = apply_suppressions(sample_issues, [], "/tmp")
        assert count == 0
        assert len(kept) == len(sample_issues)

    def test_suppression_with_file_pattern(self, sample_issues):
        suppressions = [{"rule": "BP021", "file_pattern": "a.cs"}]
        kept, count = apply_suppressions(sample_issues, suppressions, "/tmp")
        # Only the BP021 in a.cs should be suppressed
        assert count == 1

    def test_suppression_with_line_range(self, sample_issues):
        suppressions = [{"rule": "S001", "line_from": 1, "line_to": 10}]
        kept, count = apply_suppressions(sample_issues, suppressions, "/tmp")
        # S001 is at line 5 in b.cs — within range
        assert count == 1


# ============================================================
# Triage: glob matching
# ============================================================


class TestGlobMatch:
    """Test glob pattern matching."""

    def test_star_wildcard(self):
        assert _glob_match("src/Services/OrderService.cs", "src/*.cs") is False
        assert _glob_match("OrderService.cs", "*.cs") is True

    def test_double_star_wildcard(self):
        assert _glob_match("src/Services/OrderService.cs", "**/*.cs") is True
        assert _glob_match("deep/nested/path/File.cs", "**/File.cs") is True

    def test_question_mark(self):
        assert _glob_match("File1.cs", "File?.cs") is True
        assert _glob_match("File10.cs", "File?.cs") is False

    def test_exact_match(self):
        assert _glob_match("ExactFile.cs", "ExactFile.cs") is True
        assert _glob_match("OtherFile.cs", "ExactFile.cs") is False


# ============================================================
# Triage: rule family extraction
# ============================================================


class TestRuleFamily:
    """Test rule family extraction."""

    def test_standard_codes(self):
        assert _rule_family("SEC001") == "SEC"
        assert _rule_family("BP021") == "BP"
        assert _rule_family("CS0168") == "CS"

    def test_underscore_prefix(self):
        assert _rule_family("LEGACY_SEC_hardcoded") == "LEGACY"

    def test_no_letters(self):
        assert _rule_family("123") == "123"


# ============================================================
# Fetcher: helpers
# ============================================================


class TestFetcherHelpers:
    """Test fetcher utility functions."""

    def test_normalize_review_path(self):
        result = _normalize_review_path("/home/user/project/src/File.cs", "/home/user/project")
        # Result should be relative path
        assert "src" in result
        assert "File.cs" in result
        assert not result.startswith("/home")

    def test_normalize_review_path_no_root(self):
        result = _normalize_review_path("/some/path/File.cs", "")
        assert result == "/some/path/File.cs"

    def test_chunk_file_args(self):
        long_list = [f"path/to/file{i}.cs" for i in range(100)]
        chunks = _chunk_file_args("test-analyzer", long_list)
        assert len(chunks) >= 1
        # Each chunk should be non-empty
        assert all(len(c) > 0 for c in chunks)

    def test_write_file_list(self):
        paths = ["file1.cs", "file2.cs", "file3.cs"]
        list_path = _write_file_list(paths)
        assert os.path.exists(list_path)
        content = Path(list_path).read_text()
        assert "file1.cs" in content
        assert "file2.cs" in content
        os.unlink(list_path)  # cleanup

    def test_sdk_minimum_is_version_aware(self, monkeypatch):
        monkeypatch.setattr(
            "review.analyzer.fetcher.get_dotnet_sdk_version",
            lambda: "5.0.408",
        )
        assert dotnet_sdk_meets_minimum(6) is False

        monkeypatch.setattr(
            "review.analyzer.fetcher.get_dotnet_sdk_version",
            lambda: "8.0.423",
        )
        assert dotnet_sdk_meets_minimum(6) is True


# ============================================================
# Reporter: build_report
# ============================================================


class TestBuildReport:
    """Test report assembly."""

    def test_builds_valid_report(self, sample_issues):
        report = build_report(
            project_root="/tmp/test",
            framework="net8.0",
            framework_type="modern",
            frameworks=["net8.0"],
            project_type="web",
            nuget_packages=[],
            project_metadata={},
            cs_files=["a.cs", "b.cs"],
            all_issues=sample_issues,
            layer_counts={"ast": 3, "semantic": 1, "project": 1},
            skipped_layer_details=[],
            executed_layers={"ast", "semantic", "project"},
            requested_layers={"ast", "semantic", "project"},
            sdk_present=True,
            cve_result=None,
            coverage_data={},
            netanalyzers_summary={"injected": True, "skipped_reason": None},
        )
        assert report["project_root"] == "/tmp/test"
        assert report["framework_version"] == "net8.0"
        assert report["files_scanned"] == 2
        assert report["total_issues"] == len(sample_issues)
        assert "score" in report
        assert "by_severity" in report
        assert "issues" in report
        assert "review_integrity" in report
        assert report["review_integrity"]["netanalyzers"]["injected_for_projects"] == 1

    def test_empty_issues_report(self):
        report = build_report(
            project_root="/tmp/test",
            framework="net8.0",
            framework_type="modern",
            frameworks=["net8.0"],
            project_type="unknown",
            nuget_packages=[],
            project_metadata={},
            cs_files=[],
            all_issues=[],
            layer_counts={},
            skipped_layer_details=[],
            requested_layers=set(),
            executed_layers=set(),
            sdk_present=True,
            cve_result=None,
            coverage_data={},
            netanalyzers_summary=None,
        )
        assert report["total_issues"] == 0
        assert report["files_scanned"] == 0

    def test_report_has_triage_summary(self, sample_issues):
        report = build_report(
            project_root="/tmp/test",
            framework="net8.0",
            framework_type="modern",
            frameworks=["net8.0"],
            project_type="web",
            nuget_packages=[],
            project_metadata={},
            cs_files=["a.cs"],
            all_issues=sample_issues,
            layer_counts={"ast": 3},
            skipped_layer_details=[],
            requested_layers={"ast"},
            executed_layers={"ast"},
            sdk_present=True,
            cve_result=None,
            coverage_data={},
            netanalyzers_summary=None,
        )
        assert "triage_summary" in report
        assert "deterministic" in report["triage_summary"]

    def test_report_exposes_phase_timings_and_mode(self):
        report = build_report(
            project_root="/tmp/test",
            framework="net8.0",
            framework_type="modern",
            frameworks=["net8.0"],
            project_type="unknown",
            nuget_packages=[],
            project_metadata={},
            cs_files=[],
            all_issues=[],
            layer_counts={},
            skipped_layer_details=[],
            requested_layers=set(),
            executed_layers=set(),
            sdk_present=True,
            cve_result=None,
            coverage_data={},
            netanalyzers_summary=None,
            phase_timings={"semantic": 0.25},
            review_mode="quick",
        )
        assert report["phase_timings"]["semantic"] == 0.25
        assert report["review_mode"] == "quick"


class TestResultCache:
    def test_result_cache_round_trip_and_fingerprint_changes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "A.cs"
            source.write_text("class A {}", encoding="utf-8")
            first = inputs_fingerprint([str(source)], salt="test")
            save_result_cache(temp_dir, "semantic-result", first, {"issues": []})
            assert load_result_cache(temp_dir, "semantic-result", first) == {"issues": []}
            source.write_text("class B {}", encoding="utf-8")
            second = inputs_fingerprint([str(source)], salt="test")
            assert second != first
            assert load_result_cache(temp_dir, "semantic-result", second) is None


class TestExtendedReviewLayers:
    def test_test_quality_reports_assertion_and_gap(self):
        files = ["src/OrderService.cs", "tests/OrderServiceTests.cs"]
        codes = {
            files[0]: "public class OrderService { public void Create() {} }",
            files[1]: "[Fact] public void CreateWorks() { var x = 1; }\n[Fact] public void CreateIsValid() { Assert.True(true); }",
        }
        issues, summary = analyze_test_quality(files, codes, "unknown")
        assert summary["test_methods"] == 2
        assert summary["assertion_ratio"] == 0.5
        assert any(issue.rule == "TESTQ001" for issue in issues)
        assert "OrderService" in summary["missing_test_types"]

    def test_team_config_and_rule_package(self):
        issue = CodeIssue(file="src/Generated/Api.cs", line=1, severity="warning", category="style", rule="TEAM001")
        kept, summary = apply_team_config(
            [issue],
            {"severity_overrides": {"TEAM001": "error"}, "exclude_paths": ["**/Generated/**"]},
            ".",
        )
        assert kept == []
        assert summary["suppressed"] == 1
        with tempfile.TemporaryDirectory() as temp_dir:
            package_dir = Path(temp_dir) / ".dotnet-review" / "rules"
            package_dir.mkdir(parents=True)
            (package_dir / "team.json").write_text(
                json.dumps({"rules": [{"id": "TEAM001", "pattern": "TODO"}]}),
                encoding="utf-8",
            )
            assert load_rule_packages(temp_dir) == [{"id": "TEAM001", "pattern": "TODO"}]

    def test_security_metadata_and_specialized_checks(self):
        codes = {
            "src/Api/OrdersController.cs": (
                "using Microsoft.AspNetCore;\n"
                "public class OrdersController { public IActionResult Get() => Ok(); }\n"
                "var c = new HttpClient(); Log.Warning(password);"
            )
        }
        security = analyze_security_text(codes)
        specialized = analyze_specialized(codes)
        all_issues = security + specialized
        enrich_security_metadata(all_issues)
        assert any(issue.rule == "SEC026_sensitive_data_logging" for issue in security)
        assert any(issue.rule == "ASP_API001" for issue in specialized)
        assert any(issue.rule == "MS001" for issue in specialized)
        assert any(issue.cwe == "CWE-532" for issue in all_issues)
        assert not any(issue.rule == "SEC028_cleartext_http" for issue in analyze_security_text({"a.cs": "https://api.example.test"}))

    def test_pr_payloads_and_trend_report(self):
        report = {"issues": [{"file": "src/A.cs", "line": 4, "severity": "error", "rule": "SEC026_sensitive_data_logging", "message": "secret log", "cwe": "CWE-532"}]}
        assert render_github_comments(report)[0]["line"] == 4
        assert render_azure_comments(report)[0]["threadContext"]["rightFileEnd"]["line"] == 4
        with tempfile.TemporaryDirectory() as temp_dir:
            history = Path(temp_dir) / "history.jsonl"
            history.write_text(
                json.dumps({"timestamp": "1", "score": 70, "total_issues": 3, "issue_rules": ["A"], "phase_timings": {"semantic": 2.0}}) + "\n"
                + json.dumps({"timestamp": "2", "score": 80, "total_issues": 1, "issue_rules": ["B"], "phase_timings": {"semantic": 1.0}}) + "\n",
                encoding="utf-8",
            )
            trend = build_trend_report(temp_dir)
            assert trend["quality"]["score_delta"] == 10
            assert trend["performance"]["average_phase_seconds"]["semantic"] == 1.5
            assert "趋势报告" in format_trend_markdown(trend)


# ============================================================
# Complexity Analyzer (compat API)
# ============================================================


class TestAnalyzeComplexity:
    """Test complexity analysis (compat API)."""

    def test_high_complexity_detection(self):
        code = """
public void ComplexMethod()
{
    if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) {
        if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) {
    } } } } } } }
    } } } } } }
}
"""
        issues = analyze_complexity("test.cs", code)
        assert len(issues) > 0

    def test_method_length_detection(self):
        body = "\n".join([f"    var x{i} = {i};" for i in range(110)])
        code = f"public void LongMethod()\n{{\n{body}\n}}"
        issues = analyze_complexity("test.cs", code)
        # Should detect CC002 (method length)
        assert any(i.rule == "CC002" for i in issues)

    def test_clean_code_no_issues(self):
        code = """
public void CleanMethod(int a, int b)
{
    var sum = a + b;
    if (sum > 0)
    {
        Console.WriteLine(sum);
    }
}
"""
        issues = analyze_complexity("test.cs", code)
        # Should have no errors (may have info-level suggestions)
        errors = [i for i in issues if i.severity == "error"]
        assert len(errors) == 0


class TestScoringAndIntegrity:
    def test_testability_is_scored_as_test(self):
        issue = CodeIssue(
            file="test.cs", line=1, severity="error", category="testability",
            rule="LEGACY_T016_datetime_now", message="test", source="ast",
        )
        assert calculate_score([issue])["test"] == 90

    def test_integrity_normalizes_netanalyzers_summary(self):
        integrity = build_review_integrity(
            sdk_present=True,
            sdk_version="8.0.423",
            requested_layers={"build"},
            executed_layers={"build"},
            skipped_layer_details=[],
            cve_result=None,
            cve_requested=False,
            coverage_data={},
            coverage_requested=False,
            netanalyzers_summary={"injected": False, "skipped_reason": "--skip-netanalyzers"},
        )
        assert integrity["dotnet_sdk_version"] == "8.0.423"
        assert integrity["netanalyzers"]["injected_for_projects"] == 0
        assert integrity["netanalyzers"]["disabled_by_user"] is True

    def test_baseline_classifies_introduced_and_fixed(self):
        current = [
            CodeIssue(
                file="src/New.cs", line=8, severity="warning",
                category="best-practice", rule="BP001", message="new",
                source="ast",
            ),
        ]
        baseline = [
            {
                "file": "src/Old.cs", "line": 3, "severity": "warning",
                "category": "style", "rule": "S001", "message": "old",
            },
        ]
        diff = compute_diff(current, baseline, "/project")
        assert [item["rule"] for item in diff["introduced"]] == ["BP001"]
        assert [item["rule"] for item in diff["fixed"]] == ["S001"]

    def test_introduced_gate_fails_without_valid_baseline(self):
        args = type("Args", (), {
            "fail_on": "none",
            "quality_gate_score": None,
            "fail_on_introduced": "error",
        })()
        assert _calculate_exit_code({}, args) != 0
        assert _calculate_exit_code(
            {"diff_baseline": {"error": "baseline report could not be loaded"}},
            args,
        ) != 0

    def test_json_output_is_utf8_safe(self):
        rendered = format_json({"message": "中文 ⚠️"})
        assert "中文" in rendered


# ============================================================
# Integration: module imports work
# ============================================================


class TestModuleImports:
    """Verify all new modules can be imported."""

    def test_analyzer_init(self):
        from review.analyzer import (
            dotnet_available, analyze_ast, analyze_semantic,
            classify_rule, apply_suppressions, build_report,
        )
        assert callable(dotnet_available)
        assert callable(analyze_ast)
        assert callable(analyze_semantic)
        assert callable(classify_rule)
        assert callable(apply_suppressions)
        assert callable(build_report)

    def test_re_exporter_engine(self):
        """Verify engine.py still exports moved functions."""
        from review.engine import (
            dotnet_available,
            analyze_ast,
            analyze_semantic,
            analyze_build,
            analyze_format,
            suppress_ast_semantic_overlap,
            apply_suppressions,
        )
        assert callable(dotnet_available)
        assert callable(analyze_ast)
