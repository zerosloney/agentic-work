#!/usr/bin/env node
// evolve.js — Phase 4: evolution recommendations
//
// Reads traces + signals, identifies low-scoring tools, analyzes failure
// patterns, and generates actionable skill-tuning recommendations.
//
// Output: recommendation report (console + JSON). Human reviews and applies.
//
// Usage:
//   node evolve.js                       # console report
//   node evolve.js --json --out rec.json # write JSON
//   node evolve.js --days 14             # analyze last 14 days
//   node evolve.js --data-dir /path
//   node evolve.js --threshold 0.7       # flag tools below this score

const path = require('path');
const fs = require('fs');

// ─── args ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { json: false, out: null, days: 7, dataDir: null, threshold: 0.7 };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--days') args.days = parseInt(argv[++i], 10);
    else if (argv[i] === '--data-dir') args.dataDir = argv[++i];
    else if (argv[i] === '--threshold') args.threshold = parseFloat(argv[++i]);
  }
  return args;
}

// ─── paths ────────────────────────────────────────────────────────

function getDirs(args) {
  const base = args.dataDir
    ? args.dataDir
    : process.env.ZCODE_PLUGIN_DATA ||
      path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
  return {
    traces: path.join(base, 'traces'),
    signals: path.join(base, 'signals'),
  };
}

// ─── load data ────────────────────────────────────────────────────

function loadJSONL(dir, daysLimit) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
  const entries = [];
  const cutoff = daysLimit ? Date.now() - daysLimit * 86400000 : 0;

  for (const file of files) {
    if (daysLimit) {
      const fileDate = new Date(file.replace('.jsonl', '')).getTime();
      if (fileDate < cutoff - 86400000) continue;
    }
    const lines = fs.readFileSync(path.join(dir, file), 'utf-8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (!daysLimit || new Date(entry.ts).getTime() >= cutoff) {
          entries.push(entry);
        }
      } catch {
        // skip
      }
    }
  }
  return entries;
}

// ─── skill inference ──────────────────────────────────────────────
// Heuristic: map tool + input context to likely skill.

function inferSkill(toolName, toolInput) {
  if (!toolInput) return null;

  const inputStr = JSON.stringify(toolInput).toLowerCase();

  // Bash command patterns
  if (toolName === 'Bash') {
    if (/(dotnet|nuget|\.csproj|\.sln|c#)/.test(inputStr)) return 'dotnet-csharp-developer';
    if (/(sql|mysql|postgres|sqlite|database|query)/.test(inputStr)) return 'database-explorer';
    if (/(git|commit|push|pull|branch)/.test(inputStr)) return null; // general, no skill
    if (/(npm|node|yarn|webpack)/.test(inputStr)) return null;
    return null;
  }

  // Edit/Write file patterns
  if (toolName === 'Edit' || toolName === 'Write') {
    const fp = (toolInput.file_path || '').toLowerCase();
    if (/\.cs$/.test(fp) || /\.csproj$/.test(fp) || /\.sln$/.test(fp)) return 'dotnet-csharp-developer';
    if (/\.sql$/.test(fp)) return 'database-explorer';
    if (/winforms|devexpress|\.designer\.cs/.test(fp)) return 'winforms-dev-flow';
    if (/\.md$/.test(fp)) return null; // docs, no skill
    return null;
  }

  return null;
}

// ─── failure analysis ─────────────────────────────────────────────

function analyzeFailures(traces) {
  const toolStats = {};
  const errorPatterns = {};
  const skillErrors = {};

  for (const t of traces) {
    const tool = t.tool_name || 'unknown';
    const isFail = t.event === 'PostToolUseFailure';

    if (!toolStats[tool]) {
      toolStats[tool] = { total: 0, failures: 0, errors: [] };
    }
    toolStats[tool].total++;
    if (isFail) {
      toolStats[tool].failures++;
      const msg = t.error?.message || 'unknown';
      toolStats[tool].errors.push(msg);

      // Error pattern bucket
      const pattern = categorizeError(msg);
      errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;

      // Skill mapping
      const skill = inferSkill(t.tool_name, t.tool_input);
      if (skill) {
        if (!skillErrors[skill]) skillErrors[skill] = { total: 0, failures: 0, patterns: {} };
        skillErrors[skill].total++;
        skillErrors[skill].failures++;
        skillErrors[skill].patterns[pattern] = (skillErrors[skill].patterns[pattern] || 0) + 1;
      }
    } else {
      // Also count skill on success (for rate calculation)
      const skill = inferSkill(t.tool_name, t.tool_input);
      if (skill) {
        if (!skillErrors[skill]) skillErrors[skill] = { total: 0, failures: 0, patterns: {} };
        skillErrors[skill].total++;
      }
    }
  }

  return { toolStats, errorPatterns, skillErrors };
}

function categorizeError(msg) {
  const lower = msg.toLowerCase();
  if (/permission denied|access denied|eacces/.test(lower)) return 'permission';
  if (/not found|enoent|does not exist|no such file/.test(lower)) return 'not_found';
  if (/timeout|etimedout/.test(lower)) return 'timeout';
  if (/syntax|parse|unexpected|invalid/.test(lower)) return 'syntax';
  if (/connection|econnrefused|network/.test(lower)) return 'connection';
  if (/memory|heap|out of memory/.test(lower)) return 'resource';
  return 'other';
}

// ─── recommendation engine ────────────────────────────────────────

function generateRecommendations(analysis, threshold) {
  const recs = [];

  // Per-tool recommendations
  for (const [tool, stats] of Object.entries(analysis.toolStats)) {
    const rate = stats.total > 0 ? stats.failures / stats.total : 0;
    if (rate < threshold) continue; // only flag high failure rates

    // Find dominant error pattern
    const patternCounts = {};
    for (const err of stats.errors) {
      const p = categorizeError(err);
      patternCounts[p] = (patternCounts[p] || 0) + 1;
    }
    const dominant = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0];

    if (dominant) {
      const action = patternToAction(tool, dominant[0], dominant[1], stats.failures);
      recs.push({
        scope: 'tool',
        target: tool,
        severity: rate > 0.5 ? 'high' : 'medium',
        failure_rate: +rate.toFixed(3),
        total_failures: stats.failures,
        dominant_pattern: dominant[0],
        recommendation: action,
      });
    }
  }

  // Per-skill recommendations
  for (const [skill, data] of Object.entries(analysis.skillErrors)) {
    if (data.total < 3) continue; // need minimum sample
    const rate = data.failures / data.total;
    if (rate < threshold) continue;

    const topPattern = Object.entries(data.patterns).sort((a, b) => b[1] - a[1])[0];
    recs.push({
      scope: 'skill',
      target: skill,
      severity: rate > 0.5 ? 'high' : 'medium',
      failure_rate: +rate.toFixed(3),
      total_failures: data.failures,
      dominant_pattern: topPattern ? topPattern[0] : 'unknown',
      recommendation: `Skill "${skill}" has ${(rate * 100).toFixed(0)}% failure rate. ${topPattern ? `Add pre-check for "${topPattern[0]}" errors in skill instructions.` : 'Review skill prompt for robustness.'}`,
    });
  }

  // Sort: high severity first, then by failure rate
  return recs.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
    return b.failure_rate - a.failure_rate;
  });
}

function patternToAction(tool, pattern, count, totalFails) {
  const actions = {
    permission: `Add pre-check: verify permissions before ${tool} operations. Consider adding "Check file/dir permissions first" to skill instructions.`,
    not_found: `Add existence validation: check file/resource exists before ${tool}. Add guard step in skill prompt.`,
    timeout: `Add timeout handling: wrap ${tool} calls with timeout + retry logic. Consider breaking large operations into smaller chunks.`,
    syntax: `Add validation step: validate input format before ${tool}. Consider adding a lint/parse pre-check.`,
    connection: `Add connectivity check: verify network/service availability before ${tool}. Add retry with backoff.`,
    resource: `Add resource guard: check memory/disk before ${tool}. Consider streaming or chunked processing.`,
    other: `Review ${tool} failure logs for common patterns. ${count}/${totalFails} failures categorized as "other".`,
  };
  return actions[pattern] || actions.other;
}

// ─── console output ───────────────────────────────────────────────

function printReport(recs, analysis, days) {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║    Skill Radar — Evolution Report    ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`\nAnalysis window: ${days} days`);
  console.log(`Total traces: ${Object.values(analysis.toolStats).reduce((s, t) => s + t.total, 0)}`);

  if (recs.length === 0) {
    console.log('\n✅ No tools/skills below threshold. No action needed.');
    console.log('');
    return;
  }

  console.log(`\n${recs.length} recommendation(s):\n`);

  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    const icon = r.severity === 'high' ? '🔴' : '🟡';
    console.log(`${icon} [${r.scope.toUpperCase()}] ${r.target} — ${r.severity}`);
    console.log(`   Failure rate: ${(r.failure_rate * 100).toFixed(0)}% (${r.total_failures} failures)`);
    console.log(`   Pattern: ${r.dominant_pattern}`);
    console.log(`   Action: ${r.recommendation}`);
    console.log('');
  }

  console.log('── Next Steps ────────────────────────');
  console.log('  1. Review recommendations above');
  console.log('  2. Edit relevant SKILL.md to add pre-checks/guards');
  console.log('  3. Re-run after 1 week to measure improvement');
  console.log('');
}

// ─── main ─────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv);
  const dirs = getDirs(args);
  const traces = loadJSONL(dirs.traces, args.days);
  const signals = loadJSONL(dirs.signals, args.days);

  const analysis = analyzeFailures(traces);
  const recs = generateRecommendations(analysis, args.threshold);

  if (args.json) {
    const report = {
      generated_at: new Date().toISOString(),
      days_window: args.days,
      threshold: args.threshold,
      recommendations: recs,
      summary: {
        total_traces: traces.length,
        total_signals: signals.length,
        tools_analyzed: Object.keys(analysis.toolStats).length,
        skills_flagged: Object.keys(analysis.skillErrors).length,
      },
    };
    const json = JSON.stringify(report, null, 2);
    if (args.out) {
      fs.writeFileSync(args.out, json + '\n');
      console.log(`Report written: ${args.out}`);
    } else {
      console.log(json);
    }
  } else {
    printReport(recs, analysis, args.days);
  }
}

main();
