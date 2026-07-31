'use strict';
// lib/derive-platform.js — Install-time agent frontmatter derivation.
//
// Source layout (post-flatten): plugins/<name>/agents/*.md holds a SINGLE
// baseline copy with ZCode-style nested `permission:` frontmatter. Per-platform
// agents/ subdirs no longer exist in the source repo.
//
// At install time each install-<platform>.js calls deriveAgents() to transform
// that baseline into the target platform's frontmatter (codebuddy/qoder flat
// permissionMode, qwencode approvalMode+tools, trae nested+platform marker).
// ZCode is a no-op (baseline IS the ZCode form). Logic lifted verbatim from the
// removed scripts/generate-platform-agents.js so derived output stays identical.
//
// Manifests stay static (5 hand-maintained copies) — only agent frontmatter is
// derived, because maintaining 5 frontmatter copies per agent (55 files) was the
// actual redundancy.
//
// Public API:
//   deriveAgents(srcAgentsDir, platform, destAgentsDir, { dryRun })
//   deriveAgentFile(srcFile, platform)  → { out, profile } string (for unit check)

const fs = require('fs');
const path = require('path');

const DERIVE_PLATFORMS = ['codebuddy', 'trae', 'qoder', 'qwencode'];

// ─── declarative platform templates per profile ─────────────────

const PROFILE_TEMPLATES = {
  editor: {
    permissionMode: 'acceptEdits',
    approvalMode: 'auto-edit',
    codebuddyTools: 'Bash, Read, Glob, Grep, Edit, Write',
    qwenTools: ['read_file', 'read_many_files', 'write_file', 'edit', 'glob', 'grep_search', 'list_directory', 'run_shell_command', 'web_fetch', 'web_search'],
  },
  orchestrator: {
    permissionMode: 'default',
    approvalMode: 'default',
    codebuddyTools: 'Bash, Read, Glob, Grep',
    qwenTools: ['read_file', 'read_many_files', 'glob', 'grep_search', 'list_directory', 'run_shell_command', 'task'],
  },
  reviewer: {
    permissionMode: 'default',
    approvalMode: 'default',
    codebuddyTools: 'Bash, Read, Glob, Grep',
    qwenTools: ['read_file', 'read_many_files', 'glob', 'grep_search', 'list_directory', 'run_shell_command'],
  },
};

// ─── mini frontmatter parser (repo subset of YAML) ──────────────

// Baseline (zcode) files have no leading HTML comments.
const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;

// Extract an indented block under `key:` at ANY nesting depth.
function extractIndented(raw, key) {
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `${key}:`);
  if (start === -1) return null;
  const baseIndent = lines[start].length - lines[start].trimStart().length;
  const blockLines = [lines[start]];
  const map = {};
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === '') continue;
    const indent = l.length - l.trimStart().length;
    if (indent <= baseIndent) break;
    blockLines.push(l);
    const kv = l.trim().match(/^"([^"]+)":\s*(.+)$/) || l.trim().match(/^([^:]+):\s*(.+)$/);
    if (kv) map[kv[1].trim()] = unquote(kv[2].trim());
  }
  return { map, block: blockLines.join('\n') };
}

function unquote(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseFrontmatter(content) {
  const m = content.match(FM_RE);
  if (!m) return null;
  return { raw: m[1], body: content.slice(m[0].length) };
}

// ─── profile derivation ─────────────────────────────────────────

function deriveProfile(zcodeRaw) {
  const perm = extractIndented(zcodeRaw, 'permission');
  if (!perm) throw new Error('no permission block in zcode frontmatter');
  if (perm.map.edit === 'allow') return 'editor';
  const task = extractIndented(zcodeRaw, 'task');
  if (task) {
    const hasGrant = Object.entries(task.map).some(([k, v]) => k !== '*' && v === 'allow');
    if (hasGrant) return 'orchestrator';
  }
  return 'reviewer';
}

// ─── frontmatter builders ───────────────────────────────────────

function buildFrontmatter(platform, profile, name, description, zcodeRaw) {
  const t = PROFILE_TEMPLATES[profile];
  const descLine = (platform === 'codebuddy' || platform === 'qoder')
    ? `description: "${description.replace(/"/g, '\\"')}"`
    : `description: ${description}`;

  if (platform === 'codebuddy' || platform === 'qoder') {
    return [
      '---',
      `name: ${name}`,
      descLine,
      `tools: ${t.codebuddyTools}`,
      `permissionMode: ${t.permissionMode}`,
      '---',
    ].join('\n');
  }
  if (platform === 'qwencode') {
    const toolsYaml = t.qwenTools.map((x) => `  - ${x}`).join('\n');
    return [
      '---',
      `name: ${name}`,
      `description: "${description.replace(/"/g, '\\"')}"`,
      'model: inherit',
      `approvalMode: ${t.approvalMode}`,
      'tools:',
      toolsYaml,
      '---',
    ].join('\n');
  }
  if (platform === 'trae') {
    const perm = extractIndented(zcodeRaw, 'permission');
    return [
      '---',
      `name: ${name}`,
      'platform: trae',
      `description: ${description}`,
      perm ? perm.block : 'permission: {}',
      '---',
    ].join('\n');
  }
  throw new Error(`unknown platform: ${platform}`);
}

function syncComment(platform, agentFile) {
  const label = {
    codebuddy: 'CodeBuddy 适配版。frontmatter 已转换为 CodeBuddy 兼容字段（permissionMode 单值）。',
    qoder: 'Qoder 适配版。frontmatter 已转换为 Qoder 兼容字段（permissionMode 单值）。',
    qwencode: 'Qwen Code 适配版。frontmatter 已转换为 Qwen Code 兼容字段（approvalMode + tools 列表）。',
    trae: 'Trae 适配版。frontmatter = ZCode 嵌套 permission + platform: trae 标记。',
  }[platform];
  return `<!-- sync: baseline agents/${agentFile} 派生，仅 frontmatter 不同（安装时由 derive-platform.js 生成） -->\n<!--\n  ${label}\n-->\n`;
}

// ─── mini frontmatter field reader (for name/description) ───────

function readField(raw, key) {
  const m = raw.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? unquote(m[1].trim()) : '';
}

// ─── public API ─────────────────────────────────────────────────

/**
 * Derive one agent file's content for a target platform.
 * @param {string} srcFile   absolute path to baseline (zcode) agent .md
 * @param {string} platform  codebuddy | trae | qoder | qwencode
 * @returns {{ out: string, profile: string }}
 */
function deriveAgentFile(srcFile, platform) {
  if (!DERIVE_PLATFORMS.includes(platform)) {
    throw new Error(`derive-platform: platform must be one of ${DERIVE_PLATFORMS.join(', ')} (got: ${platform})`);
  }
  const content = fs.readFileSync(srcFile, 'utf-8');
  const parsed = parseFrontmatter(content);
  if (!parsed) throw new Error(`no frontmatter in baseline: ${srcFile}`);
  const name = readField(parsed.raw, 'name');
  const description = readField(parsed.raw, 'description');
  const profile = deriveProfile(parsed.raw);
  const fm = buildFrontmatter(platform, profile, name, description, parsed.raw);
  const agentFile = path.basename(srcFile);
  const out = syncComment(platform, agentFile) + fm + '\n\n' + parsed.body.replace(/^\s+/, '');
  return { out, profile };
}

/**
 * Derive all baseline agents in srcAgentsDir into destAgentsDir for platform.
 * ZCode is the baseline → copy as-is (no derivation). Other platforms derive.
 *
 * @param {string} srcAgentsDir   plugins/<name>/agents (baseline)
 * @param {string} platform       zcode | codebuddy | trae | qoder | qwencode
 * @param {string} destAgentsDir  install dest agents/
 * @param {object} [opts] { dryRun: boolean }
 * @returns {number} files written/would-write
 */
function deriveAgents(srcAgentsDir, platform, destAgentsDir, opts = {}) {
  const dryRun = !!opts.dryRun;
  if (!fs.existsSync(srcAgentsDir)) return 0;
  const files = fs.readdirSync(srcAgentsDir).filter((f) => f.endsWith('.md'));
  if (!files.length) return 0;

  if (!dryRun) fs.mkdirSync(destAgentsDir, { recursive: true });
  let count = 0;
  for (const f of files) {
    const srcFile = path.join(srcAgentsDir, f);
    const dstFile = path.join(destAgentsDir, f);
    if (platform === 'zcode') {
      // baseline IS zcode — straight copy
      if (!dryRun) fs.copyFileSync(srcFile, dstFile);
      count++;
    } else {
      const { out, profile } = deriveAgentFile(srcFile, platform);
      if (!dryRun) fs.writeFileSync(dstFile, out);
      count++;
      if (dryRun) console.log(`    derive: ${f} (${platform}/${profile})`);
    }
  }
  return count;
}

module.exports = {
  DERIVE_PLATFORMS,
  PROFILE_TEMPLATES,
  deriveProfile,
  deriveAgentFile,
  deriveAgents,
};
