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
//
// Source layout (post-flatten): a single agents/ baseline with ZCode frontmatter;
// per-platform agent copies no longer exist. ZCode IS the baseline, so agents/ is
// copied as-is (no derivation). Hooks: JS shared at hooks/*.js, per-platform config
// at hooks/zcode/hooks.json — copied into install dir as hooks/hooks.json.

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');
const { getPluginVersion } = require('./lib/plugin-version');
const { readJsonWithRecovery, writeJsonAtomic } = require('./lib/json-file');

const PLUGIN_DIR = joinHome('.zcode', 'cli', 'plugins');
const MARKETPLACE_NAME = 'master0071';
const PLUGINS = ['dotnet-work', 'agentic-workflow', 'skill-radar', 'graph-workflow'];
// Public source subdirs to copy (manifest copied separately).
const SUBDIRS = ['skills', 'agents', 'commands', '_shared', 'scripts'];

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

// Copy hooks: shared *.js + this platform's hooks.json (flattened from hooks/<platform>/hooks.json).
function copyHooks(src, destDir, platform, args) {
  const hooksSrc = path.join(src, 'hooks');
  if (!fs.existsSync(hooksSrc)) return;
  const platConfig = path.join(hooksSrc, platform, 'hooks.json');
  if (!fs.existsSync(platConfig)) return; // plugin has no hooks
  const hooksDest = path.join(destDir, 'hooks');
  const scripts = fs.readdirSync(hooksSrc).filter((f) => f.endsWith('.js'));
  if (!args.dryRun) {
    fs.mkdirSync(hooksDest, { recursive: true });
    for (const f of scripts) fs.copyFileSync(path.join(hooksSrc, f), path.join(hooksDest, f));
    fs.copyFileSync(platConfig, path.join(hooksDest, 'hooks.json'));
    console.log(`  copied: hooks/ (${scripts.length} scripts + ${platform}/hooks.json → hooks.json)`);
  } else {
    console.log(`  would copy: ${scripts.length} hook scripts + ${platform}/hooks.json → hooks/hooks.json`);
  }
}

function installPlugin(pluginName, args) {
  const PLUGIN_VERSION = getPluginVersion(pluginName);
  const installName = `${pluginName}-zcode`;
  const destDir = path.join(PLUGIN_DIR, 'cache', MARKETPLACE_NAME, installName, PLUGIN_VERSION);
  const src = path.join(__dirname, '..', 'plugins', pluginName);
  const manifestSrc = path.join(src, '.zcode-plugin', 'plugin.json');

  console.log(`\n→ Installing ${installName}`);
  // Pre-wipe for idempotency: reinstall replaces all content.
  if (!args.dryRun && fs.existsSync(destDir)) removeDir(destDir);
  if (!fs.existsSync(src)) {
    console.error(`Error: source not found: ${src}`);
    process.exit(1);
  }

  for (const sub of SUBDIRS) {
    const subSrc = path.join(src, sub);
    if (!fs.existsSync(subSrc)) continue;
    const subDest = path.join(destDir, sub);
    if (!args.dryRun) {
      copyDirRecursive(subSrc, subDest);
      console.log(`  copied: ${sub}/`);
    } else {
      console.log(`  would copy: ${subSrc} → ${subDest}`);
    }
  }

  copyHooks(src, destDir, 'zcode', args);

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
    let marketplace = readJsonWithRecovery(marketplaceFile, {
      name: MARKETPLACE_NAME, owner: { name: 'master0071' }, plugins: [], version: 1
    });
    if (!marketplace || typeof marketplace !== 'object' || !Array.isArray(marketplace.plugins)) {
      console.error(`Warning: invalid marketplace structure in ${marketplaceFile}; preserving it as a backup.`);
      const backup = `${marketplaceFile}.corrupt.${Date.now()}.bak`;
      fs.copyFileSync(marketplaceFile, backup);
      marketplace = { name: MARKETPLACE_NAME, owner: { name: 'master0071' }, plugins: [], version: 1 };
    }
    const entry = {
      name: installName,
      source: 'filesystem',
      cachePath: destDir.split(path.sep).join('/'),
      version: PLUGIN_VERSION,
      description: `${pluginName} plugin for ZCode`,
      category: ({ 'dotnet-work': 'development', 'skill-radar': 'observability' })[pluginName] || 'workflow'
    };
    const idx = marketplace.plugins.findIndex(p => p.name === installName);
    if (idx >= 0) marketplace.plugins[idx] = entry;
    else marketplace.plugins.push(entry);
    writeJsonAtomic(marketplaceFile, marketplace);
    console.log(`  registered in marketplace`);
  } else {
    console.log(`  would register in marketplace`);
  }

  // Enable flag
  const dataDir = path.join(PLUGIN_DIR, 'data', `${installName}@${MARKETPLACE_NAME}`);
  if (!args.dryRun) {
    fs.mkdirSync(dataDir, { recursive: true });
    const enabledFile = path.join(dataDir, 'enabled.json');
    writeJsonAtomic(enabledFile, { enabled: true, version: PLUGIN_VERSION });
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
