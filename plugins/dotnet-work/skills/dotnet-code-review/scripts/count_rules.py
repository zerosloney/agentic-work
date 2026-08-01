#!/usr/bin/env python3
"""
Count rules from YAML catalog (rules/builtin/rules.yml).

This is the single source of truth for "how many rules does the engine
actually execute?" — used to verify SKILL.md and references/*.md don't
drift from the real implementation.

Previously counted from C# source regex, now reads from YAML.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES_YML = ROOT / "rules" / "builtin" / "rules.yml"


def load_rules() -> list[dict]:
    """Load rules from YAML catalog."""
    import yaml
    with open(RULES_YML, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("rules", [])


def categorize(rules: list[dict]) -> dict[str, list[str]]:
    """Group rules by source (ast/semantic)."""
    ast = []
    sem = []
    repository = []
    for r in rules:
        rid = r["id"]
        if rid.startswith("LEGACY_"):
            ast.append(rid)
        elif rid.startswith(("SEM", "EF", "ASP", "P", "RCS")):
            sem.append(rid)
        else:
            repository.append(rid)
    return {"ast": sorted(ast), "semantic": sorted(sem), "repository": sorted(repository)}


def main() -> int:
    if not RULES_YML.exists():
        print(f"ERROR: {RULES_YML} not found", file=sys.stderr)
        return 1

    rules = load_rules()
    groups = categorize(rules)

    print("=" * 60)
    print("dotnet-code-review rule counts (from rules/builtin/rules.yml)")
    print("=" * 60)
    print(f"AST LEGACY_* rules              : {len(groups['ast']):4d}")
    sem = groups["semantic"]
    print(f"Semantic SEM/EF/ASP/P/RCS rules  : {len(sem):4d}")
    for prefix in ["SEM", "EF", "ASP", "P", "RCS"]:
        count = sum(1 for i in sem if i.startswith(prefix))
        print(f"  - {prefix}_*                        : {count:4d}")
    print(f"Repository/security/test rules  : {len(groups['repository']):4d}")
    print(f"  Total unique active           : {len(rules):4d}")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
