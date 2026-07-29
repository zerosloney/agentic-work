#!/usr/bin/env node
'use strict';
// verify-agent-sync.js — Cross-platform agent body consistency check.
//
// Each agent ships as per-platform copies under <plugin>/<platform>/agents/.
// Frontmatter differs per platform; bodies MUST be identical. This strips
// frontmatter + platform sync comments and compares the normalized body hash
// against the ZCode baseline (single source of truth). Exits non-zero on drift.
//
// Usage:
//   node scripts/verify-agent-sync.js                # check all plugins
//   node scripts/verify-agent-sync.js --plugin graph-workflow
//   node scripts/verify-agent-sync.js --fix          # overwrite non-zcode bodies from zcode baseline
//
// Exit 0 = all in sync, 1 = drift found, 2 = usage error.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.join(__dirname, '..');
const PLUGINS = ['dotnet-work', 'agentic-workflow', 'skill-radar', 'graph-workflow'];
// Platforms with an agents/ subtree. skill-radar has no agents (hooks-only).
const PLATFORMS = ['zcode', 'codebuddy', 'trae', 'qoder', 'qwencode'];
const BASELINE = 'zcode'; // single source of truth for body

function parseArgs(argv) {
  const args = { plugin: null, fix: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --plugin requires a value');
        process.exit(2);
      }
      if (!PLUGINS.includes(next)) {
        console.error(`Error: unknown plugin '${next}'. Available: ${PLUGINS.join(', ')}`);
        process.exit(2);
      }
      args.plugin = next;
      i++;
    } else if (argv[i] === '--fix') {
      args.fix = true;
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/verify-agent-sync.js [--plugin <name>] [--fix]');
      process.exit(0);
    } else {
      console.error(`Error: unknown argument '${argv[i]}'`);
      process.exit(2);
    }
  }
  return args;
}

// Strip frontmatter + comment decorations to isolate the comparable body.
//
// File shapes vary per platform (zcode is the baseline, others prepend notes):
//   zcode:    <frontmatter> <body>
//   codebuddy: <!-- sync --> <!-- adaptation note --> <frontmatter> <body>
//   trae/qoder/qwencode: <!-- sync --> <frontmatter> [<!-- note -->] <body>
//
// Strategy: walk leading tokens, discarding blank lines, HTML comment blocks,
// and one frontmatter block, until the first real content line remains.
function normalizeBody(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  let frontmatterSeen = false;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    if (line.trim().startsWith('<!--')) {
      // consume until closing -->
      while (i < lines.length && !lines[i].includes('-->')) i++;
      i++; // skip the line containing -->
      continue;
    }
    if (line === '---' && !frontmatterSeen) {
      let end = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j] === '---') { end = j; break; }
      }
      if (end === -1) break; // unterminated frontmatter, stop stripping
      i = end + 1;
      frontmatterSeen = true;
      continue;
    }
    break; // first real content line
  }
  let text = lines.slice(i).join('\n');
  return text
    .split('\n')
    .map(l => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '') + '\n';
}

function hashBody(normalized) {
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

// Collect agent files per platform for a plugin. Returns Map<agentName, Map<platform, filepath>>.
function collectAgents(plugin) {
  const byAgent = new Map();
  const pluginDir = path.join(REPO_ROOT, 'plugins', plugin);
  for (const plat of PLATFORMS) {
    const agentsDir = path.join(pluginDir, plat, 'agents');
    if (!fs.existsSync(agentsDir)) continue;
    for (const entry of fs.readdirSync(agentsDir)) {
      if (!entry.endsWith('.md')) continue;
      const name = entry.replace(/\.md$/, '');
      if (!byAgent.has(name)) byAgent.set(name, new Map());
      byAgent.get(name).set(plat, path.join(agentsDir, entry));
    }
  }
  return byAgent;
}

function checkPlugin(plugin, fix) {
  const byAgent = collectAgents(plugin);
  if (byAgent.size === 0) return { checked: 0, drifts: [], fixed: 0 };

  const drifts = [];
  let fixed = 0;
  let checked = 0;

  for (const [agent, platformFiles] of byAgent) {
    const baselinePath = platformFiles.get(BASELINE);
    if (!baselinePath) {
      drifts.push({ agent, platform: '(none)', msg: `no ${BASELINE} baseline` });
      continue;
    }
    const baselineBody = normalizeBody(fs.readFileSync(baselinePath, 'utf-8'));
    const baselineHash = hashBody(baselineBody);
    checked++;

    for (const [plat, file] of platformFiles) {
      if (plat === BASELINE) continue;
      const raw = fs.readFileSync(file, 'utf-8');
      const body = normalizeBody(raw);
      const hash = hashBody(body);
      if (hash !== baselineHash) {
        drifts.push({ agent, platform: plat, file, baselineHash, hash });
        if (fix) {
          // Reconstruct: preserve this platform's frontmatter + sync comment, replace body.
          const fixedContent = rebuildWithBaselineFrontmatter(file, raw, baselineBody);
          if (fixedContent !== null) {
            fs.writeFileSync(file, fixedContent);
            fixed++;
          }
        }
      }
    }
  }
  return { checked, drifts, fixed };
}

// On --fix, keep the platform file's leading comments + its own frontmatter, then append the zcode body.
// Layout: [<!-- sync -->] [<!-- adaptation note -->] ---frontmatter--- <body>
function rebuildWithBaselineFrontmatter(file, raw, baselineBody) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const isFmDelim = (l) => l === '---';
  // Walk leading comments + blanks, find the frontmatter opening `---`.
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    if (line.trim().startsWith('<!--')) {
      while (i < lines.length && !lines[i].includes('-->')) i++;
      i++; // skip line with -->
      continue;
    }
    break;
  }
  if (!isFmDelim(lines[i])) return null; // no frontmatter found, skip
  // find the closing `---`
  let end = -1;
  for (let j = i + 1; j < lines.length; j++) {
    if (isFmDelim(lines[j])) { end = j; break; }
  }
  if (end === -1) return null; // unterminated frontmatter, skip
  const header = lines.slice(0, end + 1).join('\n');
  return header + '\n\n' + baselineBody;
}

function main() {
  const args = parseArgs(process.argv);
  const targets = args.plugin ? [args.plugin] : PLUGINS;
  let totalDrifts = 0;
  let totalFixed = 0;

  for (const plugin of targets) {
    const { checked, drifts, fixed } = checkPlugin(plugin, args.fix);
    totalDrifts += drifts.length;
    totalFixed += fixed;

    if (drifts.length === 0) {
      if (checked > 0) {
        console.log(`📦 ${plugin}   ✅ ${checked} agent(s) body in sync`);
      } else {
        console.log(`📦 ${plugin}   – no agents (hooks-only plugin)`);
      }
    } else {
      console.log(`📦 ${plugin}   ⚠️  ${drifts.length} drift(s):`);
      for (const d of drifts) {
        const rel = d.file ? path.relative(REPO_ROOT, d.file) : '';
        console.log(`   ${d.agent} [${d.platform}]  ${rel}`);
        if (d.baselineHash) {
          console.log(`      zcode=${d.baselineHash}  ${d.platform}=${d.hash}`);
        } else {
          console.log(`      ${d.msg}`);
        }
      }
    }
  }

  if (totalDrifts === 0) {
    console.log('\n✅ All agent bodies in sync.');
    process.exit(0);
  }
  if (args.fix && totalFixed > 0) {
    console.log(`\n🔧 Fixed ${totalFixed} file(s) from ${BASELINE} baseline. Re-run without --fix to confirm.`);
    process.exit(totalDrifts - totalFixed > 0 ? 1 : 0);
  }
  console.error('\n❌ Agent body drift detected. Edit the zcode baseline, then run with --fix.');
  process.exit(1);
}

main();
