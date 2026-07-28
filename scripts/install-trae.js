#!/usr/bin/env node
'use strict';
// install-trae.js — Install agentic-work plugins for Trae
//
// Usage:
//   node scripts/install-trae.js                  # install all
//   node scripts/install-trae.js --plugin agentic-workflow
//   node scripts/install-trae.js --uninstall
//   node scripts/install-trae.js --dry-run
//
// Copies plugins/<name>/* (skills, agents-trae, commands, scripts) to
// %USERPROFILE%/.trae/plugins/<name>-trae/
// Manifest is read from .trae-plugin/plugin.json at the plugin root.

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');
const { getPluginVersion } = require('./lib/plugin-version');

const PLUGIN_DIR = joinHome('.trae', 'plugins');
const PLUGINS = ['dotnet-work', 'agentic-workflow'];
const SUBDIRS = ['.trae-plugin', 'skills', 'commands', 'trae/agents', 'scripts'];
// Source subdir → destination dirname (when they differ)
const RENAME_MAP = { 'trae/agents': 'agents' };

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
  const PLUGIN_VERSION = getPluginVersion(pluginName);
  const installName = `${pluginName}-trae`;
  const destDir = path.join(PLUGIN_DIR, installName, PLUGIN_VERSION);
  const src = path.join(__dirname, '..', 'plugins', pluginName);
  const manifestSrc = path.join(src, '.trae-plugin', 'plugin.json');

  console.log(`\n→ Installing ${installName}`);
  if (!fs.existsSync(src)) {
    console.error(`Error: source not found: ${src}`);
    process.exit(1);
  }

  for (const sub of SUBDIRS) {
    if (sub === '.trae-plugin') continue;
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
    fs.mkdirSync(path.join(destDir, '.trae-plugin'), { recursive: true });
    fs.copyFileSync(manifestSrc, path.join(destDir, '.trae-plugin', 'plugin.json'));
    console.log('  copied: .trae-plugin/');
  } else {
    console.log(`  would copy: ${manifestSrc} → ${path.join(destDir, '.trae-plugin', 'plugin.json')}`);
  }
}

function uninstallPlugin(pluginName, args) {
  const PLUGIN_VERSION = getPluginVersion(pluginName);
  const installName = `${pluginName}-trae`;
  const destDir = path.join(PLUGIN_DIR, installName, PLUGIN_VERSION);
  console.log(`\n→ Removing ${installName}`);

  if (fs.existsSync(destDir)) {
    if (!args.dryRun) removeDir(destDir);
    console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${destDir}`);
  }
}

function install(args) {
  console.log('Installing agentic-work for Trae...\n');
  for (const name of selectPlugins(args)) installPlugin(name, args);
  console.log(args.dryRun ? '\n[dry-run] No files written.' : '\n✅ Installation complete. Restart Trae to take effect.');
}

function uninstall(args) {
  console.log('Uninstalling agentic-work from Trae...\n');
  for (const name of selectPlugins(args)) uninstallPlugin(name, args);
  console.log(args.dryRun ? '\n[dry-run] No files removed.' : '\n✅ Uninstallation complete.');
}

const args = parseArgs(process.argv);
args.uninstall ? uninstall(args) : install(args);
