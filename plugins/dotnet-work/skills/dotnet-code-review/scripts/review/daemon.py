"""Local long-running review daemon.

The daemon keeps the Python orchestration process alive, serializes reviews to
avoid concurrent MSBuild loads, and reuses the same project result caches. It
is intentionally localhost-only; it does not expose arbitrary shell execution.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .engine import run_review


_LOCK = threading.Lock()
_REPORT_CACHE: dict[str, dict] = {}


def _args_from_request(payload: dict) -> argparse.Namespace:
    values = {
        "target": payload.get("target"), "diff": payload.get("diff"), "files": payload.get("files"),
        "all": payload.get("all", False), "preview": False, "quick": payload.get("quick", True),
        "workers": int(payload.get("workers", 4)), "changed_only": payload.get("changed_only", False),
        "cache": payload.get("cache"), "semantic_cache_dir": payload.get("semantic_cache_dir"),
        "no_incremental_semantic": False, "solution": payload.get("solution"),
        "target_framework": payload.get("target_framework"), "legacy_compat": payload.get("legacy_compat", False),
        "skip_ast": payload.get("skip_ast", False), "skip_semantic": payload.get("skip_semantic", False),
        "skip_project": payload.get("skip_project", False), "skip_build": payload.get("skip_build", True),
        "skip_format": payload.get("skip_format", True), "skip_netanalyzers": False,
        "no_duplicates": payload.get("no_duplicates", True), "no_docs": payload.get("no_docs", True),
        "no_nuget_check": payload.get("no_nuget_check", True), "coverage": payload.get("coverage"),
        "coverage_threshold": float(payload.get("coverage_threshold", 0.6)), "cve_check": False,
        "cve_db": None, "ensure_cve_db": False, "history_dir": payload.get("history_dir"),
        "api_compat": False, "baseline_report": None, "fail_on_introduced": "none",
        "context_bundles": False, "fix": False, "fix_dry_run": False,
    }
    return argparse.Namespace(**values)


class _Handler(BaseHTTPRequestHandler):
    server_version = "dotnet-review-daemon/1"

    def _write(self, status: int, body: dict):
        raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path == "/health":
            self._write(200, {"status": "ok", "cache_entries": len(_REPORT_CACHE)})
        else:
            self._write(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/review":
            self._write(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 2_000_000:
                raise ValueError("request body must be between 1 byte and 2 MB")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("request body must be a JSON object")
            key = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
            with _LOCK:
                report = _REPORT_CACHE.get(key)
                if report is None:
                    report = run_review(_args_from_request(payload))
                    _REPORT_CACHE[key] = report
            self._write(200, report)
        except Exception as exc:
            self._write(400, {"error": str(exc), "type": type(exc).__name__})

    def log_message(self, *_args):
        return


def main() -> None:
    parser = argparse.ArgumentParser(description="Local dotnet-code-review daemon")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), _Handler)
    print(json.dumps({"status": "listening", "url": f"http://{args.host}:{args.port}"}), flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
