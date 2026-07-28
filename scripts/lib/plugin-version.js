'use strict';
// lib/plugin-version.js — Single source of truth for plugin versions.
//
// The plugin manifest (.codebuddy-plugin/plugin.json) is the authoritative
// version source. All install scripts, materialization, and SKILL.md files
// derive their version from here — never hardcode PLUGIN_VERSION in scripts.
//
// Usage:
//   const { getPluginVersion, assertVersionSync } = require('./lib/plugin-version');
//   const v = getPluginVersion('dotnet-work');  // reads from manifest
//   assertVersionSync('dotnet-work');           // throws if SKILL.md / marketplace drift

const fs = require('fs');
const path = require('path');
const { REPO_ROOT } = require('./materialize');

/**
 * Read the version string from a plugin's codebuddy manifest.
 * That manifest is the single source of truth for the plugin version.
 *
 * @param {string} pluginName  e.g. 'dotnet-work' | 'agentic-workflow'
 * @returns {string}  semver version, e.g. '0.1.0'
 * @throws  if manifest missing or has no version field
 */
function getPluginVersion(pluginName) {
  const manifestPath = path.join(
    REPO_ROOT, 'plugins', pluginName, '.codebuddy-plugin', 'plugin.json'
  );
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Version source not found: ${manifestPath}`);
  }
  const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  if (!data.version || typeof data.version !== 'string') {
    throw new Error(`Missing "version" in ${manifestPath}`);
  }
  return data.version;
}

/**
 * Get versions for multiple plugins at once.
 * @param {string[]} pluginNames
 * @returns {Object}  { pluginName: version }
 */
function getPluginVersions(pluginNames) {
  const result = {};
  for (const name of pluginNames) {
    result[name] = getPluginVersion(name);
  }
  return result;
}

// ─── Sync detection (used by bump-version.js and CI checks) ───

/**
 * Collect every place a plugin's version is expressed.
 * Used by bump-version.js to know what to update, and by
 * assertVersionSync to detect drift.
 *
 * @param {string} pluginName
 * @returns {Array<{ file: string, line: number, current: string, pattern: string }>}
 */
function collectVersionSites(pluginName) {
  const expected = getPluginVersion(pluginName);
  const sites = [];

  // 1. .codebuddy-plugin/plugin.json (source of truth — always matches itself)
  sites.push({
    file: path.join('plugins', pluginName, '.codebuddy-plugin', 'plugin.json'),
    current: expected,
    pattern: 'json-manifest',
    isSource: true,
  });

  // 2. .zcode-plugin/plugin.json (should match)
  const zcodeManifest = path.join(REPO_ROOT, 'plugins', pluginName, '.zcode-plugin', 'plugin.json');
  if (fs.existsSync(zcodeManifest)) {
    const v = JSON.parse(fs.readFileSync(zcodeManifest, 'utf-8')).version;
    sites.push({
      file: path.join('plugins', pluginName, '.zcode-plugin', 'plugin.json'),
      current: v,
      pattern: 'json-manifest',
      isSource: false,
    });
  }

  // 3. .trae-plugin/plugin.json (should match)
  const traeManifest = path.join(REPO_ROOT, 'plugins', pluginName, '.trae-plugin', 'plugin.json');
  if (fs.existsSync(traeManifest)) {
    const v = JSON.parse(fs.readFileSync(traeManifest, 'utf-8')).version;
    sites.push({
      file: path.join('plugins', pluginName, '.trae-plugin', 'plugin.json'),
      current: v,
      pattern: 'json-manifest',
      isSource: false,
    });
  }

  // 4. .qoder-plugin/plugin.json (should match)
  const qoderManifest = path.join(REPO_ROOT, 'plugins', pluginName, '.qoder-plugin', 'plugin.json');
  if (fs.existsSync(qoderManifest)) {
    const v = JSON.parse(fs.readFileSync(qoderManifest, 'utf-8')).version;
    sites.push({
      file: path.join('plugins', pluginName, '.qoder-plugin', 'plugin.json'),
      current: v,
      pattern: 'json-manifest',
      isSource: false,
    });
  }

  // 5. .qwen-plugin/qwen-extension.json (should match)
  const qwenManifest = path.join(REPO_ROOT, 'plugins', pluginName, '.qwen-plugin', 'qwen-extension.json');
  if (fs.existsSync(qwenManifest)) {
    const v = JSON.parse(fs.readFileSync(qwenManifest, 'utf-8')).version;
    sites.push({
      file: path.join('plugins', pluginName, '.qwen-plugin', 'qwen-extension.json'),
      current: v,
      pattern: 'json-manifest',
      isSource: false,
    });
  }

  // 6. SKILL.md files (YAML frontmatter `version: X.Y.Z`)
  const skillsDir = path.join(REPO_ROOT, 'plugins', pluginName, 'skills');
  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillMd = path.join(skillsDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;
      const content = fs.readFileSync(skillMd, 'utf-8');
      const match = content.match(/^\s{2}version:\s*(\S+)/m);
      sites.push({
        file: path.join('plugins', pluginName, 'skills', entry.name, 'SKILL.md'),
        current: match ? match[1] : '(missing)',
        pattern: 'yaml-frontmatter',
        isSource: false,
      });
    }
  }

  // 7. marketplace.json (the root .codebuddy-plugin/marketplace.json)
  const marketplaceFile = path.join(REPO_ROOT, '.codebuddy-plugin', 'marketplace.json');
  if (fs.existsSync(marketplaceFile)) {
    const marketplace = JSON.parse(fs.readFileSync(marketplaceFile, 'utf-8'));
    const entry = (marketplace.plugins || []).find(p => p.name === `${pluginName}-codebuddy`);
    if (entry) {
      sites.push({
        file: '.codebuddy-plugin/marketplace.json',
        current: entry.version,
        pattern: 'marketplace-entry',
        isSource: false,
      });
    }
  }

  return sites;
}

/**
 * Check that all version sites match the manifest.
 * @param {string} pluginName
 * @returns {{ ok: boolean, expected: string, drifts: Array<{file, current}> }}
 */
function checkVersionSync(pluginName) {
  const expected = getPluginVersion(pluginName);
  const sites = collectVersionSites(pluginName);
  const drifts = sites.filter(s => !s.isSource && s.current !== expected);
  return { ok: drifts.length === 0, expected, drifts };
}

/**
 * Throw if any site drifts from the manifest version.
 * @param {string} pluginName
 */
function assertVersionSync(pluginName) {
  const { ok, expected, drifts } = checkVersionSync(pluginName);
  if (ok) return;
  const detail = drifts.map(d => `  - ${d.file}: "${d.current}" (expected "${expected}")`).join('\n');
  throw new Error(
    `Version drift detected for "${pluginName}":\n${detail}\n` +
    `Run: node scripts/bump-version.js --plugin ${pluginName}`
  );
}

module.exports = {
  getPluginVersion,
  getPluginVersions,
  collectVersionSites,
  checkVersionSync,
  assertVersionSync,
};
