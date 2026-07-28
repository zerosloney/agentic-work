"""triage.py — issue classification, suppression, overlap handling.

Classifies rules into categories, suppresses AST/SEM overlaps,
applies user-defined suppressions and verdicts.
"""
from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path

from ..models import CodeIssue

logger = logging.getLogger("dotnet-review.analyzer.triage")


# ============================================================
# Rule classification
# ============================================================


def classify_rule(rule_code: str) -> str:
    """Map a rule code to a review category.

    Supports AST (LEGACY_*), SEM (SEM_*), build (CS/CA/IDE),
    and custom rule prefixes.
    """
    # Semantic rules (check before style since SEM contains S)
    if rule_code.startswith("SEM"):
        return "semantic"
    if rule_code.startswith("EF"):
        return "reliability"
    if rule_code.startswith("ARCH") or rule_code.startswith("LAYER"):
        return "architecture"
    if rule_code.startswith("ASYNC"):
        return "best-practice"
    # AST rules
    if rule_code.startswith("LEGACY_SEC") or rule_code.startswith("SEC"):
        return "security"
    if rule_code.startswith("LEGACY_BP") or rule_code.startswith("BP"):
        return "best-practice"
    if rule_code.startswith("LEGACY_CC") or rule_code.startswith("CC"):
        return "complexity"
    if rule_code.startswith("LEGACY_P") or rule_code.startswith("P"):
        return "performance"
    if rule_code.startswith("LEGACY_S") or rule_code.startswith("S"):
        return "style"
    if rule_code.startswith("DUP"):
        return "best-practice"
    # Build rules
    if rule_code.startswith("CS"):
        return "reliability"
    if rule_code.startswith("CA"):
        return "best-practice"
    if rule_code.startswith("IDE"):
        return "style"
    return "best-practice"


# ============================================================
# AST/SEM overlap suppression
# ============================================================


def suppress_ast_semantic_overlap(
    ast_issues: list[CodeIssue],
    semantic_issues: list[CodeIssue],
) -> tuple[list[CodeIssue], int]:
    """Suppress AST issues that are also reported by the semantic analyzer.

    The semantic analyzer has type information and can confirm whether an AST-level
    pattern is actually a problem. When both report the same issue (same file, line,
    and rule family), the AST version is suppressed in favor of the semantic one.

    Returns (filtered_ast_issues, suppressed_count).
    """
    if not ast_issues or not semantic_issues:
        return ast_issues, 0

    # Build a set of (file, line, rule_family) from semantic issues
    sem_keys: set[tuple[str, int, str]] = set()
    for issue in semantic_issues:
        family = _rule_family(issue.rule)
        sem_keys.add((issue.file, issue.line, family))

    filtered: list[CodeIssue] = []
    suppressed = 0
    for issue in ast_issues:
        family = _rule_family(issue.rule)
        key = (issue.file, issue.line, family)
        if key in sem_keys:
            suppressed += 1
            logger.debug("Suppressed AST %s (line %d) — confirmed by semantic analyzer",
                         issue.rule, issue.line)
        else:
            filtered.append(issue)

    return filtered, suppressed


def _rule_family(rule_code: str) -> str:
    """Extract the rule family prefix (e.g. SEC001 → SEC, BP021 → BP)."""
    m = re.match(r"([A-Z]+)", rule_code)
    return m.group(1) if m else rule_code


# ============================================================
# User-defined suppressions
# ============================================================


def load_suppressions(project_root: str) -> list[dict]:
    """Load user-defined suppressions from .dotnet-review/suppressions.json."""
    path = Path(project_root) / ".dotnet-review" / "suppressions.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data.get("suppressions", [])
    except (json.JSONDecodeError, OSError):
        return []


def _matches_suppression(issue: CodeIssue, sup: dict, project_root: str) -> bool:
    """Check if an issue matches a suppression rule."""
    # Match by rule
    if "rule" in sup and sup["rule"] != issue.rule:
        return False
    # Match by file pattern
    if "file_pattern" in sup:
        pattern = sup["file_pattern"]
        if not _glob_match(issue.file, pattern):
            return False
    # Match by line range
    if "line_from" in sup and issue.line < sup["line_from"]:
        return False
    if "line_to" in sup and issue.line > sup["line_to"]:
        return False
    return True


def _glob_match(filepath: str, pattern: str) -> bool:
    """Simple glob match (supports * and ** wildcards)."""
    # Convert glob pattern to regex
    regex = pattern
    regex = regex.replace("**", "{{GLOBSTAR}}")
    regex = regex.replace("*", "[^/]*")
    regex = regex.replace("{{GLOBSTAR}}", ".*")
    regex = regex.replace("?", ".")
    regex = f"^{regex}$"
    return bool(re.match(regex, filepath.replace("\\", "/")))


def apply_suppressions(
    issues: list[CodeIssue],
    suppressions: list[dict],
    project_root: str,
) -> tuple[list[CodeIssue], int]:
    """Apply user-defined suppressions to the issue list.

    Returns (filtered_issues, suppressed_count).
    """
    if not suppressions:
        return issues, 0

    filtered: list[CodeIssue] = []
    suppressed = 0
    for issue in issues:
        matched = False
        for sup in suppressions:
            if _matches_suppression(issue, sup, project_root):
                matched = True
                break
        if matched:
            suppressed += 1
            logger.debug("Suppressed %s in %s:%d", issue.rule, issue.file, issue.line)
        else:
            filtered.append(issue)

    return filtered, suppressed


# ============================================================
# Agent verdict suppression
#
# Verdict loading and matching live in ..agent_verdicts (single source of
# truth, documented in SKILL.md §2.3). Re-exported here so existing imports
# from review.analyzer.triage keep working.
# ============================================================

from ..agent_verdicts import load_verdicts, apply_verdicts  # noqa: E402,F401
