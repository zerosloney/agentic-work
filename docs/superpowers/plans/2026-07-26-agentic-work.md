# agentic-work Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `D:\Code\agentic-skills\` 内的 `donet-work/` 与 `loop-workflow/templates/` 内容，打包成兼容 opencode / codebuddy / zcode 三平台的插件仓库，git init 后作为本地仓库落地。

**Architecture:** 单仓双插件（dotnet-work + loop-workflow），每插件三个平台子目录（`plugins/<plugin>/<platform>/`）。仓库根放平台 manifest（zcode `marketplace.json` + codebuddy `.codebuddy-plugin/marketplace.json` + npm `package.json`），每个平台子目录放该平台的 plugin manifest（zcode `.zcode-plugin/plugin.json` / codebuddy `.codebuddy-plugin/plugin.json` / opencode 无 manifest）。三个 `scripts/install-<platform>.js` 复制内容到对应平台目录。

**Tech Stack:** Node.js 18+（CommonJS），`fs/path`，无外部依赖。沿用 caveman4cn 安装脚本模式。

---

## Global Constraints

- 目录名 `donet-work` → `dotnet-work`（重命名，全仓拼写一致）
- npm 包名：`@master0071/agentic-work`
- 市场名：`master0071`（与 caveman4cn 同市场；install 时向 `~/.zcode/.../marketplaces/master0071/` 注册）
- 仓库根路径：`D:\Code\agentic-skills\`（git init 在此处）
- 平台目标路径：
  - opencode：`%USERPROFILE%\.config\opencode\{skills,agents,commands}\`
  - codebuddy：`%USERPROFILE%\.codebuddy\plugins\<name>-codebuddy\`
  - zcode：`%USERPROFILE%\.zcode\cli\plugins\cache\master0071\<name>-zcode\0.1.0\`
- 文件复制原则：内容字节级一致（除 manifest 文件），三平台不差异化 SKILL.md / agent / command
- install 脚本必须支持：`--uninstall` / `--dry-run` / `--plugin <name>` 三个 flag
- 编码：UTF-8 无 BOM，行尾 LF（与 caveman4cn 一致）
- git commit 频率：每个 Task 完成后一次

---

## File Structure

### 创建（仓库根）
- `package.json` — npm manifest（@master0071/agentic-work）
- `marketplace.json` — zcode 平台 manifest
- `.codebuddy-plugin/marketplace.json` — codebuddy 平台 manifest
- `.gitignore` — git ignore
- `.editorconfig` — 编辑器规约
- `LICENSE` — MIT
- `README.md` — 用户面向
- `AGENTS.md` — 后续 agent 开发规约

### 创建（scripts/）
- `scripts/install-opencode.js` — opencode 安装脚本
- `scripts/install-codebuddy.js` — codebuddy 安装脚本
- `scripts/install-zcode.js` — zcode 安装脚本
- `scripts/instantiate-templates.js` — loop-workflow 模板一次性实例化脚本
- `scripts/lib/copy-dir.js` — 共享递归复制工具
- `scripts/lib/resolve-home.js` — HOME 路径解析（USERPROFILE/HOME）

### 创建（plugins/dotnet-work/，原 donet-work 内容复制 3 份）
- `plugins/dotnet-work/opencode/skills/database-explorer/{SKILL.md, references/, scripts/}`
- `plugins/dotnet-work/opencode/skills/dotnet-code-review/{SKILL.md, references/, scripts/}`
- `plugins/dotnet-work/opencode/skills/dotnet-csharp-developer/{SKILL.md, references/}`
- `plugins/dotnet-work/opencode/skills/winforms-dev-flow/{SKILL.md, references/, scripts/}`
- `plugins/dotnet-work/codebuddy/skills/<4 个同名 skill>`（同 opencode 内容）
- `plugins/dotnet-work/codebuddy/.codebuddy-plugin/plugin.json`
- `plugins/dotnet-work/zcode/skills/<4 个同名 skill>`（同 opencode 内容）
- `plugins/dotnet-work/zcode/.zcode-plugin/plugin.json`

### 创建（plugins/loop-workflow/）
- `plugins/loop-workflow/opencode/agents/<12 个>.md`
- `plugins/loop-workflow/opencode/commands/<5 个>.md`
- `plugins/loop-workflow/codebuddy/agents/<12 个>.md`（同 opencode）
- `plugins/loop-workflow/codebuddy/commands/<5 个>.md`（同 opencode）
- `plugins/loop-workflow/codebuddy/.codebuddy-plugin/plugin.json`
- `plugins/loop-workflow/zcode/agents/<12 个>.md`（同 opencode）
- `plugins/loop-workflow/zcode/commands/<5 个>.md`（同 opencode）
- `plugins/loop-workflow/zcode/.zcode-plugin/plugin.json`

### 修改
- `donet-work/` → `plugins/dotnet-work/opencode/skills/<...>/`（重命名 + 嵌套复制）

---

## Task 1: 仓库骨架初始化与目录重命名

**Files:**
- Create: `D:\Code\agentic-skills\.gitignore`
- Create: `D:\Code\agentic-skills\.editorconfig`
- Rename: `donet-work/` → `plugins/dotnet-work/`

**Interfaces:**
- Consumes: 现有 `D:\Code\agentic-skills\donet-work\` 目录
- Produces: `D:\Code\agentic-skills\plugins\dotnet-work\` 目录（暂作为后续重命名前的暂存根）

- [ ] **Step 1: 创建目录骨架**

PowerShell:
```powershell
$root = "D:\Code\agentic-skills"
New-Item -ItemType Directory -Path "$root\plugins\dotnet-work\opencode\skills" -Force
New-Item -ItemType Directory -Path "$root\plugins\dotnet-work\codebuddy\skills" -Force
New-Item -ItemType Directory -Path "$root\plugins\dotnet-work\zcode\skills" -Force
New-Item -ItemType Directory -Path "$root\plugins\dotnet-work\codebuddy\.codebuddy-plugin" -Force
New-Item -ItemType Directory -Path "$root\plugins\dotnet-work\zcode\.zcode-plugin" -Force
New-Item -ItemType Directory -Path "$root\plugins\loop-workflow\opencode\agents" -Force
New-Item -ItemType Directory -Path "$root\plugins\loop-workflow\opencode\commands" -Force
New-Item -ItemType Directory -Path "$root\plugins\loop-workflow\codebuddy\agents" -Force
New-Item -ItemType Directory -Path "$root\plugins\loop-workflow\codebuddy\commands" -Force
New-Item -ItemType Directory -Path "$root\plugins\loop-workflow\codebuddy\.codebuddy-plugin" -Force
New-Item -ItemType Directory -Path "$root\plugins\loop-workflow\zcode\agents" -Force
New-Item -ItemType Directory -Path "$root\plugins\loop-workflow\zcode\commands" -Force
New-Item -ItemType Directory -Path "$root\plugins\loop-workflow\zcode\.zcode-plugin" -Force
New-Item -ItemType Directory -Path "$root\scripts\lib" -Force
New-Item -ItemType Directory -Path "$root\.codebuddy-plugin" -Force
```

Verify:
```powershell
Get-ChildItem -LiteralPath "$root\plugins" -Recurse -Force -Depth 4 | Where-Object { $_.PSIsContainer }
```
Expected: 11 个新建目录均存在。

- [ ] **Step 2: 重命名 donet-work → plugins/dotnet-work（暂存根）**

PowerShell:
```powershell
Move-Item -LiteralPath "D:\Code\agentic-skills\donet-work" -Destination "D:\Code\agentic-skills\plugins\dotnet-work\_src" -Force
```
Verify:
```powershell
Test-Path "D:\Code\agentic-skills\donet-work"
Test-Path "D:\Code\agentic-skills\plugins\dotnet-work\_src\database-explorer\SKILL.md"
```
Expected: 第一个 False，第二个 True。

- [ ] **Step 3: 写 .gitignore**

```text
node_modules/
.DS_Store
*.log
.cache/
.opencode/
.codebuddy/
!.codebuddy-plugin/
```

PowerShell:
```powershell
$gi = "D:\Code\agentic-skills\.gitignore"
Set-Content -LiteralPath $gi -Value "node_modules/`n.DS_Store`n*.log`n.cache/`n.opencode/`n.codebuddy/`n!.codebuddy-plugin/`n" -NoNewline -Encoding UTF8
```

- [ ] **Step 4: 写 .editorconfig**

```text
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{js,json}]
quote_type = double
```

PowerShell:
```powershell
$ec = "D:\Code\agentic-skills\.editorconfig"
Set-Content -LiteralPath $ec -Encoding UTF8 -Value @"
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{js,json}]
quote_type = double
"@
```

- [ ] **Step 5: 验证 Task 1 完成**

```powershell
Test-Path "D:\Code\agentic-skills\.gitignore"
Test-Path "D:\Code\agentic-skills\.editorconfig"
Test-Path "D:\Code\agentic-skills\plugins\dotnet-work\_src\database-explorer\SKILL.md"
Get-ChildItem -LiteralPath "D:\Code\agentic-skills\plugins" -Directory | Select-Object Name
```
Expected: 三个 True，`Name` 含 `dotnet-work` 与 `loop-workflow`。

---

## Task 2: 顶层 manifest 文件（package.json + 两个 marketplace.json）

**Files:**
- Create: `D:\Code\agentic-skills\package.json`
- Create: `D:\Code\agentic-skills\marketplace.json`
- Create: `D:\Code\agentic-skills\.codebuddy-plugin\marketplace.json`
- Create: `D:\Code\agentic-skills\LICENSE`

**Interfaces:**
- Consumes: 仓库根路径、marketplace name `master0071`
- Produces: 三个顶层 manifest 文件 + LICENSE

- [ ] **Step 1: 写 LICENSE（MIT）**

PowerShell:
```powershell
$year = (Get-Date).Year
$license = @"
MIT License

Copyright (c) $year master0071

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"@
Set-Content -LiteralPath "D:\Code\agentic-skills\LICENSE" -Value $license -NoNewline -Encoding UTF8
```

- [ ] **Step 2: 写 package.json**

PowerShell:
```powershell
$pkg = @'
{
  "name": "@master0071/agentic-work",
  "version": "0.1.0",
  "description": "Agentic-work plugins (dotnet-work + loop-workflow) for opencode, codebuddy, and zcode.",
  "license": "MIT",
  "author": {
    "name": "master0071",
    "url": "https://github.com/master0071"
  },
  "homepage": "https://github.com/master0071/agentic-work",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/master0071/agentic-work.git"
  },
  "engines": { "node": ">=18" },
  "bin": {
    "agentic-work-opencode": "scripts/install-opencode.js",
    "agentic-work-codebuddy": "scripts/install-codebuddy.js",
    "agentic-work-zcode": "scripts/install-zcode.js"
  },
  "scripts": {
    "install:opencode": "node ./scripts/install-opencode.js",
    "install:codebuddy": "node ./scripts/install-codebuddy.js",
    "install:zcode": "node ./scripts/install-zcode.js",
    "install:all": "node ./scripts/install-opencode.js && node ./scripts/install-codebuddy.js && node ./scripts/install-zcode.js"
  },
  "files": [
    "plugins/",
    "scripts/",
    "marketplace.json",
    ".codebuddy-plugin/marketplace.json",
    "AGENTS.md",
    "README.md",
    "LICENSE"
  ]
}
'@
Set-Content -LiteralPath "D:\Code\agentic-skills\package.json" -Value $pkg -NoNewline -Encoding UTF8
```

Verify JSON validity:
```powershell
Get-Content "D:\Code\agentic-skills\package.json" | ConvertFrom-Json | Select-Object name, version
```
Expected: `name = @master0071/agentic-work`, `version = 0.1.0`.

- [ ] **Step 3: 写 marketplace.json（zcode 用）**

PowerShell:
```powershell
$mp = @'
{
  "name": "master0071",
  "description": "Agentic-work plugins (dotnet-work + loop-workflow) for ZCode.",
  "owner": {
    "name": "master0071",
    "url": "https://github.com/master0071/agentic-work"
  },
  "plugins": [
    {
      "name": "dotnet-work-zcode",
      "source": "./plugins/dotnet-work/zcode",
      "description": ".NET development skills (database-explorer, dotnet-code-review, dotnet-csharp-developer, winforms-dev-flow) for ZCode.",
      "version": "0.1.0",
      "category": "development",
      "tags": ["dotnet", "csharp", "development", "skills"],
      "strict": true
    },
    {
      "name": "loop-workflow-zcode",
      "source": "./plugins/loop-workflow/zcode",
      "description": "Orchestrated execute-review loops (coding/testing/writing/Ralph) for ZCode.",
      "version": "0.1.0",
      "category": "workflow",
      "tags": ["workflow", "loop", "ralph", "orchestration"],
      "strict": true
    }
  ]
}
'@
Set-Content -LiteralPath "D:\Code\agentic-skills\marketplace.json" -Value $mp -NoNewline -Encoding UTF8
```

Verify:
```powershell
(Get-Content "D:\Code\agentic-skills\marketplace.json" | ConvertFrom-Json).plugins.Count
```
Expected: `2`.

- [ ] **Step 4: 写 .codebuddy-plugin/marketplace.json**

PowerShell:
```powershell
$cbmp = @'
{
  "name": "master0071",
  "description": "Agentic-work plugins (dotnet-work + loop-workflow) for CodeBuddy.",
  "owner": {
    "name": "master0071",
    "email": "master0071@users.noreply.github.com"
  },
  "plugins": [
    {
      "name": "dotnet-work-codebuddy",
      "description": ".NET development skills (database-explorer, dotnet-code-review, dotnet-csharp-developer, winforms-dev-flow) for CodeBuddy.",
      "version": "0.1.0",
      "source": "./plugins/dotnet-work/codebuddy",
      "category": "development",
      "author": {
        "name": "master0071",
        "url": "https://github.com/master0071"
      },
      "homepage": "https://github.com/master0071/agentic-work",
      "license": "MIT",
      "tags": ["dotnet", "csharp", "development"]
    },
    {
      "name": "loop-workflow-codebuddy",
      "description": "Orchestrated execute-review loops (coding/testing/writing/Ralph) for CodeBuddy.",
      "version": "0.1.0",
      "source": "./plugins/loop-workflow/codebuddy",
      "category": "workflow",
      "author": {
        "name": "master0071",
        "url": "https://github.com/master0071"
      },
      "homepage": "https://github.com/master0071/agentic-work",
      "license": "MIT",
      "tags": ["workflow", "loop", "ralph"]
    }
  ]
}
'@
Set-Content -LiteralPath "D:\Code\agentic-skills\.codebuddy-plugin\marketplace.json" -Value $cbmp -NoNewline -Encoding UTF8
```

Verify:
```powershell
Get-Content "D:\Code\agentic-skills\.codebuddy-plugin\marketplace.json" | ConvertFrom-Json | Select-Object -ExpandProperty plugins | Select-Object name, source
```
Expected: 两个条目，`source` 分别为 `./plugins/dotnet-work/codebuddy` 与 `./plugins/loop-workflow/codebuddy`。

- [ ] **Step 5: 验证 Task 2 完成**

```powershell
Test-Path "D:\Code\agentic-skills\package.json"
Test-Path "D:\Code\agentic-skills\marketplace.json"
Test-Path "D:\Code\agentic-skills\.codebuddy-plugin\marketplace.json"
Test-Path "D:\Code\agentic-skills\LICENSE"
```
Expected: 全 True。

---

## Task 3: dotnet-work 平台 manifest（zcode + codebuddy plugin.json）

**Files:**
- Create: `D:\Code\agentic-skills\plugins\dotnet-work\zcode\.zcode-plugin\plugin.json`
- Create: `D:\Code\agentic-skills\plugins\dotnet-work\codebuddy\.codebuddy-plugin\plugin.json`

**Interfaces:**
- Consumes: dotnet-work 的 4 个 skill 名称（database-explorer, dotnet-code-review, dotnet-csharp-developer, winforms-dev-flow）
- Produces: 两个 plugin manifest

- [ ] **Step 1: 写 zcode plugin.json**

PowerShell:
```powershell
$zp = @'
{
  "name": "dotnet-work-zcode",
  "version": "0.1.0",
  "description": ".NET development skills for ZCode (database-explorer, dotnet-code-review, dotnet-csharp-developer, winforms-dev-flow).",
  "author": {
    "name": "master0071",
    "url": "https://github.com/master0071"
  },
  "homepage": "https://github.com/master0071/agentic-work",
  "repository": "https://github.com/master0071/agentic-work",
  "license": "MIT",
  "keywords": ["dotnet", "csharp", "skills"],
  "commands": "commands",
  "agents": "agents",
  "skills": "skills"
}
'@
Set-Content -LiteralPath "D:\Code\agentic-skills\plugins\dotnet-work\zcode\.zcode-plugin\plugin.json" -Value $zp -NoNewline -Encoding UTF8
```

- [ ] **Step 2: 写 codebuddy plugin.json**

PowerShell:
```powershell
$cbp = @'
{
  "name": "dotnet-work-codebuddy",
  "version": "0.1.0",
  "description": ".NET development skills for CodeBuddy (database-explorer, dotnet-code-review, dotnet-csharp-developer, winforms-dev-flow).",
  "category": "Development",
  "commands": "commands",
  "agents": "agents",
  "skills": [
    "skills/database-explorer",
    "skills/dotnet-code-review",
    "skills/dotnet-csharp-developer",
    "skills/winforms-dev-flow"
  ]
}
'@
Set-Content -LiteralPath "D:\Code\agentic-skills\plugins\dotnet-work\codebuddy\.codebuddy-plugin\plugin.json" -Value $cbp -NoNewline -Encoding UTF8
```

- [ ] **Step 3: 验证**

```powershell
Test-Path "D:\Code\agentic-skills\plugins\dotnet-work\zcode\.zcode-plugin\plugin.json"
Test-Path "D:\Code\agentic-skills\plugins\dotnet-work\codebuddy\.codebuddy-plugin\plugin.json"
```
Expected: 全 True。

---

## Task 4: dotnet-work skills 复制到三个平台子目录

**Files:**
- Copy from: `D:\Code\agentic-skills\plugins\dotnet-work\_src\<skill-name>\*`
- Copy to:
  - `D:\Code\agentic-skills\plugins\dotnet-work\opencode\skills\<skill-name>\`
  - `D:\Code\agentic-skills\plugins\dotnet-work\codebuddy\skills\<skill-name>\`
  - `D:\Code\agentic-skills\plugins\dotnet-work\zcode\skills\<skill-name>\`

**Interfaces:**
- Consumes: Task 1 暂存的 `_src/` 目录
- Produces: 三个平台各 4 个完整 skill（含 SKILL.md + references/ + scripts/）

- [ ] **Step 1: 写共享 copy 工具 scripts/lib/copy-dir.js**

PowerShell 创建文件 `D:\Code\agentic-skills\scripts\lib\copy-dir.js`：
```javascript
'use strict';
const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest, opts = {}) {
  const skip = opts.skip || (() => false);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(s, d, opts);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

module.exports = { copyDirRecursive };
```

- [ ] **Step 2: 写一次性 dotnet-work 复制脚本（仅本次执行，跑完可删）**

PowerShell 创建文件 `D:\Code\agentic-skills\scripts\copy-dotnet-work.js`（一次性）：
```javascript
#!/usr/bin/env node
'use strict';
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');

const SRC = path.join(__dirname, '..', 'plugins', 'dotnet-work', '_src');
const PLATFORMS = ['opencode', 'codebuddy', 'zcode'];
const SKILLS = ['database-explorer', 'dotnet-code-review', 'dotnet-csharp-developer', 'winforms-dev-flow'];

let totalFiles = 0;
for (const skill of SKILLS) {
  for (const platform of PLATFORMS) {
    const src = path.join(SRC, skill);
    const dest = path.join(SRC, '..', platform, 'skills', skill);
    copyDirRecursive(src, dest);
    const count = require('fs').readdirSync(dest, { recursive: true }).filter(f =>
      require('fs').statSync(require('path').join(dest, f)).isFile()
    ).length;
    totalFiles += count;
    console.log(`  copied: ${platform}/skills/${skill} (${count} files)`);
  }
}
console.log(`\nTotal files copied: ${totalFiles}`);
console.log(`Skills × platforms: ${SKILLS.length} × ${PLATFORMS.length} = ${SKILLS.length * PLATFORMS.length}`);
```

- [ ] **Step 3: 运行复制脚本**

```powershell
node D:\Code\agentic-skills\scripts\copy-dotnet-work.js
```
Expected output:
```
  copied: opencode/skills/database-explorer (N files)
  copied: codebuddy/skills/database-explorer (N files)
  copied: zcode/skills/database-explorer (N files)
  copied: opencode/skills/dotnet-code-review (N files)
  ... (12 lines total)
  Total files copied: <sum>
  Skills × platforms: 4 × 3 = 12
```

- [ ] **Step 4: 验证每个平台子目录下 4 个 skill 齐全**

```powershell
$expected = @('database-explorer', 'dotnet-code-review', 'dotnet-csharp-developer', 'winforms-dev-flow')
foreach ($platform in @('opencode', 'codebuddy', 'zcode')) {
    $actual = Get-ChildItem -LiteralPath "D:\Code\agentic-skills\plugins\dotnet-work\$platform\skills" -Directory | Select-Object -ExpandProperty Name
    $missing = $expected | Where-Object { $_ -notin $actual }
    if ($missing.Count -eq 0) {
        Write-Host "OK: $platform has all 4 skills"
    } else {
        Write-Host "FAIL: $platform missing: $($missing -join ', ')"
    }
}
```
Expected: 三行 `OK: <platform> has all 4 skills`。

- [ ] **Step 5: 验证 SKILL.md 字节级一致（关键：cross-platform content equality）**

PowerShell:
```powershell
$skills = @('database-explorer', 'dotnet-code-review', 'dotnet-csharp-developer', 'winforms-dev-flow')
foreach ($skill in $skills) {
    $hashes = @{}
    foreach ($platform in @('opencode', 'codebuddy', 'zcode')) {
        $file = "D:\Code\agentic-skills\plugins\dotnet-work\$platform\skills\$skill\SKILL.md"
        $hashes[$platform] = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
    }
    $unique = $hashes.Values | Sort-Object -Unique
    if ($unique.Count -eq 1) {
        Write-Host "OK: $skill SKILL.md identical across platforms"
    } else {
        Write-Host "FAIL: $skill SKILL.md hash mismatch: $($hashes.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" } | Out-String)"
    }
}
```
Expected: 4 行 `OK: <skill> SKILL.md identical across platforms`。

- [ ] **Step 6: 删除暂存 _src 目录（不再需要）**

```powershell
Remove-Item -LiteralPath "D:\Code\agentic-skills\plugins\dotnet-work\_src" -Recurse -Force
Test-Path "D:\Code\agentic-skills\plugins\dotnet-work\_src"
```
Expected: `False`。

- [ ] **Step 7: 删除一次性脚本（任务完成）**

```powershell
Remove-Item -LiteralPath "D:\Code\agentic-skills\scripts\copy-dotnet-work.js" -Force
Test-Path "D:\Code\agentic-skills\scripts\copy-dotnet-work.js"
```
Expected: `False`。

---

## Task 5: 共享脚本工具 — resolve-home.js

**Files:**
- Create: `D:\Code\agentic-skills\scripts\lib\resolve-home.js`

**Interfaces:**
- Consumes: process.env
- Produces: `resolveHome()` 函数，返回 Windows 上 `%USERPROFILE%`，其他平台 `$HOME`

- [ ] **Step 1: 写 resolve-home.js**

```javascript
'use strict';
const path = require('path');

function resolveHome() {
  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) {
    throw new Error('Cannot resolve HOME: neither USERPROFILE nor HOME is set');
  }
  return home;
}

function joinHome(...segments) {
  return path.join(resolveHome(), ...segments);
}

module.exports = { resolveHome, joinHome };
```

- [ ] **Step 2: 验证**

```powershell
node -e "const {joinHome} = require('D:/Code/agentic-skills/scripts/lib/resolve-home'); console.log(joinHome('.config', 'opencode'))"
```
Expected: 形如 `C:\Users\master\.config\opencode` 的绝对路径。

---

## Task 6: loop-workflow 模板实例化生成器

**Files:**
- Create: `D:\Code\agentic-skills\scripts\instantiate-templates.js`
- Output to:
  - `D:\Code\agentic-skills\plugins\loop-workflow\opencode\agents\<name>.md`
  - `D:\Code\agentic-skills\plugins\loop-workflow\opencode\commands\<name>.md`
  - `D:\Code\agentic-skills\plugins\loop-workflow\codebuddy\agents\<name>.md`
  - `D:\Code\agentic-skills\plugins\loop-workflow\codebuddy\commands\<name>.md`
  - `D:\Code\agentic-skills\plugins\loop-workflow\zcode\agents\<name>.md`
  - `D:\Code\agentic-skills\plugins\loop-workflow\zcode\commands\<name>.md`

**Interfaces:**
- Consumes: `loop-workflow/templates/agents/*.md` (12 个) 与 `loop-workflow/templates/commands/*.md` (5 个)
- Produces: 17 个文件 × 3 平台 = 51 个实例化文件

- [ ] **Step 1: 写 instantiate-templates.js（含占位符替换表 + backpressure 配置块）**

```javascript
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'loop-workflow', 'templates');
const OUT_BASE = path.join(ROOT, 'plugins', 'loop-workflow');
const PLATFORMS = ['opencode', 'codebuddy', 'zcode'];

// 占位符替换表（与 spec §6.2 一致）
const AGENT_MAP = {
  'coding-orchestrator.md':  { name: 'coding-orchestrator',  desc: 'Coding-Loop 主控 Agent：编排 executor/reviewer，按 scope drift 零容忍门禁停止。', exe: 'coding-builder',     rev: 'coding-reviewer',     engine: '' },
  'coding-executor.md':      { name: 'coding-builder',       desc: 'Coding-Loop 受控编码 Builder：声明 scope 内编码、按根因分组修复、真实验证。',   exe: null,                rev: null,                engine: '' },
  'coding-reviewer.md':      { name: 'coding-reviewer',      desc: 'Coding-Loop 只读审查 Agent：scope drift 检测、根因归并、verdict 输出。',          exe: null,                rev: null,                engine: '' },
  'ralph-orchestrator.md':   { name: 'ralph-orchestrator',   desc: 'Ralph 主控 Agent：TaskList 编排，背压熔断门禁决定停止。',                       exe: 'ralph-worker',       rev: 'ralph-reviewer',     engine: 'loop' },
  'ralph-executor.md':       { name: 'ralph-worker',         desc: 'Ralph Loop 执行者：单任务执行、运行验证、原样回报。',                            exe: null,                rev: null,                engine: '' },
  'ralph-reviewer.md':       { name: 'ralph-reviewer',       desc: 'Ralph Loop 只读质量阀：accept_criteria 复核、verdict 输出。',                   exe: null,                rev: null,                engine: '' },
  'testing-orchestrator.md': { name: 'test-orchestrator',    desc: 'Test-Loop 主控 Agent：源码冻结，三项验证信号驱动停止。',                       exe: 'test-writer',        rev: 'coverage-reviewer',  engine: '' },
  'testing-executor.md':     { name: 'test-writer',          desc: 'Test-Loop 执行者：仅写测试、源码冻结、回报三项信号。',                          exe: null,                rev: null,                engine: '' },
  'testing-reviewer.md':     { name: 'coverage-reviewer',    desc: 'Test-Loop 只读质量阀：三项信号 + 源码冻结双保险。',                            exe: null,                rev: null,                engine: '' },
  'writing-orchestrator.md': { name: 'writing-orchestrator', desc: 'Writing-Loop 主控 Agent：写作边界，三项质量信号驱动停止（弱门禁）。',         exe: 'writing-author',     rev: 'writing-reviewer',   engine: '' },
  'writing-executor.md':     { name: 'writing-author',       desc: 'Writing-Loop 执行者：仅写文档、术语一致、链接可达。',                          exe: null,                rev: null,                engine: '' },
  'writing-reviewer.md':     { name: 'writing-reviewer',     desc: 'Writing-Loop 只读质量阀：术语漂移/死链/代码示例三项扫描。',                    exe: null,                rev: null,                engine: '' }
};

// backpressure 配置块（spec §6.3）
const BACKPRESSURE = {
  'coding-orchestrator.md':  '### 背压（coding 域）\n- MAX_CYCLES = 8（>8 轮未 DONE 强制停止）\n- STALL_MAX = 2（连续 2 轮任务状态签名无变化 → STALL）\n- 失败计数达到 3 → 立即 ESCALATE\n- 风险评估默认 medium；用户描述含"生产 / 安全 / 数据迁移"→ high',
  'ralph-orchestrator.md':   '### 背压（ralph 域）\n- MAX_CYCLES = 10（>10 轮未 DONE 强制停止）\n- STALL_MAX = 3（连续 3 轮状态签名无变化 → STALL）\n- 失败计数达到 max_failures → 立即 ESCALATE（默认 max_failures=3）',
  'testing-orchestrator.md': '### 背压（testing 域）\n- MAX_CYCLES = 8（>8 轮未 DONE 强制停止）\n- STALL_MAX = 2（连续 2 轮任务状态签名无变化 → STALL）\n- 三项信号必须全达标：coverage.lines ≥ 80%、mutation_score ≥ 60%、empty_assertions_count == 0\n- 失败计数达到 3 → 立即 ESCALATE',
  'writing-orchestrator.md': '### 背压（writing 域）\n- MAX_CYCLES = 6（>6 轮未 DONE 强制停止）\n- STALL_MAX = 2（连续 2 轮任务状态签名无变化 → STALL）\n- 三项信号必须全达标：terminology_drift_count == 0、broken_links_count == 0、code_example_errors == 0\n- 失败计数达到 2 → 立即 ESCALATE（弱门禁，retry_on_failure=false）'
};

const COMMAND_MAP = {
  'coding-loop.md':   { name: 'coding-loop',   desc: 'Coding-Loop: 受控编码/审查闭环',            agent: 'coding-orchestrator',   exe: 'coding-builder',     rev: 'coding-reviewer' },
  'ralph-loop.md':    { name: 'ralph-loop',    desc: 'Ralph-Loop: 通用编排执行审查闭环（线性）', agent: 'ralph-orchestrator',    exe: 'ralph-worker',       rev: 'ralph-reviewer' },
  'ralph-graph.md':   { name: 'ralph-graph',   desc: 'Ralph-Graph: 通用编排执行审查闭环（DAG 路由表）', agent: 'ralph-orchestrator', exe: 'ralph-worker',       rev: 'ralph-reviewer' },
  'testing-loop.md':  { name: 'test-loop',     desc: 'Test-Loop: 三项验证信号驱动的测试编写闭环（源码冻结）', agent: 'test-orchestrator', exe: 'test-writer',      rev: 'coverage-reviewer' },
  'writing-loop.md':  { name: 'writing-loop',  desc: 'Writing-Loop: 文档写作质量信号闭环（写作边界）',     agent: 'writing-orchestrator', exe: 'writing-author',   rev: 'writing-reviewer' }
};

function replacePlaceholders(content, map) {
  return content
    .replace(/\{\{name\}\}/g, map.name)
    .replace(/\{\{description\}\}/g, map.desc)
    .replace(/\{\{executor_name\}\}/g, map.exe || '')
    .replace(/\{\{reviewer_name\}\}/g, map.rev || '')
    .replace(/\{\{engine_type\}\}/g, map.engine || '')
    .replace(/\{\{backpressure\}\}/g, map.bp || '');
}

function processAgents() {
  const srcDir = path.join(TEMPLATE_DIR, 'agents');
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
  let count = 0;
  for (const file of files) {
    const map = AGENT_MAP[file];
    if (!map) { console.error(`MISSING MAP: ${file}`); process.exit(1); }
    map.bp = BACKPRESSURE[file] || '';
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const replaced = replacePlaceholders(content, map);
    for (const platform of PLATFORMS) {
      const out = path.join(OUT_BASE, platform, 'agents', `${map.name}.md`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, replaced, 'utf8');
      count++;
    }
  }
  console.log(`agents: ${files.length} templates × ${PLATFORMS.length} platforms = ${count} files`);
}

function processCommands() {
  const srcDir = path.join(TEMPLATE_DIR, 'commands');
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
  let count = 0;
  for (const file of files) {
    const map = COMMAND_MAP[file];
    if (!map) { console.error(`MISSING MAP: ${file}`); process.exit(1); }
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const replaced = replacePlaceholders(content, map);
    for (const platform of PLATFORMS) {
      const out = path.join(OUT_BASE, platform, 'commands', `${map.name}.md`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, replaced, 'utf8');
      count++;
    }
  }
  console.log(`commands: ${files.length} templates × ${PLATFORMS.length} platforms = ${count} files`);
}

// 主流程
processAgents();
processCommands();
console.log('\nTotal: ' + (Object.keys(AGENT_MAP).length + Object.keys(COMMAND_MAP).length) * PLATFORMS.length + ' files written');
```

- [ ] **Step 2: 运行实例化生成器**

```powershell
node D:\Code\agentic-skills\scripts\instantiate-templates.js
```
Expected output:
```
agents: 12 templates × 3 platforms = 36 files
commands: 5 templates × 3 platforms = 15 files

Total: 51 files written
```

- [ ] **Step 3: 验证文件齐全**

```powershell
$expectedAgents = @('coding-orchestrator','coding-builder','coding-reviewer','ralph-orchestrator','ralph-worker','ralph-reviewer','test-orchestrator','test-writer','coverage-reviewer','writing-orchestrator','writing-author','writing-reviewer')
$expectedCommands = @('coding-loop','ralph-loop','ralph-graph','test-loop','writing-loop')
foreach ($platform in @('opencode','codebuddy','zcode')) {
    $agents = Get-ChildItem -LiteralPath "D:\Code\agentic-skills\plugins\loop-workflow\$platform\agents" -Filter "*.md" | Select-Object -ExpandProperty BaseName
    $cmds = Get-ChildItem -LiteralPath "D:\Code\agentic-skills\plugins\loop-workflow\$platform\commands" -Filter "*.md" | Select-Object -ExpandProperty BaseName
    $missA = $expectedAgents | Where-Object { $_ -notin $agents }
    $missC = $expectedCommands | Where-Object { $_ -notin $cmds }
    if ($missA.Count -eq 0 -and $missC.Count -eq 0) {
        Write-Host "OK: $platform has 12 agents + 5 commands"
    } else {
        Write-Host "FAIL: $platform missing agents: $($missA -join ','), commands: $($missC -join ',')"
    }
}
```
Expected: 三行 `OK: <platform> has 12 agents + 5 commands`。

- [ ] **Step 4: 验证占位符已全部替换**

```powershell
$leftover = Get-ChildItem -LiteralPath "D:\Code\agentic-skills\plugins\loop-workflow" -Recurse -Filter "*.md" | Where-Object {
    (Select-String -Path $_.FullName -Pattern "\{\{.*?\}\}" -Quiet)
}
if ($leftover.Count -eq 0) {
    Write-Host "OK: no leftover {{...}} placeholders"
} else {
    Write-Host "FAIL: $($leftover.Count) files still have placeholders:"
    $leftover | ForEach-Object { Write-Host "  $($_.FullName)" }
}
```
Expected: `OK: no leftover {{...}} placeholders`.

---

## Task 7: loop-workflow 平台 manifest（zcode + codebuddy plugin.json）

**Files:**
- Create: `D:\Code\agentic-skills\plugins\loop-workflow\zcode\.zcode-plugin\plugin.json`
- Create: `D:\Code\agentic-skills\plugins\loop-workflow\codebuddy\.codebuddy-plugin\plugin.json`

**Interfaces:**
- Consumes: Task 6 产出的 agents/commands 列表
- Produces: 两个 plugin manifest

- [ ] **Step 1: 写 zcode plugin.json**

PowerShell:
```powershell
$zp = @'
{
  "name": "loop-workflow-zcode",
  "version": "0.1.0",
  "description": "Orchestrated execute-review loops for ZCode. 12 agents + 5 commands covering coding/testing/writing/Ralph workflows.",
  "author": {
    "name": "master0071",
    "url": "https://github.com/master0071"
  },
  "homepage": "https://github.com/master0071/agentic-work",
  "repository": "https://github.com/master0071/agentic-work",
  "license": "MIT",
  "keywords": ["workflow", "loop", "ralph", "orchestration"],
  "commands": "commands",
  "agents": "agents"
}
'@
Set-Content -LiteralPath "D:\Code\agentic-skills\plugins\loop-workflow\zcode\.zcode-plugin\plugin.json" -Value $zp -NoNewline -Encoding UTF8
```

- [ ] **Step 2: 写 codebuddy plugin.json**

PowerShell:
```powershell
$cbp = @'
{
  "name": "loop-workflow-codebuddy",
  "version": "0.1.0",
  "description": "Orchestrated execute-review loops for CodeBuddy. 12 agents + 5 commands covering coding/testing/writing/Ralph workflows.",
  "category": "Workflow",
  "commands": "commands",
  "agents": "agents"
}
'@
Set-Content -LiteralPath "D:\Code\agentic-skills\plugins\loop-workflow\codebuddy\.codebuddy-plugin\plugin.json" -Value $cbp -NoNewline -Encoding UTF8
```

- [ ] **Step 3: 验证**

```powershell
Test-Path "D:\Code\agentic-skills\plugins\loop-workflow\zcode\.zcode-plugin\plugin.json"
Test-Path "D:\Code\agentic-skills\plugins\loop-workflow\codebuddy\.codebuddy-plugin\plugin.json"
```
Expected: 全 True。

---

## Task 8: install-opencode.js

**Files:**
- Create: `D:\Code\agentic-skills\scripts\install-opencode.js`

**Interfaces:**
- Consumes: `plugins/<name>/opencode/{skills,agents,commands}/`
- Produces: 复制到 `%USERPROFILE%\.config\opencode\{skills,agents,commands}\`
- CLI flags: `--plugin <dotnet-work|loop-workflow>` (默认两个)、`--uninstall`、`--dry-run`

- [ ] **Step 1: 写 install-opencode.js**

```javascript
#!/usr/bin/env node
'use strict';
// install-opencode.js — Install agentic-work plugins for opencode
//
// Usage:
//   node scripts/install-opencode.js                  # install all
//   node scripts/install-opencode.js --plugin dotnet-work
//   node scripts/install-opencode.js --uninstall
//   node scripts/install-opencode.js --dry-run
//
// Copies plugins/<name>/opencode/{skills,agents,commands} to
// %USERPROFILE%/.config/opencode/{skills,agents,commands}/

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');

const HOME = joinHome('.config', 'opencode');
const PLUGINS = [
  { name: 'dotnet-work',   src: 'plugins/dotnet-work/opencode' },
  { name: 'loop-workflow', src: 'plugins/loop-workflow/opencode' }
];
const SUBDIRS = ['skills', 'agents', 'commands'];

function parseArgs(argv) {
  const args = { plugin: null, uninstall: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') args.plugin = argv[++i];
    else if (argv[i] === '--uninstall') args.uninstall = true;
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

function selectPlugins(args) {
  if (!args.plugin) return PLUGINS;
  const found = PLUGINS.find(p => p.name === args.plugin);
  if (!found) {
    console.error(`Unknown plugin: ${args.plugin}. Available: ${PLUGINS.map(p => p.name).join(', ')}`);
    process.exit(1);
  }
  return [found];
}

function install(args) {
  console.log('Installing agentic-work for opencode...\n');
  const plugins = selectPlugins(args);
  for (const plugin of plugins) {
    const srcBase = path.join(__dirname, '..', plugin.src);
    for (const sub of SUBDIRS) {
      const src = path.join(srcBase, sub);
      if (!fs.existsSync(src)) continue;
      const dest = path.join(HOME, sub);
      // opencode skills/<name>/ nested; agents/commands/ flat
      if (sub === 'skills') {
        for (const skill of fs.readdirSync(src)) {
          const skillSrc = path.join(src, skill);
          const skillDest = path.join(dest, skill);
          if (!args.dryRun) copyDirRecursive(skillSrc, skillDest);
          console.log(`  ${args.dryRun ? 'would copy' : 'copied'}: ${sub}/${skill}/`);
        }
      } else {
        for (const file of fs.readdirSync(src)) {
          const fSrc = path.join(src, file);
          const fDest = path.join(dest, file);
          if (!args.dryRun) fs.copyFileSync(fSrc, fDest);
          console.log(`  ${args.dryRun ? 'would copy' : 'copied'}: ${sub}/${file}`);
        }
      }
    }
  }
  console.log(args.dryRun ? '\n[dry-run] No files written.' : '\n✅ Installation complete.');
}

function uninstall(args) {
  console.log('Uninstalling agentic-work from opencode...\n');
  const plugins = selectPlugins(args);
  for (const plugin of plugins) {
    const srcBase = path.join(__dirname, '..', plugin.src);
    for (const sub of SUBDIRS) {
      const src = path.join(srcBase, sub);
      if (!fs.existsSync(src)) continue;
      if (sub === 'skills') {
        for (const skill of fs.readdirSync(src)) {
          const dest = path.join(HOME, sub, skill);
          if (fs.existsSync(dest) && !args.dryRun) fs.rmSync(dest, { recursive: true, force: true });
          console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${sub}/${skill}/`);
        }
      } else {
        for (const file of fs.readdirSync(src)) {
          const dest = path.join(HOME, sub, file);
          if (fs.existsSync(dest) && !args.dryRun) fs.rmSync(dest, { force: true });
          console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${sub}/${file}`);
        }
      }
    }
  }
  console.log(args.dryRun ? '\n[dry-run] No files removed.' : '\n✅ Uninstallation complete.');
}

const args = parseArgs(process.argv);
args.uninstall ? uninstall(args) : install(args);
```

- [ ] **Step 2: dry-run 验证**

```powershell
node D:\Code\agentic-skills\scripts\install-opencode.js --dry-run
```
Expected: 列出每个 skill/agent/command 的 "would copy" 路径。

- [ ] **Step 3: --plugin dotnet-work dry-run 过滤**

```powershell
node D:\Code\agentic-skills\scripts\install-opencode.js --plugin dotnet-work --dry-run
```
Expected: 仅显示 dotnet-work 的 skills（无 agents/commands，因为 dotnet-work 是 skills-only）。

---

## Task 9: install-codebuddy.js

**Files:**
- Create: `D:\Code\agentic-skills\scripts\install-codebuddy.js`

**Interfaces:**
- Consumes: `plugins/<name>/codebuddy/`
- Produces: 复制到 `%USERPROFILE%\.codebuddy\plugins\<name>-codebuddy\`，注册到 marketplace
- CLI flags: 同 Task 8

- [ ] **Step 1: 写 install-codebuddy.js（基于 caveman4cn install-codebuddy.js 模式）**

```javascript
#!/usr/bin/env node
'use strict';
// install-codebuddy.js — Install agentic-work plugins for CodeBuddy
//
// Usage:
//   node scripts/install-codebuddy.js                  # install all
//   node scripts/install-codebuddy.js --plugin dotnet-work
//   node scripts/install-codebuddy.js --uninstall
//   node scripts/install-codebuddy.js --dry-run
//
// Copies plugins/<name>/codebuddy/* to
// %USERPROFILE%/.codebuddy/plugins/<name>-codebuddy/
// and registers via 'codebuddy plugin' CLI.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');

const PLUGIN_DIR = joinHome('.codebuddy', 'plugins');
const MARKETPLACE_NAME = 'master0071';
const PLUGIN_VERSION = '0.1.0';
const PLUGINS = ['dotnet-work', 'loop-workflow'];

function parseArgs(argv) {
  const args = { plugin: null, uninstall: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') args.plugin = argv[++i];
    else if (argv[i] === '--uninstall') args.uninstall = true;
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

function selectPlugins(args) {
  if (!args.plugin) return PLUGINS;
  if (!PLUGINS.includes(args.plugin)) {
    console.error(`Unknown plugin: ${args.plugin}. Available: ${PLUGINS.join(', ')}`);
    process.exit(1);
  }
  return [args.plugin];
}

function findCodeBuddy() {
  try {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'where codebuddy' : 'which codebuddy';
    const out = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    return out.split('\n')[0].trim();
  } catch { return null; }
}

function runCB(args, dryRun) {
  const cmd = `codebuddy ${args}`;
  if (dryRun) { console.log(`  would run: ${cmd}`); return ''; }
  try { return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }); }
  catch (err) { throw new Error(err.stderr || err.message); }
}

function deleteDirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) deleteDirRecursive(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(dir);
}

function ensureMarketplaceManifest(plugins, dryRun) {
  const manifestFile = path.join(PLUGIN_DIR, '.codebuddy-plugin', 'marketplace.json');
  if (dryRun) { console.log(`  would update: ${manifestFile}`); return; }
  fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
  let data = { name: MARKETPLACE_NAME, description: '', owner: { name: 'master0071' }, plugins: [] };
  if (fs.existsSync(manifestFile)) {
    try { data = JSON.parse(fs.readFileSync(manifestFile, 'utf-8')); } catch (_) {}
  }
  data.name = MARKETPLACE_NAME;
  data.description = 'Custom marketplace for local CodeBuddy plugins';
  data.plugins = data.plugins || [];
  for (const pluginName of plugins) {
    const entry = {
      name: `${pluginName}-codebuddy`,
      version: PLUGIN_VERSION,
      source: `./${pluginName}-codebuddy`,
      category: pluginName === 'dotnet-work' ? 'development' : 'workflow',
      author: { name: 'master0071', url: 'https://github.com/master0071' },
      homepage: 'https://github.com/master0071/agentic-work',
      license: 'MIT'
    };
    const idx = data.plugins.findIndex(p => p.name === entry.name);
    if (idx >= 0) data.plugins[idx] = entry;
    else data.plugins.push(entry);
  }
  fs.writeFileSync(manifestFile, JSON.stringify(data, null, 2) + '\n');
}

function install(args) {
  console.log('Installing agentic-work for CodeBuddy...\n');
  const cbPath = findCodeBuddy();
  if (!cbPath) {
    console.error('Error: CodeBuddy CLI not found in PATH');
    console.error('Install CodeBuddy first: npm install -g codebuddy');
    process.exit(1);
  }
  console.log(`→ CodeBuddy at: ${cbPath}`);

  const plugins = selectPlugins(args);
  for (const pluginName of plugins) {
    const src = path.join(__dirname, '..', 'plugins', pluginName, 'codebuddy');
    const installName = `${pluginName}-codebuddy`;
    const dest = path.join(PLUGIN_DIR, installName);
    if (!fs.existsSync(src)) {
      console.error(`Error: source not found: ${src}`);
      process.exit(1);
    }
    if (!args.dryRun) {
      if (fs.existsSync(dest)) deleteDirRecursive(dest);
      copyDirRecursive(src, dest);
      console.log(`  copied to: ${dest}`);
    } else {
      console.log(`  would copy: ${src} → ${dest}`);
    }
  }

  console.log('\n→ Updating marketplace manifest...');
  ensureMarketplaceManifest(plugins, args.dryRun);

  console.log(`\n→ Adding marketplace: ${MARKETPLACE_NAME}`);
  try { runCB(`plugin marketplace add "${PLUGIN_DIR}" --name ${MARKETPLACE_NAME}`, args.dryRun); }
  catch (_) { /* may already exist */ }

  console.log(`\n→ Updating marketplace...`);
  runCB(`plugin marketplace update ${MARKETPLACE_NAME}`, args.dryRun);

  for (const pluginName of plugins) {
    const pluginId = `${pluginName}-codebuddy@${MARKETPLACE_NAME}`;
    console.log(`\n→ Installing plugin: ${pluginId}`);
    try { runCB(`plugin uninstall ${pluginId}`, args.dryRun); } catch (_) {}
    runCB(`plugin install ${pluginId}`, args.dryRun);
  }
  console.log(args.dryRun ? '\n[dry-run] No files written.' : '\n✅ Installation complete.');
}

function uninstall(args) {
  console.log('Uninstalling agentic-work from CodeBuddy...\n');
  const plugins = selectPlugins(args);
  for (const pluginName of plugins) {
    const installName = `${pluginName}-codebuddy`;
    const pluginId = `${installName}@${MARKETPLACE_NAME}`;
    console.log(`→ Uninstalling: ${pluginId}`);
    try { runCB(`plugin uninstall ${pluginId}`, args.dryRun); } catch (_) {}
    const dest = path.join(PLUGIN_DIR, installName);
    if (fs.existsSync(dest)) {
      if (!args.dryRun) deleteDirRecursive(dest);
      console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${dest}`);
    }
  }
  console.log(args.dryRun ? '\n[dry-run] No files removed.' : '\n✅ Uninstallation complete.');
}

const args = parseArgs(process.argv);
args.uninstall ? uninstall(args) : install(args);
```

- [ ] **Step 2: dry-run 验证**

```powershell
node D:\Code\agentic-skills\scripts\install-codebuddy.js --dry-run
```
Expected: 列出 would copy / would run 命令路径，但不实际执行 codebuddy CLI。

---

## Task 10: install-zcode.js

**Files:**
- Create: `D:\Code\agentic-skills\scripts\install-zcode.js`

**Interfaces:**
- Consumes: `plugins/<name>/zcode/`
- Produces: 复制到 `%USERPROFILE%\.zcode\cli\plugins\cache\master0071\<name>-zcode\0.1.0\`
- 注册到 `%USERPROFILE%\.zcode\cli\plugins\marketplaces\master0071\marketplace.json`
- 创建 `%USERPROFILE%\.zcode\cli\plugins\data\<name>-zcode@master0071\` 启用标记
- CLI flags: 同 Task 8

- [ ] **Step 1: 写 install-zcode.js（基于 caveman4cn install-zcode.js 模式）**

```javascript
#!/usr/bin/env node
'use strict';
// install-zcode.js — Install agentic-work plugins for ZCode
//
// Usage:
//   node scripts/install-zcode.js                  # install all
//   node scripts/install-zcode.js --plugin dotnet-work
//   node scripts/install-zcode.js --uninstall
//   node scripts/install-zcode.js --dry-run
//
// Copies plugins/<name>/zcode/* to
// %USERPROFILE%/.zcode/cli/plugins/cache/master0071/<name>-zcode/0.1.0/
// and registers in marketplace.

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');

const PLUGIN_DIR = joinHome('.zcode', 'cli', 'plugins');
const MARKETPLACE_NAME = 'master0071';
const PLUGIN_VERSION = '0.1.0';
const PLUGINS = ['dotnet-work', 'loop-workflow'];
const SUBDIRS = ['.zcode-plugin', 'skills', 'commands', 'agents', 'hooks', 'assets'];

function parseArgs(argv) {
  const args = { plugin: null, uninstall: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') args.plugin = argv[++i];
    else if (argv[i] === '--uninstall') args.uninstall = true;
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

function selectPlugins(args) {
  if (!args.plugin) return PLUGINS;
  if (!PLUGINS.includes(args.plugin)) {
    console.error(`Unknown plugin: ${args.plugin}. Available: ${PLUGINS.join(', ')}`);
    process.exit(1);
  }
  return [args.plugin];
}

function deleteDirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) deleteDirRecursive(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(dir);
}

function installPlugin(pluginName, args) {
  const installName = `${pluginName}-zcode`;
  const pluginRoot = path.join(PLUGIN_DIR, 'cache', MARKETPLACE_NAME, `${installName}\\${PLUGIN_VERSION}`);
  const src = path.join(__dirname, '..', 'plugins', pluginName, 'zcode');

  console.log(`\n→ Installing ${installName}`);
  if (!fs.existsSync(src)) {
    console.error(`Error: source not found: ${src}`);
    process.exit(1);
  }

  for (const sub of SUBDIRS) {
    const subSrc = path.join(src, sub);
    if (!fs.existsSync(subSrc)) continue;
    const subDest = path.join(pluginRoot, sub);
    if (!args.dryRun) {
      copyDirRecursive(subSrc, subDest);
      console.log(`  copied: ${sub}/`);
    } else {
      console.log(`  would copy: ${subSrc} → ${subDest}`);
    }
  }

  // 注册到 marketplace
  const marketplaceFile = path.join(PLUGIN_DIR, 'marketplaces', MARKETPLACE_NAME, 'marketplace.json');
  if (!args.dryRun) {
    fs.mkdirSync(path.dirname(marketplaceFile), { recursive: true });
    let marketplace = { name: MARKETPLACE_NAME, owner: { name: 'master0071' }, plugins: [], version: 1 };
    if (fs.existsSync(marketplaceFile)) {
      marketplace = JSON.parse(fs.readFileSync(marketplaceFile, 'utf-8'));
    }
    const entry = {
      name: installName,
      source: 'filesystem',
      cachePath: pluginRoot.replace(/\\/g, '\\\\'),
      version: PLUGIN_VERSION,
      description: `${pluginName} plugin for ZCode`,
      category: pluginName === 'dotnet-work' ? 'development' : 'workflow'
    };
    const idx = marketplace.plugins.findIndex(p => p.name === installName);
    if (idx >= 0) marketplace.plugins[idx] = entry;
    else marketplace.plugins.push(entry);
    fs.writeFileSync(marketplaceFile, JSON.stringify(marketplace, null, 2) + '\n');
    console.log(`  registered in marketplace`);
  } else {
    console.log(`  would register in marketplace`);
  }

  // 启用标记
  const dataDir = path.join(PLUGIN_DIR, 'data', `${installName}@${MARKETPLACE_NAME}`);
  if (!args.dryRun) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`  enabled`);
  } else {
    console.log(`  would create data dir`);
  }
}

function uninstallPlugin(pluginName, args) {
  const installName = `${pluginName}-zcode`;
  const pluginRoot = path.join(PLUGIN_DIR, 'cache', MARKETPLACE_NAME, `${installName}\\${PLUGIN_VERSION}`);
  console.log(`\n→ Removing ${installName}`);

  if (fs.existsSync(pluginRoot)) {
    if (!args.dryRun) deleteDirRecursive(pluginRoot);
    console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${pluginRoot}`);
  }

  const marketplaceFile = path.join(PLUGIN_DIR, 'marketplaces', MARKETPLACE_NAME, 'marketplace.json');
  if (fs.existsSync(marketplaceFile) && !args.dryRun) {
    const marketplace = JSON.parse(fs.readFileSync(marketplaceFile, 'utf-8'));
    marketplace.plugins = marketplace.plugins.filter(p => p.name !== installName);
    fs.writeFileSync(marketplaceFile, JSON.stringify(marketplace, null, 2) + '\n');
    console.log(`  removed from marketplace`);
  } else if (args.dryRun) {
    console.log(`  would remove from marketplace`);
  }

  const dataDir = path.join(PLUGIN_DIR, 'data', `${installName}@${MARKETPLACE_NAME}`);
  if (fs.existsSync(dataDir)) {
    if (!args.dryRun) deleteDirRecursive(dataDir);
    console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: data dir`);
  }
}

function install(args) {
  console.log('Installing agentic-work for ZCode...\n');
  for (const name of selectPlugins(args)) installPlugin(name, args);
  console.log(args.dryRun ? '\n[dry-run] No files written.' : '\n✅ Installation complete. Restart ZCode to take effect.');
}

function uninstall(args) {
  console.log('Uninstalling agentic-work from ZCode...\n');
  for (const name of selectPlugins(args)) uninstallPlugin(name, args);
  console.log(args.dryRun ? '\n[dry-run] No files removed.' : '\n✅ Uninstallation complete.');
}

const args = parseArgs(process.argv);
args.uninstall ? uninstall(args) : install(args);
```

- [ ] **Step 2: dry-run 验证**

```powershell
node D:\Code\agentic-skills\scripts\install-zcode.js --dry-run
```
Expected: 列出每个插件每个 SUBDIR 的 would copy 路径，would register / would create data dir。

---

## Task 11: 自检 — 三脚本 dry-run 全部跑通

**Files:**
- None (verification only)

- [ ] **Step 1: opencode dry-run**

```powershell
node D:\Code\agentic-skills\scripts\install-opencode.js --dry-run 2>&1 | Tee-Object -FilePath "$env:TEMP\dry-run-opencode.txt"
```
Expected: exit code 0, 输出包含 4 skills（dotnet-work）+ 12 agents + 5 commands（loop-workflow）的 would copy 列表。

- [ ] **Step 2: codebuddy dry-run**

```powershell
node D:\Code\agentic-skills\scripts\install-codebuddy.js --dry-run 2>&1 | Tee-Object -FilePath "$env:TEMP\dry-run-codebuddy.txt"
```
Expected: exit code 0，输出 would copy 路径 + would run codebuddy 命令列表。

- [ ] **Step 3: zcode dry-run**

```powershell
node D:\Code\agentic-skills\scripts\install-zcode.js --dry-run 2>&1 | Tee-Object -FilePath "$env:TEMP\dry-run-zcode.txt"
```
Expected: exit code 0，输出 would copy 路径 + would register / would create data。

- [ ] **Step 4: 单插件 dry-run 过滤**

```powershell
node D:\Code\agentic-skills\scripts\install-zcode.js --plugin dotnet-work --dry-run
```
Expected: 仅显示 dotnet-work-zcode 相关路径，无 loop-workflow。

- [ ] **Step 5: 验证 dry-run 不写入任何文件**

```powershell
Test-Path "$env:USERPROFILE\.config\opencode\skills\database-explorer"
Test-Path "$env:USERPROFILE\.codebuddy\plugins\dotnet-work-codebuddy"
Test-Path "$env:USERPROFILE\.zcode\cli\plugins\cache\master0071\dotnet-work-zcode\0.1.0"
```
Expected: 全 False（dry-run 不应触碰任何目标目录）。

---

## Task 12: README.md + AGENTS.md

**Files:**
- Create: `D:\Code\agentic-skills\README.md`
- Create: `D:\Code\agentic-skills\AGENTS.md`

**Interfaces:**
- README.md 面向用户（安装说明、插件列表、平台差异）
- AGENTS.md 面向后续开发 agent（仓库规约、修改指引）

- [ ] **Step 1: 写 README.md**

PowerShell:
```powershell
$readme = @'
# @master0071/agentic-work

Agentic-work plugins for **opencode**, **CodeBuddy**, and **ZCode**.

## Plugins

| Plugin          | Description                                                                                       | Type    |
|-----------------|---------------------------------------------------------------------------------------------------|---------|
| `dotnet-work`   | .NET development skills: database-explorer, dotnet-code-review, dotnet-csharp-developer, winforms-dev-flow | skills  |
| `loop-workflow` | Orchestrated execute-review loops: 12 agents + 5 commands covering coding/testing/writing/Ralph    | agents + commands |

## Installation

### From source (this repo)

```sh
# Install all platforms
npm run install:all

# Or per-platform
npm run install:opencode     # copies to ~/.config/opencode/
npm run install:codebuddy    # copies to ~/.codebuddy/plugins/<name>-codebuddy/
npm run install:zcode        # copies to ~/.zcode/cli/plugins/cache/master0071/<name>-zcode/

# Per-plugin flag
node scripts/install-zcode.js --plugin dotnet-work
node scripts/install-zcode.js --plugin loop-workflow

# Dry-run (preview without writing)
node scripts/install-zcode.js --dry-run

# Uninstall
node scripts/install-zcode.js --uninstall
```

### Single-plugin scope

```sh
npm install -g @master0071/dotnet-work
npm install -g @master0071/loop-workflow
```

(Wrappers `agentic-work-opencode`, `agentic-work-codebuddy`, `agentic-work-zcode` provided via `package.json` bin.)

## Marketplace

Both plugins ship under the `master0071` marketplace for CodeBuddy and ZCode:

- CodeBuddy: `~/.codebuddy/plugins/.codebuddy-plugin/marketplace.json`
- ZCode: `~/.zcode/cli/plugins/marketplaces/master0071/marketplace.json`

## Cross-platform content equality

Each plugin's `skills/`, `agents/`, `commands/` are byte-identical across the three platform subdirectories. Platform manifests (`<plugin>/<platform>/.codebuddy-plugin/plugin.json` etc.) are the only platform-specific files.

## Repository structure

```
agentic-work/
├── package.json                          # @master0071/agentic-work
├── marketplace.json                      # zcode marketplace
├── .codebuddy-plugin/marketplace.json    # codebuddy marketplace
├── plugins/
│   ├── dotnet-work/
│   │   ├── opencode/   # { skills/<4> }
│   │   ├── codebuddy/  # + .codebuddy-plugin/plugin.json
│   │   └── zcode/      # + .zcode-plugin/plugin.json
│   └── loop-workflow/
│       ├── opencode/   # { agents/<12>, commands/<5> }
│       ├── codebuddy/  # + .codebuddy-plugin/plugin.json
│       └── zcode/      # + .zcode-plugin/plugin.json
└── scripts/
    ├── install-opencode.js
    ├── install-codebuddy.js
    ├── install-zcode.js
    └── instantiate-templates.js   # one-shot generator for loop-workflow
```

## License

MIT © master0071
'@
Set-Content -LiteralPath "D:\Code\agentic-skills\README.md" -Value $readme -NoNewline -Encoding UTF8
```

- [ ] **Step 2: 写 AGENTS.md**

PowerShell:
```powershell
$agents = @'
# AGENTS.md — agentic-work

This repo contains plugins for opencode / CodeBuddy / ZCode. Follow these rules when making changes.

## Layout invariants

- `plugins/<plugin-name>/` is a single plugin. Each plugin MUST have three platform subdirs: `opencode/`, `codebuddy/`, `zcode/`.
- Content inside `skills/`, `agents/`, `commands/` MUST be byte-identical across the three platforms.
- Platform manifests live only in their respective `<platform>/` subdir:
  - `zcode/.zcode-plugin/plugin.json`
  - `codebuddy/.codebuddy-plugin/plugin.json`
  - opencode has no per-plugin manifest; skills/agents/commands are discovered by name.

## dotnet-work

- Source: previously `donet-work/` (renamed, typo fixed).
- 4 skills: `database-explorer`, `dotnet-code-review`, `dotnet-csharp-developer`, `winforms-dev-flow`.
- When adding a new skill: create `<skill-name>/SKILL.md` + `references/` + `scripts/` once, then copy to all three platform subdirs.

## loop-workflow

- Templates at `loop-workflow/templates/{agents,commands}/*.md` use `{{...}}` placeholders.
- `scripts/instantiate-templates.js` is the only way to materialize instances. To add a new agent/command:
  1. Add template to `loop-workflow/templates/`
  2. Update `AGENT_MAP` / `COMMAND_MAP` in `instantiate-templates.js`
  3. Update `BACKPRESSURE` if it's an orchestrator
  4. Run `node scripts/instantiate-templates.js`

## Install scripts

- Each `scripts/install-<platform>.js` accepts: `--plugin <name>`, `--uninstall`, `--dry-run`.
- They MUST be idempotent: re-running install replaces existing content.
- Uninstall MUST remove all files created by install (skills/<name>/, agents/<file>.md, commands/<file>.md for opencode; full install dirs for codebuddy/zcode).

## Verification

Before committing, run all three dry-runs:

```sh
node scripts/install-opencode.js --dry-run
node scripts/install-codebuddy.js --dry-run
node scripts/install-zcode.js --dry-run
```

All three must exit 0 without writing any files.

## Marketplace

The `master0071` marketplace is shared with `caveman4cn`. To avoid conflicts, plugin names include the platform suffix (`dotnet-work-zcode`, `loop-workflow-codebuddy`, etc.) and live under `plugins/<name>/<platform>/` in this repo.
'@
Set-Content -LiteralPath "D:\Code\agentic-skills\AGENTS.md" -Value $agents -NoNewline -Encoding UTF8
```

- [ ] **Step 3: 验证**

```powershell
Test-Path "D:\Code\agentic-skills\README.md"
Test-Path "D:\Code\agentic-skills\AGENTS.md"
Get-Content "D:\Code\agentic-skills\README.md" | Measure-Object -Line | Select-Object -ExpandProperty Lines
Get-Content "D:\Code\agentic-skills\AGENTS.md" | Measure-Object -Line | Select-Object -ExpandProperty Lines
```
Expected: README ≥ 50 行, AGENTS.md ≥ 30 行。

---

## Task 13: git init + 首次提交

**Files:**
- Create: `D:\Code\agentic-skills\.git\` (git init)
- Commit: 全部新增/重命名/复制的文件

- [ ] **Step 1: git init（若尚未初始化）**

```powershell
Push-Location "D:\Code\agentic-skills"
if (-not (Test-Path ".git")) {
    git init
    git config user.email "master0071@users.noreply.github.com"
    git config user.name "master0071"
}
Pop-Location
```

- [ ] **Step 2: git add 所有源**

```powershell
Push-Location "D:\Code\agentic-skills"
git add .gitignore .editorconfig LICENSE
git add package.json marketplace.json .codebuddy-plugin/marketplace.json
git add README.md AGENTS.md
git add scripts/
git add plugins/
Pop-Location
```

Verify:
```powershell
Push-Location "D:\Code\agentic-skills"
git status --short
Pop-Location
```
Expected: 仅显示新增文件（A 或 ?? 前缀），无未跟踪的临时文件。

- [ ] **Step 3: 首次提交**

```powershell
Push-Location "D:\Code\agentic-skills"
git commit -m "feat: initial agentic-work plugins

- dotnet-work: 4 .NET development skills × 3 platforms (opencode/codebuddy/zcode)
  - database-explorer, dotnet-code-review, dotnet-csharp-developer, winforms-dev-flow
  - Renamed from donet-work (typo fix)

- loop-workflow: 12 agents + 5 commands × 3 platforms
  - Pre-instantiated from loop-workflow/templates/ via instantiate-templates.js
  - Covers coding/testing/writing/Ralph orchestration loops

- Install scripts: install-opencode.js / install-codebuddy.js / install-zcode.js
  - Each supports --plugin / --uninstall / --dry-run

- Marketplace: master0071 (shared with caveman4cn)
- npm scope: @master0071/agentic-work"
Pop-Location
```

- [ ] **Step 4: 验证 commit**

```powershell
Push-Location "D:\Code\agentic-skills"
git log --oneline -1
git status
Pop-Location
```
Expected: 1 个 commit，working tree clean。

---

## Self-Review Checklist (post-plan)

1. **Spec coverage**:
   - 重命名 donet-work → dotnet-work ✓ (Task 1)
   - 4 skills × 3 平台复制 ✓ (Task 4)
   - 12 agents + 5 commands × 3 平台生成 ✓ (Task 6)
   - 3 个 install 脚本 ✓ (Tasks 8/9/10)
   - 顶层 manifest × 3 + LICENSE ✓ (Task 2)
   - 每个平台子目录的 plugin manifest × 2 (dotnet-work + loop-workflow) ✓ (Tasks 3/7)
   - README + AGENTS ✓ (Task 12)
   - git init + commit ✓ (Task 13)
   - dry-run 自检 ✓ (Task 11)

2. **Placeholder scan**:
   - 全 plan 无 TBD/TODO/「implement later」
   - 每个 Step 给具体代码或命令
   - 文件路径全部绝对路径

3. **Type consistency**:
   - `parseArgs()` 返回的 args 对象结构在 install-opencode.js / install-codebuddy.js / install-zcode.js 三脚本中完全一致（`{plugin, uninstall, dryRun}`）
   - PLUGINS 数组在三个 install 脚本中元素顺序一致：['dotnet-work', 'loop-workflow']
   - marketplace name `master0071` 在所有 manifest 与 install 脚本中一致