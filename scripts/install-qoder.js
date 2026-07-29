#!/usr/bin/env node
'use strict';
// install-qoder.js — Install agentic-work plugins for Qoder
//
// Usage:
//   node scripts/install-qoder.js                  # install all
//   node scripts/install-qoder.js --plugin agentic-workflow
//   node scripts/install-qoder.js --uninstall
//   node scripts/install-qoder.js --dry-run
//
// Registration-first: Qoder only loads plugins registered in
// ~/.qoder/plugins/installed_plugins_v2.json, so this script probes for the
// qodercli binary (PATH, then ~/.qoder/bin/qodercli/) and, when found, runs
// `qodercli plugins install <repo-plugin-dir>` against the repo source dir.
// The staged copy to %USERPROFILE%/.qoder/plugins/<name>-qoder/ is kept as a
// fallback for machines without qodercli (manual registration required).
// Manifest is read from .qoder-plugin/plugin.json at the plugin root.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');
const { getPluginVersion } = require('./lib/plugin-version');

const PLUGIN_DIR = joinHome('.qoder', 'plugins');
const PLUGINS = ['dotnet-work', 'agentic-workflow', 'graph-workflow'];
const SUBDIRS = ['.qoder-plugin', 'skills', 'commands', 'qoder/agents', '_shared', 'scripts'];
// Source subdir → destination dirname (when they differ)
const RENAME_MAP = { 'qoder/agents': 'agents' };

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

// ─── qodercli detection + registration ───────────────────────────

// Probe order: PATH (where/which), then the Qoder-managed install location
// ~/.qoder/bin/qodercli/qodercli(.exe) (a symlink to the versioned binary,
// typically NOT exported to PATH). A candidate counts only if `--version`
// exits 0.
function findQoderCli() {
  const candidates = [];
  const whichCmd = process.platform === 'win32' ? 'where' : 'which';
  const w = spawnSync(whichCmd, ['qodercli'], { encoding: 'utf-8' });
  if (w.status === 0 && w.stdout && w.stdout.trim()) {
    candidates.push(w.stdout.trim().split(/\r?\n/)[0]);
  }
  candidates.push(joinHome(
    '.qoder', 'bin', 'qodercli',
    process.platform === 'win32' ? 'qodercli.exe' : 'qodercli'
  ));
  for (const c of candidates) {
    if (!fs.existsSync(c)) continue;
    const r = spawnSync(c, ['--version'], { encoding: 'utf-8' });
    if (r.status === 0) return c;
  }
  return null;
}

// Register the repo source dir (its manifest paths match the repo layout).
// Returns true on success. Failure is non-fatal: files are staged anyway and
// the caller prints the manual command.
function registerPlugin(cli, srcDir) {
  const r = spawnSync(cli, ['plugins', 'install', srcDir], { encoding: 'utf-8' });
  if (r.stdout) process.stdout.write(r.stdout.replace(/^/gm, '  '));
  if (r.status !== 0) {
    if (r.stderr) process.stderr.write(r.stderr.replace(/^/gm, '  '));
    return false;
  }
  return true;
}

function unregisterPlugin(cli, manifestName) {
  const r = spawnSync(cli, ['plugins', 'uninstall', manifestName], { encoding: 'utf-8' });
  if (r.stdout) process.stdout.write(r.stdout.replace(/^/gm, '  '));
  if (r.status !== 0 && r.stderr) process.stderr.write(r.stderr.replace(/^/gm, '  '));
  return r.status === 0;
}

function readManifest(pluginName) {
  const p = path.join(__dirname, '..', 'plugins', pluginName, '.qoder-plugin', 'plugin.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// The staged copy flattens qoder/agents → agents/ (RENAME_MAP), so manifest
// paths like ./qoder/agents/x.md must be rewritten to ./agents/x.md or the
// staged dir would not survive `qodercli plugins validate`.
function rewriteManifestPathsForStaged(manifest) {
  const rewritten = JSON.parse(JSON.stringify(manifest));
  const fixPath = (v) => {
    if (typeof v !== 'string') return v;
    let out = v;
    for (const [from, to] of Object.entries(RENAME_MAP)) {
      if (out === `./${from}` || out.startsWith(`./${from}/`)) {
        out = `./${to}` + out.slice(`./${from}`.length);
      }
    }
    return out;
  };
  for (const [key, val] of Object.entries(rewritten)) {
    if (Array.isArray(val)) rewritten[key] = val.map(fixPath);
    else rewritten[key] = fixPath(val);
  }
  return rewritten;
}

function installPlugin(pluginName, args) {
  const PLUGIN_VERSION = getPluginVersion(pluginName);
  const installName = `${pluginName}-qoder`;
  const destDir = path.join(PLUGIN_DIR, installName, PLUGIN_VERSION);
  const src = path.join(__dirname, '..', 'plugins', pluginName);
  const manifestSrc = path.join(src, '.qoder-plugin', 'plugin.json');

  console.log(`\n→ Installing ${installName}`);
  // Pre-wipe for idempotency: reinstall replaces all content.
  if (fs.existsSync(destDir)) removeDir(destDir);
  if (!fs.existsSync(src)) {
    console.error(`Error: source not found: ${src}`);
    process.exit(1);
  }

  for (const sub of SUBDIRS) {
    if (sub === '.qoder-plugin') continue;
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

  // Hooks (selective): the manifest declares "hooks": "hooks/hooks.qoder.json" (wrapper
  // format { "hooks": ... }, per https://docs.qoder.com/zh/cli/plugins), so the repo
  // plugin dir is directly installable via `qodercli plugins install`. For the staged
  // copy, additionally rename it to hooks/hooks.json (Qoder's auto-discovery convention)
  // as belt-and-braces. Copy only the JS scripts plus the Qoder config — excluding the
  // other platform variants (hooks.zcode.json, hooks.codebuddy.json, hooks.qwencode.json,
  // hooks.trae.json).
  const hooksSrc = path.join(src, 'hooks');
  const qoderHooksConfig = path.join(hooksSrc, 'hooks.qoder.json');
  if (fs.existsSync(qoderHooksConfig)) {
    const hooksDest = path.join(destDir, 'hooks');
    const scripts = fs.readdirSync(hooksSrc).filter((f) => f.endsWith('.js'));
    if (!args.dryRun) {
      fs.mkdirSync(hooksDest, { recursive: true });
      for (const f of scripts) fs.copyFileSync(path.join(hooksSrc, f), path.join(hooksDest, f));
      fs.copyFileSync(qoderHooksConfig, path.join(hooksDest, 'hooks.json'));
      fs.copyFileSync(qoderHooksConfig, path.join(hooksDest, 'hooks.qoder.json'));
      console.log(`  copied: hooks/ (${scripts.length} scripts + hooks.qoder.json, also as hooks.json)`);
    } else {
      console.log(`  would copy: ${hooksSrc} → ${hooksDest} (${scripts.join(', ')}, hooks.qoder.json → hooks.json)`);
    }
  }

  if (!args.dryRun) {
    fs.mkdirSync(path.join(destDir, '.qoder-plugin'), { recursive: true });
    const staged = rewriteManifestPathsForStaged(readManifest(pluginName));
    fs.writeFileSync(
      path.join(destDir, '.qoder-plugin', 'plugin.json'),
      JSON.stringify(staged, null, 2) + '\n'
    );
    console.log('  copied: .qoder-plugin/ (manifest paths rewritten for flattened layout)');
  } else {
    console.log(`  would copy: ${manifestSrc} → ${path.join(destDir, '.qoder-plugin', 'plugin.json')} (paths rewritten)`);
  }
}

function uninstallPlugin(pluginName, args) {
  const PLUGIN_VERSION = getPluginVersion(pluginName);
  const installName = `${pluginName}-qoder`;
  const parentDir = path.join(PLUGIN_DIR, installName);
  const destDir = path.join(parentDir, PLUGIN_VERSION);
  console.log(`\n→ Removing ${installName}`);

  if (fs.existsSync(destDir)) {
    if (!args.dryRun) removeDir(destDir);
    console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${destDir}`);
  }
  // Drop the now-empty <name>-qoder/ shell too — uninstall must remove
  // everything install created.
  if (!args.dryRun && fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
    fs.rmdirSync(parentDir);
    console.log(`  removed: ${parentDir}`);
  }
}

function install(args) {
  console.log('Installing agentic-work for Qoder...\n');
  const cli = findQoderCli();
  let failed = 0;
  for (const name of selectPlugins(args)) {
    installPlugin(name, args);
    if (!cli) continue;
    const srcDir = path.join(__dirname, '..', 'plugins', name);
    if (args.dryRun) {
      console.log(`  would register: qodercli plugins install ${srcDir}`);
    } else {
      console.log('  registering via qodercli...');
      if (!registerPlugin(cli, srcDir)) failed++;
    }
  }

  if (args.dryRun) {
    console.log(`\n[dry-run] No files written. qodercli ${cli ? `detected: ${cli}` : 'NOT found — would stage only'}.`);
  } else if (cli && failed === 0) {
    console.log('\n✅ Registered via qodercli — run /plugins reload or restart Qoder to activate.');
  } else if (cli) {
    console.log(`\n⚠️  ${failed} plugin(s) failed to register — files are staged; retry manually:\n` +
      '   qodercli plugins install <repo-plugin-dir>  (then /plugins reload or restart Qoder).');
  } else {
    console.log('\n⚠️  qodercli not found — files staged only. Qoder loads registered plugins exclusively\n' +
      '   (~/.qoder/plugins/installed_plugins_v2.json). Activate with:\n' +
      '   qodercli plugins install <staged-or-repo-plugin-dir>  (then /plugins reload or restart Qoder).');
  }
}

function uninstall(args) {
  console.log('Uninstalling agentic-work from Qoder...\n');
  const cli = findQoderCli();
  for (const name of selectPlugins(args)) {
    if (cli) {
      const manifestName = readManifest(name).name;
      if (args.dryRun) {
        console.log(`would unregister: qodercli plugins uninstall ${manifestName}`);
      } else {
        console.log(`\n→ Unregistering ${manifestName}`);
        // Non-fatal: the plugin may never have been registered on this machine.
        unregisterPlugin(cli, manifestName);
      }
    }
    uninstallPlugin(name, args);
  }
  console.log(args.dryRun ? '\n[dry-run] No files removed.' : '\n✅ Uninstallation complete.');
}

const args = parseArgs(process.argv);
args.uninstall ? uninstall(args) : install(args);
