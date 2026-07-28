"""analyzer/ — Fetchers, triage, and reporters for dotnet-code-review.

Submodules:
    fetcher  — subprocess invocation of Roslyn/dotnet analyzers
    triage   — issue classification, suppression, overlap handling
    reporter — final report dict assembly
"""

from .fetcher import (
    dotnet_available,
    get_dotnet_sdk_version,
    analyze_ast,
    analyze_semantic,
    analyze_project,
    analyze_build,
    analyze_format,
)
from .triage import (
    classify_rule,
    suppress_ast_semantic_overlap,
    load_suppressions,
    apply_suppressions,
)
from .reporter import build_report

__all__ = [
    "dotnet_available",
    "get_dotnet_sdk_version",
    "analyze_ast",
    "analyze_semantic",
    "analyze_project",
    "analyze_build",
    "analyze_format",
    "classify_rule",
    "suppress_ast_semantic_overlap",
    "load_suppressions",
    "apply_suppressions",
    "build_report",
]
