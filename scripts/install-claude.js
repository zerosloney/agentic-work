#!/usr/bin/env node
'use strict';
// install-claude.js — Install agentic-work plugins for Claude Code
//
// Usage:
//   node scripts/install-claude.js                  # install all
//   node scripts/install-claude.js --plugin skill-radar
//   node scripts/install-claude.js --uninstall
//   node scripts/install-claude.js --dry-run
//
// Claude Code loads plugins from ~/.claude/plugins/<name>/ and references
// agents/, commands/, skills/ subdirectories. Manifest is read from
// .claude-plugin/plugin.json at the plugin root.
//
// Notes on platform parity:
//   - The Claude Code hook protocol is the same shape as ZCode: a top-level
//     "hooks" object with one entry per event, each entry an array of
//     { matcher, hooks: [{ type: "command", command, timeout }] }. The
//     command string may reference ${CLAUDE_PLUGIN_ROOT} (the only ${...}
//     variable the host actually substitutes).
//   - Unlike the other 5 platforms, skill-radar's Claude Code source lives
//     at hooks/hooks.json (root of hooks/) rather than hooks/claude/hooks.json.
//     Rationale: the .claude-plugin/plugin.json references ./hooks/hooks.json
//     directly, and the file's contents are already in Claude format. AGENTS.md
//     calls this out as the documented exception to the "hooks/<platform>/"
//     source-layout invariant.
//   - Hook scripts output `{}` (flat), which Claude Code accepts. CodeBuddy
//     is the only platform that requires hookSpecificOutput, and that path
//     is preserved here.

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');
const { getPluginVersion } = require('./lib/plugin-version');

const PLUGIN_DIR = joinHome('.claude', 'plugins');
const PLUGINS = ['dotnet-work', 'agentic-workflow', 'graph-workflow', 'skill-radar'];

function parseArgs(argv) {
  const args = { plugin: null, uninstall: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --plugin requires a value (e.g. skill-radar)');
        process.exit(2);
      }
      args.plugin = next;
      i++;
    } else if (argv[i] === '--uninstall') args.uninstall = true;
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

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// Copy hooks for Claude Code: shared *.js + the single root hooks/hooks.json
// (the documented exception to the per-platform subdir layout — see AGENTS.md).
// The manifest declares "hooks": "./hooks/hooks.json", and the source file
// is already in Claude format, so we copy it as-is.
function copyHooksClaude(pluginRoot, dest, dryRun) {
  const hooksSrc = path.join(pluginRoot, 'hooks');
  if (!fs.existsSync(hooksSrc)) return;
  const claudeConfig = path.join(hooksSrc, 'hooks.json');
  if (!fs.existsSync(claudeConfig)) return;
  const hooksDest = path.join(dest, 'hooks');
  // Top-level *.js scripts are shared across platforms; we ship only the ones
  // the Claude config references (matches the qwencode/trae/qoder pattern).
  const scripts = fs.readdirSync(hooksSrc).filter((f) => f.endsWith('.js'));
  if (!dryRun) {
    fs.mkdirSync(hooksDest, { recursive: true });
    for (const f of scripts) fs.copyFileSync(path.join(hooksSrc, f), path.join(hooksDest, f));
    fs.copyFileSync(claudeConfig, path.join(hooksDest, 'hooks.json'));
    console.log(`  ${dryRun ? 'would copy' : 'copied'}: hooks/ (${scripts.length} scripts + hooks.json)`);
  } else {
    console.log(`  would copy: ${scripts.length} hook scripts + hooks/hooks.json → hooks/hooks.json`);
  }
}

function installPlugin(pluginName, args) {
  const manifestPath = path.join(
    __dirname, '..', 'plugins', pluginName, '.claude-plugin', 'plugin.json'
  );
  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: Claude Code manifest not found: ${manifestPath}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const installName = manifest.name;
  const destDir = path.join(PLUGIN_DIR, installName);
  const src = path.join(__dirname, '..', 'plugins', pluginName);

  console.log(`\n→ Installing ${installName}`);
  if (!fs.existsSync(src)) {
    console.error(`Error: source not found: ${src}`);
    process.exit(1);
  }

  // 1. Wipe (idempotent)
  if (fs.existsSync(destDir)) {
    if (!args.dryRun) removeDir(destDir);
    console.log(`  ${args.dryRun ? 'would wipe' : 'wiped'}: ${destDir}`);
  }

  // 2. Copy manifest
  if (!args.dryRun) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(manifestPath, path.join(destDir, '.claude-plugin', 'plugin.json'));
    console.log('  copied: .claude-plugin/plugin.json');
  } else {
    console.log(`  would copy: ${manifestPath} → ${path.join(destDir, '.claude-plugin', 'plugin.json')}`);
  }

  // 3. Copy agents (Claude expects agents/ directory; the platform reads the
  //    nested permission: block from each agent's frontmatter, which is what
  //    the ZCode baseline already emits — so we copy baseline as-is. No
  //    per-platform derivation needed; if a future frontmatter change breaks
  //    this, add a 'claude' profile in scripts/lib/derive-platform.js.)
  const agentsSrc = path.join(src, 'agents');
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(destDir, 'agents');
    if (!args.dryRun) {
      copyDirRecursive(agentsSrc, agentsDest);
      console.log('  copied: agents/ (zcode baseline, claude reads nested permission: as-is)');
    } else {
      console.log(`  would copy: ${agentsSrc} → ${agentsDest}`);
    }
  }

  // 4. Copy commands
  const commandsSrc = path.join(src, 'commands');
  if (fs.existsSync(commandsSrc)) {
    const commandsDest = path.join(destDir, 'commands');
    if (!args.dryRun) {
      copyDirRecursive(commandsSrc, commandsDest);
      console.log('  copied: commands/');
    } else {
      console.log(`  would copy: ${commandsSrc} → ${commandsDest}`);
    }
  }

  // 5. Copy skills
  const skillsSrc = path.join(src, 'skills');
  if (fs.existsSync(skillsSrc)) {
    const skillsDest = path.join(destDir, 'skills');
    if (!args.dryRun) {
      copyDirRecursive(skillsSrc, skillsDest);
      console.log('  copied: skills/');
    } else {
      console.log(`  would copy: ${skillsSrc} → ${skillsDest}`);
    }
  }

  // 5b. Copy _shared (optional cross-agent reference docs, e.g. agentic-workflow)
  const sharedSrc = path.join(src, '_shared');
  if (fs.existsSync(sharedSrc)) {
    const sharedDest = path.join(destDir, '_shared');
    if (!args.dryRun) {
      copyDirRecursive(sharedSrc, sharedDest);
      console.log('  copied: _shared/');
    } else {
      console.log(`  would copy: ${sharedSrc} → ${sharedDest}`);
    }
  }

  // 5c. Copy hooks (Claude Code: manifest declares ./hooks/hooks.json;
  //     the source IS the root hooks/hooks.json — see copyHooksClaude note).
  copyHooksClaude(src, destDir, args.dryRun);

  // 6. Copy scripts (skill-radar's analysis scripts live here)
  const scriptsSrc = path.join(src, 'scripts');
  if (fs.existsSync(scriptsSrc)) {
    const scriptsDest = path.join(destDir, 'scripts');
    if (!args.dryRun) {
      copyDirRecursive(scriptsSrc, scriptsDest);
      console.log('  copied: scripts/');
    } else {
      console.log(`  would copy: ${scriptsSrc} → ${scriptsDest}`);
    }
  }
}

function uninstallPlugin(pluginName, args) {
  const manifestPath = path.join(
    __dirname, '..', 'plugins', pluginName, '.claude-plugin', 'plugin.json'
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const installName = manifest.name;
  const destDir = path.join(PLUGIN_DIR, installName);
  console.log(`\n→ Removing ${installName}`);

  if (fs.existsSync(destDir)) {
    if (!args.dryRun) removeDir(destDir);
    console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${destDir}`);
  }
}

function install(args) {
  console.log('Installing agentic-work for Claude Code...\n');
  for (const name of selectPlugins(args)) installPlugin(name, args);
  console.log(args.dryRun
    ? '\n[dry-run] No files written.'
    : '\n✅ Installation complete. Restart Claude Code to take effect.');
}

function uninstall(args) {
  console.log('Uninstalling agentic-work from Claude Code...\n');
  for (const name of selectPlugins(args)) uninstallPlugin(name, args);
  console.log(args.dryRun
    ? '\n[dry-run] No files removed.'
    : '\n✅ Uninstallation complete.');
}

const args = parseArgs(process.argv);
args.uninstall ? uninstall(args) : install(args);
