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
//
// Hooks: Trae has no plugin-level hooks — only global (~/.trae-cn/hooks.json) or
// project (.trae/hooks.json) configs, with no plugin-root variable. So when a plugin
// ships hooks/hooks.trae.json (a template), install renders ${TRAE_PLUGIN_ROOT} to the
// installed plugin dir and merges the result into the global hooks.json; entries are
// marked by the '<name>-trae' path substring for idempotent re-install and uninstall.

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');
const { getPluginVersion } = require('./lib/plugin-version');

const PLUGIN_DIR = joinHome('.trae', 'plugins');
// Global hooks config per https://docs.trae.cn/ide_hook-configuration-reference (CN edition)
const HOOKS_FILE = joinHome('.trae-cn', 'hooks.json');
const PLUGINS = ['dotnet-work', 'agentic-workflow', 'graph-workflow'];
const SUBDIRS = ['.trae-plugin', 'skills', 'commands', 'trae/agents', '_shared', 'scripts'];
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

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function loadGlobalHooks() {
  try {
    const data = JSON.parse(fs.readFileSync(HOOKS_FILE, 'utf-8'));
    if (!data.hooks || typeof data.hooks !== 'object') data.hooks = {};
    return data;
  } catch {
    return { version: 1, hooks: {} };
  }
}

// Drop every hook group containing a command that references this plugin's install dir.
function stripOwnHooks(config, marker) {
  for (const event of Object.keys(config.hooks)) {
    config.hooks[event] = (config.hooks[event] || []).filter(
      (g) => !(g.hooks || []).some((h) => typeof h.command === 'string' && h.command.includes(marker))
    );
    if (config.hooks[event].length === 0) delete config.hooks[event];
  }
  return config;
}

function installHooks(pluginName, destDir, args) {
  const templatePath = path.join(__dirname, '..', 'plugins', pluginName, 'hooks', 'hooks.trae.json');
  if (!fs.existsSync(templatePath)) return;
  const marker = `${pluginName}-trae`;
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
  const rendered = JSON.parse(
    JSON.stringify(template.hooks).split('${TRAE_PLUGIN_ROOT}').join(toPosix(destDir))
  );
  if (args.dryRun) {
    console.log(`  would merge hooks into: ${HOOKS_FILE} (events: ${Object.keys(rendered).join(', ')}; marker: ${marker})`);
    return;
  }
  const config = stripOwnHooks(loadGlobalHooks(), marker);
  if (typeof config.version !== 'number') config.version = 1;
  for (const [event, groups] of Object.entries(rendered)) {
    config.hooks[event] = (config.hooks[event] || []).concat(groups);
  }
  fs.mkdirSync(path.dirname(HOOKS_FILE), { recursive: true });
  fs.writeFileSync(HOOKS_FILE, JSON.stringify(config, null, 2) + '\n');
  console.log(`  merged hooks into: ${HOOKS_FILE}`);
}

function uninstallHooks(pluginName, args) {
  const marker = `${pluginName}-trae`;
  const templatePath = path.join(__dirname, '..', 'plugins', pluginName, 'hooks', 'hooks.trae.json');
  if (!fs.existsSync(templatePath) || !fs.existsSync(HOOKS_FILE)) return;
  if (args.dryRun) {
    console.log(`  would remove '${marker}' hook entries from: ${HOOKS_FILE}`);
    return;
  }
  const config = stripOwnHooks(loadGlobalHooks(), marker);
  fs.writeFileSync(HOOKS_FILE, JSON.stringify(config, null, 2) + '\n');
  console.log(`  removed '${marker}' hook entries from: ${HOOKS_FILE}`);
}

function installPlugin(pluginName, args) {
  const PLUGIN_VERSION = getPluginVersion(pluginName);
  const installName = `${pluginName}-trae`;
  const destDir = path.join(PLUGIN_DIR, installName, PLUGIN_VERSION);
  const src = path.join(__dirname, '..', 'plugins', pluginName);
  const manifestSrc = path.join(src, '.trae-plugin', 'plugin.json');

  console.log(`\n→ Installing ${installName}`);
  // Pre-wipe for idempotency: reinstall replaces all content.
  if (fs.existsSync(destDir)) removeDir(destDir);
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

  // Hooks: copy the Node scripts only (platform configs stay in the repo), then
  // merge the rendered hooks.trae.json template into the global hooks.json.
  const hooksSrc = path.join(src, 'hooks');
  if (fs.existsSync(hooksSrc) && fs.existsSync(path.join(hooksSrc, 'hooks.trae.json'))) {
    const hooksDest = path.join(destDir, 'hooks');
    const scriptsToCopy = fs.readdirSync(hooksSrc).filter((f) => f.endsWith('.js'));
    if (!args.dryRun) {
      fs.mkdirSync(hooksDest, { recursive: true });
      for (const f of scriptsToCopy) fs.copyFileSync(path.join(hooksSrc, f), path.join(hooksDest, f));
      console.log(`  copied: hooks/ (${scriptsToCopy.length} scripts)`);
    } else {
      console.log(`  would copy: ${hooksSrc} → ${hooksDest} (${scriptsToCopy.join(', ')})`);
    }
    installHooks(pluginName, destDir, args);
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
  uninstallHooks(pluginName, args);
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
