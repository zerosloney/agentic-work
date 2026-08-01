from __future__ import annotations
import json
import logging
import time
from pathlib import Path

logger = logging.getLogger('dotnet-review')



# ============================================================
# Report History & Trends
# ============================================================

def _history_file(history_dir: str) -> str:
    """Path to the rolling history JSONL file."""
    return str(Path(history_dir) / "history.jsonl")



def save_report_history(
    history_dir: str,
    snapshot: dict,
    cs_files: list[str],
    issues: list,
) -> dict:
    """Append a review snapshot to the history log and return summary.

    Args:
        history_dir: Directory to store history files
        snapshot: Dict with files_scanned, total_issues, by_severity, score,
                  cognitive_complexity, technical_debt_minutes
        cs_files: Files reviewed
        issues: Issues found

    Returns:
        {
            "total_runs": N,
            "files_scanned": N,
            "total_issues": N,
            "avg_score": N,
            "trend": {"issues_delta": N, "score_delta": N, "direction": "up|down|same"}
        }
    """
    try:
        Path(history_dir).mkdir(parents=True, exist_ok=True)
    except OSError:
        return {"error": f"Cannot create history dir: {history_dir}"}

    entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "files_scanned": snapshot.get("files_scanned", 0),
        "total_issues": snapshot.get("total_issues", 0),
        "by_severity": snapshot.get("by_severity", {}),
        "score": snapshot.get("score", {}).get("overall", 0),
        "cognitive_complexity": snapshot.get("cognitive_complexity", 0),
        "technical_debt_minutes": snapshot.get("technical_debt_minutes", 0),
        "files": cs_files,
        "issue_rules": [i.rule for i in issues],
        "phase_timings": snapshot.get("phase_timings", {}),
        "test_quality": snapshot.get("test_quality", {}),
    }

    hist_path = Path(_history_file(history_dir))
    try:
        with hist_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except OSError:
        return {"error": f"Cannot write history: {hist_path}"}

    # Load all runs for summary
    runs = _load_history(history_dir)
    scores = [r.get("score", 0) for r in runs if r.get("score")]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    # Compute trend vs previous run
    trend = compute_trend(history_dir)

    return {
        "total_runs": len(runs),
        "files_scanned": entry["files_scanned"],
        "total_issues": entry["total_issues"],
        "avg_score": avg_score,
        "trend": trend,
    }



def _load_history(history_dir: str) -> list[dict]:
    """Load all history entries from the JSONL file."""
    hist_path = Path(_history_file(history_dir))
    if not hist_path.exists():
        return []
    entries = []
    try:
        for line in hist_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except OSError:
        pass
    return entries



def compute_trend(history_dir: str) -> dict:
    """Compare the last two history entries and return trend.

    Returns:
        {
            "issues_delta": N,   # positive = more issues, negative = fewer
            "score_delta": N,    # positive = better, negative = worse
            "direction": "up|down|same",
            "prev_run": timestamp or null,
            "prev_issues": N or null,
            "prev_score": N or null,
        }
    """
    runs = _load_history(history_dir)
    if len(runs) < 2:
        return {
            "issues_delta": 0,
            "score_delta": 0,
            "direction": "same",
            "prev_run": runs[0]["timestamp"] if runs else None,
            "prev_issues": runs[0]["total_issues"] if runs else None,
            "prev_score": runs[0]["score"] if runs else None,
        }

    curr = runs[-1]
    prev = runs[-2]
    curr_issues = curr.get("total_issues", 0)
    prev_issues = prev.get("total_issues", 0)
    curr_score = curr.get("score", 0)
    prev_score = prev.get("score", 0)

    issues_delta = curr_issues - prev_issues
    score_delta = curr_score - prev_score

    if score_delta > 0:
        direction = "up"
    elif score_delta < 0:
        direction = "down"
    else:
        direction = "same"

    return {
        "issues_delta": issues_delta,
        "score_delta": score_delta,
        "direction": direction,
        "prev_run": prev["timestamp"],
        "prev_issues": prev_issues,
        "prev_score": prev_score,
    }


def build_trend_report(history_dir: str, window: int = 20) -> dict:
    """Build quality and performance trends for the latest history window."""
    runs = _load_history(history_dir)[-max(1, window):]
    if not runs:
        return {"history_dir": history_dir, "runs": 0, "quality": {}, "performance": {}, "regressions": []}
    scores = [float(r.get("score", 0) or 0) for r in runs]
    issues = [int(r.get("total_issues", 0) or 0) for r in runs]
    phase_names = sorted({name for run in runs for name in (run.get("phase_timings", {}) or {})})
    phase_averages = {
        name: round(sum(float((run.get("phase_timings", {}) or {}).get(name, 0) or 0) for run in runs) / len(runs), 4)
        for name in phase_names
    }
    rules: dict[str, int] = {}
    for run in runs:
        for rule in run.get("issue_rules", []) or []:
            rules[rule] = rules.get(rule, 0) + 1
    previous = runs[-2] if len(runs) > 1 else {}
    previous_rules = set(previous.get("issue_rules", []) or [])
    current_rules = set(runs[-1].get("issue_rules", []) or [])
    return {
        "history_dir": history_dir,
        "runs": len(runs),
        "first_timestamp": runs[0].get("timestamp"),
        "last_timestamp": runs[-1].get("timestamp"),
        "quality": {
            "latest_score": scores[-1],
            "average_score": round(sum(scores) / len(scores), 2),
            "score_delta": round(scores[-1] - scores[0], 2),
            "latest_issues": issues[-1],
            "issue_delta": issues[-1] - issues[0],
        },
        "performance": {
            "average_phase_seconds": phase_averages,
            "latest_phase_seconds": runs[-1].get("phase_timings", {}),
        },
        "test_quality": runs[-1].get("test_quality", {}),
        "regressions": sorted(current_rules - previous_rules),
        "frequent_rules": sorted(rules.items(), key=lambda item: (-item[1], item[0]))[:20],
    }


def format_trend_markdown(report: dict) -> str:
    quality = report.get("quality", {})
    performance = report.get("performance", {})
    lines = [
        "# dotnet-code-review 趋势报告",
        "",
        f"- Runs: {report.get('runs', 0)}",
        f"- Score: {quality.get('latest_score', 0)} (delta {quality.get('score_delta', 0)})",
        f"- Issues: {quality.get('latest_issues', 0)} (delta {quality.get('issue_delta', 0)})",
        "",
        "## 平均阶段耗时",
        "",
    ]
    for name, seconds in (performance.get("average_phase_seconds", {}) or {}).items():
        lines.append(f"- {name}: {seconds:.4f}s")
    lines.extend(["", "## 最近新增规则", ""])
    lines.extend(f"- {rule}" for rule in report.get("regressions", []) or [])
    return "\n".join(lines) + "\n"
