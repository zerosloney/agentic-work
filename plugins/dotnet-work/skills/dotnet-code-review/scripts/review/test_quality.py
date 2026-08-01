"""Test-code quality and test-gap analysis.

This layer is deliberately project-local and dependency-free. It complements
Roslyn test rules with a useful repository-level view: which test methods have
assertions, which production types have no obvious test counterpart, and what
the test suite looks like by framework.
"""
from __future__ import annotations

import re
from pathlib import Path

from .models import CodeIssue


_TEST_ATTR = re.compile(
    r"\[(?:Fact|Theory|Test|TestCase|TestMethod|TestCaseSource|TestFixture)\b",
    re.IGNORECASE,
)
_CLASS_RE = re.compile(r"\bclass\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)")
_PUBLIC_METHOD_RE = re.compile(
    r"\bpublic\s+(?:async\s+)?(?:static\s+)?[\w<>,.?\[\]]+\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*\("
)


def _is_test_file(path: str, code: str, project_type: str) -> bool:
    normalized = path.replace("\\", "/").lower()
    return (
        project_type == "test"
        or "/test/" in normalized
        or "/tests/" in normalized
        or Path(path).stem.lower().endswith(("test", "tests", "fixture"))
        or bool(_TEST_ATTR.search(code))
    )


def _test_methods(code: str) -> list[tuple[int, str, str, int]]:
    lines = code.splitlines()
    methods: list[tuple[int, str, str]] = []
    for idx, line in enumerate(lines):
        if not _TEST_ATTR.search(line) and not (idx and _TEST_ATTR.search(lines[idx - 1])):
            continue
        for next_line in lines[idx : min(len(lines), idx + 8)]:
            match = _PUBLIC_METHOD_RE.search(next_line)
            if match:
                line_start = sum(len(item) + 1 for item in lines[:idx])
                methods.append((idx + 1, match.group("name"), next_line, line_start))
                break
    return methods


def _method_body(code: str, start: int) -> str:
    """Extract one brace-delimited method body instead of the rest of the file."""
    body_start = code.find("{", start)
    if body_start < 0:
        return ""
    depth = 0
    for index in range(body_start, len(code)):
        if code[index] == "{":
            depth += 1
        elif code[index] == "}":
            depth -= 1
            if depth == 0:
                return code[body_start:index + 1]
    return code[body_start:]


def analyze_test_quality(
    cs_files: list[str],
    file_codes: dict[str, str],
    project_type: str = "unknown",
) -> tuple[list[CodeIssue], dict]:
    """Return test-quality findings and a repository-level test-gap summary."""
    test_files = [p for p in cs_files if _is_test_file(p, file_codes.get(p, ""), project_type)]
    production_files = [p for p in cs_files if p not in test_files]
    issues: list[CodeIssue] = []
    test_method_count = 0
    assertion_count = 0
    test_class_names: set[str] = set()

    for path in test_files:
        code = file_codes.get(path, "")
        for line, name, signature, signature_start in _test_methods(code):
            test_method_count += 1
            body = _method_body(code, signature_start + code[signature_start:].find(signature))
            has_assert = bool(re.search(r"\b(?:Assert|FluentAssertions|Should|Expect)\b", body))
            if has_assert:
                assertion_count += 1
            else:
                issues.append(CodeIssue(
                    file=path, line=line, severity="warning", category="test",
                    rule="TESTQ001", message=f"测试方法 {name} 未发现断言",
                    source="test", suggestion="增加明确的 Assert/Should 断言，验证行为而不只是执行代码。",
                ))
        test_class_names.update(m.group("name").removesuffix("Tests").removesuffix("Test")
                                for m in _CLASS_RE.finditer(code))

    missing_types: list[str] = []
    for path in production_files:
        code = file_codes.get(path, "")
        for match in _CLASS_RE.finditer(code):
            name = match.group("name")
            if name in {"Program", "Startup", "GlobalUsings", "Migrations"} or name.endswith(("Dto", "Model", "Options")):
                continue
            if name.endswith(("Controller", "Service", "Handler", "Repository", "Manager")) and name not in test_class_names:
                missing_types.append(name)
                issues.append(CodeIssue(
                    file=path, line=code[:match.start()].count("\n") + 1,
                    severity="info", category="test", rule="TESTQ002",
                    message=f"生产类型 {name} 未发现同名测试类",
                    source="test", suggestion=f"考虑增加 {name}Tests，覆盖主要成功、失败和边界路径。",
                ))

    summary = {
        "test_files": len(test_files),
        "production_files": len(production_files),
        "test_methods": test_method_count,
        "tests_with_assertions": assertion_count,
        "assertion_ratio": round(assertion_count / test_method_count, 3) if test_method_count else 0,
        "missing_test_types": sorted(set(missing_types)),
        "gap_count": len(set(missing_types)),
    }
    return issues, summary
