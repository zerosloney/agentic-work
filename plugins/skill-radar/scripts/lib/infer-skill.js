// infer-skill.js — map (tool_name, tool_input) to the likely skill.
//
// Shared by log-invocation.js (trace-time tagging) and evolve.js (post-hoc
// analysis). Single source of truth so the two never drift.
//
// Two layers (P1-7):
//   1. CURATED rules (below): hand-tuned bash/extension/plugin-path patterns.
//      Conservative — false negative is cheap, false positive corrupts metrics.
//   2. DISCOVERED rules (discover-skills.js): any skill directory found under
//      plugins/<plugin>/skills/<name>/ automatically gains a path rule and
//      whole-word bash hints. New skills are observed without editing this file.
//      Discovery failures fall back to curated rules silently.
//
// Order matters: most specific first.

'use strict';

const fs = require('fs');
const path = require('path');

// ─── discovered layer (dynamic) ─────────────────────────────────

let discoveredSkills = null;
let discoveryAttempted = false;

function getDataDir() {
  const envDir = process.env.ZCODE_PLUGIN_DATA || process.env.CODEBUDDY_PLUGIN_DATA;
  if (envDir) return envDir;
  return path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
}

// Walk up from scripts/lib/ looking for an ancestor that contains plugins/.
function findPluginsDir() {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'plugins');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function getDiscoveredSkills() {
  if (discoveryAttempted) return discoveredSkills;
  discoveryAttempted = true;
  try {
    const pluginsDir = findPluginsDir();
    if (!pluginsDir) return null;
    const { resolveSkillMap } = require(path.join(__dirname, 'discover-skills.js'));
    const map = resolveSkillMap(pluginsDir, getDataDir());
    discoveredSkills = map && map.skills ? map.skills : null;
  } catch {
    discoveredSkills = null; // fall back to curated rules
  }
  return discoveredSkills;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Match a discovered skill by file path segment or whole-word bash hint.
function inferFromDiscovered(toolName, inputStr, filePath) {
  const skills = getDiscoveredSkills();
  if (!skills) return null;
  if (toolName === 'Edit' || toolName === 'Write') {
    const fp = (filePath || '').toLowerCase();
    for (const name of Object.keys(skills)) {
      if (fp.includes(name.toLowerCase())) return name;
    }
    return null;
  }
  if (toolName === 'Bash') {
    for (const [name, info] of Object.entries(skills)) {
      for (const hint of info.bashHints || []) {
        const re = new RegExp(`\\b${escapeRe(hint.toLowerCase())}\\b`);
        if (re.test(inputStr)) return name;
      }
    }
  }
  return null;
}

// ─── curated layer (hand-tuned) ─────────────────────────────────

function inferSkill(toolName, toolInput) {
  if (!toolInput) return null;
  const inputStr = JSON.stringify(toolInput).toLowerCase();

  if (toolName === 'Bash') {
    // dotnet-code-review: explicit review orchestrator/analyzer invocation
    if (/review[-_]orchestrator|csharp-unified-analyzer|dotnet-code-review/.test(inputStr)) {
      return 'dotnet-code-review';
    }
    if (/\b(dotnet|nuget|\.csproj|\.sln|c#)\b/.test(inputStr)) return 'dotnet-csharp-developer';
    if (/\b(sql|mysql|postgres|sqlite|kingbase|database|query)\b/.test(inputStr)) return 'database-explorer';
    if (/\b(winforms|devexpress)\b/.test(inputStr)) return 'winforms-dev-flow';
    // Discovered-layer bash hints for skills without curated rules.
    return inferFromDiscovered(toolName, inputStr, null);
  }

  if (toolName === 'Edit' || toolName === 'Write') {
    const fp = (toolInput.file_path || '').toLowerCase();

    // Most specific first: path-segment match beats extension match.
    // e.g. plugins/dotnet-work/skills/dotnet-code-review/... → dotnet-code-review
    if (/dotnet-code-review/.test(fp)) return 'dotnet-code-review';
    if (/database-explorer/.test(fp)) return 'database-explorer';
    if (/dotnet-csharp-developer/.test(fp)) return 'dotnet-csharp-developer';
    if (/winforms-dev-flow/.test(fp)) return 'winforms-dev-flow';

    // Extension-based fallbacks (path didn't name a skill)
    if (/\.cs$/.test(fp) || /\.csproj$/.test(fp) || /\.sln$/.test(fp)) return 'dotnet-csharp-developer';
    if (/\.sql$/.test(fp)) return 'database-explorer';
    if (/winforms|devexpress|\.designer\.cs/.test(fp)) return 'winforms-dev-flow';

    // Discovered-layer path rules BEFORE plugin-level attribution: a path that
    // names a concrete skill directory (e.g. plugins/<p>/skills/<name>/...)
    // belongs to that skill, not to the plugin's generic self-edit bucket.
    const discovered = inferFromDiscovered(toolName, inputStr, fp);
    if (discovered) return discovered;

    // Plugin self-edits (observability + workflow tooling maintenance)
    if (/skill-radar[\\/]/.test(fp)) return 'skill-radar';
    if (/graph-workflow[\\/]/.test(fp)) return 'graph-workflow';
    if (/agentic-workflow[\\/]/.test(fp)) return 'agentic-workflow';

    return null;
  }

  return null;
}

module.exports = { inferSkill };
