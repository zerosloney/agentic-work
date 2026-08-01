"""reporter.py — final report dict assembly.

Builds the complete review result dict from all analysis layer outputs.
"""
from __future__ import annotations

import logging
import os
import time
from pathlib import Path

from ..models import CodeIssue
from ..rules import get_triage_for_rule
from ..evidence import build_review_integrity, serialize_issue, build_degradation_notices
from ..scoring import calculate_score, count_by_severity, estimate_technical_debt

logger = logging.getLogger("dotnet-review.analyzer.reporter")


def build_report(
    *,
    project_root: str,
    framework: str,
    framework_type: str,
    frameworks: list[str],
    project_type: str,
    nuget_packages: list[dict],
    project_metadata: dict,
    cs_files: list[str],
    all_issues: list[CodeIssue],
    layer_counts: dict,
    skipped_layer_details: list[dict],
    executed_layers: set[str],
    requested_layers: set[str],
    sdk_present: bool,
    sdk_version: str | None = None,
    cve_result: dict | None,
    coverage_data: dict,
    coverage_requested: bool | None = None,
    netanalyzers_summary: dict | None,
    sem_comp_errs: int = 0,
    semantic_status: str = "",
    semantic_cache_stats: dict | None = None,
    semantic_workspace: dict | None = None,
    mi_score: float = 0,
    total_cognitive: int = 0,
    fix_result: dict | None = None,
    history_summary: dict | None = None,
    api_compat: dict | None = None,
    diff_baseline_result: dict | None = None,
    introduced_score: dict | None = None,
    changed_lines: dict | None = None,
    project_analysis: dict | None = None,
    test_available: bool = False,
    suppressed_by_ast: int = 0,
    suppressed_by_config: int = 0,
    suppressed_by_verdict: int = 0,
    relaxed_suppression_count: int = 0,
    win_suppressed_count: int = 0,
    analysis_time: float = 0,
    phase_timings: dict[str, float] | None = None,
    review_mode: str = "full",
    test_quality: dict | None = None,
    configuration: dict | None = None,
) -> dict:
    """Build the complete review result dict.

    This function assembles all analysis outputs into the final JSON/compact
    report structure consumed by the Agent and CLI.
    """
    # ── Score & severity ──
    score = calculate_score(all_issues)
    by_severity = count_by_severity(all_issues)
    debt_minutes = estimate_technical_debt(all_issues)

    # ── Review integrity ──
    review_integrity = build_review_integrity(
        sdk_present=sdk_present,
        sdk_version=sdk_version,
        requested_layers=requested_layers,
        executed_layers=executed_layers,
        skipped_layer_details=skipped_layer_details,
        cve_result=cve_result,
        cve_requested="cve" in requested_layers,
        coverage_data=coverage_data,
        coverage_requested=(
            bool(coverage_data)
            if coverage_requested is None
            else coverage_requested
        ),
        netanalyzers_summary=netanalyzers_summary,
    )
    if sem_comp_errs:
        review_integrity["semantic_compilation_errors"] = sem_comp_errs
        review_integrity["semantic_degraded"] = True
        from ..evidence import TYPE_DEPENDENT_RULE_PREFIXES
        review_integrity["degraded_rule_families"] = list(TYPE_DEPENDENT_RULE_PREFIXES)
    if semantic_workspace:
        review_integrity["semantic_workspace"] = semantic_workspace

    # ── Degradation notices ──
    degradation_notices = build_degradation_notices(
        skipped_layer_details=skipped_layer_details,
        sem_comp_errs=sem_comp_errs,
    )

    # ── Triage summary ──
    _triage_counts = {"deterministic": 0, "agent_verify": 0, "agent_only": 0}
    for _i in all_issues:
        _t = get_triage_for_rule(_i.rule)
        _triage_counts[_t] = _triage_counts.get(_t, 0) + 1
    triage_summary = {
        "deterministic": _triage_counts["deterministic"],
        "agent_verify": _triage_counts["agent_verify"],
        "agent_only": _triage_counts["agent_only"],
        "total": sum(_triage_counts.values()),
    }

    # ── Sorted & serialized issues ──
    sorted_issues = sorted(
        all_issues,
        key=lambda x: (
            {"error": 0, "warning": 1, "info": 2}.get(x.severity, 3),
            x.file,
            x.line,
        ),
    )

    return {
        "project_root": project_root,
        "framework_version": framework,
        "framework_type": framework_type,
        "frameworks": frameworks,
        "project_type": project_type,
        "nuget_packages": nuget_packages,
        "metadata": project_metadata,
        "semantic_status": semantic_status,
        "files_scanned": len(cs_files),
        "total_issues": len(all_issues),
        "score": score,
        "by_severity": by_severity,
        "maintainability_index": mi_score,
        "cognitive_complexity": total_cognitive,
        "technical_debt_minutes": debt_minutes,
        "test_available": test_available,
        "coverage_summary": coverage_data.get("summary", {}) if coverage_data else {},
        "fix_result": fix_result,
        "cve_check": cve_result,
        "history_summary": history_summary,
        "api_compatibility": api_compat,
        "diff_baseline": diff_baseline_result,
        "introduced_score": introduced_score,
        "changed_lines": {f: sorted(ls) for f, ls in changed_lines.items()} if changed_lines else {},
        "issues": [serialize_issue(i) for i in sorted_issues],
        "layers": layer_counts,
        "skipped_layers": [d["layer"] for d in skipped_layer_details],
        "skipped_layer_details": skipped_layer_details,
        "review_integrity": review_integrity,
        "degradation_notices": degradation_notices,
        "sdk_present": sdk_present,
        "suppressed_by_ast": suppressed_by_ast,
        "suppressed_by_config": suppressed_by_config,
        "suppressed_by_verdict": suppressed_by_verdict,
        "relaxed_suppression_count": relaxed_suppression_count,
        "win_suppressed_count": win_suppressed_count,
        "project_analysis": project_analysis,
        "semantic_cache_stats": semantic_cache_stats or {},
        "semantic_workspace": semantic_workspace or {},
        "filtered_rules": [],
        "analysis_time": analysis_time,
        "phase_timings": phase_timings or {},
        "review_mode": review_mode,
        "test_quality": test_quality or {},
        "configuration": configuration or {},
        "triage_summary": triage_summary,
    }
