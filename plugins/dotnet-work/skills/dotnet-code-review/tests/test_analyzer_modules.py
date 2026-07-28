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
from review.analyzer.fetcher import (
    dotnet_available,
    _normalize_review_path,
    _chunk_file_args,
    _write_file_list,
)
from review.engine import analyze_complexity


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
