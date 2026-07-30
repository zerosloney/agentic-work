#!/usr/bin/env node
'use strict';
// discover-skills.js — Dynamic skill discovery for infer-skill (P1-7).
//
// Scans plugins/<plugin>/skills/<skill-name>/ directories and builds a skill
// map so NEW skills are observed by skill-radar without editing infer-skill.js.
//
// Design (conservative — false negative OK, false positive corrupts metrics):
//   - PATH rules are fully automatic: any Edit/Write whose file_path contains a
//     known skill directory name is attributed to that skill. Directory names
//     are exact, so this is safe.
//   - BASH keyword rules come from a curated OVERRIDES table only (kept in
//     infer-skill.js) — auto-derived keywords would be noisy.
//   - Results are cached in <data-dir>/skill-map.json with a fingerprint of
//     the plugins directory (names + mtimes); the cache regenerates whenever
//     the tree changes.
//
// CLI: node discover-skills.js [--plugins-dir <dir>] [--cache <file>] [--print]

const fs = require('fs');
const path = require('path');

const STOPWORDS = new Set(['dev', 'flow', 'skill', 'plugin', 'work', 'the', 'and']);

// Significant kebab segments of a skill name, usable as conservative bash hints.
// Length >= 4 and not a stopword. These only ADD to curated rules; they are
// matched as whole words by the caller.
function significantSegments(skillName) {
  return skillName.split('-').filter((s) => s.length >= 4 && !STOPWORDS.has(s));
}

function fingerprintTree(pluginsDir) {
  // Cheap tree fingerprint: "<plugin>/<skill-dir>" entries with mtimes.
  const entries = [];
  for (const plugin of safeReadDir(pluginsDir)) {
    const skillsDir = path.join(pluginsDir, plugin, 'skills');
    for (const skill of safeReadDir(skillsDir)) {
      try {
        const st = fs.statSync(path.join(skillsDir, skill));
        if (st.isDirectory()) entries.push(`${plugin}/${skill}:${Math.floor(st.mtimeMs)}`);
      } catch { /* skip */ }
    }
  }
  return entries.sort().join('|');
}

function safeReadDir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

// Build the skill map from the plugins tree.
// Returns { fingerprint, skills: { [skillName]: { plugin, pathSegments, bashHints } } }
function buildSkillMap(pluginsDir) {
  const skills = {};
  for (const plugin of safeReadDir(pluginsDir)) {
    const skillsDir = path.join(pluginsDir, plugin, 'skills');
    for (const skill of safeReadDir(skillsDir)) {
      const abs = path.join(skillsDir, skill);
      try {
        if (!fs.statSync(abs).isDirectory()) continue;
        // A real skill has SKILL.md inside.
        if (!fs.existsSync(path.join(abs, 'SKILL.md'))) continue;
      } catch { continue; }
      skills[skill] = {
        plugin,
        pathSegments: [skill],
        bashHints: significantSegments(skill),
      };
    }
  }
  return { fingerprint: fingerprintTree(pluginsDir), skills };
}

function loadCache(cacheFile, pluginsDir) {
  try {
    if (!fs.existsSync(cacheFile)) return null;
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    if (data.fingerprint !== fingerprintTree(pluginsDir)) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCache(cacheFile, map) {
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    const tmp = `${cacheFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(map));
    try {
      fs.renameSync(tmp, cacheFile);
    } catch {
      // Windows rename-over-existing fallback
      fs.writeFileSync(cacheFile, JSON.stringify(map));
      try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    }
  } catch { /* cache is best-effort */ }
}

// Resolve the skill map: cache when fresh, rebuild otherwise.
// dataDir is the skill-radar data dir (traces/signals/session.json live there).
function resolveSkillMap(pluginsDir, dataDir) {
  const cacheFile = path.join(dataDir, 'skill-map.json');
  const cached = loadCache(cacheFile, pluginsDir);
  if (cached) return cached;
  const map = buildSkillMap(pluginsDir);
  saveCache(cacheFile, map);
  return map;
}

// Find the repo plugins/ dir relative to this file (scripts/lib/ → up 4 = repo root…
// but installed layouts differ; try a few candidates).
function findPluginsDir() {
  const here = __dirname;
  const candidates = [
    path.resolve(here, '..', '..', '..', '..'),           // repo: plugins/skill-radar/scripts/lib → repo root… no, that lands on plugins/
    path.resolve(here, '..', '..', '..', '..', '..'),     // repo root
  ];
  for (const c of candidates) {
    const p = path.join(c, 'plugins');
    if (fs.existsSync(p)) return p;
  }
  // Installed layout: <install>/scripts/lib with sibling plugins unknown — give up.
  return candidates[candidates.length - 1] && fs.existsSync(path.join(candidates[candidates.length - 1], 'plugins'))
    ? path.join(candidates[candidates.length - 1], 'plugins')
    : null;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const pluginsDir = args.includes('--plugins-dir')
    ? args[args.indexOf('--plugins-dir') + 1]
    : findPluginsDir();
  const dataDir = args.includes('--cache')
    ? path.dirname(args[args.indexOf('--cache') + 1])
    : path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
  if (!pluginsDir || !fs.existsSync(pluginsDir)) {
    console.error('plugins dir not found — pass --plugins-dir');
    process.exit(2);
  }
  const map = resolveSkillMap(pluginsDir, dataDir);
  if (args.includes('--print')) console.log(JSON.stringify(map, null, 2));
  else console.log(`discovered ${Object.keys(map.skills).length} skill(s): ${Object.keys(map.skills).join(', ')}`);
}

module.exports = { resolveSkillMap, buildSkillMap, significantSegments };
