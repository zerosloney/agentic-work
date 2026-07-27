#!/usr/bin/env node
'use strict';
// bump-version.js — Single-command version sync for agentic-work plugins.
//
// The plugin manifest (.codebuddy-plugin/plugin.json) is the single source of
// truth. This script reads that version and propagates it to:
//   - .zcode-plugin/plugin.json
//   - all skills/*/SKILL.md (YAML frontmatter)
//   - .codebuddy-plugin/marketplace.json (the root marketplace entry)
//
// Usage:
//   node scripts/bump-version.js --plugin dotnet-work          # sync all sites from manifest
//   node scripts/bump-version.js --plugin dotnet-work --check   # dry-run: show what would change
//   node scripts/bump-version.js --plugin dotnet-work --set 1.2.0  # bump manifest + sync all
//   node scripts/bump-version.js --all                          # sync all plugins
//
// After running, the manifest version is the only place you ever edit.

const fs = require('fs');
const path = require('path');
const { REPO_ROOT } = require('./lib/materialize');
const { getPluginVersion, collectVersionSites } = require('./lib/plugin-version');

const PLUGINS = ['dotnet-work', 'loop-workflow'];

function parseArgs(argv) {
  const args = { plugin: null, all: false, check: false, set: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --plugin requires a value');
        process.exit(2);
      }
      args.plugin = next;
      i++;
    } else if (argv[i] === '--all') {
      args.all = true;
    } else if (argv[i] === '--check') {
      args.check = true;
    } else if (argv[i] === '--set') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --set requires a semver value (e.g. 0.2.0)');
        process.exit(2);
      }
      args.set = next;
      i++;
    } else {
      console.error(`Error: unknown argument: ${argv[i]}`);
      process.exit(2);
    }
  }
  return args;
}

function selectPlugins(args) {
  if (args.all) return PLUGINS;
  if (args.plugin) {
    if (!PLUGINS.includes(args.plugin)) {
      console.error(`Unknown plugin: ${args.plugin}. Available: ${PLUGINS.join(', ')}`);
      process.exit(1);
    }
    return [args.plugin];
  }
  console.error('Error: specify --plugin <name> or --all');
  process.exit(2);
}

/**
 * Update the manifest version (only when --set is used).
 */
function setManifestVersion(pluginName, newVersion) {
  const files = [
    path.join('plugins', pluginName, '.codebuddy-plugin', 'plugin.json'),
    path.join('plugins', pluginName, '.zcode-plugin', 'plugin.json'),
  ];
  for (const rel of files) {
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const data = JSON.parse(fs.readFileSync(abs, 'utf-8'));
    data.version = newVersion;
    fs.writeFileSync(abs, JSON.stringify(data, null, 2) + '\n');
    console.log(`  ✏️  ${rel} → ${newVersion}`);
  }
}

/**
 * Sync version into a SKILL.md YAML frontmatter.
 *
 * Two cases:
 *   1. `version:` already exists → replace its value in place.
 *   2. `metadata:` block exists but has no `version:` → add it as the last
 *      field before the closing `---`.
 *   3. No `metadata:` block at all → add a minimal one with name + version
 *      (rare; only for skills that lack it entirely).
 *
 * @returns true if a write occurred.
 */
function syncSkillMd(filePath, newVersion) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Case 1: version field exists — replace in place
  if (/^ {2}version:\s*\S+/m.test(content)) {
    const updated = content.replace(
      /^( {2}version:\s*)(\S+)/m,
      `$1${newVersion}`
    );
    if (updated !== content) {
      fs.writeFileSync(filePath, updated);
      return true;
    }
    return false;
  }

  // Case 2: metadata block exists but no version → add before closing ---
  if (/^metadata:\s*$/m.test(content)) {
    // Find the metadata: line and the next --- (frontmatter end)
    const lines = content.split('\n');
    const metaIdx = lines.findIndex(l => /^metadata:\s*$/.test(l));
    // Find the closing --- after metadata:
    let closeIdx = -1;
    for (let i = metaIdx + 1; i < lines.length; i++) {
      if (/^---$/.test(lines[i]) && i > metaIdx) {
        closeIdx = i;
        break;
      }
    }
    if (closeIdx >= 0) {
      // Insert version as the last field in metadata block (before ---)
      lines.splice(closeIdx, 0, `  version: ${newVersion}`);
      fs.writeFileSync(filePath, lines.join('\n'));
      return true;
    }
  }

  // Case 3: no metadata block → add one after the name: field (or after ---)
  // This is a fallback for skills that lack metadata entirely.
  const lines = content.split('\n');
  const nameIdx = lines.findIndex(l => /^name:\s*/.test(l));
  if (nameIdx >= 0) {
    // Insert metadata block after name line
    lines.splice(nameIdx + 1, 0, 'metadata:', `  version: ${newVersion}`);
    fs.writeFileSync(filePath, lines.join('\n'));
    return true;
  }

  return false;
}

/**
 * Sync version into the root marketplace.json for a plugin's entry.
 */
function syncMarketplace(pluginName, newVersion) {
  const marketplaceFile = path.join(REPO_ROOT, '.codebuddy-plugin', 'marketplace.json');
  if (!fs.existsSync(marketplaceFile)) return false;
  const data = JSON.parse(fs.readFileSync(marketplaceFile, 'utf-8'));
  const entry = (data.plugins || []).find(p => p.name === `${pluginName}-codebuddy`);
  if (!entry || entry.version === newVersion) return false;
  entry.version = newVersion;
  fs.writeFileSync(marketplaceFile, JSON.stringify(data, null, 2) + '\n');
  return true;
}

function syncPlugin(pluginName, args) {
  console.log(`\n📦 ${pluginName}`);

  // 1. Optionally bump the manifest itself
  if (args.set) {
    setManifestVersion(pluginName, args.set);
  }

  // 2. Read the authoritative version from manifest
  const version = args.set || getPluginVersion(pluginName);
  console.log(`   Source version: ${version}`);

  // 3. Collect current state
  const sites = collectVersionSites(pluginName);
  const drifts = sites.filter(s => !s.isSource && s.current !== version);

  if (drifts.length === 0) {
    console.log('   ✅ All sites in sync.');
    return;
  }

  if (args.check) {
    console.log(`   ⚠️  ${drifts.length} site(s) out of sync:`);
    for (const d of drifts) {
      console.log(`      ${d.file}: "${d.current}" → "${version}"`);
    }
    return;
  }

  // 4. Apply sync
  for (const site of drifts) {
    if (site.pattern === 'json-manifest') {
      // .zcode-plugin/plugin.json — update JSON field
      const abs = path.join(REPO_ROOT, site.file);
      const data = JSON.parse(fs.readFileSync(abs, 'utf-8'));
      data.version = version;
      fs.writeFileSync(abs, JSON.stringify(data, null, 2) + '\n');
      console.log(`   🔄 ${site.file}: ${site.current} → ${version}`);
    } else if (site.pattern === 'yaml-frontmatter') {
      const abs = path.join(REPO_ROOT, site.file);
      if (syncSkillMd(abs, version)) {
        console.log(`   🔄 ${site.file}: ${site.current} → ${version}`);
      }
    } else if (site.pattern === 'marketplace-entry') {
      if (syncMarketplace(pluginName, version)) {
        console.log(`   🔄 ${site.file}: ${site.current} → ${version}`);
      }
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  const plugins = selectPlugins(args);

  if (args.set) {
    console.log(`Bumping ${plugins.join(', ')} → ${args.set} and syncing...\n`);
  } else if (args.check) {
    console.log(`Checking version sync for ${plugins.join(', ')}...\n`);
  } else {
    console.log(`Syncing versions for ${plugins.join(', ')}...\n`);
  }

  for (const name of plugins) {
    syncPlugin(name, args);
  }

  console.log('');
  if (args.check) {
    // Exit non-zero if any drift found (CI-friendly)
    const anyDrift = plugins.some(p => {
      const { ok } = require('./lib/plugin-version').checkVersionSync(p);
      return !ok;
    });
    if (anyDrift) {
      console.log('❌ Version drift detected. Run without --check to fix.');
      process.exit(1);
    } else {
      console.log('✅ All versions in sync.');
    }
  } else {
    console.log('✅ Done. Only .codebuddy-plugin/plugin.json needs future edits.');
  }
}

main();
