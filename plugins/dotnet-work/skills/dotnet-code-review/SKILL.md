---
name: dotnet-code-review
description: |
  C#/.NET 代码审查，基于 Roslyn（AST + Semantic + Project）+ dotnet build/format + 离线 CVE 库。
  6 维度覆盖：安全（OWASP Top 10 / CWE 映射）、性能、可维护性、可测试性、最佳实践/可靠性、架构（与 `references/dimensions-coverage.md` 对齐）。
  186 条自研规则（AST 154 + 语义 24 + 测试/安全/专项 8）+ NetAnalyzers CAxxxx（~500 条）动态注入。
  两阶段 Triage→Verify 协议 + Agent 误报反馈闭环（.dotnet-review/agent-verdicts.json）+
  SARIF 输出（GitHub Code Scanning）+ 自动修复（9 条规则）。
  Agent 通过 subprocess 调用 scripts/review.py，用户不接触 CLI。
  触发：用户说"审查 C# 代码" / "代码 review" / "安全扫描" / "生产就绪检查" / "NuGet 包安全" 时。
when_to_use: |
  用户需要审查 C# 代码质量、安全检查、生产就绪评估、PR 审查、NuGet 包安全分析时使用。
  触发词："代码审查"、"review"、"安全扫描"、"质量评分"、"CVE"、"生产就绪"、"代码质量"。
license: MIT
metadata:
  author: master0071
  version: 1.0.7
  category: code-quality
---

# .NET Code Review — Agent 指令集

## 核心原则

1. **用户看不到 CLI。** 用户用自然语言提审查需求，你在后台调 `review.py`，只返回结果报告。
2. **先跑 CLI 再报告。** 不要凭 SKILL.md 的规则文档手动审查代码——规则文档是参考，实际 findings 来自 Roslyn 分析器。
3. **格式优先 `--format compact --output-mode top --max-issues 10`**。先拿紧凑结果确认分数，需要细节时再补 `--format json`。
4. **读取 review_integrity。** 每次运行检查 `layers_skipped` / `cve_conclusion_valid` / `coverage_conclusion_valid`，在报告中说明边界。
5. **修复建议基于 CLI 结果 + 代码上下文生成。** 不是调用外部 LLM，而是当前模型基于 issue 列表 + 源码 ±3 行直接生成 diff。

脚本路径：`skill://dotnet-code-review/scripts/review.py`

---

## 0. 前置条件

### 0.1 .NET SDK 门禁

CLI 要求 .NET SDK ≥ 6.0。调用前先检查：

```bash
dotnet --version
```

- 失败 / < 6.0 → CLI 抛 `ToolMissingError`（exit 4），不返回任何 issues
- 告知用户安装 .NET SDK 6+（推荐 8.0 LTS）：https://dotnet.microsoft.com/download

### 0.2 C# 分析器编译

三个 Roslyn 分析器以源文件提供，**首次使用前需编译**。运行时优先执行已编译 DLL；如果 DLL 不存在，会自动走允许 restore 的 `dotnet run` 慢路径回退：
- `scripts/csharp-ast-analyzer/` — AST 语法树级检测
- `scripts/csharp-semantic-analyzer/` — 语义模型级检测（SDK 8+ solution 模式优先使用 MSBuildWorkspace；SDK 6/7 保留 fallback）
- `scripts/csharp-project-analyzer/` — 跨文件项目级检测

编译命令（在 skill 根目录执行）：
- Windows: `powershell -File scripts/build-analyzers.ps1`
- Linux/macOS: `bash scripts/build-analyzers.sh`

### 0.3 性能路径与缓存

- 日常本地审查优先使用 `--quick`；CI/生产门禁使用完整模式。
- Semantic、Build、Format 结果按源文件、项目文件、`Directory.Build.*`、`global.json`、`project.assets.json`、SDK/TFM 等输入指纹缓存到 `<project>/.review-cache/`。
- SDK 8+ 且提供 solution 时，Semantic 优先按目标 `.csproj` 及其项目引用闭包加载 MSBuildWorkspace；只有 `--solution full` 才加载整个 solution。
- 热缓存命中会在 JSON 的 `semantic_cache_stats`、`phase_timings` 和 `review_integrity.semantic_workspace` 中体现；缓存默认 24 小时有效并限制每类最多 32 个结果。

### 0.4 团队配置与自定义规则包

在项目根目录放置 `.dotnet-review/config.json`（也可通过 `DOTNET_REVIEW_CONFIG` 指定外部文件）：

```json
{
  "disabled_rules": ["MS002"],
  "severity_overrides": {"TESTQ002": "warning"},
  "exclude_paths": ["**/Generated/"],
  "rule_packages": [".dotnet-review/team-rules.json"]
}
```

规则包使用 `{"rules": [...]}` 或规则数组格式；每条规则至少包含 `id`、`pattern`，可选 `severity`、`category`、`suggestion`、`cwe`、`owasp`、`enabled`。规则包中的正则规则会与内置规则一起参与审查，团队配置只影响当前项目。

### 0.5 PR 评论、趋势与常驻服务

- 生成 GitHub/Azure DevOps 评论 payload 不访问网络：`--pr-provider github --pr-comments-out pr-comments.json`。
- 只有显式添加 `--publish-pr-comments` 才会使用 CI 环境变量发布评论；GitHub 读取 `GITHUB_TOKEN` 等变量，Azure DevOps 读取 `SYSTEM_ACCESSTOKEN` 等变量。
- 记录历史后生成性能/质量趋势：`--trend-report .review-history --trend-format markdown`；报告包含阶段耗时、分数/问题数变化、规则回归和测试质量。
- 启动本机热审查 daemon：在 `scripts/` 目录执行 `python -m review.daemon --port 8765`，然后 POST JSON 到 `/review`，GET `/health` 查看状态。daemon 常驻 Python 编排进程并复用项目缓存，Roslyn analyzer 子进程在未命中缓存时仍会按请求执行。

---

## 1. 命令速查

### 1.1 场景速查表

| 用户意图 | 命令 | 说明 |
|---------|------|------|
| 审查整个项目 | `--target <目录> --format compact --output-mode top --max-issues 10` | 自动扫描全部 .cs，快速出分 |
| 审查指定文件 | `--files <path1.cs> [path2.cs ...] --format compact --output-mode top` | 指定文件，不扫描目录 |
| 审查 PR 变更 | `--diff HEAD --changed-only --format compact --output-mode top` | 仅报告变更行上的问题 |
| 快速本地审查 | `--target <目录> --quick --format compact --output-mode top --max-issues 10` | 只跑 AST + Semantic，跳过项目/build/format/NuGet/CVE 扩展层 |
| 审查并对比基线 | `--target . --baseline-report baseline.json --fail-on-introduced error --format json` | 先跑基线，再对比增量 |
| 完整生产级审查 | `--target . --quality-gate-score 85 --fail-on warning --cve-check --format json` | 安全 + 质量 + CVE |
| 只看摘要 | `--target . --format compact --output-mode summary` | 仅分数+统计，~50-100 token |
| 只看问题列表 | `--target . --format json --output-mode by-rule` | 按规则分组，跳过详细信息 |
| 预览文件列表 | `--target . --preview` | 列出将扫描的文件，不执行审查 |
| 输出 SARIF | `--target . --format sarif` | 用于 GitHub Code Scanning / Azure DevOps |
| 生成 PR 评论 | `--target . --pr-provider github --pr-comments-out pr-comments.json` | 生成 GitHub/Azure DevOps provider payload，不发布网络请求 |
| 质量/性能趋势 | `--trend-report .review-history --trend-format markdown` | 读取历史 JSONL，不重新扫描代码 |
| 自动修复 | `--target . --fix-dry-run`（预览） / `--fix`（执行） | 9 条内置规则可自动修复 |
| 覆盖率检查 | `--coverage coverage.cobertura.xml --coverage-threshold 0.8` | 读 Cobertura 报告检查覆盖率 |
| .NET Framework 项目 | `--target <目录> --legacy-compat --format compact --output-mode top --max-issues 10` | 跳过 SDK 6+ 门槛和 Build/Format 层，AST/语义/项目分析仍运行 |
| 人工审查清单 | `--checklist` | 输出工具无法静态检测的维度清单 |

### 1.2 Token 节约模式 / 输出格式选择

| 场景 | 命令组合 | token | 理由 |
|------|---------|-------|------|
| 快速评分/摘要 | `--format compact --output-mode summary` | ~50-100 | 最小 token，仅分数+统计 |
| 看最严重问题 | `--format compact --output-mode top --max-issues 10` | ~200-500 | 首次审查，先看 top 10 |
| 按规则分组 | `--format json --output-mode by-rule` | ~500-2000 | 省去重复 issue 详情 |
| 全部 issue 详情 | `--format json`（默认） | ~2000-10000 | 完整结构化数据，生成修复建议 |
| 上传 Code Scanning | `--format sarif` | — | GitHub/Azure DevOps 原生格式 |
| 截断消息长度 | `--max-message-length 80`（追加） | 追加节省 | 控制单条消息大小 |

性能参数：`--workers N` 控制文档、风格和性能等独立文件检查的最大并发数（默认 4）。
完整 JSON 报告包含 `analysis_time`、`phase_timings` 和 `review_mode`，可用于定位冷启动、MSBuild、Build/Format 或缓存瓶颈。

### 1.3 质量门禁

| 参数 | 作用 |
|------|------|
| `--quality-gate-score <N>` | 总分 < N 时 exit 1。推荐：开发 70、测试 80、预生产 85、生产 90 |
| `--fail-on {error\|warning\|info\|none}` | 存在该级别及以上 issue 时 exit 非零（默认 error） |
| `--fail-on-introduced {error\|warning\|none}` | 仅 PR 新引入的问题触发（需 `--baseline-report`） |

### 1.4 Exit Code

| 码 | 含义 |
|----|------|
| 0 | 通过或无问题 |
| 1 | error 级别问题，或分数低于 `--quality-gate-score` |
| 2 | 仅 warning |
| 3 | 配置错误 |
| 4 | 工具缺失（.NET SDK） |
| 5 | 内部错误 |
| 6 | 用户输入错误 |
| 7 | 输入格式错误（malformed，非用户操作错误） |
| 130 | 中断 |

---

## 2. Agent 决策规则

### 2.1 意图映射

| 用户输入 | Agent 行为 |
|---------|-----------|
| "审查这个项目 / 这个代码" | → `--target <项目目录> --format compact --output-mode top --max-issues 10` |
| "审查这个项目"（多 project 仓库）| 先 `--target . --preview` 列出 project，用户选一个后再 `--target <project_dir>` |
| "审查这几个文件" | → `--files <file1.cs> <file2.cs> --format compact --output-mode top` |
| "审查 PR / 变更" | → `--diff HEAD --changed-only --format compact --output-mode top` |
| "快速审查 / 快速看一下" | → `--target <path> --quick --format compact --output-mode top --max-issues 10`；有 diff 时自动限制到变更行 |
| "代码质量 / 质量评分" | → `--target . --format compact --output-mode summary` |
| "安全检查 / 安全漏洞" | → `--target . --format json --cve-check --quality-gate-score 85` |
| "生产就绪审查" | → `--target . --quality-gate-score 85 --fail-on warning --cve-check --format json --output-mode top --max-issues 20` |
| "帮我修复代码问题" | → `--target . --fix-dry-run --format json`（先预览），用户确认后 `--fix` |
| "和之前对比" | → 先跑基线 `--target . --format json > baseline.json`，再 `--baseline-report baseline.json --fail-on-introduced error --format json` |
| "NuGet 包安全" | → `--target . --cve-check --format json --output-mode summary` |
| "覆盖率" | → 需用户提供 `coverage.cobertura.xml` 路径，再加 `--coverage <path> --coverage-threshold 0.8` |
| "有什么审查不了的" | → `--checklist` |

### 2.2 两阶段审查协议（Triage → Verify）

工具对每条 issue 标注 triage 字段，Agent 据此决定是否需要深度分析：

| triage 值 | 含义 | Agent 行为 |
|-----------|------|------------|
| deterministic | Roslyn/编译器已确认，误报率极低 | **直接报告**，无需额外验证 |
| agent_verify | 高置信候选但需上下文判断 | **读取源码上下文**，按 verification_hints 判断 |
| agent_only | 工具无法静态检测 | Agent 自行分析（如业务逻辑合理性） |

#### Phase 1: Triage（~100-300 token）

```bash
review.py --target . --format compact --output-mode summary
```

输出包含 triage_summary：
```json
{
  "score": 85, "grade": "B",
  "issues": {"error": 2, "warning": 5, "info": 8},
  "triage": {"deterministic": 10, "agent_verify": 5, "agent_only": 0, "total": 15}
}
```

**Agent 决策**：
- agent_verify == 0 → 直接出报告（所有问题已确认），结束
- agent_verify > 0 → 进入 Phase 2

#### Phase 2: Deep Analysis（按需，~500-2000 token）

```bash
review.py --target . --format json --output-mode top --max-issues 10 --context-bundles
```

- --context-bundles：为 agent_verify 类 issue 自动附带代码上下文（±5 行 + 所在方法/类名）
- 每条 agent_verify issue 附带 verification_hints，告诉 Agent 需要检查什么
- Agent 逐条分析，判断 true positive / false positive

#### Phase 3: Fix Suggestions（仅 error/warning）

修复建议规则详见 **§ 4.1**。核心约束：只修 error/warning、标 AI 生成、安全类加人工复核。

### 2.3 Agent 判定反馈闭环

Agent 确认某条 issue 为误报后，可写入 .dotnet-review/agent-verdicts.json：

```json
{
  "verdicts": [
    {
      "rule": "LEGACY_BP021_task_run_server",
      "file_pattern": "**/BackgroundJobs/**",
      "verdict": "false_positive",
      "reason": "Background job service, Task.Run is appropriate"
    }
  ]
}
```

后续审查自动抑制匹配的 issue，从分数中移除。suppressed_by_verdict 字段记录抑制数量。

### 2.4 审查流程

```
1. 确定审查范围（项目/文件/PR）
2. Phase 1: review.py --format compact --output-mode summary
3. 读取 triage_summary，判断是否需要 Phase 2
4. Phase 2（如需）: review.py --format json --context-bundles
5. 对 agent_verify 类 issue，按 verification_hints 读源码判断
6. 读取 review_integrity 确认检测边界
7. 生成修复建议 diff（仅 error/warning）
8. 输出四段式报告
```


### 2.5 输出格式选择

输出格式选择见 §1.2 Token 节约模式表（已合并场景/命令/token/理由四列）。

---

## 3. 输出处理

### 3.1 JSON 输出结构

```json
{
  "project_root": "E:/Git/CRSBackend",
  "framework_version": "net8.0",
  "framework_type": "modern",
  "files_scanned": 42,
  "total_issues": 15,
  "score": { "overall": 85.0, "grade": "B", "security": 90, "best_practice": 80, ... },
  "by_severity": { "error": 2, "warning": 5, "info": 8 },
  "technical_debt_minutes": 120,
  "cognitive_complexity": 45,
  "maintainability_index": 72.5,
  "issues": [
    {
      "file": "src/Services/OrderService.cs",
      "line": 42,
      "severity": "error",
      "category": "security",
      "rule": "SEC001",
      "message": "SQL injection: use parameterized query",
      "suggestion": "Use SqlParameter instead of string concatenation",
      "source": "ast",
      "confidence": "high",
      "evidence_type": "roslyn_ast",
      "triage": "deterministic",
      "verification_hints": []
    }
  ],
  "review_integrity": {
    "layers_executed": ["ast", "semantic", "build"],
    "layers_skipped": [],
    "cve_conclusion_valid": false,
    "coverage_conclusion_valid": false,
    "netanalyzers": {
      "injected_for_projects": 1,
      "skipped_projects": [],
      "disabled_by_user": false
    }
  }
}
```

### 3.2 Triage 与可信度解读

**Triage 分类**（每条 issue 的 triage 字段）：
- deterministic — Roslyn 语法树/编译器已确认，Agent 直接报告
- agent_verify — 高置信候选但需上下文判断，附带 verification_hints
- agent_only — 工具无法静态检测

**可信度**（每条 issue 的 confidence 字段）：

| 来源 | 默认可信度 | 说明 |
|------|-----------|------|
| `ast` / `semantic` / `project` / `build` | high | Roslyn 语法树/编译器诊断，零误报 |
| `format` / `coverage` / `nuget` / `duplicate` / `doc` | medium | 工具输出或确定性文本扫描 |
| `custom` | low | 用户自定义正则规则 |

### 3.3 评分解读

总分 = Σ(各类别分数 × 权重)，0-100。

| 等级 | 分数 | 含义 |
|------|------|------|
| A | ≥ 90 | 优秀，可生产就绪 |
| B | ≥ 80 | 良好，少量警告 |
| C | ≥ 70 | 及格，需关注 |
| D | ≥ 60 | 差，需改进 |
| F | < 60 | 不合格，必须修复 |

| 类别 | 权重 | 每条 error 扣分 |
|------|------|----------------|
| security | 20% | 10 |
| best-practice | 20% | 10 |
| semantic | 10% | 10 |
| complexity | 10% | 10 |
| code-smell | 10% | 10 |
| style | 5% | 10 |
| test | 5% | 10 |
| performance | 5% | 10 |
| naming | 5% | 10 |
| reliability | 5% | 10 |
| security-hotspot | 5% | 10 |

---

## 4. 报告生成模板

最终回复采用四段式格式：

```text
Findings
- [error] path/to/File.cs:42 - SEC001 - SQL injection
  SQL 注入风险：使用字符串拼接构造 SQL 查询，攻击者可通过输入注入恶意 SQL。
  修复方向：使用参数化查询（SqlParameter）。

- [warning] path/to/Other.cs:18 - DI1001 - 构造函数参数过多
  5 个参数，超过推荐的 4 个上限。考虑拆分职责。

Fix Suggestions
- [SEC001] path/to/File.cs:42
  上下文：
  ```csharp
  var sql = "SELECT * FROM Users WHERE Name = '" + input + "'";
  var cmd = new SqlCommand(sql, conn);
  ```
  ```diff
  - var sql = "SELECT * FROM Users WHERE Name = '" + input + "'";
  - var cmd = new SqlCommand(sql, conn);
  + var cmd = new SqlCommand("SELECT * FROM Users WHERE Name = @name", conn);
  + cmd.Parameters.AddWithValue("@name", input);
  ```
  ⚠️ AI 生成，应用前请人工验证。

Open Questions / Assumptions
- 目标框架：net8.0（自动检测）
- build 层已执行，NetAnalyzers 已注入（约 500 条 CAxxxx 规则参与检测）
- CVE 检查未启用（无 --cve-check），不报告"无漏洞"
- 覆盖率数据未提供

Summary
- Score: 85.0/100 (B)
- Severity: 2 error, 5 warning, 8 info
- Technical Debt: ~120 分钟
- Scope: 42 files in E:/Git/CRSBackend
- Command: review.py --target E:/Git/CRSBackend --format json --quality-gate-score 80
```

### 4.1 修复建议生成规则

| # | 规则 | 说明 |
|---|------|------|
| 1 | **只处理 error/warning** | info 级只列不修 |
| 2 | **标记 AI 生成** | 每条建议附带 "⚠️ AI generated — verify before applying" |
| 3 | **安全类 (SEC) 额外警告** | 加 "Manual security review required" |
| 4 | **复杂修只给方向** | 跨文件/重构类，给 1-2 句思路，加 "Requires manual refactoring" |
| 5 | **Token 预算控制** | issues > 30 时最多生成 top 10 条 error + warning 的修复建议 |
| 6 | **零语义保证** | 禁止声称"已通过编译"或"无风险" |
| 7 | **不可覆盖自动修复** | `fix_result` 非空时，已修复的 issue 跳过 AI 建议 |
| 8 | **安全优先** | 安全类问题优先修复，其次性能，最后代码风格 |

---

## 5. 边界处理

### 5.1 review_integrity 检查清单

每次解析 JSON 结果后，必须检查 `review_integrity`：

```json
{
  "layers_executed": ["ast", "semantic"],
  "layers_skipped": [{"layer": "build", "reason": "no .csproj/.sln found"}],
  "cve_conclusion_valid": false,
  "coverage_conclusion_valid": false
}
```

| 条件 | Agent 行为 |
|------|-----------|
| `layers_skipped` 非空 | 在 Open Questions 中说明哪个层跳过及原因 |
| `cve_conclusion_valid == false` | **不得**报告"无已知漏洞" |
| `coverage_conclusion_valid == false` | **不得**报告"覆盖率达标" |
| `netanalyzers.injected_for_projects == 0` 且 `disabled_by_user == false` | 说明"CAxxxx 规则集（约 500 条）未参与检测" |
| `semantic_degraded == true` | 说明"语义分析层降级，SEM_* 规则不可靠" |

### 5.2 降级场景

| 场景 | 行为 |
|------|------|
| 无 .NET SDK | CLI 硬阻断（exit 4），告知用户安装。**例外**：`--legacy-compat` 模式下只需 `dotnet` CLI 存在即可（不限版本），AST/语义/项目分析器编译为 DLL 后通过 Roslyn AdHocWorkspace 直接分析源码 |
| 无 csproj | build/format 层跳过，Agent 应主动询问目标框架，用 `--target-framework` 覆盖 |
| 无 CVE 数据库 | `--cve-check` 返回 `db_present=false`，标记"未扫描"而非"安全" |
| 覆盖率文件缺失 | 跳过覆盖率检查，Summary 中说明 |
| 指定文件模式 (`--files`) | build/format 层自动跳过（无 csproj），这是 AST 级审查，非完整审查 |
| .NET Framework 项目 | 使用 `--legacy-compat` 标志：跳过 SDK 6+ 门槛 + 自动跳过 Build/Format 层。AST（154 条规则）和项目（跨文件/架构）分析仍可运行；Semantic 需要 `.csproj/.sln` context 才会执行，否则明确标记为跳过。由 `winforms-dev-flow` skill 自动调用 |

### 5.3 没有问题时

当 `total_issues == 0` 或只有 info 级别问题时：

- 明确写"未发现 error/warning 级别问题"
- 说明检测边界（如未启用语义分析、无 coverage、CVE 数据库离线）
- 不要写"代码完美"——说明哪些层没跑

---

## 6. 故障排查

| 错误 | Agent 行为 |
|------|-----------|
| "ToolMissingError: .NET SDK ≥ 6.0 is required" | 告知用户安装 .NET SDK。**替代方案**：若是 .NET Framework 项目且无法安装 SDK 6+，用 `--legacy-compat` 运行降级模式 |
| 无 csproj 文件 | 用 `--target-framework` 手动指定框架 |
| `--cve-check` 返回 `db_present=false` | 标记未扫描，问用户是否要 `--ensure-cve-db` 联网下载 |
| build 失败 | 检查项目是否可编译，告知用户 |
| 扫描结果为空 | 确认目标目录有 .cs 文件 |
| 评分低于预期 | 按类别逐项分析，指出占比最高的扣分类别 |
| `--legacy-compat` 下 AST 分析器返回空 | 检查 `dotnet` CLI 是否在 PATH 中（legacy 模式仍需 `dotnet` 命令来托管编译后的 DLL） |

---

## 7. references/ 索引

按需加载——Agent 在用户问到对应主题时才读这些文件。

| 主题 | 文件 | 何时加载 |
| --- | --- | --- |
| 规则总数真相 | `python scripts/count_rules.py` | 用户问"多少条规则"或评审成熟度 |
| 安全 / OWASP / CWE 映射 | `references/owasp-mapping.md` | 用户问 OWASP 覆盖度、SEC\*/SH\* 解释 |
| 6 维度规则矩阵 | `references/dimensions-coverage.md` | 解释某维度为何漏报 / 与 SonarLint 对比 |
| 层能力边界 | `references/layer-capabilities.md` | 用户问 AdhocWorkspace 限制 / AST 误报场景 |
| 性能规则 | `references/performance-rules.md` | 报告 P0xx 系列 / 解释热路径识别 |
| 修复模板 | `references/reporting-and-fix.md` | 生成 fix 段落时 |
| 评分口径 | `references/scoring-and-thresholds.md` | 解释 grade 边界、扣分公式 |
| BP 目录 | `references/best-practices-catalog.md` | 报告 BP\* 系列 |
| 规则目录 | `references/rules-catalog.md` | 查任意 ID 含义 |
| 设计取舍 | `references/skill-authoring.md` | 维护者 / 评审者 |

---

## 8. 测试状态

`tests/` 目录下 6 个测试文件持续断言本 skill 的分析层与报告契约：

| 测试数 | 文件 | 断言 |
|--------|------|------|
| 49（17 个类/函数） | `tests/test_analyzer_modules.py` | analyzer/ 子包（fetcher/triage/reporter）E2E + 模块重导入 + triage 分类与抑制 + glob 匹配 + 规则族识别 + 报告组装 + 复杂度 + 评分/integrity + baseline introduced/fixed 分类 + team 配置与 rule package + 扩展层（test quality/security/specialized/PR payload/trend）|
| 1 | `tests/test_analyzer_runtime_integration.py` | 编译后 Semantic/Project/Build analyzer 契约（需 DLL） |
| 1 | `tests/test_rule_cases.py` | `rule-cases.yml` 驱动的 AST 规则正反例回归（需 DLL） |
| 1 | `tests/test_runtime_smoke.py` | 编译后 Roslyn AST analyzer 原始契约 + Python fetcher→CodeIssue 适配器（需 DLL） |
| 3 | `tests/test_safety_contracts.py` | CVE 数据库 integrity（sidecar 不匹配不得判 clean）+ auto-fix 原子性（无 backup 不留 temp）+ apply_all 保留单份 backup |
| 2 | `tests/test_solution_integration.py` | 跨项目 `.sln` Semantic 引用解析 + MSBuildWorkspace 条件编译/生成源/重定向输出（需 DLL） |

运行：

```sh
cd plugins/dotnet-work/skills/dotnet-code-review
python -m pytest tests/ -v
```

当前状态：**57 passed, 0 xfailed**。无 .NET SDK 或未构建 analyzer DLL 时，4 个运行时集成测试（`test_analyzer_runtime_integration` / `test_rule_cases` / `test_runtime_smoke` / `test_solution_integration`）会明确 skip；模块/报告契约类测试（`test_analyzer_modules` / `test_safety_contracts`）无需 SDK 即可跑。CLI smoke review 和插件门禁由 CI workflow 在 Ubuntu 与 Windows runner 上执行。

**规则数口径**：`python scripts/count_rules.py` 实测 186 条（AST LEGACY_* 154 + 语义 SEM/EF/ASP/P/RCS 24 + 测试/安全/专项 8），与 SKILL.md description 声明一致。`count_rules.py` 是规则数单一事实源——`scripts/review/rules.py` 的 `AUTO_FIXES` 映射不是执行规则口径。

---

*基于 Microsoft 官方编码约定 + SonarQube C# 规则集 + 社区最佳实践整理*
*适用于 .NET Framework 4.7.2+ 和 .NET Core 3.1+*
*CLI 工具：scripts/review.py（基于 Roslyn 分析引擎）*
