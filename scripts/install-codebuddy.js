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