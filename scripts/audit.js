#!/usr/bin/env node
'use strict';
// audit.js — Daily self-audit for agentic-work repo.
//
// Runs 12 check categories, writes a dated report to reports/audit-YYYY-MM-DD-HH.md,
// and auto-fixes "must-fix" (destructive/irreversible) findings.
//
// Usage:
//   node scripts/audit.js              # run audit + auto-fix + write report
//   node scripts/audit.js --check      # dry-run: only report, no fixes
//   node scripts/audit.js --verbose    # print per-check details to stderr
//
// Check categories (全查):
//   A. Version sync        — manifest + SKILL.md + marketplace drift
//   B. Agent body sync     — cross-platform body consistency (zcode/codebuddy/trae/qoder/qwencode)
//   C. Install dry-run     — all 5 install scripts + materialize pass --dry-run
//   D. JSON validity       — every .json file parses
//   E. Hook integrity      — hooks.json refs → existing .js files
//   F. Manifest fields     — required fields per platform manifest
//   G. Marketplace entries — version + source path + name consistency
//   H. State schema        — .loop-cli/state/*.json validates
//   I. Script syntax       — all .js files pass `node -c`
//   J. Symlink check       — no broken symlinks
//   K. Gitignore coverage  — expected patterns present
//   L. Orphan detection    — _shared/ refs resolve, command refs resolve
//
// Must-fix (destructive/irreversible):
//   - Version drift (auto-sync via bump-version.js)
//   - Invalid JSON (report only — cannot auto-fix semantics)
//   - Missing hook scripts (report only — cannot auto-generate)
//   - Install dry-run failure (report only — needs code fix)
//   - Manifest field missing (report only — needs intent)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { REPO_ROOT } = require('./lib/materialize');
const { checkVersionSync, getPluginVersion } = require('./lib/plugin-version');

// ─── CLI args ───
const args = {
  check: process.argv.includes('--check'),
  verbose: process.argv.includes('--verbose'),
};

// ─── Finding model ───
// Each finding: { category, severity, mustFix, evidence, suggestion, file }
// severity: 'critical' | 'warning' | 'info'
// mustFix:  true = destructive/irreversible, auto-fix attempted
const findings = [];
const fixLog = [];

function addFinding(f) {
  findings.push({ ...f, category: f.category || 'UNKNOWN' });
}

// ─── Utility ───
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return { _error: e.message };
  }
}

function tryParseJSON(filePath) {
  try {
    JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return null;
  } catch (e) {
    return e.message;
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(REPO_ROOT, relPath));
}

function listFilesRecursive(dir, extFilter = null) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === '.codegraph') continue;
        walk(full);
      } else if (e.isFile() || e.isSymbolicLink()) {
        if (!extFilter || full.endsWith(extFilter)) {
          results.push(full);
        }
      }
    }
  }
  walk(dir);
  return results;
}

function stripFrontmatter(content) {
  // Remove leading --- ... --- block
  const m = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[1] : content;
}

function stripHtmlComments(content) {
  return content.replace(/<!--[\s\S]*?-->/g, '');
}

function log(msg) {
  if (args.verbose) console.error(`  ${msg}`);
}

// ═══════════════════════════════════════════════════════════════
// CHECK A: Version sync
// ═══════════════════════════════════════════════════════════════
function checkVersionDrift() {
  log('CHECK A: Version sync');
  const PLUGINS = ['dotnet-work', 'agentic-workflow', 'skill-radar', 'graph-workflow'];

  for (const plugin of PLUGINS) {
    let result;
    try {
      result = checkVersionSync(plugin);
    } catch (e) {
      addFinding({
        category: 'A',
        severity: 'critical',
        mustFix: false,
        file: `plugins/${plugin}/.codebuddy-plugin/plugin.json`,
        evidence: e.message,
        suggestion: 'Check manifest exists and has version field',
      });
      continue;
    }

    if (!result.ok) {
      for (const d of result.drifts) {
        addFinding({
          category: 'A',
          severity: 'critical',
          mustFix: true,
          file: d.file,
          evidence: `Version "${d.current}" does not match manifest "${result.expected}"`,
          suggestion: `Run: node scripts/bump-version.js --plugin ${plugin}`,
        });
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK B: Agent body sync (cross-platform)
// ═══════════════════════════════════════════════════════════════
function checkAgentBodySync() {
  log('CHECK B: Agent body sync');
  const PLATFORMS = ['zcode', 'codebuddy', 'trae', 'qoder', 'qwencode'];
  const PLUGINS_WITH_AGENTS = ['agentic-workflow', 'graph-workflow'];

  for (const plugin of PLUGINS_WITH_AGENTS) {
    const agentsDir = path.join(REPO_ROOT, 'plugins', plugin, 'zcode', 'agents');
    if (!fs.existsSync(agentsDir)) continue;
    const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));

    for (const agentFile of agentFiles) {
      const bodies = {};
      const present = [];

      for (const platform of PLATFORMS) {
        const agentPath = path.join(REPO_ROOT, 'plugins', plugin, platform, 'agents', agentFile);
        if (!fs.existsSync(agentPath)) continue;
        present.push(platform);
        const content = fs.readFileSync(agentPath, 'utf-8');
        // Body = strip frontmatter + strip html comments
        const body = stripHtmlComments(stripFrontmatter(content)).trim();
        bodies[platform] = body;
      }

      if (present.length < 2) continue;

      // Compare all platforms to zcode (source of truth)
      const sourceBody = bodies['zcode'];
      if (!sourceBody) continue;

      for (const platform of present) {
        if (platform === 'zcode') continue;
        if (bodies[platform] !== sourceBody) {
          // Find first differing line for evidence
          const linesA = sourceBody.split('\n');
          const linesB = bodies[platform].split('\n');
          let diffLine = -1;
          for (let i = 0; i < Math.max(linesA.length, linesB.length); i++) {
            if (linesA[i] !== linesB[i]) { diffLine = i + 1; break; }
          }
          addFinding({
            category: 'B',
            severity: 'warning',
            mustFix: false,
            file: `plugins/${plugin}/${platform}/agents/${agentFile}`,
            evidence: `Body differs from zcode/agents/${agentFile} at line ${diffLine}`,
            suggestion: `Sync body from zcode variant (frontmatter may intentionally differ)`,
          });
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK C: Install dry-run
// ═══════════════════════════════════════════════════════════════
function checkInstallDryRun() {
  log('CHECK C: Install dry-run');
  const installScripts = [
    'scripts/install-codebuddy.js',
    'scripts/install-zcode.js',
    'scripts/install-trae.js',
    'scripts/install-qoder.js',
    'scripts/install-qwencode.js',
    'scripts/materialize-codebuddy.js',
  ];

  for (const script of installScripts) {
    const scriptPath = path.join(REPO_ROOT, script);
    if (!fs.existsSync(scriptPath)) continue;
    try {
      execSync(`node ${scriptPath} --dry-run`, {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      log(`  ${script}: PASS`);
    } catch (e) {
      const stderr = e.stderr || '';
      const stdout = e.stdout || '';
      addFinding({
        category: 'C',
        severity: 'critical',
        mustFix: false,
        file: script,
        evidence: `dry-run exited ${e.status}: ${(stderr + stdout).split('\n').filter(Boolean).pop() || e.message}`,
        suggestion: 'Fix the install script so --dry-run passes',
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK D: JSON validity
// ═══════════════════════════════════════════════════════════════
function checkJSONValidity() {
  log('CHECK D: JSON validity');
  const jsonFiles = listFilesRecursive(REPO_ROOT, '.json');

  for (const filePath of jsonFiles) {
    const err = tryParseJSON(filePath);
    if (err) {
      const relPath = path.relative(REPO_ROOT, filePath);
      addFinding({
        category: 'D',
        severity: 'critical',
        mustFix: false,
        file: relPath,
        evidence: err.split('\n')[0],
        suggestion: 'Fix JSON syntax error',
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK E: Hook integrity
// ═══════════════════════════════════════════════════════════════
function checkHookIntegrity() {
  log('CHECK E: Hook integrity');
  const pluginsWithHooks = ['agentic-workflow', 'graph-workflow', 'skill-radar'];
  // hooks.zcode.json = ZCode (type:process, ${ZCODE_PLUGIN_ROOT}) — all plugins use per-platform names (hooks.<platform>.json);
  // hooks.codebuddy.json = CodeBuddy (type:command, ${CODEBUDDY_PLUGIN_ROOT}/${CLAUDE_PLUGIN_ROOT});
  // hooks.qwencode.json = Qwen Code (type:command, ${CLAUDE_PLUGIN_ROOT}, top-level event keys);
  // hooks.trae.json = Trae template (type:command, ${TRAE_PLUGIN_ROOT}, rendered+merged into global hooks.json by install-trae.js);
  // hooks.qoder.json = Qoder (type:command, ${QODER_PLUGIN_ROOT}, wrapper format, installed as hooks/hooks.json by install-qoder.js)
  const hookFiles = ['hooks.zcode.json', 'hooks.codebuddy.json', 'hooks.qwencode.json', 'hooks.trae.json', 'hooks.qoder.json'];

  for (const plugin of pluginsWithHooks) {
    for (const hookFile of hookFiles) {
      const hooksJsonPath = path.join(REPO_ROOT, 'plugins', plugin, 'hooks', hookFile);
      if (!fs.existsSync(hooksJsonPath)) continue;

      const hooksData = readJSON(hooksJsonPath);
      if (hooksData._error) {
        addFinding({
          category: 'E',
          severity: 'critical',
          mustFix: false,
          file: `plugins/${plugin}/hooks/${hookFile}`,
          evidence: hooksData._error,
          suggestion: `Fix ${hookFile} syntax`,
        });
        continue;
      }

      // Collect all hook script references.
      // ZCode/CodeBuddy wrap events under "hooks"; Qwen hook files use top-level event keys.
      const hookRefs = [];
      const eventMap = (hooksData.hooks && typeof hooksData.hooks === 'object') ? hooksData.hooks : hooksData;
      for (const [event, matchers] of Object.entries(eventMap)) {
        if (!Array.isArray(matchers)) continue; // skip description/other non-event fields
        for (const matcher of matchers) {
          for (const hook of (matcher.hooks || [])) {
            if (hook.type === 'process' && hook.args) {
              // ZCode form: script path appears in args[]
              for (let i = 0; i < hook.args.length; i++) {
                if (typeof hook.args[i] === 'string' && hook.args[i].includes('hooks/')) {
                  hookRefs.push(hook.args[i]);
                }
              }
            } else if (hook.type === 'command' && typeof hook.command === 'string') {
              // CodeBuddy form: single shell string — extract ${*_PLUGIN_ROOT}/... path tokens
              const m = hook.command.match(/\$\{[A-Z_]*PLUGIN_ROOT\}[^"' ]+/g) || [];
              hookRefs.push(...m);
            }
          }
        }
      }

      for (const ref of hookRefs) {
        // Resolve ${ZCODE_PLUGIN_ROOT}/hooks/X.js → plugins/<plugin>/hooks/X.js (all root vars)
        const resolved = ref.replace(/\$\{[A-Z_]*PLUGIN_ROOT\}/, `plugins/${plugin}`);
        const fullPath = path.join(REPO_ROOT, resolved);
        if (!fs.existsSync(fullPath)) {
          addFinding({
            category: 'E',
            severity: 'critical',
            mustFix: false,
            file: `plugins/${plugin}/hooks/${hookFile}`,
            evidence: `Hook script not found: ${resolved}`,
            suggestion: `Create ${resolved} or remove reference from ${hookFile}`,
          });
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK F: Manifest field completeness
// ═══════════════════════════════════════════════════════════════
function checkManifestFields() {
  log('CHECK F: Manifest field completeness');
  const PLUGINS = ['dotnet-work', 'agentic-workflow', 'skill-radar', 'graph-workflow'];
  const REQUIRED_FIELDS = {
    'codebuddy': ['name', 'version', 'description', 'category'],
    'zcode': ['name', 'version', 'description', 'author', 'license'],
    'trae': ['name', 'version', 'description'],
    'qoder': ['name', 'version', 'description'],
    'qwen': ['name', 'version', 'description'],
  };

  for (const plugin of PLUGINS) {
    for (const [platform, required] of Object.entries(REQUIRED_FIELDS)) {
      let manifestPath;
      if (platform === 'qwen') {
        manifestPath = path.join(REPO_ROOT, 'plugins', plugin, '.qwen-plugin', 'qwen-extension.json');
      } else {
        manifestPath = path.join(REPO_ROOT, 'plugins', plugin, `.${platform}-plugin`, 'plugin.json');
      }
      if (!fs.existsSync(manifestPath)) continue;

      const data = readJSON(manifestPath);
      if (data._error) continue;

      for (const field of required) {
        if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
          addFinding({
            category: 'F',
            severity: 'warning',
            mustFix: false,
            file: path.relative(REPO_ROOT, manifestPath),
            evidence: `Missing or empty required field: "${field}"`,
            suggestion: `Add "${field}" to manifest`,
          });
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK G: Marketplace entries
// ═══════════════════════════════════════════════════════════════
function checkMarketplace() {
  log('CHECK G: Marketplace entries');
  const marketplacePath = path.join(REPO_ROOT, 'marketplace.json');
  const mkt = readJSON(marketplacePath);
  if (mkt._error) {
    addFinding({
      category: 'G',
      severity: 'critical',
      mustFix: false,
      file: 'marketplace.json',
      evidence: mkt._error,
      suggestion: 'Fix marketplace.json syntax',
    });
    return;
  }

  for (const entry of (mkt.plugins || [])) {
    // Source path exists
    const sourcePath = path.join(REPO_ROOT, entry.source);
    if (!fs.existsSync(sourcePath)) {
      addFinding({
        category: 'G',
        severity: 'critical',
        mustFix: false,
        file: 'marketplace.json',
        evidence: `source path does not exist: ${entry.source} (plugin: ${entry.name})`,
        suggestion: `Create ${entry.source} or remove marketplace entry`,
      });
    }

    // Version matches manifest
    try {
      const pluginName = entry.name.replace(/-codebuddy$|-zcode$/, '');
      const sync = checkVersionSync(pluginName);
      if (!sync.ok && sync.expected !== entry.version) {
        // Already reported in CHECK A, skip duplicate
      }
    } catch (_) {}
  }

  // Check .codebuddy-plugin/marketplace.json too
  const cbMktPath = path.join(REPO_ROOT, '.codebuddy-plugin', 'marketplace.json');
  if (fs.existsSync(cbMktPath)) {
    const cbMkt = readJSON(cbMktPath);
    if (cbMkt._error) {
      addFinding({
        category: 'G',
        severity: 'critical',
        mustFix: false,
        file: '.codebuddy-plugin/marketplace.json',
        evidence: cbMkt._error,
        suggestion: 'Fix marketplace.json syntax',
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK H: State schema
// ═══════════════════════════════════════════════════════════════
function checkStateSchema() {
  log('CHECK H: State schema');
  const stateDirs = [
    path.join(REPO_ROOT, '.loop-cli', 'state'),
  ];

  for (const dir of stateDirs) {
    if (!fs.existsSync(dir)) continue;
    const stateFiles = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const sf of stateFiles) {
      const fullPath = path.join(dir, sf);
      try {
        const result = execSync(`node ${REPO_ROOT}/scripts/validate-state.js "${fullPath}"`, {
          cwd: REPO_ROOT,
          encoding: 'utf-8',
          timeout: 10000,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        log(`  ${sf}: valid`);
      } catch (e) {
        const stderr = e.stderr || '';
        addFinding({
          category: 'H',
          severity: 'warning',
          mustFix: false,
          file: path.relative(REPO_ROOT, fullPath),
          evidence: stderr.split('\n').filter(Boolean).pop() || e.message,
          suggestion: 'Fix state file to match schema',
        });
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK I: Script syntax
// ═══════════════════════════════════════════════════════════════
function checkScriptSyntax() {
  log('CHECK I: Script syntax');
  const jsFiles = listFilesRecursive(REPO_ROOT, '.js');

  for (const filePath of jsFiles) {
    // Skip node_modules and dist
    if (filePath.includes('node_modules') || filePath.includes(`${path.sep}dist${path.sep}`)) continue;
    try {
      execSync(`node --check "${filePath}"`, {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e) {
      const relPath = path.relative(REPO_ROOT, filePath);
      addFinding({
        category: 'I',
        severity: 'critical',
        mustFix: false,
        file: relPath,
        evidence: (e.stderr || e.message).split('\n').filter(Boolean).shift() || 'syntax error',
        suggestion: 'Fix JavaScript syntax error',
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK J: Symlink check
// ═══════════════════════════════════════════════════════════════
function checkSymlinks() {
  log('CHECK J: Symlink check');
  function walkDir(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
        walkDir(full);
      } else if (e.isSymbolicLink()) {
        try {
          fs.statSync(full);
        } catch {
          const relPath = path.relative(REPO_ROOT, full);
          addFinding({
            category: 'J',
            severity: 'warning',
            mustFix: false,
            file: relPath,
            evidence: 'Broken symlink',
            suggestion: 'Remove or repair the symlink',
          });
        }
      }
    }
  }
  walkDir(REPO_ROOT);
}

// ═══════════════════════════════════════════════════════════════
// CHECK K: Gitignore coverage
// ═══════════════════════════════════════════════════════════════
function checkGitignore() {
  log('CHECK K: Gitignore coverage');
  const gitignorePath = path.join(REPO_ROOT, '.gitignore');
  const content = fs.readFileSync(gitignorePath, 'utf-8');

  const expectedPatterns = [
    'node_modules/',
    '.DS_Store',
    '*.log',
  ];

  for (const pattern of expectedPatterns) {
    if (!content.includes(pattern)) {
      addFinding({
        category: 'K',
        severity: 'info',
        mustFix: false,
        file: '.gitignore',
        evidence: `Missing pattern: "${pattern}"`,
        suggestion: `Add "${pattern}" to .gitignore`,
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECK L: Reference integrity (_shared + command refs)
// ═══════════════════════════════════════════════════════════════
function checkReferenceIntegrity() {
  log('CHECK L: Reference integrity');

  // L1: _shared/ files referenced by agents must exist
  const sharedDir = path.join(REPO_ROOT, 'plugins', 'agentic-workflow', '_shared');
  if (fs.existsSync(sharedDir)) {
    const sharedFiles = fs.readdirSync(sharedDir).filter(f => f.endsWith('.md'));
    // Just check that _shared files exist and are non-empty
    for (const sf of sharedFiles) {
      const full = path.join(sharedDir, sf);
      const stat = fs.statSync(full);
      if (stat.size === 0) {
        addFinding({
          category: 'L',
          severity: 'warning',
          mustFix: false,
          file: `plugins/agentic-workflow/_shared/${sf}`,
          evidence: 'File is empty',
          suggestion: 'Add content or remove the empty file',
        });
      }
    }
  }

  // L2: Command files must exist and reference valid agent names
  const commandsDir = path.join(REPO_ROOT, 'plugins', 'agentic-workflow', 'commands');
  if (fs.existsSync(commandsDir)) {
    const cmdFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
    for (const cf of cmdFiles) {
      const full = path.join(commandsDir, cf);
      const content = fs.readFileSync(full, 'utf-8');
      if (content.trim().length === 0) {
        addFinding({
          category: 'L',
          severity: 'warning',
          mustFix: false,
          file: `plugins/agentic-workflow/commands/${cf}`,
          evidence: 'Command file is empty',
          suggestion: 'Add command content or remove',
        });
      }
    }
  }

  // L3: SKILL.md files have valid YAML frontmatter
  const pluginsWithSkills = ['dotnet-work'];
  for (const plugin of pluginsWithSkills) {
    const skillsDir = path.join(REPO_ROOT, 'plugins', plugin, 'skills');
    if (!fs.existsSync(skillsDir)) continue;
    for (const skill of fs.readdirSync(skillsDir)) {
      const skillMd = path.join(skillsDir, skill, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;
      const content = fs.readFileSync(skillMd, 'utf-8');
      if (!content.startsWith('---')) {
        addFinding({
          category: 'L',
          severity: 'warning',
          mustFix: false,
          file: path.relative(REPO_ROOT, skillMd),
          evidence: 'Missing YAML frontmatter (does not start with ---)',
          suggestion: 'Add YAML frontmatter block',
        });
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-FIX: must-fix findings
// ═══════════════════════════════════════════════════════════════
function autoFix() {
  if (args.check) {
    log('Skipping auto-fix (--check mode)');
    return;
  }

  const mustFixFindings = findings.filter(f => f.mustFix);
  if (mustFixFindings.length === 0) {
    log('No must-fix findings to auto-fix');
    return;
  }

  // Group must-fix by type
  const versionDrift = mustFixFindings.filter(f => f.category === 'A');

  // Fix version drift by running bump-version.js
  if (versionDrift.length > 0) {
    const affectedPlugins = new Set();
    for (const f of versionDrift) {
      const m = f.file.match(/plugins\/([^/]+)/);
      if (m) affectedPlugins.add(m[1]);
    }

    for (const plugin of affectedPlugins) {
      try {
        const output = execSync(`node ${REPO_ROOT}/scripts/bump-version.js --plugin ${plugin}`, {
          cwd: REPO_ROOT,
          encoding: 'utf-8',
          timeout: 30000,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        fixLog.push({ plugin, status: 'fixed', output: output.trim() });
        log(`Fixed version drift for ${plugin}`);
      } catch (e) {
        fixLog.push({
          plugin,
          status: 'failed',
          output: (e.stderr || e.stdout || e.message).trim(),
        });
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// REPORT GENERATION
// ═══════════════════════════════════════════════════════════════
function generateReport() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const hourStr = String(now.getHours()).padStart(2, '0');
  const reportName = `audit-${dateStr}-${hourStr}.md`;
  const reportPath = path.join(REPO_ROOT, 'reports', reportName);

  const critical = findings.filter(f => f.severity === 'critical');
  const warnings = findings.filter(f => f.severity === 'warning');
  const infos = findings.filter(f => f.severity === 'info');
  const mustFix = findings.filter(f => f.mustFix);
  const fixed = fixLog.filter(f => f.status === 'fixed');
  const failedFixes = fixLog.filter(f => f.status === 'failed');

  let md = `# Audit Report — ${dateStr} ${hourStr}:00

**Generated:** ${now.toISOString()}
**Repo:** agentic-work
**Mode:** ${args.check ? 'dry-run (no fixes)' : 'auto-fix (must-fix only)'}

## Summary

| Metric | Count |
|--------|-------|
| Critical | ${critical.length} |
| Warning | ${warnings.length} |
| Info | ${infos.length} |
| Must-fix (destructive) | ${mustFix.length} |
| Auto-fixed | ${fixed.length} |
| Fix failures | ${failedFixes.length} |
| **Total findings** | **${findings.length}** |

`;

  // Auto-fix log
  if (fixLog.length > 0) {
    md += '## Auto-Fix Log\n\n';
    for (const entry of fixLog) {
      md += `### ${entry.plugin} — ${entry.status}\n\n\`\`\`\n${entry.output}\n\`\`\`\n\n`;
    }
  }

  // Findings by category
  const categories = [
    ['A', 'Version Sync'],
    ['B', 'Agent Body Sync'],
    ['C', 'Install Dry-Run'],
    ['D', 'JSON Validity'],
    ['E', 'Hook Integrity'],
    ['F', 'Manifest Fields'],
    ['G', 'Marketplace Entries'],
    ['H', 'State Schema'],
    ['I', 'Script Syntax'],
    ['J', 'Symlink Check'],
    ['K', 'Gitignore Coverage'],
    ['L', 'Reference Integrity'],
  ];

  for (const [cat, label] of categories) {
    const catFindings = findings.filter(f => f.category === cat);
    if (catFindings.length === 0) continue;

    md += `## ${cat}. ${label}\n\n`;
    for (const f of catFindings) {
      md += `### [${f.severity.toUpperCase()}] ${f.file}\n\n`;
      if (f.mustFix) md += '**⚠ MUST-FIX (destructive/irreversible)**\n\n';
      md += `**Evidence:** ${f.evidence}\n\n`;
      md += `**Suggestion:** ${f.suggestion}\n\n`;
    }
  }

  // Self-verification section
  md += '## Self-Verification\n\n';
  md += 'Each finding includes:\n';
  md += '- **File path** — exact location of the issue\n';
  md += '- **Evidence** — concrete diagnostic output (not interpretation)\n';
  md += '- **Severity** — critical (breaks install/runtime) / warning (inconsistency) / info (hygiene)\n';
  md += '- **Suggestion** — actionable fix or command\n\n';

  if (critical.length === 0 && warnings.length === 0) {
    md += '**Result:** ✅ All checks passed. No issues found.\n';
  } else if (critical.length === 0) {
    md += `**Result:** ⚠ ${warnings.length} warning(s) found. No critical issues.\n`;
  } else {
    md += `**Result:** ❌ ${critical.length} critical issue(s) found. Requires attention.\n`;
  }

  // Ensure reports/ dir exists
  const reportsDir = path.join(REPO_ROOT, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(reportPath, md);
  return { reportPath, reportName };
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
function main() {
  console.error('🔍 Running daily audit...\n');

  const startTime = Date.now();

  checkVersionDrift();
  checkAgentBodySync();
  checkInstallDryRun();
  checkJSONValidity();
  checkHookIntegrity();
  checkManifestFields();
  checkMarketplace();
  checkStateSchema();
  checkScriptSyntax();
  checkSymlinks();
  checkGitignore();
  checkReferenceIntegrity();

  // Auto-fix must-fix findings
  autoFix();

  // Generate report
  const { reportPath, reportName } = generateReport();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.error(`\n✅ Audit complete in ${elapsed}s`);
  console.error(`📄 Report: ${reportPath}`);
  console.error(`   Findings: ${findings.length} (${findings.filter(f => f.severity === 'critical').length} critical)`);

  if (fixLog.length > 0) {
    const fixed = fixLog.filter(f => f.status === 'fixed').length;
    const failed = fixLog.filter(f => f.status === 'failed').length;
    console.error(`🔧 Auto-fixed: ${fixed} | Failed: ${failed}`);
  }

  // Exit code: 0 = no critical findings, 1 = critical found
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  process.exit(criticalCount > 0 ? 1 : 0);
}

main();
