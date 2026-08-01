from __future__ import annotations
import hashlib
import json
import logging
import time
from pathlib import Path

logger = logging.getLogger('dotnet-review')

# Cache version derived from analyzer DLL hashes — invalidates cached results
# when any analyzer is rebuilt. Increment the SALT when the cache format changes
# without touching the DLLs (e.g. after a bugfix in review.py's cache consumer).
_CACHE_SALT = "v1"
_CACHE_VERSION: str | None = None


def inputs_fingerprint(paths: list[str], salt: str = "") -> str:
    """Return a stable content fingerprint for a group of review inputs.

    This is used for whole-project results (semantic/build/format), where a
    single file cache key is insufficient because project settings and
    references affect the result.
    """
    hasher = hashlib.sha256()
    hasher.update(salt.encode("utf-8"))
    for raw_path in sorted({str(Path(p).resolve()) for p in paths}):
        path = Path(raw_path)
        hasher.update(raw_path.lower().encode("utf-8", errors="replace"))
        digest = file_hash(raw_path) if path.is_file() else "missing"
        hasher.update(digest.encode("ascii"))
    return hasher.hexdigest()[:24]


def load_result_cache(cache_dir: str | None, prefix: str, fingerprint: str) -> dict | None:
    """Load a JSON result cache entry keyed by a complete input fingerprint."""
    if not cache_dir or not fingerprint:
        return None
    path = Path(cache_dir) / f"{prefix}_{fingerprint}.json"
    try:
        if time.time() - path.stat().st_mtime > 24 * 60 * 60:
            return None
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except (OSError, json.JSONDecodeError):
        return None


def save_result_cache(
    cache_dir: str | None, prefix: str, fingerprint: str, data: dict
) -> None:
    """Atomically save a whole-project JSON result cache entry."""
    if not cache_dir or not fingerprint:
        return
    try:
        root = Path(cache_dir)
        root.mkdir(parents=True, exist_ok=True)
        path = root / f"{prefix}_{fingerprint}.json"
        temp = root / f".{path.name}.tmp"
        temp.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        temp.replace(path)
        # Keep each result-cache family bounded. Fingerprints are immutable, so
        # retaining only the newest entries prevents long-lived workspaces from
        # accumulating stale project snapshots.
        entries = sorted(
            root.glob(f"{prefix}_*.json"),
            key=lambda p: p.stat().st_mtime if p.exists() else 0,
            reverse=True,
        )
        for stale in entries[32:]:
            try:
                stale.unlink()
            except OSError:
                pass
    except OSError:
        pass


def _compute_analyzer_hash() -> str:
    """Compute a combined hash of analyzer projects for cache versioning.

    Returns a hex string that changes when any analyzer is rebuilt or its
    .csproj changes. Empty string if no analyzer artifacts can be read
    (cache disabled).

    The runtime prefers a built DLL for each individual analyzer and falls
    back to ``dotnet run --project <x>.csproj`` when no DLL is available. Cache
    validity therefore tracks the .csproj files (dependency/TFM changes drive
    the fallback rebuild) plus the newest built DLL under bin/ for each
    project. We hash the newest DLL across all bin/ subdirs (Debug/Release ×
    net6.0/net8.0/win-x64) rather than a hardcoded TFM path.
    """
    skill_dir = Path(__file__).resolve().parent.parent
    hasher = hashlib.sha256()
    hasher.update(_CACHE_SALT.encode())
    # Include the three authoritative individual analyzers. Keep the unified
    # project in the cache fingerprint as well so future parity work cannot
    # accidentally reuse results produced by a different analyzer build.
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
