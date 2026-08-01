"""Lightweight security checks and CWE/OWASP metadata."""
from __future__ import annotations

import re

from .models import CodeIssue


SECURITY_RULE_METADATA: dict[str, tuple[str, str]] = {
    "LEGACY_SEC002_process_injection": ("CWE-78", "A03:2021"),
    "LEGACY_SEC003_xpath_injection": ("CWE-643", "A03:2021"),
    "LEGACY_SEC004_path_traversal": ("CWE-22", "A01:2021"),
    "LEGACY_SEC_hardcoded_secret": ("CWE-798", "A07:2021"),
    "LEGACY_TLS_cert_validation_disabled": ("CWE-295", "A07:2021"),
    "LEGACY_BinaryFormatter": ("CWE-502", "A08:2021"),
    "LEGACY_CSharpCodeProvider": ("CWE-95", "A03:2021"),
    "LEGACY_SEC024_open_redirect": ("CWE-601", "A01:2021"),
    "LEGACY_SEC025_ssrf": ("CWE-918", "A10:2021"),
    "LEGACY_SEC023_cors_misconfig": ("CWE-942", "A05:2021"),
    "SEC026_sensitive_data_logging": ("CWE-532", "A09:2021"),
    "SEC027_jwt_validation_disabled": ("CWE-347", "A07:2021"),
    "SEC028_cleartext_http": ("CWE-319", "A02:2021"),
    "SEC029_password_in_url": ("CWE-598", "A07:2021"),
}


def enrich_security_metadata(issues: list[CodeIssue]) -> None:
    """Attach CWE and OWASP identifiers to known security findings."""
    for issue in issues:
        cwe, owasp = SECURITY_RULE_METADATA.get(issue.rule, ("", ""))
        if cwe:
            issue.cwe = issue.cwe or cwe
            issue.owasp = issue.owasp or owasp


def analyze_security_text(file_codes: dict[str, str]) -> list[CodeIssue]:
    """Detect a small set of high-signal security sinks missed by legacy rules."""
    issues: list[CodeIssue] = []
    patterns = [
        (r"\b(?:Log|Logger|Console)\w*\s*\.\s*\w+\s*\([^\n]*(?:password|passwd|secret|token|authorization)\b",
         "SEC026_sensitive_data_logging", "error", "CWE-532", "避免把密码、令牌或 Authorization 写入日志。"),
        (r"(?:ValidateIssuerSigningKey|ValidateLifetime|RequireHttpsMetadata)\s*=\s*false",
         "SEC027_jwt_validation_disabled", "error", "CWE-347", "不要关闭 JWT 签名/生命周期/HTTPS 元数据校验。"),
        (r"(?i)http://[^\s\"']+", "SEC028_cleartext_http", "warning", "CWE-319", "生产环境使用 HTTPS，并通过配置或 allowlist 管理外部地址。"),
        (r"(?i)(?:password|passwd|secret|token)\s*=\s*[^&\"']+&|[?&](?:password|token|secret)=",
         "SEC029_password_in_url", "error", "CWE-598", "不要通过 URL query 传递密码或令牌，改用安全请求头或请求体。"),
    ]
    for path, code in file_codes.items():
        for pattern, rule, severity, cwe, suggestion in patterns:
            for match in re.finditer(pattern, code):
                line = code[:match.start()].count("\n") + 1
                issues.append(CodeIssue(
                    file=path, line=line, severity=severity, category="security",
                    rule=rule, message=f"检测到潜在安全风险：{rule}", source="security",
                    suggestion=suggestion, cwe=cwe,
                    owasp=SECURITY_RULE_METADATA.get(rule, ("", ""))[1],
                ))
    return issues
