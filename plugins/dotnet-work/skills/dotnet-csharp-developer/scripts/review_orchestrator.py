#!/usr/bin/env python3
"""review_orchestrator.py — Step 4b wrapper for dotnet-code-review (P1).

Wraps review.py with csharp-developer defaults and adds triage interpretation
that drives the Agent's Step 4c decision. The Agent reads structured output
with a clear `agent_next_action` instead of interpreting raw review JSON.

Usage:
    python scripts/review_orchestrator.py --target <project_root> [--mode quick|full] [--json]

Modes:
    quick (default) — compact + top 10, ~200-500 token equivalent
    full            — JSON + top 20 + context bundles, ~2000-5000 token equivalent

Output (JSON):
    {
      // ... review.py raw JSON (score, issues, triage, etc.) ...
      "csharp_developer_triage": {
        "must_fix": [{"rule": "SEC001", "file": "...", "line": 42, "action": "fix_now"}],
        "should_fix": [{"rule": "BP021", "file": "...", "line": 18, "action": "fix_if_time"}],
        "info_only": [...],
        "sec_errors_present": true,
        "agent_next_action": "fix_sec_errors"
      }
    }

agent_next_action values:
    fix_sec_errors — SEC* error present, must fix before deliver
    fix_errors     — non-SEC error present, must fix before deliver
    fix_warnings   — warnings only, suggested to fix but can deliver
    deliver        — no errors, ready to deliver
    escalate       — review.py failed or not available

Exit codes:
    0 — no errors (may have warnings) — can deliver
    1 — errors present (including SEC) — must fix
    2 — warnings only
    3 — review.py not available or call failed
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Review orchestrator for csharp-developer Step 4b")
    p.add_argument("--target", required=True, help="Project root directory")
    p.add_argument("--mode", choices=["quick", "full"], default="quick",
                   help="quick=compact+top10, full=json+top20+context")
    p.add_argument("--max-issues", type=int, default=None,
                   help="Override max issues (default: 10 quick, 20 full)")
    p.add_argument("--review-script", default=None,
                   help="Path to review.py (auto-detected if omitted)")
    return p.parse_args()


def find_review_script(target: str) -> str | None:
    """Locate review.py relative to this script or via skill:// path resolution."""
    # This script lives in plugins/dotnet-work/skills/dotnet-csharp-developer/scripts/
    # review.py lives in plugins/dotnet-work/skills/dotnet-code-review/scripts/review.py
    this_dir = Path(__file__).resolve().parent
    candidate = this_dir.parent.parent / "dotnet-code-review" / "scripts" / "review.py"
    if candidate.exists():
        return str(candidate)
    return None


def build_review_cmd(review_script: str, target: str, mode: str, max_issues: int | None) -> list[str]:
    """Construct the review.py command with csharp-developer defaults."""
    if mode == "quick":
        cmd = [
            sys.executable, review_script,
            "--target", target,
            "--format", "compact",
            "--output-mode", "top",
            "--max-issues", str(max_issues or 10),
        ]
    else:
        cmd = [
            sys.executable, review_script,
            "--target", target,
            "--format", "json",
            "--output-mode", "top",
            "--max-issues", str(max_issues or 20),
            "--context-bundles",
        ]
    return cmd


def run_review(cmd: list[str]) -> tuple[int, dict | None, str]:
    """Run review.py and parse JSON output. Returns (exit_code, parsed_json, raw_output)."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        output = result.stdout
        # review.py may emit warnings before JSON; find the first '{'
        json_start = output.find("{")
        if json_start < 0:
            return result.returncode or 3, None, output
        try:
            data = json.loads(output[json_start:])
            return result.returncode, data, output
        except json.JSONDecodeError:
            return 3, None, output
    except FileNotFoundError:
        return 3, None, "review.py not found"
    except subprocess.TimeoutExpired:
        return 3, None, "review.py timed out after 180s"


def build_triage(review_data: dict | None, review_exit: int) -> dict:
    """Build cshaderp_developer_triage from review.py output.

    Handles two review.py output shapes:
    - JSON mode:  issues = [{rule, file, line, severity, message}, ...]
    - Compact mode: issues = {"error": N, "warning": N, "info": N}
                   triage  = {"deterministic": N, "agent_verify": N, "agent_only": N}
    """
    if review_data is None or review_exit == 3:
        return {
            "must_fix": [],
            "should_fix": [],
            "info_only": [],
            "sec_errors_present": False,
            "agent_next_action": "escalate",
        }

    issues = review_data.get("issues", [])
    by_severity = review_data.get("by_severity", {})

    # ── JSON mode: issues is a list of dicts ──
    if isinstance(issues, list):
        must_fix, should_fix, info_only = [], [], []
        sec_errors_present = False
        for issue in issues:
            entry = {
                "rule": issue.get("rule", ""),
                "file": issue.get("file", ""),
                "line": issue.get("line", 0),
                "message": issue.get("message", ""),
            }
            sev = issue.get("severity", "info")
            if sev == "error":
                entry["action"] = "fix_now"
                must_fix.append(entry)
                if issue.get("rule", "").startswith("SEC"):
                    sec_errors_present = True
            elif sev == "warning":
                entry["action"] = "fix_if_time"
                should_fix.append(entry)
            else:
                entry["action"] = "info_only"
                info_only.append(entry)

    # ── Compact mode: issues is a count dict ──
    else:
        must_fix, should_fix, info_only = [], [], []
        error_count = issues.get("error", 0) if isinstance(issues, dict) else 0
        warning_count = issues.get("warning", 0) if isinstance(issues, dict) else 0
        info_count = issues.get("info", 0) if isinstance(issues, dict) else 0
        # Compact mode doesn't expose individual issue details at top level;
        # use by_severity for counts and triage for confidence breakdown.
        if error_count > 0:
            must_fix = [{"rule": "multiple", "file": "", "line": 0,
                         "message": f"{error_count} error(s) — run --mode full for details",
                         "action": "fix_now"}]
        if warning_count > 0:
            should_fix = [{"rule": "multiple", "file": "", "line": 0,
                           "message": f"{warning_count} warning(s) — run --mode full for details",
                           "action": "fix_if_time"}]
        if info_count > 0:
            info_only = [{"rule": "multiple", "file": "", "line": 0,
                          "message": f"{info_count} info(s)",
                          "action": "info_only"}]
        # SEC detection: not available in compact mode; default to False
        sec_errors_present = False

    # Determine next action
    if sec_errors_present:
        agent_next_action = "fix_sec_errors"
    elif must_fix:
        agent_next_action = "fix_errors"
    elif should_fix:
        agent_next_action = "fix_warnings"
    else:
        agent_next_action = "deliver"

    return {
        "must_fix": must_fix,
        "should_fix": should_fix,
        "info_only": info_only,
        "sec_errors_present": sec_errors_present,
        "agent_next_action": agent_next_action,
    }


def main() -> int:
    args = parse_args()

    # ── Locate review.py ──
    review_script = args.review_script or find_review_script(args.target)
    if not review_script or not Path(review_script).exists():
        result = {
            "error": "review.py not found — dotnet-code-review skill not available",
            "review_available": False,
            "csharp_developer_triage": {
                "must_fix": [], "should_fix": [], "info_only": [],
                "sec_errors_present": False,
                "agent_next_action": "escalate",
            },
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 3

    # ── Run review ──
    cmd = build_review_cmd(review_script, args.target, args.mode, args.max_issues)
    review_exit, review_data, raw_output = run_review(cmd)

    # ── Build triage ──
    triage = build_triage(review_data, review_exit)

    # ── Assemble output ──
    if review_data is not None:
        review_data["csharp_developer_triage"] = triage
        print(json.dumps(review_data, ensure_ascii=False, indent=2))
    else:
        result = {
            "error": "review.py did not return valid JSON",
            "raw_output": raw_output[:2000],
            "review_exit_code": review_exit,
            "csharp_developer_triage": triage,
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))

    # ── Map to exit code ──
    action = triage["agent_next_action"]
    if action == "fix_sec_errors" or action == "fix_errors":
        return 1
    if action == "fix_warnings":
        return 2
    if action == "escalate":
        return 3
    return 0


if __name__ == "__main__":
    sys.exit(main())
