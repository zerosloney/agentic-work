# 项目指纹识别 — Step 0b

> **目的**:解决 Step 1「只扫 1-2 个最近窗体」的盲区,**在生成前对全项目做一遍风格扫描**,
> 给出项目家族指纹 + 风格异质性报告,提前发现「同项目两套风格」「一个新模块是 ORM 但老模块是 SqlOperate」等问题。
>
> **来源**:failure-modes 案例 5「泛型 vs 非泛型混用」的根因——单点采样不足以判定项目风格。

---

## 何时跑这个 Step

- ✅ **总是跑**(默认 Step 0b)
- ⏸ 跳过条件:用户明确说"对照项目就是 X,不用探"
- 🔴 输出"严重异质性"时,**强制用户二选一并全项目统一**

---

## §0 Quick Scan — glance / deep 两档(默认入口)

> **目的**:让 Step 0b 在「低成本嗅探」与「全量指纹」之间分档,默认只跑 glance,只在发现分裂信号或用户主动要求时才升级到 deep。
> **节省**:glance 比 deep 少跑 60-70% 的搜索 / git 命令,token 与耗时都大幅下降(典型项目从 30s → 8s,从 ~2000 token → ~600 token)。

### §0.1 两档对比

| 档位 | 触发条件 | 跑的命令 | 输出 | 决策 |
|------|---------|---------|------|------|
| **glance**(默认) | 所有任务第一步 | 6 个查询(基类/数据访问/GridStyle/Collection/DAL 完整性/连接名),**全部过滤注释** | 迷你指纹卡(6 行) + 异质性等级 | 🟢 纯一 → 直接进 Step 1<br>🟡 / 🔴 → **自动升级到 deep** |
| **deep**(完整指纹) | ①glance 输出 🟡/🔴<br>②用户主动说"做完整指纹"<br>③用户描述里有"项目很乱"/"过渡期"/"新模块上线"等关键词 | §1 全套(1.1-1.5) + git log | §4 完整指纹卡 | 按 §3 流程 |

### §0.2 glance 命令(权威:scan_project.py)

> **权威命令**：`python scripts/scan_project.py --root "<项目根>" [--subdir <目标子目录>]`
> 脚本内建 rg→pure-Python 降级（`_has_rg()` 检测 + `_select_string()` pure-Python regex 扫描），无需手动维护 PowerShell 平行命令。
> 以下 §0.2-glance/§0.3-SelectString 的 PowerShell 命令块已于 2026-08 移除——脚本失败时直接跑 `python scripts/scan_project.py` 调试，不再回退 PowerShell。
> 探测的 6 个维度（与脚本 `glance` 函数一一对应）：窗体基类家族 / 数据访问方式 / GridStyle 代号 / Collection 层存在性 / DAL 层完整性（dalRatio）/ 连接名（top1，过滤注释）。


### §0.4 glance 输出格式(迷你指纹卡)

```text
项目: {项目根}                              扫描: {N} .cs
┌─────────────────┬────────┬────────┬────────────────────────────────┐
│ 维度            │ 主导    │ 占比   │ 异类                           │
├─────────────────┼────────┼────────┼────────────────────────────────┤
│ 窗体基类        │ frmBase│ 99%    │ frm_Base<T>(1%)                │
│ 数据访问        │ SqlOp  │ 93%    │ DbHelp.Query(7%)               │
│ GridStyle 代号  │ "ASS"  │ 100%   │ —                              │
│ Collection 层   │ 无     │ —      │ —                              │
│ DAL 层完整性    │ DAL/Ser│ 0.05   │ DAL=1/Ser=1490→无独立DAL层⚠️   │
│ 连接名(top1)    │ ASSConn│ 11866  │ ASSDBHelp=3261(过滤注释后)     │
└─────────────────┴────────┴────────┴────────────────────────────────┘
异质性等级: 🟢 纯一(所有维度主导 ≥95%)       → 直接进 Step 1
```

> **⚠️ 所有维度都基于过滤注释后的真实代码统计**。未过滤注释时,CRS 项目的 `varlist.ASSConn` 会扫到 311 次(全是 `//` 注释残留),真实非注释调用为 0。

**DAL 层完整性判定**(查询 5 输出):
- `dalRatio ≥ 0.5` → 项目有独立 DAL 层,Step 4 正常生成 DAL 文件
- `0.1 ≤ dalRatio < 0.5` → DAL 层部分存在,Step 1 让用户确认目标模块是否生成 DAL
- `dalRatio < 0.1` → **项目无独立 DAL 层**,数据访问直接写在 Ser 里;Step 4 不生成 DAL 文件,改走 `three-tier-mvp.md` 「无独立 DAL 层」变体

> ⚠️ **退化情况**(`serCount = 0`):代码有 `$dalRatio = if ($serCount -gt 0) {...} else { 0 }` 守护(§0.2 L73),全新空项目(无任何 `*Ser.cs`)会被强制 `dalRatio = 0`、归到「无独立 DAL 层」桶。此时应**视为架构未定**——Step 1 让用户从参照窗体或 `three-tier-mvp.md` 选择分层方式,不默认走「Ser 内联数据访问」。

### §0.5 glance → deep 自动升级规则

```text
glance 输出 → 自动判定:
  ├─ 所有维度都 🟢(主导 ≥95%)         → 直接进 Step 1(用 glance 卡即可)
  ├─ 任一维度 🟡(主导 75-95%)         → 自动升级到 deep(补 §1.2-1.4)
  ├─ 任一维度 🔴(主导 <75%)           → 自动升级到 deep(走 ask_user a/b/c)
  └─ 命名空间 ≥4 套                   → 自动升级到 deep(必 ask_user)
```

> 📋 **GridStyle 多代号 ≠ 自动升级**(实测调整 2026-07):
>
> 旧规则「全项目 ≥2 种 GridStyle = 🔴」会误伤——Upgrader 主仓实测有 6 种代号(ASS/CSS/SM/SMManagement/SMBOM/Ass),但这是**子模块专用代号的正常状态**(如 `SM.UI` 全用 SM 系列),不代表目标模块风格分裂。
>
> **新规则(子目录级判定)**:
> - 全项目级多代号 → 🟢/🟡,**不强制升级**(只要目标模块所在子目录代号单一)
> - **目标模块所在子目录内 ≥2 种代号**(如 ITPManagement: ASS 50 / CSS 65 / Ass 25 三分) → 🔴 必升级,Step 1 让用户选代号
> - 代号大小写变体(`Ass` vs `ASS`)也算不同代号,混用即触发子目录级 🔴
>
> glance 档默认只扫全项目级;目标模块所在子目录的代号分布由 Step 0 「定位目标目录」时顺带 `rg -n 'new GridStyle\(' {目标目录}` 确认(同样过滤注释)。

### §0.6 何时跳过 glance 直接 deep

| 用户输入关键词 | 直接 deep(不跑 glance) |
|---------------|----------------------|
| "项目很乱"/"代码风格不统一"/"两套都有人用" | ✅ |
| "做个完整指纹"/"全项目扫描"/"项目体检" | ✅ |
| "新模块上线"/"新开分支,不要混用" | ✅ |
| "项目合并后"/"刚从老项目迁过来" | ✅ |
| 用户主动 `ask_user` 选 deep 档 | ✅ |

### §0.7 何时跳过整个 Step 0b

| 用户输入关键词 | 跳过 |
|---------------|------|
| "就按 X 模块风格" / "跟 X.cs 一样" | ✅(但建议仍跑一次 glance 存档) |
| "我已经知道项目用 frmBase+SqlOperate+ASS,不用探" | ✅ |
| "小窗体不用这么正式" | 🟡 折中:跑 glance,但不输出完整指纹卡 |

---

## §1 探测方法(自动 + 必跑)

### 1.1 项目家族探测(`rg` / `glob`)

```powershell
# 在项目根目录跑(Agent 用)
$projectRoot = "C:\Src\YourProject"

# 基类家族:是否泛型
@(& rg -g "*.cs" "class\s+frm_Base<" $projectRoot 2>$null).Count
@(& rg -g "*.cs" "class\s+frmBase\b" $projectRoot 2>$null).Count
@(& rg -g "*.cs" ":\s*frm_Base<" $projectRoot 2>$null).Count
@(& rg -g "*.cs" ":\s*frmBase\b" $projectRoot 2>$null).Count

# DAL 数据访问方式
@(& rg -g "*.cs" "SqlOperate\s+_so\s*=" $projectRoot 2>$null).Count
@(& rg -g "*.cs" "_dal\.Query<" $projectRoot 2>$null).Count
@(& rg -g "*.cs" "DbHelp\.Query<" $projectRoot 2>$null).Count

# GridStyle 代号
& rg -g "*.cs" "new GridStyle\(" $projectRoot 2>$null | Select-Object -First 50
& rg -o -g "*.cs" 'new GridStyle\("[A-Z]+"' $projectRoot 2>$null | Sort-Object -Unique
```

### 1.2 命名约定探测

```powershell
# 类名前缀
& rg -o -g "*.cs" "class\s+[A-Z]{2,4}_?[A-Z][a-zA-Z]+" $projectRoot 2>$null |
    ForEach-Object { if ($_ -match "(DAL|Frm|Dlg|UC|dlg|frm)_?[A-Z][a-zA-Z]+") { $Matches[0] } } |
    Sort-Object -Unique |
    Select-Object -First 30

# 文件名前缀
& rg --files -g "*.cs" $projectRoot 2>$null |
    ForEach-Object { Split-Path $_ -Leaf } |
    Select-Object -First 50
```

### 1.3 引用家族探测(`using` 语句)

```powershell
# 关键命名空间
& rg -g "*.cs" "using\s+(Jamtc\.Common\.Extend|CSS\.[A-Z]+|Jamtc\.DevExpressExtend)" $projectRoot 2>$null |
    Sort-Object |
    Get-Unique |
    Select-Object -First 10

# 对话框基类来源
& rg -o -g "*.cs" ":\s*dlg_(Modify)?Base" $projectRoot 2>$null |
    Sort-Object |
    Get-Unique
```

### 1.4 模块目录探测

```powershell
# 是否有 DAL / BLL / Common 分层目录
Get-ChildItem -Directory -Recurse -LiteralPath $projectRoot |
    Where-Object { $_.Name -in @("CSS.DAL","CSS.BLL","CSS.Common","DAL","BLL","BIZ") } |
    Select-Object -ExpandProperty FullName

# 业务模块子目录
Get-ChildItem -Directory -Recurse -LiteralPath $projectRoot |
    Where-Object { $_.Name -eq "UI" } |
    Select-Object -ExpandProperty FullName -First 10
```

### 1.5 历史演化(可选,但建议跑)

```powershell
# 最近 6 个月 commit 的命名风格演化
git log --since="6 months ago" --pretty=format: --name-only --diff-filter=A -- "*.cs" |
    Sort-Object -Unique |
    Select-Object -First 30

# 最近 6 个月 commit 的基类演化
@(git log --since="6 months ago" --pretty=format:%H -p -- "*.cs" |
    rg "^\+class\s+(frm_Base|frmBase)").Count
```

---

## §2 项目家族指纹(4 类已知项目)

| 家族 | 特征 signal | Designer 模板 |
|------|-------------|--------------|
| **A. Deve-Upgrader**(主项目) | 基类 `frmBase` + `SqlOperate+ListOperate` + `GridStyle("ASS")` + `varlist.ASSConn`(实测主导) | §1 |
| **B. Deve-CRS**(主项目) | 基类 `frm_Base<T>` + ORM `DbHelp.Query<T>()` + `GridStyle("CRS")` + 泛型 `IView<T>` | §2 |
| **C. EQUP(CRS-Eqp)**(子模块) | 命名空间 `Jamtc.Extend.CRS.Eqp.UI` + `dlgBase` 手动 OK + `GridStyle("EQP")` | §3 |
| **D. CSS.WHXL.Extend**(本地化项目) | 基类 `frmBase` + `varlist.ASSDBHelp` + `GridStyle("CSS")` + 仍保留 Collection 层 | §4 |

**指纹匹配算法**:
1. 同时匹配 ≥3 个 signal → 唯一家族
2. 匹配 2 个 signal → 多家族候选,**Step 0b 强制列选项让用户确认**
3. 匹配 ≤1 个 signal → 未知家族,见 §3

---

## §3 风格异质性报告(关键输出)

> 这是 Step 0b 区别于 Step 1 的核心。

### 3.1 三类风格分布

```text
项目: {项目根}
扫描范围: {项目根}/**/*.cs
排除: Designer 文件 / 自动生成 / 测试代码

┌────────────────────┬───────────┬──────┬────────┐
│ 风格维度           │ 家族 A    │ 家族 B│ 家族 D │
├────────────────────┼───────────┼──────┼────────┤
│ 窗体基类 (frmBase) │ ███ 73%   │      │ ██ 27% │
│ 泛型 (frm_Base<T>) │      ██ 18%│ ████ 82%│       │
│ SQL _so + _tolist  │ ███ 65%   │      │ ██ 35% │
│ ORM DbHelp.Query<T>│      ██ 22%│ ████ 78%│       │
│ GridStyle("ASS")   │ ██ 45%   │      │       │
│ GridStyle("CSS")   │           │      │ ███ 55% │
│ GridStyle("CRS")   │           │ ████ 100%│      │
│ Collection 层      │           │      │ ██ 80% │
└────────────────────┴───────────┴──────┴────────┘

异质性等级: 🔴 严重分裂(主导风格未达 75%)
```

### 3.2 异质性等级

| 等级 | 占比阈值 | 含义 | Step 0b 行为 |
|------|---------|------|------------|
| 🟢 **纯一** | 主导 ≥95% | 项目风格一致 | 直接按主导风格进入 Step 1 |
| 🟡 **主导+少数** | 主导 75-95% | 有少数孤例 | 提示"发现 N 个异类,建议新代码随主导" |
| 🔴 **严重分裂** | 主导 <75% 或分布均匀 | 项目处于过渡期 | **强制用户二选一**(见下) |

### 3.3 🔴 严重分裂时的强策略

> 当探测到严重分裂时,**新代码不进入 Step 1**,而是先把决策挂给用户:

| 模式 | 方案 | 适用 |
|------|------|------|
| **路径 a:跟随主导** | 按多数派(75% 那一方)生成新代码 | 后续模块继续积累 |
| **路径 b:跟随最近** | 按最近 6 个月 commit 的主导风格 | 项目处于"老→新"过渡 |
| **路径 c:新开分支** | 完全独立的新模块,不混用旧基类 | 微服务 / 新模块上线 |

执行:用 `ask_user` 把 3 个路径列出让用户选,不默认。

### 3.4 异类检测清单(辅助确认)

| 异类维度 | 检测命令 | 异类阈值 |
|---------|---------|---------|
| 基类风格 | `rg -g "*.cs" ":\s*(frmBase\|frm_Base<)"` | 任意基类占总基类数 <5% → 异类 |
| 数据访问 | `rg -g "*.cs" "(SqlOperate\|DbHelp\.Query)"` | 同时出现两种方式 |
| GridStyle 代号 | `rg -o -g "*.cs" 'new GridStyle\("[A-Z]+"'` | 出现 ≥2 种代号 |
| DAL 命名 | `ls {项目根}/**/DAL*/` | 有 `DAL` / `DALBase` / `DALMM_` 多版本 |

---

## §4 输出:项目指纹卡

> Step 0b 必须把以下指纹卡交付给用户,作为 Step 1 输入。

```markdown
## 项目指纹卡(Step 0b 输出)

项目根: {项目根}
扫描时间: {YYYY-MM-DD}
扫描文件数: {N} 个 .cs

### 项目家族
主家族: {A / B / C / D / 未知}
识别置信度: 🟢 高(3 个 signal 匹配) / 🟡 中(2 个) / 🔴 低(≤1 个)
备选家族: {list}

### 风格异质性
| 维度 | 主导 | 占比 | 异类 |
|------|------|------|------|
| 窗体基类 | frmBase | 73% | frm_Base<T>(27%) |
| 数据访问 | SqlOperate | 65% | DbHelp.Query(22%) |
| GridStyle | "CSS" | 55% | "ASS"(45%) |
| Collection | 保留 | 80% | 直连(20%) |

异质性等级: 🟡 主导+少数(占主导 73%,未达 75% 红线)
建议: 新代码随主导(frmBase + SqlOperate + "CSS");Collection 层随主流保留

### 与既有 Step 1 提取关系
- Step 1 的提取 10+ 项仍然有效,但**确认窗体基类时,要看 73% 占比那一边**,而非最近 1-2 个窗体
- 若新窗体属于"新模块"或"过渡期",走 Step 0b → 用户二选一

### 已知风险
- ⚠️ 18% 的窗体是泛型 frm_Base<T>,新窗体不能"折中"(会编译失败)
- ⚠️ GridStyle 有 "CSS"/"ASS" 两个共存,Step 1 必须确认新窗体跟哪个

→ 进入 Step 1(并在 Step 1 提取表加注:"Step 0b 输出")
```

---

## §5 与其他 Step 的关系

```
Step 0  → Step 0a  → 【Step 0b 项目指纹】 → Step 1 模式提取  → Step 1b 判定
           (必填)        (本文件)                  (10+ 项)         (异常时)
                              │
                              ├─ 输出:项目家族
                              ├─ 输出:异质性等级
                              ├─ 输出:风格分布表
                              └─ 🔴 严重分裂时:ask_user 选 a/b/c
```

### Step 0b 的进入条件

- **必跑**:所有新窗体(第一个入口)
- **跳过**:
  - 用户明确指定"按 X 模块风格"
  - 同一项目的同一模块第二次生成(已有指纹卡)
- **重跑条件**:
  - 半年以上未刷新
  - 项目合并 / 升级基类
  - 用户主动要求"重新识别"

---

## §6 与 failure-modes 的对应关系

| Step 0b 行为 | 防住的失败案例 |
|------------|--------------|
| 全项目基类扫描 | 案例 5(同项目两套风格) |
| 全项目命名扫描 | 案例 8(命名约定不符) |
| GridStyle 多值检测 | 案例 4(代号不匹配) |
| DAL 数据访问方式扫描 | 案例 1(DBHelp/连接名) |
| Collection 层存在性检测 | 防止新代码被迫走 Collection |

---

## §7 实施清单(Agent 如何跑)

### 7.1 默认流程(glance 优先)

```powershell
# 1. 准备工作:确认项目根(.sln 或 .csproj 所在)
$projectRoot = "<.sln 或 .csproj 所在目录>"

# 2. 跑 §0.2 glance 命令(6 个查询,全部过滤注释)
#    → 输出迷你指纹卡(6 行)

# 3. 按 §0.5 自动判定:
#    - 🟢 全纯一 → 进 Step 1(用 glance 卡)
#    - 🟡 任一维度 75-95% → 升级到 deep(跑 §1.2-1.4)
#    - 🔴 任一维度 <75% 或 GridStyle ≥2 种 → 升级到 deep + ask_user a/b/c

# 4. 若进 deep:跑 §1 全套,补齐 1.2-1.5

# 5. 输出 §4 完整指纹卡(给 Step 1 当输入)

# 6. 决策:
#    - 纯一:直接进 Step 1
#    - 主导+少数:提示用户,默认随主导
#    - 严重分裂:ask_user 路径 a/b/c
```

### 7.2 跳过 glance 的快速路径

```powershell
# 用户输入含以下关键词时,直接 §1 全套(deep 档):
#   "项目很乱" / "做个完整指纹" / "新模块上线"
#   "项目合并后" / "刚从老项目迁过来"

# 用户输入含以下关键词时,跳过整个 Step 0b:
#   "就按 X 模块风格" / "跟 X.cs 一样"
#   "我已经知道项目用 frmBase+SqlOperate+ASS,不用探"
```

---

## §8 维护指南

新增项目家族:
1. 在 §2 加一行 + §1 加探测 signal
2. 在 `designer-patterns.md` 加章节(对应 §X)
3. 在 `failure-modes.md` 加"如果 X 项目 → 案例 7 加新案例"
