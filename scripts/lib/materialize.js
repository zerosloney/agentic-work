'use strict';
// lib/materialize.js — Shared plugin assembly for CodeBuddy.
//
// Used by both scripts/materialize-codebuddy.js (produces dist/codebuddy/) and
// scripts/install-codebuddy.js (installs into ~/.codebuddy/plugins/). Keeping
// the assembly logic in one place guarantees the two paths produce identical
// plugin trees, so marketplace `source` directories and script-installed
// directories stay in sync.
//
// Assembly rules per plugin (mirrors AGENTS.md "Layout invariants"):
//   1. wipe <destRoot>/<name>-codebuddy/                (idempotent)
//   2. copy plugins/<name>/ → dest, skipping codebuddy/ + .zcode-plugin/ subdirs
//      (brings in shared skills/, commands/, agents/, scripts/ plus .codebuddy-plugin/)
//   3. copy plugins/<name>/.codebuddy-plugin/plugin.json → dest/.codebuddy-plugin/
//   4. overlay plugins/<name>/codebuddy/agents/*.md onto dest/agents/
//      (replaces shared agents whose frontmatter uses fields CodeBuddy
//       doesn't recognise — mode/temperature/steps/nested permission — with
//       the CodeBuddy-adapted permissionMode versions)

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./copy-dir');

const REPO_ROOT = path.join(__dirname, '..', '..');
// Directories under plugins/<name>/ that must NOT enter the CodeBuddy tree:
//   - codebuddy/      holds CodeBuddy agent overrides only (overlaid separately in step 4)
//   - .zcode-plugin/  competitor platform manifest (root-level now); must not pollute dist
//   - .trae-plugin/   Trae platform manifest
//   - .qoder-plugin/  Qoder platform manifest
//   - .qwen-plugin/   Qwen Code platform manifest
//   - zcode/          ZCode agents directory
//   - trae/           Trae agents directory
//   - qoder/          Qoder agents directory
//   - qwencode/       Qwen Code agents directory
const SKIP_PLATFORM_DIRS = ['codebuddy', '.zcode-plugin', '.trae-plugin', '.qoder-plugin', '.qwen-plugin', 'zcode', 'trae', 'qoder', 'qwencode'];

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

  // 2. copy shared content (skills/commands/agents/scripts + root manifests), skipping platform subdirs
  if (!dryRun) {
    copyDirRecursive(pluginRoot, dest, { skip: name => SKIP_PLATFORM_DIRS.includes(name) });
  }
  console.log(`  ${dryRun ? 'would copy' : 'copied'}: ${pluginRoot} → ${dest}`);

  // 3. codebuddy manifest (already copied in step 2, but ensure .codebuddy-plugin/ dir exists)
  const manifestDestDir = path.join(dest, '.codebuddy-plugin');
  if (!dryRun) {
    fs.mkdirSync(manifestDestDir, { recursive: true });
    fs.copyFileSync(manifestSrc, path.join(manifestDestDir, 'plugin.json'));
  }
  console.log(`  ${dryRun ? 'would write' : 'wrote'} manifest: .codebuddy-plugin/plugin.json`);

  // 4. overlay codebuddy agent overrides (only if codebuddy/agents/ exists)
  const overridesDir = path.join(pluginRoot, 'codebuddy', 'agents');
  if (fs.existsSync(overridesDir)) {
    for (const entry of fs.readdirSync(overridesDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const srcFile = path.join(overridesDir, entry.name);
      const dstFile = path.join(dest, 'agents', entry.name);
      if (!dryRun) {
        fs.mkdirSync(path.join(dest, 'agents'), { recursive: true });
        fs.copyFileSync(srcFile, dstFile);
      }
      console.log(`  ${dryRun ? 'would overlay' : 'overlaid'}: agents/${entry.name}`);
    }
  }

  return dest;
}

module.exports = {
  REPO_ROOT,
  SKIP_PLATFORM_DIRS,
  materializePlugin,
  readCodebuddyDescription,
  deleteDirRecursive,
};
