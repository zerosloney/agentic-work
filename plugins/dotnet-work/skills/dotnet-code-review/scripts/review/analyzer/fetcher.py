"""fetcher.py — subprocess invocation of Roslyn/dotnet analyzers.

Spawns csharp-ast-analyzer, csharp-semantic-analyzer, csharp-project-analyzer,
dotnet build, and dotnet format. Parses their output into CodeIssue lists.
"""
from __future__ import annotations

import json
import logging
import os
import re
import subprocess
import tempfile
import time
from pathlib import Path

from ..models import CodeIssue  # import from parent review/ package
from ..cache import inputs_fingerprint, load_result_cache, save_result_cache

logger = logging.getLogger("dotnet-review.analyzer.fetcher")


# ============================================================
# .NET SDK detection
# ============================================================


def _dotnet_command_exists() -> bool:
    """Return True if `dotnet` is on PATH."""
    try:
        result = subprocess.run(
            ["dotnet", "--version"],
            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=10,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return False


def dotnet_available() -> bool:
    """Return True if a usable .NET SDK is present."""
    return _dotnet_command_exists()


def get_dotnet_sdk_version() -> str | None:
    """Return the SDK version string, or None if not available."""
    try:
        result = subprocess.run(
            ["dotnet", "--version"],
            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=10,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        pass
    return None


def dotnet_sdk_meets_minimum(min_major: int = 6) -> bool:
    """Return whether the installed SDK meets the normal review minimum."""
    version = get_dotnet_sdk_version()
    if not version:
        return False
    match = re.match(r"^(\d+)(?:\.(\d+))?", version.strip())
    if not match:
        return False
    return int(match.group(1)) >= min_major


# ============================================================
# Command building & chunking
# ============================================================


def _chunk_file_args(analyzer_name: str, extra_args: list[str]) -> list[list[str]]:
    """Split file args into chunks to avoid Windows cmdline length limit (8191 chars).

    Each chunk becomes a separate subprocess invocation.
    """
    MAX_CHUNK = 7000  # conservative limit leaving room for other args
    chunks: list[list[str]] = []
    current: list[str] = []
    current_len = 0
    for arg in extra_args:
        arg_len = len(arg) + 1  # +1 for space
        if current_len + arg_len > MAX_CHUNK and current:
            chunks.append(current)
            current = []
            current_len = 0
        current.append(arg)
        current_len += arg_len
    if current:
        chunks.append(current)
    return chunks


def _write_file_list(paths: list[str]) -> str:
    """Write paths to a temp file (one per line). Returns the temp file path."""
    fd, path = tempfile.mkstemp(suffix=".txt", prefix="review-filelist-")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write("\n".join(paths))
    return path


def _ast_cache_payload(output: str, filepath: str) -> str:
    """Keep only one file's diagnostics when caching a multi-file chunk."""
    try:
        json_start = output.find("{")
        if json_start < 0:
            return output
        data = json.loads(output[json_start:])
        target = str(Path(filepath).resolve())
        data["diagnostics"] = [
            item for item in data.get("diagnostics", [])
            if str(Path(item.get("file", "")).resolve()) == target
        ]
        return json.dumps(data, ensure_ascii=False)
    except (json.JSONDecodeError, OSError, TypeError):
        return output


def _build_analyzer_command(analyzer_name: str, extra_args: list[str]) -> list[str]:
    """Build a command for the authoritative individual analyzer.

    The three individual analyzers are the source of truth for the 186-rule
    catalog. Prefer a previously built DLL for speed, and use ``dotnet run``
    as a functional fallback when a checkout has not been built yet. The
    experimental unified analyzer is intentionally not selected here until it
    has parity tests against the individual analyzers.
    """
    script_dir = Path(__file__).resolve().parent.parent.parent
    analyzer_dir = script_dir / analyzer_name
    project = analyzer_dir / f"{analyzer_name}.csproj"

    dlls = sorted(
        (p for p in analyzer_dir.glob("bin/*/*/*.dll") if p.name == f"{analyzer_name}.dll"),
        key=_analyzer_dll_sort_key,
        reverse=True,
    )
    if dlls:
        cmd = ["dotnet", str(dlls[0])]
    else:
        # Allow restore on the slow path; --no-restore made a clean checkout
        # fail before the analyzer could be built.
        cmd = ["dotnet", "run", "--project", str(project)]
        if analyzer_name == "csharp-semantic-analyzer":
            sdk = get_dotnet_sdk_version() or ""
            major_match = re.match(r"^(\d+)", sdk)
            target = "net8.0" if major_match and int(major_match.group(1)) >= 8 else "net6.0"
            cmd.extend(["-f", target])
        cmd.append("--")
    cmd.extend(extra_args)
    return cmd


def _analyzer_dll_sort_key(path: Path) -> tuple[int, float]:
    """Prefer the newest compatible runtime, with net8 taking precedence.

    The semantic analyzer is multi-targeted: net6 keeps the historical
    AdhocWorkspace path, while net8 includes MSBuildWorkspace.  Selecting only
    by mtime could silently run net6 after an unrelated rebuild and lose the
    evaluated-project behavior.
    """
    tfm = path.parent.name.lower()
    match = re.match(r"net(\d+)(?:\.(\d+))?$", tfm)
    version = (int(match.group(1)), int(match.group(2) or 0)) if match else (0, 0)
    return (version[0] * 100 + version[1], path.stat().st_mtime)


# ============================================================
# AST Analyzer
# ============================================================


def analyze_ast(files: list[str], project_root: str = "",
                cache_dir: str | None = None) -> list[CodeIssue]:
    """Run Roslyn-based AST analyzer on original file paths (requires .NET SDK).

    Zero false-positive syntax-tree-level detection. ``project_root`` canonicalizes
    absolute paths emitted by the C# analyzer into project-root-relative form.
    """
    if not files:
        return []

    ast_dir = Path(__file__).resolve().parent.parent.parent / "csharp-ast-analyzer"
    if not (ast_dir / "csharp-ast-analyzer.csproj").exists():
        return []

    abs_files = [str(Path(f).resolve()) for f in files]

    # ── Cache check ──
    cached_issues: list[CodeIssue] = []
    uncached_abs: list[str] = []
    if cache_dir:
        from ..cache import load_cache
        for abs_f in abs_files:
            cached_raw = load_cache(cache_dir, abs_f)
            if cached_raw is not None:
                cached_issues.extend(
                    _parse_ast_diagnostics(cached_raw, project_root, files)
                )
            else:
                uncached_abs.append(abs_f)
    else:
        uncached_abs = abs_files

    if not uncached_abs:
        return cached_issues

    # ── Run AST analyzer on uncached files, chunked ──
    args_chunks = _chunk_file_args("csharp-ast-analyzer", uncached_abs)
    all_new_issues: list[CodeIssue] = []
    for chunk_idx, chunk in enumerate(args_chunks):
        try:
            cmd = _build_analyzer_command("csharp-ast-analyzer", chunk)
            result = subprocess.run(
                cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120,
            )
            chunk_issues = _parse_ast_diagnostics(result.stdout, project_root, files)
            all_new_issues.extend(chunk_issues)

            # Write cache for each file in this chunk
            if cache_dir:
                from ..cache import save_cache
                for abs_f in chunk:
                    save_cache(cache_dir, abs_f, _ast_cache_payload(result.stdout, abs_f))
        except (subprocess.TimeoutExpired, OSError) as e:
            logger.warning("AST analyzer chunk %d failed: %s", chunk_idx, e)

    return cached_issues + all_new_issues


def _parse_ast_diagnostics(output: str, project_root: str,
                           orig_files: list[str]) -> list[CodeIssue]:
    """Parse JSON output from csharp-ast-analyzer into CodeIssue list."""
    issues: list[CodeIssue] = []
    json_start = output.find("{")
    if json_start < 0:
        return issues
    try:
        data = json.loads(output[json_start:])
    except json.JSONDecodeError:
        return issues

    file_map = {str(Path(f).resolve()): f for f in orig_files}

    for d in data.get("diagnostics", []):
        src_file = d.get("file", "")
        # Canonicalize: abs path → project-relative
        if src_file in file_map:
            src_file = file_map[src_file]
        elif project_root and src_file.startswith(project_root):
            src_file = os.path.relpath(src_file, project_root)

        issues.append(CodeIssue(
            file=src_file,
            line=d.get("line", 0),
            column=0,
            severity=d.get("severity", "info"),
            category=d.get("category", "best-practice"),
            rule=d.get("code", "AST"),
            message=d.get("message", ""),
            source="ast",
            suggestion=d.get("suggestion", ""),
        ))
    return issues


# ============================================================
# Semantic Analyzer
# ============================================================


def analyze_semantic(
    files: list[str], incremental: bool = False, cache_dir: str | None = None,
    project_root: str = "", references: list[str] | None = None,
    solution_path: str | None = None, project_path: str | None = None,
) -> tuple[list[CodeIssue], dict]:
    """Run Roslyn SemanticModel-based analyzer (requires .NET SDK).

    Returns (issues, extra_data) where extra_data contains
    cache_stats and compilation_error_count.
    """
    if not files:
        return [], {}

    sem_dir = Path(__file__).resolve().parent.parent.parent / "csharp-semantic-analyzer"
    if not (sem_dir / "csharp-semantic-analyzer.csproj").exists():
        return [], {}

    abs_files = [str(Path(f).resolve()) for f in files]

    # A complete semantic result is reusable only when all source and MSBuild
    # inputs are unchanged. This avoids starting Roslyn at all on warm reviews.
    input_paths = list(abs_files) + list(references or [])
    for pattern in ("*.csproj", "*.sln", "Directory.Build.*", "global.json"):
        input_paths.extend(str(p) for p in Path(project_root).glob(pattern))
    input_paths.extend(str(Path(project_root) / "obj" / "project.assets.json") for _ in [0])
    semantic_fp = inputs_fingerprint(input_paths, salt=f"semantic-v2|{solution_path or ''}|{project_path or ''}")
    if incremental and cache_dir:
        cached = load_result_cache(cache_dir, "semantic-result", semantic_fp)
        if cached:
            cached_issues = [
                CodeIssue(**item) for item in cached.get("issues", [])
                if isinstance(item, dict) and item.get("file") is not None
            ]
            cached_extra = dict(cached.get("extra", {}))
            cached_extra["cache_stats"] = {
                **cached_extra.get("cache_stats", {}),
                "whole_result_hit": True,
                "fingerprint": semantic_fp,
            }
            return cached_issues, cached_extra

    filelist_path = _write_file_list(abs_files)
    extra = ["--file-list", filelist_path]
    refs_path = None
    if references:
        refs_path = _write_file_list(references)
        extra += ["--references-file", refs_path]
    if incremental:
        extra.append("--incremental")
        if cache_dir:
            extra.extend(["--cache-dir", cache_dir])
    if solution_path:
        extra += ["--solution", solution_path]
    if project_path and solution_path:
        extra += ["--project", project_path]
    cmd = _build_analyzer_command("csharp-semantic-analyzer", extra)

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=120,
        )

        # Prefer stdout JSON (analyzer emits findings on stdout even when it
        # logs warnings on stderr). Only consult stderr if stdout is empty.
        output = result.stdout if result.stdout.strip() else result.stderr

        json_start = output.find("{")
        if json_start < 0:
            # No JSON anywhere. Non-zero exit with no structured output means
            # the analyzer failed (e.g. compilation errors, internal crash).
            # Surface a degradation marker so the report flags SEM_* as
            # downgraded instead of silently reporting "no semantic issues".
            if result.returncode != 0:
                logger.warning(
                    "Semantic analyzer exited %d with no JSON output — "
                    "SEM_* rules degraded. stderr: %s",
                    result.returncode,
                    (result.stderr or "")[:200],
                )
                return [], {"compilation_error_count": 1}
            return [], {}
        data = json.loads(output[json_start:])
        issues = []
        for d in data.get("diagnostics", []):
            src_file = d.get("file", "")
            if src_file:
                src_file = _normalize_review_path(src_file, project_root)
            elif files:
                src_file = files[0]

            issues.append(CodeIssue(
                file=src_file,
                line=d.get("line", 0),
                column=0,
                severity=d.get("severity", "info"),
                category=d.get("category") or _fallback_semantic_category(d.get("code", "SEM")),
                rule=d.get("code", "SEM"),
                message=d.get("message", ""),
                source="semantic",
                suggestion=d.get("suggestion", ""),
            ))

        extra_data: dict = {}
        if "cache_stats" in data:
            extra_data["cache_stats"] = data["cache_stats"]
        if "semantic_workspace" in data:
            extra_data["semantic_workspace"] = data["semantic_workspace"]
        comp_err_count = data.get("compilation_error_count", 0)
        if comp_err_count:
            extra_data["compilation_error_count"] = comp_err_count
            logger.warning("Semantic analyzer: %d compilation errors — "
                "type-dependent rules (SEM_*) may be degraded", comp_err_count)

        if incremental and cache_dir and result.returncode == 0:
            save_result_cache(
                cache_dir,
                "semantic-result",
                semantic_fp,
                {
                    "issues": [issue.__dict__ for issue in issues],
                    "extra": extra_data,
                },
            )

        return issues, extra_data
    except (json.JSONDecodeError, subprocess.TimeoutExpired, OSError) as e:
        logger.warning("Semantic analyzer failed (Layer 3b skipped): %s", e)
        return [], {}
    finally:
        for _p in [filelist_path, refs_path]:
            if _p:
                try:
                    os.unlink(_p)
                except OSError:
                    pass


def _fallback_semantic_category(code: str) -> str:
    """Infer a scoring category from a SEM_* rule code prefix."""
    prefix = code.split("_")[0] if "_" in code else code
    return {
        "SEM": "semantic",
        "EF": "reliability",
        "P": "performance",
        "ASYNC": "best-practice",
        "LAYER": "architecture",
        "ARCH": "architecture",
    }.get(prefix.upper(), "semantic")


def _normalize_review_path(path: str, project_root: str) -> str:
    """Convert absolute path to project-root-relative form."""
    if not project_root:
        return path
    abs_root = str(Path(project_root).resolve())
    abs_path = str(Path(path).resolve())
    if abs_path.startswith(abs_root):
        return os.path.relpath(abs_path, abs_root)
    return path


# ============================================================
# Project Analyzer (cross-file)
# ============================================================


def analyze_project(files: list[str]) -> dict:
    """Run cross-file project analyzer. Returns raw project analysis dict."""
    if not files:
        return {}

    proj_dir = Path(__file__).resolve().parent.parent.parent / "csharp-project-analyzer"
    if not (proj_dir / "csharp-project-analyzer.csproj").exists():
        return {}

    abs_files = [str(Path(f).resolve()) for f in files]
    filelist_path = _write_file_list(abs_files)
    extra = ["--file-list", filelist_path]
    cmd = _build_analyzer_command("csharp-project-analyzer", extra)

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=120,
        )
        # Prefer stdout JSON; only fall back to stderr if stdout is empty.
        output = result.stdout if result.stdout.strip() else result.stderr

        json_start = output.find("{")
        if json_start < 0:
            if result.returncode != 0:
                logger.warning(
                    "Project analyzer exited %d with no JSON output — "
                    "project-level rules skipped. stderr: %s",
                    result.returncode,
                    (result.stderr or "")[:200],
                )
            return {}
        return json.loads(output[json_start:])
    except (json.JSONDecodeError, subprocess.TimeoutExpired, OSError) as e:
        logger.warning("Project analyzer failed: %s", e)
        return {}
    finally:
        try:
            os.unlink(filelist_path)
        except OSError:
            pass


def _project_findings_to_issues(project_analysis: dict) -> list[CodeIssue]:
    """Convert project analyzer raw findings into CodeIssue list."""
    issues: list[CodeIssue] = []
    if not project_analysis:
        return issues

    for finding in project_analysis.get("findings", []):
        issues.append(CodeIssue(
            file=finding.get("file", ""),
            line=finding.get("line", 0),
            column=0,
            severity=finding.get("severity", "info"),
            category=finding.get("category", "architecture"),
            rule=finding.get("code", "ARCH"),
            message=finding.get("message", ""),
            source="project",
            suggestion=finding.get("suggestion", ""),
        ))

    # LAYER violations
    for violation in project_analysis.get("layer_violations", []):
        issues.append(CodeIssue(
            file=violation.get("file", ""),
            line=violation.get("line", 0),
            column=0,
            severity="error",
            category="architecture",
            rule="LAYER001",
            message=violation.get("message", "Layer violation"),
            source="project",
            suggestion="Respect dependency direction: Domain ← Infrastructure → Application → API",
        ))

    return issues


# ============================================================
# Build Analyzer (dotnet build)
# ============================================================


_MSBUILD_DIAG_RE = re.compile(
    r"^(?P<file>.+?)\((?P<line>\d+)(?:,(?P<col>\d+))?\):\s+"
    r"(?P<sev>error|warning)\s+"
    r"(?P<code>[A-Z][A-Z0-9]+):\s*(?P<msg>.+?)"
    r"\s*(?:\[(?P<proj>[^\]]+)\])?\s*$",
    re.IGNORECASE,
)

_MSBUILD_DIAG_COLON_RE = re.compile(
    r"^(?P<file>.+?):(?P<line>\d+):(?P<col>\d+):\s+"
    r"(?P<sev>error|warning)\s+"
    r"(?P<code>[A-Z][A-Z0-9]+):\s*(?P<msg>.+?)"
    r"\s*(?:\[(?P<proj>[^\]]+)\])?\s*$",
    re.IGNORECASE,
)


def analyze_build(
    csproj_path: str,
    project_root: str,
    framework_type: str | None = None,
    enable_netanalyzers: bool = True,
    cache_dir: str | None = None,
    source_files: list[str] | None = None,
) -> tuple[list[CodeIssue], dict]:
    """Run dotnet build for compile diagnostics.

    Returns ``(issues, netanalyzers_info)`` where ``netanalyzers_info`` reports
    whether the official Microsoft .NET analyzers (CAxxxx) were injected.
    """
    no_inject_reason: str | None = None
    if not dotnet_available():
        return [], {"injected": False, "skipped_reason": "dotnet SDK unavailable"}

    full_path = Path(project_root) / csproj_path
    if not full_path.exists():
        return [], {"injected": False, "skipped_reason": "csproj not found"}

    cache_inputs = [str(full_path)] + list(source_files or [])
    cache_inputs += [
        str(p) for pattern in ("Directory.Build.*", "global.json", "Directory.Packages.props")
        for p in Path(project_root).glob(pattern)
    ]
    build_fp = inputs_fingerprint(
        cache_inputs,
        salt=f"build-v1|{framework_type}|{enable_netanalyzers}",
    )
    if cache_dir:
        cached = load_result_cache(cache_dir, "build-result", build_fp)
        if cached:
            return (
                [CodeIssue(**item) for item in cached.get("issues", [])],
                {**cached.get("info", {}), "cache_hit": True},
            )

    try:
        content = full_path.read_text(encoding="utf-8", errors="ignore")
        is_sdk = "<Project Sdk=" in content

        inject_na = False
        if enable_netanalyzers and is_sdk:
            if framework_type != "modern":
                no_inject_reason = (
                    ".NET Framework requires manual PackageReference "
                    "(Microsoft.CodeAnalysis.NetAnalyzers)"
                )
            elif _csproj_disables_netanalyzers(content):
                no_inject_reason = "project explicitly disabled NetAnalyzers"
            else:
                inject_na = True
        elif not enable_netanalyzers:
            no_inject_reason = "--skip-netanalyzers"

        if is_sdk:
            cmd = ["dotnet", "build", csproj_path, "--no-restore", "-nologo"]
            if inject_na:
                cmd += ["/p:EnableNETAnalyzers=true",
                        "/p:AnalysisLevel=latest-recommended"]
        else:
            cmd = [
                "dotnet", "msbuild", csproj_path,
                "/t:Build", "/p:Configuration=Debug",
                "/p:TreatWarningsAsErrors=false",
                "/clp:ErrorsOnly", "/nologo",
            ]

        result = subprocess.run(
            cmd, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=120, cwd=project_root
        )
        combined = result.stdout + result.stderr
    except (subprocess.TimeoutExpired, OSError):
        return [], {"injected": False, "skipped_reason": "build invocation failed"}

    issues = _parse_msbuild_diagnostics(combined)
    info = {
        "injected": inject_na,
        "skipped_reason": no_inject_reason,
    }
    if cache_dir and (result.returncode == 0 or issues):
        save_result_cache(
            cache_dir,
            "build-result",
            build_fp,
            {"issues": [issue.__dict__ for issue in issues], "info": info},
        )
    return issues, info


def _csproj_disables_netanalyzers(content: str) -> bool:
    """Check if the csproj explicitly disables NetAnalyzers."""
    return bool(re.search(
        r"<EnableNETAnalyzers>\s*false\s*</EnableNETAnalyzers>",
        content, re.IGNORECASE,
    ))


def _parse_msbuild_diagnostics(text: str) -> list[CodeIssue]:
    """Parse MSBuild console output into CodeIssue objects (CS/CA/IDE only)."""
    issues: list[CodeIssue] = []
    for d in _iter_msbuild_diag_fields(text):
        code = d["code"]
        if not re.match(r"^(CS|CA|IDE)\d+$", code):
            continue
        category = _build_rule_category(code)
        suggestion = _build_rule_suggestion(code, d["msg"])
        issues.append(CodeIssue(
            file=d["file"],
            line=d["line"],
            column=0,
            severity=d["sev"],
            category=category,
            rule=code,
            message=d["msg"],
            source="build",
            suggestion=suggestion,
        ))
    return issues


def _iter_msbuild_diag_fields(text: str):
    """Yield parsed diagnostic fields for each matching MSBuild line."""
    for line in text.splitlines():
        stripped = line.strip()
        m = _MSBUILD_DIAG_RE.match(stripped) or _MSBUILD_DIAG_COLON_RE.match(stripped)
        if not m:
            continue
        try:
            line_num = int(m.group("line"))
        except (TypeError, ValueError):
            line_num = 0
        yield {
            "file": m.group("file").strip(),
            "line": line_num,
            "sev": "error" if m.group("sev").lower() == "error" else "warning",
            "code": m.group("code").upper(),
            "msg": m.group("msg").strip() or stripped[:200],
        }


# ── Build rule category mapping (CS/CA → review category) ──
_BUILD_RULE_CATEGORIES: dict[str, str] = {
    # Security
    "CA5350": "security", "CA5351": "security", "CA5379": "security",
    "CA5380": "security", "CA5381": "security", "CA5382": "security",
    "CA5383": "security", "CA5384": "security", "CA5385": "security",
    "CA5386": "security", "CA5387": "security", "CA5388": "security",
    "CA5389": "security", "CA5390": "security", "CA5391": "security",
    "CA5392": "security", "CA5393": "security", "CA5394": "security",
    "CA5395": "security", "CA5396": "security", "CA5397": "security",
    "CA5398": "security", "CA5399": "security",
    "CA3001": "security", "CA3002": "security", "CA3003": "security",
    "CA3004": "security", "CA3005": "security", "CA3006": "security",
    "CA3007": "security", "CA3008": "security", "CA3009": "security",
    "CA3010": "security", "CA3011": "security", "CA3012": "security",
    "CA3013": "security", "CA3014": "security", "CA3015": "security",
    "CA3016": "security", "CA3017": "security", "CA3018": "security",
    "CA3019": "security", "CA3020": "security", "CA3021": "security",
    "CA3022": "security", "CA3023": "security",
    "CA2257": "security",
    # Performance
    "CA1822": "performance", "CA1823": "performance", "CA1824": "performance",
    "CA1825": "performance", "CA1826": "performance", "CA1827": "performance",
    "CA1828": "performance", "CA1829": "performance", "CA1830": "performance",
    "CA1831": "performance", "CA1832": "performance", "CA1833": "performance",
    "CA1834": "performance", "CA1835": "performance", "CA1836": "performance",
    "CA1837": "performance", "CA1838": "performance", "CA1839": "performance",
    "CA1840": "performance", "CA1841": "performance", "CA1842": "performance",
    "CA1843": "performance", "CA1844": "performance", "CA1845": "performance",
    "CA1846": "performance", "CA1847": "performance", "CA1848": "performance",
    "CA1849": "performance", "CA1850": "performance", "CA1851": "performance",
    "CA1852": "performance", "CA1853": "performance", "CA1854": "performance",
    "CA1855": "performance", "CA1856": "performance", "CA1857": "performance",
    "CA1858": "performance", "CA1859": "performance", "CA1860": "performance",
    # Reliability
    "CA1001": "reliability", "CA1012": "reliability", "CA1063": "reliability",
    "CA1508": "reliability", "CA1721": "reliability", "CA1805": "reliability",
    "CA1810": "reliability", "CA1812": "reliability", "CA1820": "reliability",
    # Maintainability
    "CA1000": "best-practice", "CA1008": "best-practice", "CA1010": "best-practice",
    "CA1011": "best-practice", "CA1014": "best-practice", "CA1016": "best-practice",
    "CA1017": "best-practice", "CA1018": "best-practice", "CA1019": "best-practice",
    "CA1021": "best-practice", "CA1024": "best-practice", "CA1027": "best-practice",
    "CA1028": "best-practice", "CA1030": "best-practice", "CA1031": "best-practice",
    "CA1032": "best-practice", "CA1033": "best-practice", "CA1034": "best-practice",
    "CA1036": "best-practice", "CA1040": "best-practice", "CA1041": "best-practice",
    "CA1047": "best-practice", "CA1050": "best-practice", "CA1051": "best-practice",
    "CA1052": "best-practice", "CA1054": "best-practice", "CA1055": "best-practice",
    "CA1056": "best-practice", "CA1062": "best-practice", "CA1065": "best-practice",
    "CA1501": "best-practice", "CA1502": "best-practice", "CA1504": "best-practice",
    "CA1505": "best-practice", "CA1506": "best-practice",
}


def _build_rule_category(code: str) -> str:
    """Map a CS/CA/IDE rule code to a review category."""
    if code in _BUILD_RULE_CATEGORIES:
        return _BUILD_RULE_CATEGORIES[code]
    # Heuristic: CA = code analysis, CS = compiler, IDE = style
    if code.startswith("CA"):
        return "best-practice"
    if code.startswith("CS"):
        return "reliability"
    return "style"


def _build_rule_suggestion(code: str, msg: str) -> str:
    """Generate a fix suggestion for a build rule."""
    if code.startswith("CS"):
        return f"Fix compiler error {code}: {msg[:100]}"
    if code.startswith("CA"):
        return f"Address code analysis rule {code}: {msg[:100]}"
    return msg[:100]


# ============================================================
# Format Analyzer (dotnet format)
# ============================================================


def analyze_format(
    csproj_path: str,
    project_root: str,
    cache_dir: str | None = None,
    source_files: list[str] | None = None,
) -> list[CodeIssue]:
    """Run dotnet format for style diagnostics."""
    if not dotnet_available():
        return []

    full_path = Path(project_root) / csproj_path
    if not full_path.exists():
        return []

    cache_inputs = [str(full_path)] + list(source_files or [])
    cache_inputs += [
        str(p) for pattern in ("Directory.Build.*", "global.json", ".editorconfig")
        for p in Path(project_root).glob(pattern)
    ]
    format_fp = inputs_fingerprint(cache_inputs, salt="format-v1")
    if cache_dir:
        cached = load_result_cache(cache_dir, "format-result", format_fp)
        if cached:
            return [CodeIssue(**item) for item in cached.get("issues", [])]

    try:
        # Cross-platform temp dir: /tmp on Unix, %TEMP% on Windows.
        import tempfile
        report_path = str(Path(tempfile.gettempdir()) / "dotnet-review-format-report.json")
        result = subprocess.run(
            ["dotnet", "format", csproj_path, "--verify-no-changes",
             "--no-restore", "-nologo", "--report", report_path],
            capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=120, cwd=project_root,
        )
        # Parse format output for style issues
        issues: list[CodeIssue] = []
        for line in (result.stdout + result.stderr).splitlines():
            stripped = line.strip()
            # Format diagnostic format: file(line,col): warning IDE: message
            m = _MSBUILD_DIAG_RE.match(stripped) or _MSBUILD_DIAG_COLON_RE.match(stripped)
            if not m:
                continue
            code = m.group("code").upper()
            if not code.startswith("IDE"):
                continue
            issues.append(CodeIssue(
                file=m.group("file").strip(),
                line=int(m.group("line")),
                column=0,
                severity="info",
                category="style",
                rule=code,
                message=m.group("msg").strip(),
                source="format",
                suggestion="Run `dotnet format` to auto-fix style issues.",
            ))
        if cache_dir and (result.returncode == 0 or issues):
            save_result_cache(
                cache_dir,
                "format-result",
                format_fp,
                {"issues": [issue.__dict__ for issue in issues]},
            )
        return issues
    except (subprocess.TimeoutExpired, OSError):
        return []


# ============================================================
# NuGet helpers
# ============================================================


def _resolve_nuget_cache() -> Path:
    """Locate the NuGet global packages folder."""
    env = os.environ.get("NUGET_PACKAGES")
    if env:
        p = Path(env)
        if p.exists():
            return p
    for candidate in [Path("D:/NugetPackages"), Path.home() / ".nuget" / "packages"]:
        if candidate.exists():
            return candidate
    return Path.home() / ".nuget" / "packages"


def _nuget_references_for_csproj(csproj_path: str) -> list[str]:
    """Resolve NuGet package DLL paths from a .csproj file."""
    cache = _resolve_nuget_cache()
    if not cache.exists():
        return []

    try:
        content = Path(csproj_path).read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return []

    refs: list[str] = []
    for match in re.finditer(r'Include="([^"]+)"\s+Version="([^"]+)"', content):
        pkg_name, version = match.group(1), match.group(2)
        pkg_dir = cache / pkg_name.lower() / version
        if pkg_dir.exists():
            dlls = list(pkg_dir.glob("lib/net8.0/*.dll"))
            if not dlls:
                dlls = list(pkg_dir.glob("lib/net6.0/*.dll"))
            if not dlls:
                dlls = list(pkg_dir.glob("lib/netstandard2.0/*.dll"))
            refs.extend(str(d) for d in dlls)
    return refs


def _expand_files_for_semantic_analysis(files: list[str], project_root: str) -> list[str]:
    """Expand file list to include all files in the same project(s)."""
    if not files:
        return files

    csprojs = _csproj_for_files(files)
    if not csprojs:
        return files

    expanded = set(files)
    for csproj in csprojs:
        csproj_dir = Path(csproj).parent
        for cs_file in csproj_dir.rglob("*.cs"):
            if cs_file.name.endswith(".Designer.cs") or cs_file.name == "Program.cs":
                continue
            expanded.add(str(cs_file))

    return list(expanded)


def _csproj_for_files(cs_files: list[str], max_depth: int = 8) -> list[str]:
    """Find .csproj files that contain the given .cs files."""
    csproj_dirs: set[str] = set()
    for cs_file in cs_files:
        p = Path(cs_file).resolve()
        search_dir = p.parent
        for _ in range(max_depth):
            csprojs = list(search_dir.glob("*.csproj"))
            if csprojs:
                csproj_dirs.add(str(csprojs[0]))
                break
            if search_dir.parent == search_dir:
                break
            search_dir = search_dir.parent
    return list(csproj_dirs)
