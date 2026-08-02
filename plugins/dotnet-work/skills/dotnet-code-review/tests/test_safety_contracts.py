"""Regression tests for CVE database integrity and atomic auto-fixes."""
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPT_DIR))

from review.models import CodeIssue
from review.nuget import check_nuget_cves
from review.auto_fix import apply_auto_fix, apply_all_auto_fixes


def test_cve_sidecar_mismatch_is_not_reported_as_clean(tmp_path):
    payload = json.dumps(
        {
            "packages": {
                "Example.Package": {
                    "1.0.0": [{"id": "CVE-TEST", "severity": "high", "title": "test"}]
                }
            },
            "updated_at": "2026-08-01T00:00:00Z",
        },
        ensure_ascii=False,
    ).encode("utf-8")
    db = tmp_path / "nuget-cve.json"
    db.write_bytes(payload)
    (tmp_path / "nuget-cve.json.sha256").write_text("0" * 64, encoding="ascii")

    result = check_nuget_cves(
        [{"name": "Example.Package", "version": "1.0.0"}], str(db)
    )
    assert result["db_present"] is False
    assert "SHA-256" in result["warning"]
    assert result["vulnerabilities"] == []


def test_auto_fix_without_backup_is_atomic_and_does_not_leave_temp_files(tmp_path):
    source = tmp_path / "Sample.cs"
    source.write_text("// TODO fix this\n", encoding="utf-8")

    count, content = apply_auto_fix(str(source), "S001", create_backup=False)

    assert count == 1
    assert "TODO():" in content
    assert source.read_text(encoding="utf-8") == content
    assert not Path(str(source) + ".bak").exists()
    assert not list(tmp_path.glob("*.autofix-tmp"))


def test_apply_all_auto_fixes_keeps_one_original_backup(tmp_path):
    source = tmp_path / "Sample.cs"
    original = "class Sample\n{\n#region Old\nint value = 1;\n#endregion\n}\n"
    source.write_text(original, encoding="utf-8")
    issue = CodeIssue(
        file=str(source), line=1, severity="info", category="style",
        rule="LEGACY_S003_excessive_region", message="region", source="ast",
    )

    result = apply_all_auto_fixes([issue], create_backup=True, dry_run=False)

    assert result["files_modified"] == [str(source)]
    assert source.read_text(encoding="utf-8") != original
    assert Path(str(source) + ".bak").read_text(encoding="utf-8") == original
    assert not list(tmp_path.glob("*.autofix-tmp"))
