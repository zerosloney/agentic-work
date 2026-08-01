"""ASP.NET API, EF Core and microservice-oriented checks."""
from __future__ import annotations

import re

from .models import CodeIssue


def analyze_specialized(file_codes: dict[str, str]) -> list[CodeIssue]:
    issues: list[CodeIssue] = []
    for path, code in file_codes.items():
        normalized = path.replace("\\", "/").lower()
        is_web = "controller" in normalized or "Microsoft.AspNetCore" in code

        if is_web:
            # Public controller actions without an explicit route attribute are
            # easy to expose accidentally when conventions change.
            for match in re.finditer(
                r"(?ms)(?P<attrs>(?:\s*\[[^\]]+\]\s*)*)\s*public\s+(?:async\s+)?(?:Task<)?(?:IActionResult|ActionResult|IResult|HttpResponseMessage)",
                code,
            ):
                attrs = match.group("attrs")
                if not re.search(r"\[\s*(?:Http(?:Get|Post|Put|Delete|Patch)|Route)\b", attrs):
                    issues.append(CodeIssue(
                        file=path, line=code[:match.start()].count("\n") + 1,
                        severity="warning", category="security", rule="ASP_API001",
                        message="公共 API action 未声明明确的 HTTP 方法或 Route",
                        source="specialized", suggestion="为 endpoint 添加 [HttpGet]/[HttpPost]/[Route]，避免路由约定漂移。",
                    ))

        # EF Core: unbounded materialization is a common production incident
        # pattern. Keep it informational because paging may be applied earlier.
        for match in re.finditer(r"\.(?:ToList|ToListAsync|ToArray|ToArrayAsync)\s*\(", code):
            window = code[max(0, match.start() - 300):match.start()]
            if "Take(" not in window and "Where(" not in window:
                issues.append(CodeIssue(
                    file=path, line=code[:match.start()].count("\n") + 1,
                    severity="info", category="performance", rule="EF007",
                    message="EF Core 查询可能未限制结果集就执行物化",
                    source="specialized", suggestion="确认查询有分页、过滤或合理的结果上限。",
                ))

        # Microservices: direct HttpClient construction bypasses pooled handler
        # lifetime management; missing timeout can turn an outage into thread
        # starvation.
        for match in re.finditer(r"\bnew\s+HttpClient\s*\(", code):
            issues.append(CodeIssue(
                file=path, line=code[:match.start()].count("\n") + 1,
                severity="warning", category="reliability", rule="MS001",
                message="直接 new HttpClient 可能造成连接池和 DNS 生命周期问题",
                source="specialized", suggestion="优先使用 IHttpClientFactory 或平台提供的客户端工厂。",
            ))
        if "HttpClient" in code and "Timeout" not in code and "IHttpClientFactory" not in code:
            line = code.find("HttpClient")
            issues.append(CodeIssue(
                file=path, line=code[:line].count("\n") + 1,
                severity="info", category="reliability", rule="MS002",
                message="HttpClient 未发现显式 Timeout 配置",
                source="specialized", suggestion="为外部调用配置有限超时、取消令牌和重试策略。",
            ))
    return issues
