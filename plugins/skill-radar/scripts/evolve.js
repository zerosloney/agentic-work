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
const { inferSkill } = require(path.join(__dirname, 'lib', 'infer-skill.js'));
const { categorizeError } = require(path.join(__dirname, 'lib', 'categorize-error.js'));
const { loadJSONL } = require(path.join(__dirname, 'lib', 'load-jsonl.js'));

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

// ─── failure analysis ─────────────────────────────────────────────

// Prefer the skill tagged at trace time (e.skill); fall back to inference
// for historical traces written before trace-time tagging existed.
function skillOf(trace) {
  if (trace.skill) return trace.skill;
  return inferSkill(trace.tool_name, trace.tool_input);
}

function analyzeFailures(traces, signals) {
  const toolStats = {};
  const errorPatterns = {};
  const skillErrors = {};

  // Count negative Stop signals per skill. A signal's skill is not known at
  // capture time, so attribute by session: find which skill(s) that session
  // used most. We approximate by attributing each negative signal to every
  // skill active in its session (rare — most sessions are single-skill).
  const sessionSkills = {};
  for (const t of traces) {
    const sk = skillOf(t);
    if (!sk || !t.session_id) continue;
    if (!sessionSkills[t.session_id]) sessionSkills[t.session_id] = new Set();
    sessionSkills[t.session_id].add(sk);
  }
  const skillSignals = {};
  for (const s of signals) {
    if (!s.signal_type) continue; // only negative
    const skills = sessionSkills[s.session_id];
    if (!skills) continue;
    for (const sk of skills) {
      skillSignals[sk] = (skillSignals[sk] || 0) + 1;
    }
  }

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
      const skill = skillOf(t);
      if (skill) {
        if (!skillErrors[skill]) skillErrors[skill] = { total: 0, failures: 0, patterns: {} };
        skillErrors[skill].total++;
        skillErrors[skill].failures++;
        skillErrors[skill].patterns[pattern] = (skillErrors[skill].patterns[pattern] || 0) + 1;
      }
    } else {
      // Also count skill on success (for rate calculation)
      const skill = skillOf(t);
      if (skill) {
        if (!skillErrors[skill]) skillErrors[skill] = { total: 0, failures: 0, patterns: {} };
        skillErrors[skill].total++;
      }
    }
  }

  // Attach signal counts to each skill bucket
  for (const [skill, count] of Object.entries(skillSignals)) {
    if (!skillErrors[skill]) skillErrors[skill] = { total: 0, failures: 0, patterns: {} };
    skillErrors[skill].negative_signals = count;
  }

  return { toolStats, errorPatterns, skillErrors };
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
    const signals = data.negative_signals || 0;
    const signalNote = signals > 0
      ? ` ${signals} negative Stop signal(s) — sessions ended with unresolved issues.`
      : '';
    recs.push({
      scope: 'skill',
      target: skill,
      severity: rate > 0.5 ? 'high' : 'medium',
      failure_rate: +rate.toFixed(3),
      total_failures: data.failures,
      negative_signals: signals,
      dominant_pattern: topPattern ? topPattern[0] : 'unknown',
      recommendation: `Skill "${skill}" has ${(rate * 100).toFixed(0)}% failure rate. ${topPattern ? `Add pre-check for "${topPattern[0]}" errors in skill instructions.` : 'Review skill prompt for robustness.'}${signalNote}`,
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

  const analysis = analyzeFailures(traces, signals);
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
