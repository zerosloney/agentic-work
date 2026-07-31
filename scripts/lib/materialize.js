'use strict';
// lib/materialize.js — Shared plugin assembly for CodeBuddy.
//
// Used by both scripts/materialize-codebuddy.js (produces dist/codebuddy/) and
// scripts/install-codebuddy.js (installs into ~/.codebuddy/plugins/). Keeping
// the assembly logic in one place guarantees the two paths produce identical
// plugin trees, so marketplace `source` directories and script-installed
// directories stay in sync.
//
// Source layout (post-flatten): plugins/<name>/agents/ holds a SINGLE baseline
// (ZCode frontmatter). Per-platform agent copies no longer exist. CodeBuddy
// frontmatter is DERIVED from the baseline at assembly time (derive-platform.js),
// so the output tree contains CodeBuddy-compatible agents while the source stays
// single-copy.
//
// Assembly rules per plugin:
//   1. wipe <destRoot>/<name>-codebuddy/                (idempotent)
//   2. copy plugins/<name>/ → dest, skipping platform manifest/agent subdirs
//      (brings in shared skills/, commands/, agents/ baseline, scripts/ + .codebuddy-plugin/)
//   3. copy plugins/<name>/.codebuddy-plugin/plugin.json → dest/.codebuddy-plugin/
//   4. derive agents/ → dest/agents/ with CodeBuddy frontmatter (overwrites baseline copies)
//   5. flatten hooks/zcode+codebuddy configs: dest keeps hooks/*.js + hooks/hooks.json (codebuddy)

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./copy-dir');
const { deriveAgents } = require('./derive-platform');

const REPO_ROOT = path.join(__dirname, '..', '..');
// Directories under plugins/<name>/ that must NOT enter the CodeBuddy tree:
//   - .<platform>-plugin/ competitor platform manifests (copied explicitly below)
//   - hooks/ handled separately (selective copy, not blanket)
const SKIP_PLATFORM_DIRS = [
  '.zcode-plugin', '.trae-plugin', '.qoder-plugin', '.qwen-plugin',
  'hooks', // copied selectively in step 5
];

function deleteDirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Read the description field from a plugin's codebuddy manifest.
 * Returns '' if the manifest or field is missing.
 */
function readCodebuddyDescription(pluginName) {
  const manifestPath = path.join(
    REPO_ROOT, 'plugins', pluginName, '.codebuddy-plugin', 'plugin.json'
  );
  try {
    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    return typeof data.description === 'string' ? data.description : '';
  } catch (_) {
    return '';
  }
}

// Copy hooks for codebuddy: shared *.js + codebuddy/hooks.json flattened to hooks/hooks.json.
function copyHooksCodebuddy(pluginRoot, dest, dryRun) {
  const hooksSrc = path.join(pluginRoot, 'hooks');
  if (!fs.existsSync(hooksSrc)) return;
  const platConfig = path.join(hooksSrc, 'codebuddy', 'hooks.json');
  if (!fs.existsSync(platConfig)) return;
  const hooksDest = path.join(dest, 'hooks');
  const scripts = fs.readdirSync(hooksSrc).filter((f) => f.endsWith('.js'));
  if (!dryRun) {
    fs.mkdirSync(hooksDest, { recursive: true });
    for (const f of scripts) fs.copyFileSync(path.join(hooksSrc, f), path.join(hooksDest, f));
    fs.copyFileSync(platConfig, path.join(hooksDest, 'hooks.json'));
    console.log(`  ${dryRun ? 'would copy' : 'copied'}: hooks/ (${scripts.length} scripts + codebuddy/hooks.json → hooks.json)`);
  } else {
    console.log(`  would copy: ${scripts.length} hook scripts + codebuddy/hooks.json → hooks/hooks.json`);
  }
}

/**
 * Assemble a single plugin's CodeBuddy tree under <destRoot>/<name>-codebuddy/.
 *
 * @param {string} pluginName  e.g. 'dotnet-work' | 'agentic-workflow'
 * @param {string} destRoot    absolute path; plugin goes into <destRoot>/<name>-codebuddy/
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun=false]  if true, log actions but write nothing
 */
function materializePlugin(pluginName, destRoot, opts = {}) {
  const dryRun = !!opts.dryRun;
  const installName = `${pluginName}-codebuddy`;
  const dest = path.join(destRoot, installName);
  const pluginRoot = path.join(REPO_ROOT, 'plugins', pluginName);
  const manifestSrc = path.join(pluginRoot, '.codebuddy-plugin', 'plugin.json');

  if (!fs.existsSync(pluginRoot)) {
    throw new Error(`source not found: ${pluginRoot}`);
  }
  if (!fs.existsSync(manifestSrc)) {
    throw new Error(`codebuddy manifest not found: ${manifestSrc}`);
  }

  // 1. wipe (idempotent)
  if (fs.existsSync(dest)) {
    if (!dryRun) deleteDirRecursive(dest);
    console.log(`  ${dryRun ? 'would wipe' : 'wiped'}: ${dest}`);
  }

  // 2. copy shared content (skills/commands/agents baseline/scripts + .codebuddy-plugin), skipping platform subdirs + hooks
  if (!dryRun) {
    copyDirRecursive(pluginRoot, dest, { skip: name => SKIP_PLATFORM_DIRS.includes(name) });
  }
  console.log(`  ${dryRun ? 'would copy' : 'copied'}: ${pluginRoot} → ${dest}`);

  // 3. codebuddy manifest (ensure .codebuddy-plugin/ dir + plugin.json)
  const manifestDestDir = path.join(dest, '.codebuddy-plugin');
  if (!dryRun) {
    fs.mkdirSync(manifestDestDir, { recursive: true });
    fs.copyFileSync(manifestSrc, path.join(manifestDestDir, 'plugin.json'));
  }
  console.log(`  ${dryRun ? 'would write' : 'wrote'} manifest: .codebuddy-plugin/plugin.json`);

  // 4. derive agents frontmatter for CodeBuddy (overwrites baseline copies from step 2)
  const agentsSrc = path.join(pluginRoot, 'agents');
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(dest, 'agents');
    const n = deriveAgents(agentsSrc, 'codebuddy', agentsDest, { dryRun });
    console.log(`  ${dryRun ? 'would derive' : 'derived'}: agents/ (${n} files, zcode frontmatter → codebuddy)`);
  }

  // 5. hooks (selective): shared JS + codebuddy config flattened
  copyHooksCodebuddy(pluginRoot, dest, dryRun);

  return dest;
}

module.exports = {
  REPO_ROOT,
  SKIP_PLATFORM_DIRS,
  materializePlugin,
  readCodebuddyDescription,
  deleteDirRecursive,
};
