#!/usr/bin/env node
'use strict';
// generate-platform-agents.js — Declarative platform adapter for agent frontmatter.
//
// ZCode agents (plugins/<name>/zcode/agents/*.md) are the baseline. This script
// derives each agent's permission PROFILE from its ZCode nested `permission:`
// block and generates the four other platforms' frontmatter from declarative
// templates — replacing manual maintenance of five frontmatter copies.
//
// Profiles (derived from ZCode permission block):
//   editor       — edit: allow
//   orchestrator — edit: deny + task allow-list (non-"*" entries)
//   reviewer     — edit: deny, no usable task grants
//
// Platform mappings:
//   codebuddy/qoder — flat permissionMode (acceptEdits|default) + tools CSV
//   trae            — nested permission (same as ZCode) + platform: trae
//   qwencode        — approvalMode (auto-edit|default) + tools allow-list
//
// Usage:
//   node scripts/generate-platform-agents.js --check                 # drift check, all plugins
//   node scripts/generate-platform-agents.js --write                 # regenerate non-zcode files
//   node scripts/generate-platform-agents.js --plugin graph-workflow --check
//
// Drift policy: name/description are preserved from each platform's existing
// file when present (platforms may customize wording); permission-bearing
// fields (permissionMode/approvalMode/tools/platform) MUST match the derived
// profile exactly. Body sync is verify-agent-sync.js's job, not this script's.
//
// Exit codes: 0 = in sync / written, 1 = drift detected (--check), 2 = usage error.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PLUGINS_DIR = path.join(ROOT, 'plugins');
const PLATFORMS = ['codebuddy', 'trae', 'qoder', 'qwencode'];

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

// Frontmatter may be preceded by HTML sync comments (non-zcode platform files).
const FM_RE = /^(?:\s*<!--[\s\S]*?-->\s*)*---\r?\n([\s\S]*?)\r?\n---\r?\n/;

// Extract an indented block under `key:` at ANY nesting depth: finds the first
// line whose trimmed content is exactly `key:`, then collects following lines
// with deeper indentation. Returns { map, block } — map for simple k:v children,
// block for the verbatim text.
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
    // direct children only (one level deeper) for the flat map
    const kv = l.trim().match(/^"([^"]+)":\s*(.+)$/) || l.trim().match(/^([^:]+):\s*(.+)$/);
    if (kv) map[kv[1].trim()] = unquote(kv[2].trim());
  }
  return { map, block: blockLines.join('\n') };
}

function parseFrontmatter(content) {
  const m = content.match(FM_RE);
  if (!m) return null;
  const lines = m[1].split(/\r?\n/);
  const root = {};
  // Stack of {indent, container} for nested maps/lists.
  const stack = [{ indent: -1, container: root }];
  let lastKey = null;

  for (const raw of lines) {
    if (raw.trim() === '') continue;
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].container;

    if (line.startsWith('- ')) {
      if (!Array.isArray(parent)) continue; // defensive: list under non-list
      parent.push(unquote(line.slice(2).trim()));
      continue;
    }

    const kv = line.match(/^([^:]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1].trim();
    const value = kv[2].trim();

    if (value === '') {
      // Look ahead impossible here; decide container type on first child.
      // We use a placeholder object and convert to array if a '- ' item arrives.
      const container = {};
      parent[key] = container;
      stack.push({ indent, container });
      lastKey = key;
    } else {
      parent[key] = unquote(value);
      lastKey = key;
    }
  }

  // Post-pass: convert placeholder objects that received '- ' items.
  // (Handled implicitly: our parser pushes into the container only if it's an
  // array; so instead convert on write — see listChildren hack below.)
  return { data: root, body: content.slice(m[0].length), raw: m[1] };
}

function unquote(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

// YAML lists under a key (any indent) → string[].
function extractList(raw, key) {
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `${key}:`);
  if (start === -1) return null;
  const baseIndent = lines[start].length - lines[start].trimStart().length;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === '') continue;
    const indent = l.length - l.trimStart().length;
    if (indent <= baseIndent) break;
    if (l.trim().startsWith('- ')) out.push(unquote(l.trim().slice(2).trim()));
  }
  return out.length ? out : null;
}

// ─── profile derivation ─────────────────────────────────────────

function deriveProfile(zcodeRaw) {
  const perm = extractIndented(zcodeRaw, 'permission');
  if (!perm) throw new Error('no permission block in zcode frontmatter');
  if (perm.map.edit === 'allow') return 'editor';
  // edit: deny — look at task grants (task: is nested inside permission:)
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
  const descLine = platform === 'codebuddy' || platform === 'qoder'
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
    // Trae = ZCode nested permission + platform marker. Reuse the ZCode block verbatim.
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
  return `<!-- sync: 与 zcode/agents/${agentFile} 保持同步，仅 frontmatter 不同 -->\n<!--\n  ${label}\n  本文件由 scripts/generate-platform-agents.js 生成/校验。修改请改 zcode baseline 后跑 --write。\n-->\n`;
}

// ─── drift extraction: permission-bearing fields of an existing file ───

function extractPermissionFingerprint(platform, content) {
  const fm = content.match(FM_RE);
  if (!fm) return null;
  const raw = fm[1];
  if (platform === 'codebuddy' || platform === 'qoder') {
    const pm = raw.match(/^permissionMode:\s*(.+)$/m);
    const tools = raw.match(/^tools:\s*(.+)$/m);
    return {
      permissionMode: pm ? pm[1].trim() : null,
      tools: tools ? tools[1].trim() : null,
    };
  }
  if (platform === 'qwencode') {
    const am = raw.match(/^approvalMode:\s*(.+)$/m);
    const tools = extractList(raw, 'tools') || [];
    return { approvalMode: am ? am[1].trim() : null, tools };
  }
  if (platform === 'trae') {
    const plat = raw.match(/^platform:\s*(.+)$/m);
    const perm = extractIndented(raw, 'permission');
    return { platform: plat ? plat[1].trim() : null, permBlock: perm ? normalizeWs(perm.block) : null };
  }
  return null;
}

function expectedFingerprint(platform, profile, zcodeRaw) {
  const t = PROFILE_TEMPLATES[profile];
  if (platform === 'codebuddy' || platform === 'qoder') {
    return { permissionMode: t.permissionMode, tools: t.codebuddyTools };
  }
  if (platform === 'qwencode') {
    return { approvalMode: t.approvalMode, tools: t.qwenTools };
  }
  if (platform === 'trae') {
    const perm = extractIndented(zcodeRaw, 'permission');
    return { platform: 'trae', permBlock: perm ? normalizeWs(perm.block) : null };
  }
  return null;
}

function normalizeWs(s) {
  return s.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim() !== '').join('\n');
}

function fingerprintMatches(platform, actual, expected) {
  if (!actual) return false;
  if (platform === 'qwencode') {
    return actual.approvalMode === expected.approvalMode
      && JSON.stringify(actual.tools) === JSON.stringify(expected.tools);
  }
  if (platform === 'trae') {
    return actual.platform === expected.platform && actual.permBlock === expected.permBlock;
  }
  return actual.permissionMode === expected.permissionMode && actual.tools === expected.tools;
}

// ─── main ───────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { plugin: null, check: false, write: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--plugin') args.plugin = argv[++i];
    else if (a === '--check') args.check = true;
    else if (a === '--write') args.write = true;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/generate-platform-agents.js [--plugin <name>] (--check | --write)');
      process.exit(0);
    }
  }
  if (!args.check && !args.write) {
    console.error('Error: one of --check or --write is required');
    process.exit(2);
  }
  return args;
}

function processPlugin(pluginName, args) {
  const zcodeDir = path.join(PLUGINS_DIR, pluginName, 'zcode', 'agents');
  if (!fs.existsSync(zcodeDir)) {
    console.log(`📦 ${pluginName} — no zcode/agents, skipped`);
    return { drift: 0, files: 0 };
  }
  let drift = 0;
  let files = 0;

  for (const f of fs.readdirSync(zcodeDir).filter((x) => x.endsWith('.md'))) {
    files++;
    const zcodeContent = fs.readFileSync(path.join(zcodeDir, f), 'utf-8');
    const parsed = parseFrontmatter(zcodeContent);
    if (!parsed) {
      console.error(`  ❌ ${pluginName}/zcode/${f}: no frontmatter`);
      drift++;
      continue;
    }
    const name = parsed.data.name;
    const description = parsed.data.description || '';
    let profile;
    try {
      profile = deriveProfile(parsed.raw);
    } catch (e) {
      console.error(`  ❌ ${pluginName}/zcode/${f}: ${e.message}`);
      drift++;
      continue;
    }

    for (const platform of PLATFORMS) {
      const target = path.join(PLUGINS_DIR, pluginName, platform, 'agents', f);
      const expected = expectedFingerprint(platform, profile, parsed.raw);

      if (!fs.existsSync(target)) {
        if (args.check) {
          console.error(`  ❌ ${pluginName}/${platform}/${f}: missing (profile: ${profile})`);
          drift++;
          continue;
        }
        // --write: create with platform-specific description defaulting to zcode's
        const fm = buildFrontmatter(platform, profile, name, description, parsed.raw);
        const out = syncComment(platform, f) + fm + '\n\n' + parsed.body.replace(/^\s+/, '');
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, out);
        console.log(`  ✨ ${pluginName}/${platform}/${f}: created (profile: ${profile})`);
        continue;
      }

      const existing = fs.readFileSync(target, 'utf-8');
      const actual = extractPermissionFingerprint(platform, existing);
      if (!fingerprintMatches(platform, actual, expected)) {
        if (args.check) {
          console.error(`  ❌ ${pluginName}/${platform}/${f}: permission drift (profile: ${profile})`);
          console.error(`     expected: ${JSON.stringify(expected)}`);
          console.error(`     actual:   ${JSON.stringify(actual)}`);
          drift++;
          continue;
        }
      }
      if (args.write) {
        // Regenerate: preserve existing description when present.
        // Body ALWAYS comes from the zcode baseline — never from the platform
        // file, which may be corrupted (e.g. double frontmatter) or drifted.
        const existingFm = existing.match(FM_RE);
        const existingDesc = existingFm ? (existingFm[1].match(/^description:\s*"?([^"\n]+)"?\s*$/m) || [])[1] : null;
        const fm = buildFrontmatter(platform, profile, name, (existingDesc || description).trim(), parsed.raw);
        const out = syncComment(platform, f) + fm + '\n\n' + parsed.body.replace(/^\s+/, '');
        fs.writeFileSync(target, out);
        console.log(`  ♻️  ${pluginName}/${platform}/${f}: regenerated (profile: ${profile})`);
      }
    }
    console.log(`  ✅ ${pluginName}/zcode/${f} → profile: ${profile}`);
  }
  return { drift, files };
}

function main() {
  const args = parseArgs(process.argv);
  let pluginNames = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name);
  if (args.plugin) {
    if (!pluginNames.includes(args.plugin)) {
      console.error(`Unknown plugin: ${args.plugin}. Available: ${pluginNames.join(', ')}`);
      process.exit(2);
    }
    pluginNames = [args.plugin];
  }

  let totalDrift = 0;
  let totalFiles = 0;
  for (const name of pluginNames) {
    const r = processPlugin(name, args);
    totalDrift += r.drift;
    totalFiles += r.files;
  }

  console.log(`\n${'='.repeat(50)}`);
  if (args.check) {
    console.log(`Checked ${totalFiles} zcode agent(s) × ${PLATFORMS.length} platforms. Drift: ${totalDrift}.`);
    if (totalDrift > 0) {
      console.error('❌ Platform frontmatter drift detected — run with --write to regenerate');
      process.exit(1);
    }
    console.log('✅ All platform frontmatter in sync with derived profiles');
  } else {
    console.log(`Processed ${totalFiles} zcode agent(s). Drift remaining: ${totalDrift}.`);
  }
}

main();
