#!/usr/bin/env node
'use strict';
// resolve-deps.js — Plugin dependency resolution (P1-6).
//
// Reads marketplace catalogs (root marketplace.json + .codebuddy-plugin/marketplace.json)
// and each plugin's manifest `dependencies` field, then:
//   1. Parses dependency specs: "name", "name@market", or "name@market@range"
//      (range = semver range: ^1.2.3, ~1.2.3, >=1.2.3, 1.2.3, *)
//   2. Verifies every referenced plugin exists in a known marketplace
//   3. Verifies version ranges against the candidate's declared version
//   4. Detects dependency cycles via topological sort (DFS three-color)
//   5. Reports cross-marketplace deps that lack allowCrossMarketplaceDependenciesOn
//
// Usage:
//   node scripts/resolve-deps.js                 # check all plugins
//   node scripts/resolve-deps.js --plugin graph-workflow
//   node scripts/resolve-deps.js --json          # machine-readable report
//
// Exit codes: 0 = all resolvable, 1 = missing/cycle/version errors, 2 = usage error.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PLUGINS_DIR = path.join(ROOT, 'plugins');

const MARKETPLACE_FILES = [
  path.join(ROOT, 'marketplace.json'),
  path.join(ROOT, '.codebuddy-plugin', 'marketplace.json'),
  path.join(ROOT, '.claude-plugin', 'marketplace.json'),
];

const MANIFEST_SITES = [
  '.codebuddy-plugin/plugin.json',
  '.zcode-plugin/plugin.json',
  '.trae-plugin/plugin.json',
  '.qoder-plugin/plugin.json',
  '.qwen-plugin/qwen-extension.json',
];

// ─── mini semver range matcher (no deps) ───────────────────────

function parseVer(v) {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function cmpVer(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

// Supports: "*", "1.2.3", "^1.2.3", "~1.2.3", ">=1.2.3", ">1.2.3", "<=1.2.3", "<1.2.3"
function satisfies(version, range) {
  const v = parseVer(version);
  if (!v) return false;
  const r = String(range).trim();
  if (r === '*' || r === '') return true;
  const m = r.match(/^(\^|~|>=|<=|>|<)?\s*(\d+\.\d+\.\d+)$/);
  if (!m) return false; // unsupported range syntax — treat as unsatisfiable, caller reports
  const base = parseVer(m[2]);
  const op = m[1] || '=';
  switch (op) {
    case '=': return cmpVer(v, base) === 0;
    case '>=': return cmpVer(v, base) >= 0;
    case '>': return cmpVer(v, base) > 0;
    case '<=': return cmpVer(v, base) <= 0;
    case '<': return cmpVer(v, base) < 0;
    case '^': return cmpVer(v, base) >= 0 && v[0] === base[0] && (base[0] > 0 || v[1] === base[1]);
    case '~': return cmpVer(v, base) >= 0 && v[0] === base[0] && v[1] === base[1];
    default: return false;
  }
}

// ─── dependency spec parsing ────────────────────────────────────

// "name" | "name@market" | "name@market@range" | "name@range"
// Disambiguation: a middle segment that looks like a semver range is a range.
function parseDepSpec(spec) {
  const parts = String(spec).split('@').filter((s) => s !== '');
  if (parts.length === 0 || parts.length > 3) return { error: `malformed dependency spec: "${spec}"` };
  const looksRange = (s) => /^(\^|~|>=|<=|>|<)?\d+\.\d+\.\d+$/.test(s) || s === '*';
  if (parts.length === 1) return { name: parts[0], market: null, range: null };
  if (parts.length === 2) {
    if (looksRange(parts[1])) return { name: parts[0], market: null, range: parts[1] };
    return { name: parts[0], market: parts[1], range: null };
  }
  return { name: parts[0], market: parts[1], range: parts[2] };
}

// ─── catalog loading ────────────────────────────────────────────

function loadMarketplaces() {
  // market name → { plugins: Map(name → {version, source}), allowCross: string[] }
  const markets = new Map();
  for (const file of MARKETPLACE_FILES) {
    if (!fs.existsSync(file)) continue;
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (e) {
      console.error(`Error: cannot parse marketplace file ${file}: ${e.message}`);
      process.exit(2);
    }
    const name = data.name || path.basename(path.dirname(file));
    const plugins = new Map();
    for (const entry of data.plugins || []) {
      if (entry && entry.name) plugins.set(entry.name, { version: entry.version || null, source: entry.source || null });
    }
    markets.set(name, {
      plugins,
      allowCross: data.allowCrossMarketplaceDependenciesOn || [],
      file,
    });
  }
  return markets;
}

// Find which marketplace a plugin source dir belongs to (by marketplace plugins[].source).
function findPluginMarket(markets, pluginDirName) {
  for (const [marketName, m] of markets) {
    for (const [, info] of m.plugins) {
      if (typeof info.source === 'string' && info.source.replace(/^\.\//, '').replace(/\\/g, '/') === `plugins/${pluginDirName}`) {
        return marketName;
      }
    }
  }
  return null;
}

function readPluginManifest(pluginName) {
  // Prefer the authoritative codebuddy manifest; fall back to any site.
  for (const rel of MANIFEST_SITES) {
    const p = path.join(PLUGINS_DIR, pluginName, rel);
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      } catch { /* try next */ }
    }
  }
  return null;
}

// Resolve a marketplace entry name to its repo plugin dir name via the entry's
// `source` field (falls back to stripping a `-<platform>` suffix if not found).
function repoNameOf(entryName, markets) {
  for (const [, m] of markets) {
    const info = m.plugins.get(entryName);
    if (info && typeof info.source === 'string') {
      const norm = info.source.replace(/^\.\//, '').replace(/\\/g, '/');
      const mm = norm.match(/^plugins\/([^/]+)$/);
      if (mm) return mm[1];
    }
  }
  return entryName.replace(/-(zcode|codebuddy|trae|qoder|qwen|claude)$/, '');
}

// ─── resolution ─────────────────────────────────────────────────

function resolveAll(markets, pluginNames) {
  const errors = [];
  const graph = new Map(); // repoName → string[] (dependency repoNames)
  const report = [];

  for (const pluginName of pluginNames) {
    const manifest = readPluginManifest(pluginName);
    const deps = (manifest && Array.isArray(manifest.dependencies)) ? manifest.dependencies : [];
    const myMarket = findPluginMarket(markets, pluginName);
    const resolvedDeps = [];

    for (const spec of deps) {
      const parsed = parseDepSpec(spec);
      if (parsed.error) {
        errors.push({ plugin: pluginName, type: 'malformed', detail: parsed.error });
        continue;
      }
      const depRepo = repoNameOf(parsed.name, markets);

      // Existence: in any marketplace, or as a repo plugin dir.
      const inMarket = [...markets.values()].some((m) => m.plugins.has(parsed.name));
      const inRepo = fs.existsSync(path.join(PLUGINS_DIR, depRepo));
      if (!inMarket && !inRepo) {
        errors.push({ plugin: pluginName, type: 'missing', detail: `dependency "${parsed.name}" not found in any marketplace or plugins/ dir` });
        continue;
      }

      // Cross-marketplace check.
      if (parsed.market && myMarket && parsed.market !== myMarket) {
        const my = markets.get(myMarket);
        if (my && !my.allowCross.includes(parsed.market)) {
          errors.push({ plugin: pluginName, type: 'cross-market', detail: `depends on ${parsed.name}@${parsed.market} but ${myMarket} does not allowCrossMarketplaceDependenciesOn it` });
        }
      }

      // Version range check against the marketplace-declared or manifest version.
      if (parsed.range) {
        let candidateVersion = null;
        for (const [, m] of markets) {
          const info = m.plugins.get(parsed.name);
          if (info && info.version) { candidateVersion = info.version; break; }
        }
        if (!candidateVersion && inRepo) {
          const depManifest = readPluginManifest(depRepo);
          candidateVersion = depManifest && depManifest.version;
        }
        if (candidateVersion && !satisfies(candidateVersion, parsed.range)) {
          errors.push({ plugin: pluginName, type: 'version', detail: `dependency "${parsed.name}" version ${candidateVersion} does not satisfy ${parsed.range}` });
        }
      }
      resolvedDeps.push(depRepo);
    }
    graph.set(pluginName, resolvedDeps);
    report.push({ plugin: pluginName, market: myMarket, dependencies: resolvedDeps });
  }

  // Cycle detection (three-color DFS).
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map([...graph.keys()].map((k) => [k, WHITE]));
  const cycles = [];
  function dfs(node, stack) {
    color.set(node, GRAY);
    for (const dep of graph.get(node) || []) {
      if (!graph.has(dep)) continue;
      if (color.get(dep) === GRAY) {
        cycles.push([...stack, node, dep].join(' → '));
      } else if (color.get(dep) === WHITE) {
        dfs(dep, [...stack, node]);
      }
    }
    color.set(node, BLACK);
  }
  for (const k of graph.keys()) if (color.get(k) === WHITE) dfs(k, []);
  for (const c of cycles) errors.push({ plugin: null, type: 'cycle', detail: c });

  return { errors, report, graph };
}

// ─── CLI ────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { plugin: null, json: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') args.plugin = argv[++i];
    else if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/resolve-deps.js [--plugin <name>] [--json]');
      process.exit(0);
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const markets = loadMarketplaces();
  let pluginNames = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name);
  if (args.plugin) {
    if (!pluginNames.includes(args.plugin)) {
      console.error(`Unknown plugin: ${args.plugin}. Available: ${pluginNames.join(', ')}`);
      process.exit(2);
    }
    pluginNames = [args.plugin];
  }

  const { errors, report } = resolveAll(markets, pluginNames);

  if (args.json) {
    console.log(JSON.stringify({ errors, report }, null, 2));
  } else {
    for (const r of report) {
      const depStr = r.dependencies.length ? r.dependencies.join(', ') : '(none)';
      console.log(`📦 ${r.plugin}  [market: ${r.market || 'unregistered'}]  deps: ${depStr}`);
    }
    console.log(`${'='.repeat(50)}`);
    if (errors.length) {
      for (const e of errors) {
        console.error(`❌ ${e.plugin || 'global'} [${e.type}] ${e.detail}`);
      }
    } else {
      console.log(`✅ ${report.length} plugin(s) — all dependencies resolvable, no cycles`);
    }
  }
  process.exit(errors.length ? 1 : 0);
}

main();
