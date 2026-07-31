from __future__ import annotations
import hashlib
import json
import logging
from pathlib import Path

logger = logging.getLogger('dotnet-review')

# Cache version derived from analyzer DLL hashes — invalidates cached results
# when any analyzer is rebuilt. Increment the SALT when the cache format changes
# without touching the DLLs (e.g. after a bugfix in review.py's cache consumer).
_CACHE_SALT = "v1"
_CACHE_VERSION: str | None = None


def _compute_analyzer_hash() -> str:
    """Compute a combined hash of analyzer projects for cache versioning.

    Returns a hex string that changes when any analyzer is rebuilt or its
    .csproj changes. Empty string if no analyzer artifacts can be read
    (cache disabled).

    The runtime invokes analyzers via ``dotnet run --project <x>.csproj``, so
    cache validity must track the .csproj files (dependency/TFM changes drive
    ``dotnet run`` rebuilds) plus the newest built DLL under bin/ for each
    project. We hash the newest DLL across all bin/ subdirs (Debug/Release ×
    net6.0/net8.0/win-x64) rather than a hardcoded ``Debug/net6.0`` path,
    which went stale when ast-analyzer moved to net8.0 and the unified
    analyzer (preferred at runtime) was added.
    """
    skill_dir = Path(__file__).resolve().parent.parent
    hasher = hashlib.sha256()
    hasher.update(_CACHE_SALT.encode())
    # Include the unified analyzer (preferred at runtime) and the three
    # individual analyzers (fallback path).
    for name in [
        "csharp-unified-analyzer",
        "csharp-ast-analyzer",
        "csharp-semantic-analyzer",
        "csharp-project-analyzer",
    ]:
        proj_dir = skill_dir / name
        csproj = proj_dir / f"{name}.csproj"
        if csproj.exists():
            try:
                hasher.update(csproj.read_bytes())
            except OSError:
                pass
        # Newest built DLL across all configs/tfms under bin/.
        dlls = sorted(
            proj_dir.glob("bin/**/{0}.dll".format(name)),
            key=lambda p: p.stat().st_mtime if p.exists() else 0,
        )
        if dlls:
            try:
                hasher.update(dlls[-1].read_bytes())
            except OSError:
                pass
    return hasher.hexdigest()[:16]


def _cache_version() -> str:
    global _CACHE_VERSION
    if _CACHE_VERSION is None:
        _CACHE_VERSION = _compute_analyzer_hash()
    return _CACHE_VERSION


def _cache_key(filepath: str) -> str:
    """Build cache key from analyzer version + file content hash."""
    h = file_hash(filepath)
    if not h:
        return ""
    return f"{_cache_version()}_{h}"


def file_hash(filepath: str) -> str:
    """SHA-256 hash of file content (used for cache key)."""
    try:
        h = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()
    except OSError:
        return ""


def load_cache(cache_dir: str, filepath: str) -> list | None:
    """Load cached analysis result for a file, if hash and version match."""
    if not cache_dir:
        return None
    key = _cache_key(filepath)
    if not key:
        return None
    cache_file = Path(cache_dir) / f"{key}.json"
    if not cache_file.exists():
        return None
    try:
        data = json.loads(cache_file.read_text(encoding="utf-8"))
        # Double-check version embedded in the cached data (belt-and-suspenders
        # against hash collisions or manual cache edits).
        if data.get("_cv") != _cache_version():
            logger.debug("Cache version mismatch for %s, ignoring", filepath)
            return None
        return data.get("issues", [])
    except (OSError, json.JSONDecodeError):
        return None


def save_cache(cache_dir: str, filepath: str, issues: list) -> None:
    """Save analysis result to cache (keyed by analyzer version + file hash)."""
    if not cache_dir:
        return
    key = _cache_key(filepath)
    if not key:
        return
    try:
        Path(cache_dir).mkdir(parents=True, exist_ok=True)
        cache_file = Path(cache_dir) / f"{key}.json"
        cache_file.write_text(
            json.dumps({"file": filepath, "_cv": _cache_version(), "issues": issues},
                       ensure_ascii=False),
            encoding="utf-8",
        )
    except OSError:
        pass
