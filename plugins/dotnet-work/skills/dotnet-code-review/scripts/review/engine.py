"""engine.py — Main review orchestrator (run_review entry point).

Submodules handle specific concerns:
    analyzer/fetcher.py  — subprocess invocation of Roslyn/dotnet analyzers
    analyzer/triage.py   — issue classification, suppression, overlap handling
    analyzer/reporter.py — final report dict assembly
"""
from __future__ import annotations

import json
import logging
import os
import re
import concurrent.futures
import time
from collections.abc import Callable
from pathlib import Path

from .models import CodeIssue
from .files import (
    discover_files,
    get_diff_files,
    find_csproj_files,
)
from .framework import (
    parse_target_frameworks,
    classify_framework,
    detect_project_type,
    detect_nuget_packages,
    get_project_metadata,
    pick_strictest_framework,
    detect_framework_from_global_json,
    detect_framework_from_directory_build_props,
)
from .duplication import detect_duplicates
from .coverage import load_coverage, analyze_coverage
from .docs import check_xml_documentation
from .nuget import check_nuget_versions, check_nuget_cves
from .history import save_report_history
from .api_compat import check_api_compatibility
from .scoring import (
    calculate_score,
    count_by_severity,
    estimate_technical_debt,
    dedup_issues,
)
from .auto_fix import apply_all_auto_fixes
from .errors import UserInputError, ToolMissingError, ReviewError, ConfigError, safe_read_file

# ── analyzer/ subpackage ──
from .analyzer.fetcher import (
    dotnet_available,
    get_dotnet_sdk_version,
    analyze_ast,
    analyze_semantic,
    analyze_project,
    analyze_build,
    analyze_format,
    _project_findings_to_issues,
    _nuget_references_for_csproj,
    _expand_files_for_semantic_analysis,
)
from .analyzer.triage import (
    suppress_ast_semantic_overlap,
    load_suppressions,
    apply_suppressions,
    load_verdicts,
    apply_verdicts,
)
from .analyzer.reporter import build_report

logger = logging.getLogger("dotnet-review")


# ============================================================
# Complexity Analyzer (Layer 2, retained for tests / compat API)
# NOTE: The Python complexity layer is no longer invoked from run_review().
# These functions remain so that tests can exercise CC001-CC004 detection
# and method-metric extraction via `from review import analyze_complexity`.
# ============================================================


def analyze_complexity(filepath: str, code: str) -> list[CodeIssue]:
    """Analyze cyclomatic complexity, method length, parameter count, nesting depth."""
    issues: list[CodeIssue] = []
    lines = code.split("\n")
    methods = _extract_methods(lines)

    for method in methods:
        # CC001: Cyclomatic complexity
        if method["complexity"] > 20:
            issues.append(
                CodeIssue(
                    file=filepath,
                    line=method["start_line"],
                    column=1,
                    severity="error",
                    category="complexity",
                    rule="CC001",
                    message=f"Cyclomatic complexity of {method['complexity']} in '{method['name']}' exceeds threshold (20)",
                    source="complexity",
                    suggestion=f"Break '{method['name']}' into smaller methods to reduce complexity below 20",
                )
            )
        elif method["complexity"] > 10:
            issues.append(
                CodeIssue(
                    file=filepath,
                    line=method["start_line"],
                    column=1,
                    severity="warning",
                    category="complexity",
                    rule="CC001",
                    message=f"Cyclomatic complexity of {method['complexity']} in '{method['name']}' exceeds threshold (10)",
                    source="complexity",
                    suggestion=f"Consider extracting logic from '{method['name']}' into helper methods",
                )
            )

        # CC002: Method length
        if method["line_count"] > 100:
            issues.append(
                CodeIssue(
                    file=filepath,
                    line=method["start_line"],
                    column=1,
                    severity="error",
                    category="complexity",
                    rule="CC002",
                    message=f"Method '{method['name']}' is {method['line_count']} lines long, exceeds threshold (100)",
                    source="complexity",
                    suggestion=f"Split '{method['name']}' into smaller focused methods (< 50 lines each)",
                )
            )
        elif method["line_count"] > 50:
            issues.append(
                CodeIssue(
                    file=filepath,
                    line=method["start_line"],
                    column=1,
                    severity="warning",
                    category="complexity",
                    rule="CC002",
                    message=f"Method '{method['name']}' is {method['line_count']} lines long, exceeds threshold (50)",
                    source="complexity",
                    suggestion=f"Consider extracting code blocks from '{method['name']}' into helper methods",
                )
            )

        # CC003: Parameter count
        if method["param_count"] > 8:
            issues.append(
                CodeIssue(
                    file=filepath,
                    line=method["start_line"],
                    column=1,
                    severity="error",
                    category="complexity",
                    rule="CC003",
                    message=f"Method '{method['name']}' has {method['param_count']} parameters, exceeds threshold (8)",
                    source="complexity",
                    suggestion="Introduce a parameter object to group related parameters",
                )
            )
        elif method["param_count"] > 5:
            issues.append(
                CodeIssue(
                    file=filepath,
                    line=method["start_line"],
                    column=1,
                    severity="warning",
                    category="complexity",
                    rule="CC003",
                    message=f"Method '{method['name']}' has {method['param_count']} parameters, exceeds threshold (5)",
                    source="complexity",
                    suggestion="Consider using a parameter object or builder pattern",
                )
            )

        # CC004: Nesting depth
        if method["max_nesting"] > 6:
            issues.append(
                CodeIssue(
                    file=filepath,
                    line=method["start_line"],
                    column=1,
                    severity="error",
                    category="complexity",
                    rule="CC004",
                    message=f"Maximum nesting depth of {method['max_nesting']} in '{method['name']}' exceeds threshold (6)",
                    source="complexity",
                    suggestion=f"Extract deeply nested blocks from '{method['name']}' into separate methods or use early returns",
                )
            )
        elif method["max_nesting"] > 4:
            issues.append(
                CodeIssue(
                    file=filepath,
                    line=method["start_line"],
                    column=1,
                    severity="warning",
                    category="complexity",
                    rule="CC004",
                    message=f"Maximum nesting depth of {method['max_nesting']} in '{method['name']}' exceeds threshold (4)",
                    source="complexity",
                    suggestion=f"Reduce nesting in '{method['name']}' by extracting inner blocks or using guard clauses",
                )
            )

    return issues


def _extract_methods(lines: list[str]) -> list[dict]:
    """Extract method signatures and compute metrics."""
    methods = []
    i = 0
    while i < len(lines):
        line = lines[i]
        trimmed = line.strip()
        if _is_method_signature(trimmed):
            name = _extract_method_name(trimmed)
            params = _extract_params(trimmed)
            param_count = (
                len([p for p in params.split(",") if p.strip()]) if params else 0
            )

            # Find opening brace
            brace_start = i
            if "{" not in trimmed:
                j = i + 1
                while j < len(lines):
                    if "{" in lines[j]:
                        brace_start = j
                        break
                    j += 1

            # Scan method body
            depth = 0
            body_started = False
            end_line = brace_start
            complexity = 0
            max_nesting = 0
            line_count = 0

            for j in range(brace_start, len(lines)):
                bl = lines[j]
                for ch in bl:
                    if ch == "{":
                        depth += 1
                        if not body_started:
                            body_started = True
                    elif ch == "}":
                        depth -= 1

                if body_started:
                    max_nesting = max(max_nesting, depth)
                    bt = bl.strip()
                    if _IF_RE.search(bt):
                        complexity += 1
                    if _ELSE_IF_RE.search(bt):
                        complexity += 1
                    if _ELSE_RE.search(bt) and not _ELSE_IF_RE.search(bt):
                        complexity += 1
                    if _FOR_RE.search(bt):
                        complexity += 1
                    if _FOREACH_RE.search(bt):
                        complexity += 1
                    if _WHILE_RE.search(bt):
                        complexity += 1
                    if _DO_RE.search(bt):
                        complexity += 1
                    line_count += 1

                if body_started and depth == 0:
                    end_line = j
                    break

            methods.append({
                "name": name,
                "start_line": i + 1,
                "end_line": end_line + 1,
                "line_count": line_count,
                "param_count": param_count,
                "complexity": complexity,
                "max_nesting": max_nesting,
            })
            i = end_line + 1
        else:
            i += 1
    return methods


_IF_RE = re.compile(r"\bif\b")
_ELSE_IF_RE = re.compile(r"\belse\s+if\b")
_ELSE_RE = re.compile(r"\belse\b")
_FOR_RE = re.compile(r"\bfor\b")
_FOREACH_RE = re.compile(r"\bforeach\b")
_WHILE_RE = re.compile(r"\bwhile\b")
_DO_RE = re.compile(r"\bdo\b")


def _is_method_signature(trimmed: str) -> bool:
    """Check if a line is a C# method signature."""
    if not trimmed or trimmed.startswith("//") or trimmed.startswith("/*"):
        return False
    # Must contain parentheses and optionally a return type
    if "(" not in trimmed:
        return False
    # Exclude control flow statements
    for keyword in ("if", "for", "foreach", "while", "switch", "catch", "using"):
        if trimmed.startswith(keyword + " ") or trimmed.startswith(keyword + "("):
            return False
    # Must end with ) or ) { or where T : ...
    if trimmed.endswith(")") or trimmed.endswith("}") or trimmed.endswith("{"):
        return True
    # Generic constraints
    if "where " in trimmed and ":" in trimmed:
        return True
    return False


def _extract_method_name(line: str) -> str:
    """Extract method name from a signature line."""
    # Remove modifiers and return type
    parts = line.split("(")[0].strip().split()
    return parts[-1] if parts else "<unknown>"


def _extract_params(line: str) -> str:
    """Extract parameter list from a signature line."""
    start = line.find("(")
    end = line.rfind(")")
    if start < 0 or end < 0 or end <= start:
        return ""
    return line[start + 1:end].strip()


# ============================================================
# Custom Rules
# ============================================================


def load_custom_rules(project_root: str) -> list[dict]:
    """Load custom rules from .dotnet-review/rules.json.

    A malformed (unparseable JSON) rules file raises ConfigError (exit 3) so
    the Agent is told its custom-rules config is broken, rather than silently
    dropping all rules. Missing file or read errors degrade to [] as before.
    """
    rule_path = Path(project_root) / ".dotnet-review" / "rules.json"
    if not rule_path.exists():
        return []
    try:
        data = json.loads(rule_path.read_text(encoding="utf-8"))
        return data.get("rules", [])
    except json.JSONDecodeError as e:
        raise ConfigError(
            f"Custom rules file is not valid JSON: {rule_path}",
            details={"file": str(rule_path), "error": str(e)},
            fix="Fix the JSON syntax in .dotnet-review/rules.json or delete it",
        )
    except OSError:
        return []


def analyze_custom(filepath: str, code: str, rules: list[dict]) -> list[CodeIssue]:
    """Apply user-defined regex rules to a file."""
    issues: list[CodeIssue] = []
    for rule in rules:
        pattern = rule.get("pattern", "")
        if not pattern:
            continue
        try:
            compiled = re.compile(pattern)
        except re.error:
            continue
        for i, line in enumerate(code.split("\n"), 1):
            if compiled.search(line):
                issues.append(CodeIssue(
                    file=filepath,
                    line=i,
                    column=0,
                    severity=rule.get("severity", "info"),
                    category=rule.get("category", "custom"),
                    rule=rule.get("id", "CUSTOM"),
                    message=rule.get("message", "Custom rule match"),
                    source="custom",
                    suggestion=rule.get("suggestion", ""),
                ))
    return issues


# ============================================================
# Maintainability Index
# ============================================================


def calculate_maintainability_index(
    file_codes: dict[str, str],
    all_issues: list[CodeIssue],
) -> float:
    """Calculate maintainability index (0-100) from code metrics and issues."""
    if not file_codes:
        return 100.0

    total_lines = sum(len(code.split("\n")) for code in file_codes.values())
    if total_lines == 0:
        return 100.0

    # Halstead volume approximation: based on unique operators/operands
    avg_complexity = 0
    for code in file_codes.values():
        methods = _extract_methods(code.split("\n"))
        if methods:
            avg_complexity += sum(m["complexity"] for m in methods) / len(methods)

    # MI formula (simplified): 171 - 5.2 * ln(avgVolume) - 0.23 * avgComplexity - 16.2 * ln(avgLines)
    import math
    avg_lines = total_lines / len(file_codes)
    mi = (
        171
        - 5.2 * math.log(max(total_lines, 1))
        - 0.23 * avg_complexity
        - 16.2 * math.log(max(avg_lines, 1))
    )

    # Penalize issues
    error_count = sum(1 for i in all_issues if i.severity == "error")
    warning_count = sum(1 for i in all_issues if i.severity == "warning")
    mi -= error_count * 2 + warning_count * 0.5

    return max(0, min(100, mi))


# ============================================================
# Parallel file processing
# ============================================================


def _cpu_count() -> int:
    """Return the number of available CPUs, defaulting to 1."""
    try:
        return os.cpu_count() or 1
    except NotImplementedError:
        return 1


def _parallel_map_files(
    func: Callable[[str, str], list[CodeIssue]],
    file_codes: dict[str, str],
    layer_name: str,
    max_workers: int | None = None,
) -> list[CodeIssue]:
    """Run a file-level analysis function across all files in parallel."""
    results: list[CodeIssue] = []
    workers = max_workers or min(8, _cpu_count())
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {
            pool.submit(func, fp, code): fp
            for fp, code in file_codes.items()
        }
        for f in concurrent.futures.as_completed(futures):
            try:
                results.extend(f.result())
            except Exception as e:
                logger.warning("%s check failed for %s: %s", layer_name, futures[f], e)
    return results


# ============================================================
# Main Review Logic
# ============================================================


def run_review(args) -> dict:
    """Main review entry point."""
    start_time = time.time()
    project_root = os.getcwd()

    # ── .NET SDK gate ──
    legacy_compat = getattr(args, "legacy_compat", False)
    if not dotnet_available() and not legacy_compat:
        detected = get_dotnet_sdk_version()
        if detected is None:
            reason = "no `dotnet` command found on PATH"
        else:
            reason = (
                f"detected .NET SDK {detected} is below the required minimum (.NET 6.0)"
            )
        raise ToolMissingError(
            f".NET SDK ≥ 6.0 is required for C# code review ({reason}).",
            details={
                "required": ".NET SDK 6.0 or later",
                "detected": detected,
                "install_url": "https://dotnet.microsoft.com/download",
                "recommended": ".NET 8.0 LTS",
            },
            fix="Install .NET SDK 6+ from https://dotnet.microsoft.com/download "
            "(LTS recommended: .NET 8.0), then re-run this command. "
            "We do NOT fall back to regex-only review because partial "
            "findings would be misleading. "
            "For .NET Framework projects without .NET 6+ SDK, use --legacy-compat "
            "to run AST/semantic/project analysis without the build/format layers.",
        )

    # ── File Discovery ──
    cs_files = []
    if args.diff:
        cs_files = get_diff_files(args.diff, project_root)
        cs_files = [f for f in cs_files if f.endswith(".cs")]
    elif args.files:
        cs_files = args.files
        if args.target:
            project_root = args.target
        else:
            file_paths = [Path(f).resolve() for f in args.files if Path(f).exists()]
            if file_paths:
                common = Path(os.path.commonpath([p.parent for p in file_paths]))
                search_dir = common
                for _ in range(5):
                    if list(search_dir.glob("*.csproj")):
                        project_root = str(search_dir)
                        break
                    if search_dir.parent == search_dir:
                        break
                    search_dir = search_dir.parent
                else:
                    project_root = str(common)
    elif args.all:
        scan_dir = args.all or project_root
        cs_files = discover_files(scan_dir, [".cs"])
        project_root = scan_dir
    elif args.target:
        cs_files = get_diff_files("HEAD", args.target)
        cs_files = [f for f in cs_files if f.endswith(".cs")]
        if not cs_files:
            cs_files = discover_files(args.target, [".cs"])
        project_root = args.target
    else:
        cs_files = discover_files(project_root, [".cs"])

    if not cs_files:
        explicit_target = bool(args.target or args.files or args.all or args.diff)
        if explicit_target:
            return {
                "project_root": project_root,
                "framework_version": "",
                "framework_type": "unknown",
                "project_type": "unknown",
                "frameworks": [],
                "nuget_packages": [],
                "metadata": {},
                "files_scanned": 0,
                "total_issues": 0,
                "score": calculate_score([]),
                "by_severity": {"error": 0, "warning": 0, "info": 0},
                "issues": [],
                "layers": {
                    "builtin": 0, "complexity": 0, "ast": 0, "build": 0, "format": 0,
                },
                "error": "No .cs files found",
            }
        raise UserInputError(
            f"No .cs files found in current directory: {project_root}",
            details={"project_root": project_root},
            fix="Specify --target <path>, --files <file.cs>, or --diff <ref> to review code.",
        )

    # ── Preview mode ──
    if args.preview:
        return {
            "project_root": project_root,
            "files_scanned": len(cs_files),
            "files": cs_files,
            "mode": "preview",
        }

    # ── Framework & Project Detection ──
    csproj_files = find_csproj_files(project_root)
    frameworks: list[str] = []
    framework = ""
    framework_type = "unknown"
    project_type = "unknown"
    nuget_packages: list[dict] = []
    project_metadata: dict = {}
    test_available = False

    if csproj_files:
        frameworks = parse_target_frameworks(csproj_files[0])
        if len(frameworks) > 1:
            framework = pick_strictest_framework(frameworks)
        elif frameworks:
            framework = frameworks[0]
        else:
            framework = ""
        framework_type = classify_framework(framework)
        project_type = detect_project_type(csproj_files[0])
        nuget_packages = detect_nuget_packages(csproj_files[0])
        _TEST_PACKAGE_PREFIXES = ("xunit", "nunit", "mstest", "shouldly", "fluentassertions", "moq", "nsubstitute")
        test_available = any(
            p.get("name", "").lower().startswith(_TEST_PACKAGE_PREFIXES)
            for p in nuget_packages
        ) if nuget_packages else False
        project_metadata = get_project_metadata(csproj_files[0])
    else:
        fallback = (
            detect_framework_from_global_json(project_root)
            or detect_framework_from_directory_build_props(project_root)
        )
        if fallback:
            framework = fallback
            frameworks = [fallback]
            framework_type = classify_framework(framework)
            logger.info("Framework detected from fallback: %s", framework)

    override_framework = getattr(args, "target_framework", None)
    if override_framework:
        framework = override_framework
        frameworks = [override_framework]
        framework_type = classify_framework(override_framework)

    # ── Analyze ──
    all_issues: list[CodeIssue] = []
    layer_counts = {
        "builtin": 0, "complexity": 0, "ast": 0, "semantic": 0,
        "project": 0, "build": 0, "format": 0,
    }
    executed_layers: set[str] = set()
    skipped_layer_details: list[dict] = []
    project_analysis: dict = {}
    sem_extra: dict = {}
    semantic_cache_stats: dict = {}

    file_codes: dict[str, str] = {}
    for filepath in cs_files:
        try:
            code = safe_read_file(filepath)
        except (OSError, ReviewError):
            continue
        file_codes[filepath] = code

    # ── Custom Rules ──
    custom_rules = load_custom_rules(project_root)
    if custom_rules:
        executed_layers.add("custom")
        for filepath, code in file_codes.items():
            custom_issues = analyze_custom(filepath, code, custom_rules)
            all_issues.extend(custom_issues)
        layer_counts["custom"] = sum(1 for i in all_issues if i.source == "custom")

    # ── Layer 6: Duplicate Code Detection ──
    no_duplicates = getattr(args, "no_duplicates", False)
    if not no_duplicates:
        executed_layers.add("duplicate")
        dup_issues = detect_duplicates(file_codes)
        _ENTITY_BOILERPLATE_PATHS = ["/Domain/Entities/", "/Domain/Models/"]
        for issue in dup_issues:
            if issue.rule == "DUP001":
                file_normalized = issue.file.replace("\\", "/")
                if any(p in file_normalized for p in _ENTITY_BOILERPLATE_PATHS):
                    issue.severity = "info"
        all_issues.extend(dup_issues)
        layer_counts["duplicate"] = len(dup_issues)
    else:
        skipped_layer_details.append({"layer": "duplicate", "reason": "--no-duplicates"})

    # ── Layer 6b: Coverage Analysis ──
    coverage_data = {}
    coverage_path = getattr(args, "coverage", None)
    if coverage_path:
        coverage_data = load_coverage(coverage_path)
        if coverage_data:
            executed_layers.add("coverage")
            coverage_threshold = getattr(args, "coverage_threshold", 0.6)
            coverage_issues = analyze_coverage(cs_files, coverage_data, coverage_threshold)
            all_issues.extend(coverage_issues)
            layer_counts["coverage"] = len(coverage_issues)
        else:
            skipped_layer_details.append(
                {"layer": "coverage", "reason": "coverage report missing or invalid"}
            )

    # ── Layer 7: XML Documentation Check ──
    no_docs = getattr(args, "no_docs", False)
    if not no_docs:
        executed_layers.add("doc")
        _doc_issues = _parallel_map_files(check_xml_documentation, file_codes, "Doc")
        all_issues.extend(_doc_issues)
        layer_counts["doc"] = len(_doc_issues)
    else:
        skipped_layer_details.append({"layer": "doc", "reason": "--no-docs"})

    # ── Layer 7b: Style comment check ──
    executed_layers.add("style")
    _style_issues: list[CodeIssue] = []

    def _check_style_file(filepath: str, code: str) -> list[CodeIssue]:
        issues: list[CodeIssue] = []
        for i, line in enumerate(code.split("\n"), 1):
            stripped = line.strip()
            if re.search(r"//\s*TODO(?![(:])", stripped):
                issues.append(CodeIssue(
                    file=filepath, line=i, severity="info", category="style",
                    rule="S001", message="TODO without author",
                    source="style", suggestion="Format as `// TODO(username): message`."))
            if re.search(r"//\s*FIXME", stripped):
                issues.append(CodeIssue(
                    file=filepath, line=i, severity="info", category="style",
                    rule="S002", message="FIXME without plan",
                    source="style", suggestion="Add a linked issue number and description."))
            if re.match(r"//\s*(?:if|for|foreach|while|switch|return|var|int|string|bool)\b", stripped):
                issues.append(CodeIssue(
                    file=filepath, line=i, severity="info", category="style",
                    rule="S005", message="Commented-out code",
                    source="style", suggestion="Remove dead code. Use source control history if needed later."))
        return issues

    _style_issues = _parallel_map_files(_check_style_file, file_codes, "Style")
    all_issues.extend(_style_issues)
    layer_counts["style"] = len(_style_issues)

    # ── Layer 7c: Performance text hints ──
    executed_layers.add("perf_hint")
    _perf_issues: list[CodeIssue] = []

    def _check_perf_file(filepath: str, code: str) -> list[CodeIssue]:
        issues: list[CodeIssue] = []
        for i, line in enumerate(code.split("\n"), 1):
            stripped = line.strip()
            if re.search(r"\bbyte\[\]\s+\w+", stripped) and "override" not in stripped:
                issues.append(CodeIssue(
                    file=filepath, line=i, severity="info", category="performance",
                    rule="P021", message="byte[] parameter — consider Span<byte> for zero-copy",
                    source="style", suggestion="Use Span<T> or ReadOnlySpan<T> to avoid array allocations."))
        return issues

    _perf_issues = _parallel_map_files(_check_perf_file, file_codes, "Perf hint")
    all_issues.extend(_perf_issues)
    layer_counts["perf_hint"] = sum(1 for i in _perf_issues if i.rule == "P021")

    # ── Layer 8: NuGet Version Check ──
    if nuget_packages and not getattr(args, "no_nuget_check", False):
        executed_layers.add("nuget")
        nuget_issues = check_nuget_versions(nuget_packages)
        all_issues.extend(nuget_issues)
        layer_counts["nuget"] = len(nuget_issues)

    # ── Layer 3: AST ──
    _dotnet_cmd_exists = legacy_compat and dotnet_available()
    sdk_present = dotnet_available() or _dotnet_cmd_exists

    skip_semantic = getattr(args, "skip_semantic", False)
    skip_project = getattr(args, "skip_project", False)
    skip_build = getattr(args, "skip_build", False)
    skip_format = getattr(args, "skip_format", False)

    # AST analysis
    if not skip_semantic:
        executed_layers.add("ast")
        ast_issues = analyze_ast(cs_files, project_root)
        all_issues.extend(ast_issues)
        layer_counts["ast"] = len(ast_issues)

    # Semantic analysis
    if not skip_semantic:
        executed_layers.add("semantic")
        refs = None
        if csproj_files:
            try:
                refs = _nuget_references_for_csproj(csproj_files[0])
            except Exception:
                pass
        expanded = _expand_files_for_semantic_analysis(cs_files, project_root)
        sem_issues, sem_extra = analyze_semantic(
            expanded,
            incremental=getattr(args, "incremental", False),
            cache_dir=getattr(args, "cache_dir", None),
            project_root=project_root,
            references=refs,
        )
        if "cache_stats" in sem_extra:
            semantic_cache_stats = sem_extra["cache_stats"]
        all_issues.extend(sem_issues)
        layer_counts["semantic"] = len(sem_issues)
    else:
        skipped_layer_details.append({"layer": "semantic", "reason": "--skip-semantic"})

    # Project analysis
    if not skip_project:
        executed_layers.add("project")
        project_analysis = analyze_project(cs_files)
        project_issues = _project_findings_to_issues(project_analysis)
        all_issues.extend(project_issues)
        layer_counts["project"] = len(project_issues)
    else:
        skipped_layer_details.append({"layer": "project", "reason": "--skip-project"})

    # AST/SEM overlap suppression
    if not skip_semantic:
        ast_list = [i for i in all_issues if i.source == "ast"]
        sem_list = [i for i in all_issues if i.source == "semantic"]
        filtered_ast, suppressed_by_ast = suppress_ast_semantic_overlap(ast_list, sem_list)
        # Replace AST issues with filtered version
        all_issues = [i for i in all_issues if i.source != "ast"] + filtered_ast
    else:
        suppressed_by_ast = 0

    # Build analysis
    if not skip_build and csproj_files:
        executed_layers.add("build")
        build_issues, build_info = analyze_build(
            csproj_files[0], project_root, framework_type,
        )
        all_issues.extend(build_issues)
        layer_counts["build"] = len(build_issues)
        netanalyzers_summary = build_info
    else:
        if not skip_build:
            skipped_layer_details.append({"layer": "build", "reason": "no .csproj found"})
        netanalyzers_summary = None

    # Format analysis
    if not skip_format and csproj_files:
        executed_layers.add("format")
        format_issues = analyze_format(csproj_files[0], project_root)
        all_issues.extend(format_issues)
        layer_counts["format"] = len(format_issues)
    elif not skip_format:
        skipped_layer_details.append({"layer": "format", "reason": "no .csproj found"})

    # CVE check
    cve_result = None
    if getattr(args, "cve_check", False):
        executed_layers.add("cve")
        cve_result = check_nuget_cves(nuget_packages) if nuget_packages else {"db_present": False}

    # ── Suppressions ──
    suppressions = load_suppressions(project_root)
    all_issues, suppressed_by_config = apply_suppressions(all_issues, suppressions, project_root)

    verdicts = load_verdicts(project_root)
    all_issues, suppressed_by_verdict = apply_verdicts(all_issues, verdicts)

    # ── Auto-fix ──
    fix_result = None
    if getattr(args, "fix", False) or getattr(args, "fix_dry_run", False):
        fix_result = apply_all_auto_fixes(
            all_issues,
            create_backup=True,
            dry_run=getattr(args, "fix_dry_run", not getattr(args, "fix", False)),
        )

    # ── Dedup & score ──
    all_issues = dedup_issues(all_issues)
    score = calculate_score(all_issues)
    # by_severity and technical_debt are computed inside build_report (reporter.py),
    # so no need to materialize them here.

    # ── Maintainability Index ──
    mi_score = calculate_maintainability_index(file_codes, all_issues)

    # ── History & trend ──
    history_summary = None
    history_dir = getattr(args, "history_dir", None)
    if history_dir:
        history_snapshot = {
            "files_scanned": len(cs_files),
            "total_issues": len(all_issues),
            "by_severity": count_by_severity(all_issues),
            "score": score,
            "cognitive_complexity": 0,
            "technical_debt_minutes": estimate_technical_debt(all_issues),
        }
        history_summary = save_report_history(history_dir, history_snapshot, cs_files, all_issues)

    # ── API compatibility ──
    api_compat = None
    if getattr(args, "api_compat", False) and getattr(args, "diff", None):
        api_compat = check_api_compatibility(project_root, getattr(args, "diff"))

    # ── Diff baseline ──
    diff_baseline_result = None
    introduced_score = None
    changed_lines = None
    if getattr(args, "baseline_report", None):
        diff_baseline_result = {
            "baseline": getattr(args, "baseline_report"),
            "current_score": score,
        }
        introduced_score = score  # simplified

    elapsed = time.time() - start_time

    # ── Build report via reporter module ──
    return build_report(
        project_root=project_root,
        framework=framework,
        framework_type=framework_type,
        frameworks=frameworks,
        project_type=project_type,
        nuget_packages=nuget_packages,
        project_metadata=project_metadata,
        cs_files=cs_files,
        all_issues=all_issues,
        layer_counts=layer_counts,
        skipped_layer_details=skipped_layer_details,
        executed_layers=executed_layers,
        requested_layers=set(),  # computed inside reporter
        sdk_present=sdk_present,
        cve_result=cve_result,
        coverage_data=coverage_data,
        netanalyzers_summary=netanalyzers_summary,
        sem_comp_errs=sem_extra.get("compilation_error_count", 0) if isinstance(sem_extra, dict) else 0,
        semantic_status="",
        semantic_cache_stats=semantic_cache_stats,
        mi_score=mi_score,
        total_cognitive=0,
        fix_result=fix_result,
        history_summary=history_summary,
        api_compat=api_compat,
        diff_baseline_result=diff_baseline_result,
        introduced_score=introduced_score,
        changed_lines=changed_lines,
        project_analysis=project_analysis,
        test_available=test_available,
        suppressed_by_ast=suppressed_by_ast,
        suppressed_by_config=suppressed_by_config,
        suppressed_by_verdict=suppressed_by_verdict,
        relaxed_suppression_count=0,
        win_suppressed_count=0,
        analysis_time=elapsed,
    )
