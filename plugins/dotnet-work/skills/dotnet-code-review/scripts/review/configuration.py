"""Team configuration and custom rule package loading."""
from __future__ import annotations

import json
import os
import fnmatch
from pathlib import Path

from .models import CodeIssue


def load_team_config(project_root: str) -> tuple[dict, list[str]]:
    """Load project/team config and rule packages in deterministic order."""
    root = Path(project_root)
    candidates: list[Path] = []
    env_path = os.environ.get("DOTNET_REVIEW_CONFIG")
    if env_path:
        candidates.append(Path(env_path))
    candidates.extend([
        root / ".dotnet-review" / "config.json",
        root / ".dotnet-review" / "team.json",
    ])
    config: dict = {}
    loaded: list[str] = []
    for path in candidates:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(data, dict):
            config.update(data)
            loaded.append(str(path))

    package_paths: list[str] = []
    configured = config.get("rule_packages", [])
    if isinstance(configured, str):
        configured = [configured]
    for raw in configured:
        path = Path(raw)
        if not path.is_absolute():
            path = root / path
        package_paths.append(str(path))

    rules_dir = root / ".dotnet-review" / "rules"
    if rules_dir.is_dir():
        package_paths.extend(str(p) for p in sorted(rules_dir.glob("*.json")))
    return config, loaded + package_paths


def load_rule_packages(project_root: str, config: dict | None = None) -> list[dict]:
    """Load built-in project rules plus JSON rule packages."""
    root = Path(project_root)
    paths = [root / ".dotnet-review" / "rules.json"]
    configured = (config or {}).get("rule_packages", [])
    if isinstance(configured, str):
        configured = [configured]
    paths.extend(Path(p) if Path(p).is_absolute() else root / p for p in configured)
    paths.extend(sorted((root / ".dotnet-review" / "rules").glob("*.json")))
    rules: list[dict] = []
    for path in paths:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(data, dict) and isinstance(data.get("rules"), list):
            rules.extend(item for item in data["rules"] if isinstance(item, dict))
        elif isinstance(data, list):
            rules.extend(item for item in data if isinstance(item, dict))
    return rules


def apply_team_config(
    issues: list[CodeIssue], config: dict | None, project_root: str
) -> tuple[list[CodeIssue], dict]:
    """Apply disabled rules, severity overrides and path exclusions."""
    config = config or {}
    disabled = set(config.get("disabled_rules", []) or [])
    overrides = config.get("severity_overrides", {}) or {}
    excluded = [str(p).replace("\\", "/") for p in (config.get("exclude_paths", []) or [])]
    kept: list[CodeIssue] = []
    suppressed = 0
    for issue in issues:
        normalized = issue.file.replace("\\", "/")
        if issue.rule in disabled or any(
            fnmatch.fnmatch(normalized, pattern) or pattern.rstrip("/") in normalized
            for pattern in excluded
        ):
            suppressed += 1
            continue
        if issue.rule in overrides and overrides[issue.rule] in {"error", "warning", "info"}:
            issue.severity = overrides[issue.rule]
        kept.append(issue)
    return kept, {
        "loaded": bool(config),
        "disabled_rules": sorted(disabled),
        "severity_overrides": overrides,
        "exclude_paths": excluded,
        "suppressed": suppressed,
    }
