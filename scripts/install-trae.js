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
// installed plugin dir and merges the result into a hooks.json; entries are
// marked by the '<name>-trae' path substring for idempotent re-install and uninstall.
//
// Scope selection (P1-4 — project-first, global only on explicit request):
//   --project-only   merge into <cwd>/.trae/hooks.json (errors if no project root found)
//   --global         merge into ~/.trae-cn/hooks.json (explicit opt-in; affects ALL workspaces)
//   (default)        project-level when a project root is detectable from cwd,
//                    otherwise global with a printed warning.

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');
const { getPluginVersion } = require('./lib/plugin-version');

const PLUGIN_DIR = joinHome('.trae', 'plugins');
// Global hooks config per https://docs.trae.cn/ide_hook-configuration-reference (CN edition)
const GLOBAL_HOOKS_FILE = joinHome('.trae-cn', 'hooks.json');
const PLUGINS = ['dotnet-work', 'agentic-workflow', 'graph-workflow', 'skill-radar'];
const SUBDIRS = ['.trae-plugin', 'skills', 'commands', 'trae/agents', '_shared', 'scripts'];
// Source subdir → destination dirname (when they differ)
const RENAME_MAP = { 'trae/agents': 'agents' };

// Project root markers, checked upward from cwd.
const PROJECT_MARKERS = ['.git', 'package.json', '.trae'];

function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    for (const m of PROJECT_MARKERS) {
      if (fs.existsSync(path.join(dir, m))) return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function parseArgs(argv) {
  const args = { plugin: null, uninstall: false, dryRun: false, projectOnly: false, global: false };
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
    else if (argv[i] === '--project-only') args.projectOnly = true;
    else if (argv[i] === '--global') args.global = true;
  }
  if (args.projectOnly && args.global) {
    console.error('Error: --project-only and --global are mutually exclusive');
    process.exit(2);
  }
  return args;
}

// Resolve which hooks.json to merge into, per the scope flags.
function resolveHooksTarget(args) {
  if (args.global) return { file: GLOBAL_HOOKS_FILE, scope: 'global' };
  const root = findProjectRoot(process.cwd());
  if (args.projectOnly) {
    if (!root) {
      console.error('Error: --project-only given but no project root found from cwd (looked for ' + PROJECT_MARKERS.join(', ') + ')');
      process.exit(2);
    }
    return { file: path.join(root, '.trae', 'hooks.json'), scope: 'project' };
  }
  if (root) return { file: path.join(root, '.trae', 'hooks.json'), scope: 'project' };
  console.warn('⚠️  no project root found from cwd — falling back to GLOBAL hooks (affects all workspaces). Use --project-only from a project dir to avoid this.');
  return { file: GLOBAL_HOOKS_FILE, scope: 'global' };
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

function loadHooksFile(hooksFile) {
  if (!fs.existsSync(hooksFile)) return { version: 1, hooks: {} };
  try {
    const data = JSON.parse(fs.readFileSync(hooksFile, 'utf-8'));
    if (!data.hooks || typeof data.hooks !== 'object') data.hooks = {};
    return data;
  } catch (e) {
    throw new Error(`Refusing to overwrite unreadable hooks file: ${hooksFile} (${e.message})`);
  }
}

function writeJsonAtomic(file, data) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.hooks.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  try {
    fs.renameSync(tmp, file);
  } catch (e) {
    try { fs.rmSync(tmp, { force: true }); } catch { /* best effort cleanup */ }
    throw e;
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

function installHooks(pluginName, destDir, args, hooksTarget) {
  const templatePath = path.join(__dirname, '..', 'plugins', pluginName, 'hooks', 'hooks.trae.json');
  if (!fs.existsSync(templatePath)) return;
  const marker = `${pluginName}-trae`;
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
  const rendered = JSON.parse(
    JSON.stringify(template.hooks).split('${TRAE_PLUGIN_ROOT}').join(toPosix(destDir))
  );
  if (args.dryRun) {
    console.log(`  would merge hooks into: ${hooksTarget.file} [${hooksTarget.scope}] (events: ${Object.keys(rendered).join(', ')}; marker: ${marker})`);
    return;
  }
  const config = stripOwnHooks(loadHooksFile(hooksTarget.file), marker);
  if (typeof config.version !== 'number') config.version = 1;
  for (const [event, groups] of Object.entries(rendered)) {
    config.hooks[event] = (config.hooks[event] || []).concat(groups);
  }
  writeJsonAtomic(hooksTarget.file, config);
  console.log(`  merged hooks into: ${hooksTarget.file} [${hooksTarget.scope}]`);
}

function uninstallHooks(pluginName, args, hooksTarget) {
  const marker = `${pluginName}-trae`;
  const templatePath = path.join(__dirname, '..', 'plugins', pluginName, 'hooks', 'hooks.trae.json');
  if (!fs.existsSync(templatePath) || !fs.existsSync(hooksTarget.file)) return;
  if (args.dryRun) {
    console.log(`  would remove '${marker}' hook entries from: ${hooksTarget.file} [${hooksTarget.scope}]`);
    return;
  }
  const config = stripOwnHooks(loadHooksFile(hooksTarget.file), marker);
  writeJsonAtomic(hooksTarget.file, config);
  console.log(`  removed '${marker}' hook entries from: ${hooksTarget.file} [${hooksTarget.scope}]`);
}

function installPlugin(pluginName, args, hooksTarget) {
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
  // merge the rendered hooks.trae.json template into the resolved hooks.json.
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
    installHooks(pluginName, destDir, args, hooksTarget);
  }
}

function uninstallPlugin(pluginName, args, hooksTarget) {
  const PLUGIN_VERSION = getPluginVersion(pluginName);
  const installName = `${pluginName}-trae`;
  const destDir = path.join(PLUGIN_DIR, installName, PLUGIN_VERSION);
  console.log(`\n→ Removing ${installName}`);

  if (fs.existsSync(destDir)) {
    if (!args.dryRun) removeDir(destDir);
    console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${destDir}`);
  }
  uninstallHooks(pluginName, args, hooksTarget);
}

function install(args) {
  console.log('Installing agentic-work for Trae...\n');
  const hooksTarget = resolveHooksTarget(args);
  for (const name of selectPlugins(args)) installPlugin(name, args, hooksTarget);
  console.log(args.dryRun ? '\n[dry-run] No files written.' : '\n✅ Installation complete. Restart Trae to take effect.');
}

function uninstall(args) {
  console.log('Uninstalling agentic-work from Trae...\n');
  const hooksTarget = resolveHooksTarget(args);
  for (const name of selectPlugins(args)) uninstallPlugin(name, args, hooksTarget);
  console.log(args.dryRun ? '\n[dry-run] No files removed.' : '\n✅ Uninstallation complete.');
}

const args = parseArgs(process.argv);
args.uninstall ? uninstall(args) : install(args);
