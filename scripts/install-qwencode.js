#!/usr/bin/env node
'use strict';
// install-qwencode.js — Install agentic-work plugins for Qwen Code
//
// Usage:
//   node scripts/install-qwencode.js                  # install all
//   node scripts/install-qwencode.js --plugin agentic-workflow
//   node scripts/install-qwencode.js --uninstall
//   node scripts/install-qwencode.js --dry-run
//
// Qwen Code extensions are stored in %USERPROFILE%/.qwen/extensions/<name>/
// and reference agents/, commands/, skills/ subdirectories.
// Manifest is read from .qwen-plugin/qwen-extension.json at the plugin root.

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');
const { getPluginVersion } = require('./lib/plugin-version');

const EXTENSION_DIR = joinHome('.qwen', 'extensions');
const PLUGINS = ['dotnet-work', 'agentic-workflow', 'graph-workflow'];

function parseArgs(argv) {
  const args = { plugin: null, uninstall: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --plugin requires a value (agentic-workflow)');
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

function installPlugin(pluginName, args) {
  const manifestPath = path.join(__dirname, '..', 'plugins', pluginName, '.qwen-plugin', 'qwen-extension.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: Qwen Code manifest not found: ${manifestPath}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const installName = manifest.name;
  const destDir = path.join(EXTENSION_DIR, installName);
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
    fs.copyFileSync(manifestPath, path.join(destDir, 'qwen-extension.json'));
    console.log('  copied: qwen-extension.json');
  } else {
    console.log(`  would copy: ${manifestPath} → ${path.join(destDir, 'qwen-extension.json')}`);
  }

  // 3. Copy agents (Qwen Code expects agents/ directory)
  const agentsSrc = path.join(src, 'qwencode/agents');
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(destDir, 'agents');
    if (!args.dryRun) {
      copyDirRecursive(agentsSrc, agentsDest);
      console.log('  copied: agents/');
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

  // 5c. Copy hooks (selective): Qwen loads the file declared by manifest "hooks" and
  // may auto-discover hooks/hooks.json — so copy only the JS scripts + the Qwen-format
  // config, excluding the other platform variants (hooks.zcode.json, hooks.codebuddy.json,
  // hooks.trae.json, hooks.qoder.json).
  const hooksSrc = path.join(src, 'hooks');
  if (fs.existsSync(hooksSrc)) {
    const hooksDest = path.join(destDir, 'hooks');
    const entries = fs.readdirSync(hooksSrc).filter(
      (f) => f.endsWith('.js') || f === 'hooks.qwencode.json'
    );
    if (!args.dryRun) {
      fs.mkdirSync(hooksDest, { recursive: true });
      for (const f of entries) fs.copyFileSync(path.join(hooksSrc, f), path.join(hooksDest, f));
      console.log(`  copied: hooks/ (${entries.length} files, ZCode/CodeBuddy configs excluded)`);
    } else {
      console.log(`  would copy: ${hooksSrc} → ${hooksDest} (${entries.join(', ')})`);
    }
  }

  // 6. Copy scripts
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
  const manifestPath = path.join(__dirname, '..', 'plugins', pluginName, '.qwen-plugin', 'qwen-extension.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const installName = manifest.name;
  const destDir = path.join(EXTENSION_DIR, installName);
  console.log(`\n→ Removing ${installName}`);

  if (fs.existsSync(destDir)) {
    if (!args.dryRun) removeDir(destDir);
    console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${destDir}`);
  }
}

function install(args) {
  console.log('Installing agentic-work for Qwen Code...\n');
  for (const name of selectPlugins(args)) installPlugin(name, args);
  console.log(args.dryRun ? '\n[dry-run] No files written.' : '\n✅ Installation complete. Restart Qwen Code to take effect.');
}

function uninstall(args) {
  console.log('Uninstalling agentic-work from Qwen Code...\n');
  for (const name of selectPlugins(args)) uninstallPlugin(name, args);
  console.log(args.dryRun ? '\n[dry-run] No files removed.' : '\n✅ Uninstallation complete.');
}

const args = parseArgs(process.argv);
args.uninstall ? uninstall(args) : install(args);
