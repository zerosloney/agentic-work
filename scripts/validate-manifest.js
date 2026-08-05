#!/usr/bin/env node
'use strict';
// validate-manifest.js — Validate plugin manifests across all platforms.
//
// Checks every plugins/<name>/.<platform>-plugin/ manifest for:
//   - required fields (name, version) and their formats
//   - name pattern: ^[a-z0-9][a-z0-9._-]{0,127}$ (ZCode rule, adopted repo-wide)
//   - version: valid semver
//   - component fields (commands/skills/agents/hooks/mcpServers): correct types
//     and that referenced paths exist relative to the plugin root
//   - capabilities: required non-empty array from a fixed enum (P1-5); unknown values error
//   - qwen-extension.json: treated as a manifest variant with the same core rules
//
// Usage:
//   node scripts/validate-manifest.js              # validate all plugins
//   node scripts/validate-manifest.js --plugin graph-workflow
//   node scripts/validate-manifest.js --strict     # warnings become errors
//
// Exit codes: 0 = pass, 1 = validation errors, 2 = usage/internal error.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PLUGINS_DIR = path.join(ROOT, 'plugins');

const NAME_RE = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

// P1-5: capability enum. Declared in plugin.json as "capabilities": [...].
// Hosts/marketplaces may surface these to users at install time.
const CAPABILITIES = [
  'file-read',    // reads workspace/user files
  'file-write',   // writes or edits files
  'bash-exec',    // executes shell commands / child processes
  'network',      // outbound network access (HTTP, registries, DBs)
  'hooks',        // registers event hooks (PreToolUse/PostToolUse/Stop/...)
  'agents',       // registers sub-agents that can be delegated to
  'mcp',          // registers MCP servers
  'env-access',   // reads process environment variables / secrets
];

// Manifest locations per platform, relative to plugins/<name>/
const MANIFEST_SITES = [
  { platform: 'codebuddy', rel: '.codebuddy-plugin/plugin.json' },
  { platform: 'zcode', rel: '.zcode-plugin/plugin.json' },
  { platform: 'trae', rel: '.trae-plugin/plugin.json' },
  { platform: 'qoder', rel: '.qoder-plugin/plugin.json' },
  { platform: 'qwen', rel: '.qwen-plugin/qwen-extension.json' },
];

// Component fields whose values reference paths inside the plugin.
// type: 'path' (string), 'paths' (string[]), or 'either'.
const COMPONENT_FIELDS = {
  commands: 'either',
  skills: 'either',
  agents: 'either',
  hooks: 'path',
  mcpServers: 'either',
};

function parseArgs(argv) {
  const args = { plugin: null, strict: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --plugin requires a value');
        process.exit(2);
      }
      args.plugin = next;
      i++;
    } else if (argv[i] === '--strict') args.strict = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/validate-manifest.js [--plugin <name>] [--strict]');
      process.exit(0);
    }
  }
  return args;
}

class Reporter {
  constructor(strict) {
    this.strict = strict;
    this.errors = 0;
    this.warnings = 0;
  }
  error(site, msg) {
    this.errors++;
    console.error(`  ❌ [${site}] ${msg}`);
  }
  warn(site, msg) {
    if (this.strict) {
      this.errors++;
      console.error(`  ❌ [${site}] (strict) ${msg}`);
    } else {
      this.warnings++;
      console.warn(`  ⚠️  [${site}] ${msg}`);
    }
  }
  ok(site, msg) {
    console.log(`  ✅ [${site}] ${msg}`);
  }
}

function validateName(rep, site, manifest) {
  if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
    rep.error(site, 'missing required field: name (string)');
    return;
  }
  if (!NAME_RE.test(manifest.name)) {
    rep.error(site, `name "${manifest.name}" violates pattern ${NAME_RE}`);
  }
}

function validateVersion(rep, site, manifest) {
  if (typeof manifest.version !== 'string' || manifest.version.length === 0) {
    rep.error(site, 'missing required field: version (string, semver)');
    return;
  }
  if (!SEMVER_RE.test(manifest.version)) {
    rep.error(site, `version "${manifest.version}" is not valid semver`);
  }
}

function validateDescription(rep, site, manifest) {
  if (typeof manifest.description !== 'string' || manifest.description.trim().length === 0) {
    rep.warn(site, 'missing recommended field: description');
  }
}

function validateAuthor(rep, site, manifest) {
  if (manifest.author === undefined) return;
  const a = manifest.author;
  if (typeof a === 'string') return;
  if (typeof a === 'object' && a !== null && typeof a.name === 'string') return;
  rep.error(site, 'author must be a string or an object with a "name" string');
}

// Resolve a component path reference against the plugin root and check existence.
// Path refs ending in /*.md or containing a glob are checked by their parent dir.
function checkPathRef(rep, site, pluginRoot, field, ref) {
  if (typeof ref !== 'string') {
    rep.error(site, `${field}: path reference must be a string, got ${typeof ref}`);
    return;
  }
  const cleaned = ref.replace(/^\.\//, '');
  // Glob file entries (Qoder agents style): check parent dir only.
  const globMatch = cleaned.match(/^(.*)\/[^/]*\*[^/]*$/);
  const toCheck = globMatch ? globMatch[1] : cleaned;
  const abs = path.join(pluginRoot, toCheck);
  if (!fs.existsSync(abs)) {
    rep.error(site, `${field}: referenced path not found: ${ref} (resolved: ${toCheck})`);
  }
}

function validateComponentField(rep, site, pluginRoot, manifest, field, kind, platform) {
  const v = manifest[field];
  if (v === undefined) return;
  const isArr = Array.isArray(v);
  // Hooks path: manifest declares the INSTALL shape (hooks/hooks.json), but the
  // source holds per-platform configs at hooks/<platform>/hooks.json (flattened by
  // install scripts). Validate the source platform subdir instead of the literal path.
  if (field === 'hooks' && typeof v === 'string') {
    const platDir = platform === 'qwen' ? 'qwencode' : platform;
    checkPathRef(rep, site, pluginRoot, field, `hooks/${platDir}/hooks.json`);
    return;
  }
  if (kind === 'path') {
    if (typeof v !== 'string') {
      rep.error(site, `${field}: must be a path string, got ${isArr ? 'array' : typeof v}`);
      return;
    }
    checkPathRef(rep, site, pluginRoot, field, v);
    return;
  }
  // 'either': string or string[]
  if (typeof v === 'string') {
    checkPathRef(rep, site, pluginRoot, field, v);
    return;
  }
  if (isArr) {
    if (v.length === 0) rep.warn(site, `${field}: empty array`);
    for (const item of v) checkPathRef(rep, site, pluginRoot, field, item);
    return;
  }
  // Inline objects are legal per ZCode spec (e.g. mcpServers inline map).
  if (typeof v === 'object' && v !== null) return;
  rep.error(site, `${field}: must be a path string, string array, or inline object; got ${typeof v}`);
}

function validateCapabilities(rep, site, manifest) {
  const caps = manifest.capabilities;
  if (caps === undefined) {
    rep.error(site, 'missing required field: capabilities (P1-5 install-time permission display)');
    return;
  }
  if (!Array.isArray(caps)) {
    rep.error(site, `capabilities: must be an array, got ${typeof caps}`);
    return;
  }
  if (caps.length === 0) {
    rep.error(site, 'capabilities: must not be empty');
    return;
  }
  for (const c of caps) {
    if (!CAPABILITIES.includes(c)) {
      rep.error(site, `capabilities: unknown value "${c}" (allowed: ${CAPABILITIES.join(', ')})`);
    }
  }
}

function validateHooksFileShape(rep, site, pluginRoot, manifest, platform) {
  const hooksRef = manifest.hooks;
  if (typeof hooksRef !== 'string') return;
  // Source hooks live at hooks/<platform>/hooks.json; manifest declares the install
  // shape (hooks/hooks.json). Validate the source platform file's JSON shape.
  const platDir = platform === 'qwen' ? 'qwencode' : platform;
  const abs = path.join(pluginRoot, 'hooks', platDir, 'hooks.json');
  if (!fs.existsSync(abs)) return; // already reported by checkPathRef
  try {
    const data = JSON.parse(fs.readFileSync(abs, 'utf-8'));
    // Qwen Code uses top-level event keys (no "hooks" wrapper).
    if (platform === 'qwen') {
      if (data.hooks) rep.warn(site, `qwen hooks file (hooks/${platDir}/hooks.json) uses a "hooks" wrapper; Qwen expects top-level event keys`);
      return;
    }
    if (!data.hooks || typeof data.hooks !== 'object') {
      rep.error(site, `hooks file (hooks/${platDir}/hooks.json): expected a top-level "hooks" object (${platform} format)`);
    }
  } catch (e) {
    rep.error(site, `hooks file (hooks/${platDir}/hooks.json): invalid JSON — ${e.message}`);
  }
}

// Extract the set of event keys from a hooks config file. Qwen Code uses
// top-level event keys ({ SessionStart: [...] }); other platforms wrap them
// under a "hooks" object ({ hooks: { SessionStart: [...] } }).
function readHookEvents(absHooksPath, platform) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(absHooksPath, 'utf-8'));
  } catch {
    return null; // JSON error already reported per-manifest
  }
  if (platform === 'qwen') {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return new Set(Object.keys(data));
    }
    return new Set();
  }
  if (data && typeof data.hooks === 'object' && data.hooks !== null && !Array.isArray(data.hooks)) {
    return new Set(Object.keys(data.hooks));
  }
  return new Set();
}

// Cross-platform hook event consistency. If a plugin declares hooks for two or
// more platforms, all platforms MUST register the same set of events. Drift
// is an error (not a warning) — silent event drift is the most common
// "改一处忘三处" footgun for multi-platform plugins.
function validateHookEventConsistency(rep, pluginName) {
  // platform → set of event keys. Only includes platforms whose manifest
  // declares a hooks path AND whose source file exists.
  const platformEvents = new Map();
  for (const site of MANIFEST_SITES) {
    const manifestPath = path.join(PLUGINS_DIR, pluginName, site.rel);
    if (!fs.existsSync(manifestPath)) continue;
    let manifest;
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); }
    catch { continue; } // JSON error already reported per-manifest
    if (typeof manifest.hooks !== 'string') continue; // platform doesn't use hooks
    const platDir = site.platform === 'qwen' ? 'qwencode' : site.platform;
    const abs = path.join(PLUGINS_DIR, pluginName, 'hooks', platDir, 'hooks.json');
    if (!fs.existsSync(abs)) continue; // missing file already reported
    const events = readHookEvents(abs, site.platform);
    if (events === null) continue;
    platformEvents.set(site.platform, events);
  }
  if (platformEvents.size < 2) return; // need 2+ platforms to compare
  // Union of all event keys across platforms.
  const union = new Set();
  for (const s of platformEvents.values()) for (const e of s) union.add(e);
  // For each platform, report any event from the union it's missing.
  const drift = [];
  for (const [platform, events] of platformEvents) {
    const missing = [...union].filter((e) => !events.has(e));
    if (missing.length > 0) drift.push({ platform, missing });
  }
  if (drift.length === 0) {
    const evList = [...union].sort().join(', ');
    rep.ok(pluginName, `hook events consistent across ${platformEvents.size} platforms: { ${evList} }`);
    return;
  }
  for (const { platform, missing } of drift) {
    rep.error(pluginName, `hook event drift on '${platform}': missing ${missing.map((e) => `'${e}'`).join(', ')} (present on other platforms)`);
  }
}

function validateManifest(rep, pluginName, platform, manifestPath) {
  const site = `${pluginName}/${platform}`;
  const pluginRoot = path.join(PLUGINS_DIR, pluginName);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    rep.error(site, `manifest is not valid JSON — ${e.message}`);
    return;
  }
  validateName(rep, site, manifest);
  validateVersion(rep, site, manifest);
  validateDescription(rep, site, manifest);
  validateAuthor(rep, site, manifest);
  validateCapabilities(rep, site, manifest);
  for (const [field, kind] of Object.entries(COMPONENT_FIELDS)) {
    validateComponentField(rep, site, pluginRoot, manifest, field, kind, platform);
  }
  validateHooksFileShape(rep, site, pluginRoot, manifest, platform);
  if (rep.errors === 0) rep.ok(site, 'valid');
}

// P1-1: cross-platform version consistency. The .codebuddy-plugin manifest is
// the authoritative version source (AGENTS.md); every other platform manifest
// of the same plugin MUST carry the same version. Drift is an error, not a
// warning — version skew breaks bump-version.js's propagation contract.
function validateVersionConsistency(rep, pluginName) {
  const versions = {};
  for (const site of MANIFEST_SITES) {
    const p = path.join(PLUGINS_DIR, pluginName, site.rel);
    if (!fs.existsSync(p)) continue;
    try {
      const m = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (typeof m.version === 'string') versions[site.platform] = m.version;
    } catch { /* already reported by per-manifest validation */ }
  }
  const authoritative = versions.codebuddy;
  if (!authoritative) return; // no codebuddy manifest — nothing to compare against
  for (const [platform, v] of Object.entries(versions)) {
    if (v !== authoritative) {
      rep.error(`${pluginName}/${platform}`, `version drift: ${v} != authoritative (codebuddy) ${authoritative}. Run: node scripts/bump-version.js --plugin ${pluginName}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  const rep = new Reporter(args.strict);

  let pluginNames = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  if (args.plugin) {
    if (!pluginNames.includes(args.plugin)) {
      console.error(`Unknown plugin: ${args.plugin}. Available: ${pluginNames.join(', ')}`);
      process.exit(2);
    }
    pluginNames = [args.plugin];
  }

  let checked = 0;
  for (const name of pluginNames) {
    console.log(`\n📦 ${name}`);
    let found = 0;
    for (const site of MANIFEST_SITES) {
      const manifestPath = path.join(PLUGINS_DIR, name, site.rel);
      if (!fs.existsSync(manifestPath)) continue;
      found++;
      checked++;
      validateManifest(rep, name, site.platform, manifestPath);
    }
    if (found === 0) rep.warn(name, 'no platform manifests found');
    else {
      validateVersionConsistency(rep, name);
      validateHookEventConsistency(rep, name);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Checked ${checked} manifest(s). Errors: ${rep.errors}, warnings: ${rep.warnings}.`);
  if (rep.errors > 0) {
    console.error('❌ Manifest validation FAILED');
    process.exit(1);
  }
  console.log('✅ All manifests valid');
}

main();
