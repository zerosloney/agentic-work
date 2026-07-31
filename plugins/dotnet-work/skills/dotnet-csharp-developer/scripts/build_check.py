#!/usr/bin/env python3
"""build_check.py — Structured build verification for dotnet-csharp-developer (Step 4a).

Wraps `dotnet build` and emits JSON with error/warning classification.
The Agent reads structured output instead of parsing raw MSBuild text.

Usage:
    python scripts/build_check.py --project <.csproj> [--config Debug] [--json]
    python scripts/build_check.py --project <.csproj> --changed-files a.cs b.cs

Output (JSON):
    {
      "pass": true,
      "error_count": 0,
      "warning_count": 3,
      "errors": [{"file": "...", "line": 42, "code": "CS1061", "message": "..."}],
      "warnings": [{"file": "...", "line": 18, "code": "CS0168", "message": "..."}],
      "new_errors": ["CS1061"],           // errors in changed files (heuristic)
      "pre_existing_errors": [],          // errors in unchanged files
      "dotnet_version": "8.0.101",
      "exit_code": 0
    }

Exit codes:
    0 — zero errors (warnings OK)
    1 — warnings only, no errors
    2 — build errors present
    3 — fatal (no .csproj / dotnet missing / XML parse error)
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

# MSBuild diagnostic line: file(line,col): severity CODE: message [project]
_MSBUILD_DIAG_RE = re.compile(
    r"^(?P<file>.+?)\((?P<line>\d+)(?:,(?P<col>\d+))?\):\s+"
    r"(?P<sev>error|warning)\s+"
    r"(?P<code>[A-Z][A-Z0-9]+):\s*(?P<msg>.+?)\s*$",
    re.IGNORECASE,
)
_MSBUILD_DIAG_COLON_RE = re.compile(
    r"^(?P<file>.+?):(?P<line>\d+):(?P<col>\d+):\s+"
    r"(?P<sev>error|warning)\s+"
    r"(?P<code>[A-Z][A-Z0-9]+):\s*(?P<msg>.+?)\s*$",
    re.IGNORECASE,
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Structured dotnet build check")
    p.add_argument("--project", required=True, help="Path to .csproj file")
    p.add_argument("--config", default="Debug", help="Build configuration (default: Debug)")
    p.add_argument("--changed-files", nargs="*", default=[],
                   help="Files the Agent just modified (for new-vs-preexisting heuristic)")
    p.add_argument("--timeout", type=int, default=120, help="Build timeout seconds")
    return p.parse_args()


def run_build(project: str, config: str, timeout: int) -> tuple[int, str, str]:
    """Run dotnet build. Returns (returncode, stdout, stderr).

    Forces invariant (English) culture via /p:InvariantCulture=true so MSBuild
    diagnostic lines use the stable `error CSxxxx:` / `warning CSxxxx:` format
    the regex in parse_diagnostics expects. On localized SDKs (zh/ja/...) the
    output otherwise becomes `错误 CS1061:` and parse_diagnostics silently
    drops real compile errors.
    """
    cmd = [
        "dotnet", "build", project,
        "--configuration", config,
        "--no-restore",
        "-nologo",
        "/p:InvariantCulture=true",
    ]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout,
            encoding="utf-8", errors="replace",
        )
        return result.returncode, result.stdout, result.stderr
    except FileNotFoundError:
        return -1, "", "dotnet command not found on PATH"
    except subprocess.TimeoutExpired:
        return -2, "", f"build timed out after {timeout}s"


def parse_diagnostics(text: str) -> tuple[list[dict], list[dict]]:
    """Parse MSBuild diagnostic lines into errors and warnings."""
    errors, warnings = [], []
    for line in text.splitlines():
        stripped = line.strip()
        m = _MSBUILD_DIAG_RE.match(stripped) or _MSBUILD_DIAG_COLON_RE.match(stripped)
        if not m:
            continue
        entry = {
            "file": m.group("file").strip(),
            "line": int(m.group("line")),
            "code": m.group("code").upper(),
            "message": m.group("msg").strip(),
        }
        sev = m.group("sev").lower()
        if sev == "error":
            errors.append(entry)
        else:
            warnings.append(entry)
    return errors, warnings


def classify_errors(errors: list[dict], changed_files: list[str]) -> tuple[list[str], list[str]]:
    """Heuristic: separate errors in changed files vs pre-existing."""
    if not changed_files:
        return [], [e["code"] for e in errors]

    changed_lower = {Path(f).name.lower() for f in changed_files}
    new_codes, pre_codes = [], []
    for e in errors:
        fname = Path(e["file"]).name.lower()
        if fname in changed_lower:
            new_codes.append(e["code"])
        else:
            pre_codes.append(e["code"])
    return new_codes, pre_codes


def get_dotnet_version() -> str:
    try:
        r = subprocess.run(["dotnet", "--version"], capture_output=True, text=True, timeout=10)
        return r.stdout.strip() if r.returncode == 0 else ""
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return ""


def main() -> int:
    args = parse_args()
    project_path = Path(args.project)

    # ── Pre-flight checks ──
    if not project_path.exists():
        print(json.dumps({
            "pass": False,
            "exit_code": 3,
            "fatal": f"project file not found: {project_path}",
        }))
        return 3

    # Validate XML is loadable (quick check)
    try:
        content = project_path.read_text(encoding="utf-8", errors="ignore")
        if "<Project" not in content:
            print(json.dumps({
                "pass": False,
                "exit_code": 3,
                "fatal": f"not a valid .csproj file: {project_path}",
            }))
            return 3
    except OSError as e:
        print(json.dumps({
            "pass": False,
            "exit_code": 3,
            "fatal": f"cannot read project file: {e}",
        }))
        return 3

    # ── Run build ──
    rc, stdout, stderr = run_build(str(project_path), args.config, args.timeout)

    if rc == -1:
        print(json.dumps({
            "pass": False,
            "exit_code": 3,
            "fatal": "dotnet command not found on PATH — install .NET SDK 8+",
            "install_url": "https://dotnet.microsoft.com/download",
        }))
        return 3

    if rc == -2:
        print(json.dumps({
            "pass": False,
            "exit_code": 3,
            "fatal": stderr.strip(),
        }))
        return 3

    combined = stdout + "\n" + stderr
    errors, warnings = parse_diagnostics(combined)
    new_codes, pre_codes = classify_errors(errors, args.changed_files)

    result = {
        "pass": len(errors) == 0,
        "error_count": len(errors),
        "warning_count": len(warnings),
        "errors": errors,
        "warnings": warnings,
        "new_errors": list(set(new_codes)),
        "pre_existing_errors": list(set(pre_codes)),
        "dotnet_version": get_dotnet_version(),
        "exit_code": 2 if errors else (1 if warnings else 0),
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result["exit_code"]


if __name__ == "__main__":
    sys.exit(main())
