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
// Copies plugins/<name>/* (skills, agents, commands, scripts) to
// %USERPROFILE%/.zcode/cli/plugins/cache/master0071/<name>-zcode/<version>/
// and registers in marketplace. Manifest is read from .zcode-plugin/plugin.json
// at the plugin root.

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');
const { getPluginVersion } = require('./lib/plugin-version');

const PLUGIN_DIR = joinHome('.zcode', 'cli', 'plugins');
const MARKETPLACE_NAME = 'master0071';
const PLUGINS = ['dotnet-work', 'agentic-workflow', 'skill-radar', 'graph-workflow'];
const SUBDIRS = ['.zcode-plugin', 'skills', 'commands', 'zcode/agents', 'hooks', 'scripts'];
// Source subdir → destination dirname (when they differ)
const RENAME_MAP = { 'zcode/agents': 'agents' };

function parseArgs(argv) {
  const args = { plugin: null, uninstall: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --plugin requires a value (dotnet-work | agentic-workflow)');
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
  const PLUGIN_VERSION = getPluginVersion(pluginName);
  const installName = `${pluginName}-zcode`;
  const destDir = path.join(PLUGIN_DIR, 'cache', MARKETPLACE_NAME, installName, PLUGIN_VERSION);
  const src = path.join(__dirname, '..', 'plugins', pluginName);
  const manifestSrc = path.join(src, '.zcode-plugin', 'plugin.json');

  console.log(`\n→ Installing ${installName}`);
  if (!fs.existsSync(src)) {
    console.error(`Error: source not found: ${src}`);
    process.exit(1);
  }

  for (const sub of SUBDIRS) {
    if (sub === '.zcode-plugin') continue;
    const subSrc = path.join(src, sub);
    if (!fs.existsSync(subSrc)) continue;
    const subDest = path.join(destDir, RENAME_MAP[sub] || sub);
    if (!args.dryRun) {
      copyDirRecursive(subSrc, subDest);
      console.log(`  copied: ${sub}/`);
    } else {
      console.log(`  would copy: ${subSrc} → ${subDest}`);
    }
  }

  if (!args.dryRun) {
    fs.mkdirSync(path.join(destDir, '.zcode-plugin'), { recursive: true });
    fs.copyFileSync(manifestSrc, path.join(destDir, '.zcode-plugin', 'plugin.json'));
    console.log('  copied: .zcode-plugin/');
  } else {
    console.log(`  would copy: ${manifestSrc} → ${path.join(destDir, '.zcode-plugin', 'plugin.json')}`);
  }

  // Register in marketplace
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
      cachePath: destDir.split(path.sep).join('/'),
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

  // Enable flag
  const dataDir = path.join(PLUGIN_DIR, 'data', `${installName}@${MARKETPLACE_NAME}`);
  if (!args.dryRun) {
    fs.mkdirSync(dataDir, { recursive: true });
    const enabledFile = path.join(dataDir, 'enabled.json');
    fs.writeFileSync(enabledFile, JSON.stringify({ enabled: true, version: PLUGIN_VERSION }, null, 2) + '\n');
    console.log(`  enabled`);
  } else {
    console.log(`  would create data dir with enabled.json`);
  }
}

function uninstallPlugin(pluginName, args) {
  const PLUGIN_VERSION = getPluginVersion(pluginName);
  const installName = `${pluginName}-zcode`;
  const destDir = path.join(PLUGIN_DIR, 'cache', MARKETPLACE_NAME, installName, PLUGIN_VERSION);
  console.log(`\n→ Removing ${installName}`);

  if (fs.existsSync(destDir)) {
    if (!args.dryRun) removeDir(destDir);
    console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${destDir}`);
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
    if (!args.dryRun) removeDir(dataDir);
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
