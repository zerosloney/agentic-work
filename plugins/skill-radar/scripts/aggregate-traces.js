#!/usr/bin/env node
// aggregate-traces.js — Phase 2: trace aggregation
//
// Reads JSONL traces from ZCODE_PLUGIN_DATA/traces/ and produces:
//   1. Console summary (human-readable table)
//   2. JSON report (machine-readable, written to stdout or --out file)
//
// Usage:
//   node aggregate-traces.js                     # summary to console
//   node aggregate-traces.js --json              # full JSON report to stdout
//   node aggregate-traces.js --json --out rpt.json  # write JSON to file
//   node aggregate-traces.js --days 7            # last 7 days only
//   node aggregate-traces.js --data-dir /path    # override trace dir
//
// Metrics computed:
//   - invocation count (total + per tool)
//   - success / failure count + failure rate
//   - avg response size (per tool)
//   - unique sessions
//   - top errors (by frequency)

const path = require('path');
const fs = require('fs');
const { loadJSONL } = require(path.join(__dirname, 'lib', 'load-jsonl.js'));
const { categorizeError } = require(path.join(__dirname, 'lib', 'categorize-error.js'));

// ─── args ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { json: false, out: null, days: null, dataDir: null, topCategories: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--days') args.days = parseInt(argv[++i], 10);
    else if (argv[i] === '--data-dir') args.dataDir = argv[++i];
  }
  return args;
}

// ─── paths ────────────────────────────────────────────────────────

function getTracesDir(args) {
  if (args.dataDir) return path.join(args.dataDir, 'traces');
  const base =
    process.env.ZCODE_PLUGIN_DATA ||
    process.env.CODEBUDDY_PLUGIN_DATA ||
    path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
  return path.join(base, 'traces');
}

// ─── aggregation ───────────────────────────────────────────────────

function aggregate(entries) {
  const byTool = {};
  const byDate = {};
  const bySkill = {};
  const sessions = new Set();
  const errors = {};
  let totalSuccess = 0;
  let totalFailure = 0;

  for (const e of entries) {
    const tool = e.tool_name || 'unknown';
    const date = (e.ts || '').slice(0, 10);
    const isFailure = e.event === 'PostToolUseFailure';

    // By tool
    if (!byTool[tool]) {
      byTool[tool] = { count: 0, success: 0, failure: 0, totalResponseSize: 0, sessions: new Set() };
    }
    byTool[tool].count++;
    byTool[tool].totalResponseSize += e.tool_response_size || 0;
    if (isFailure) byTool[tool].failure++;
    else byTool[tool].success++;
    if (e.session_id) byTool[tool].sessions.add(e.session_id);

    // By skill (only tagged traces; untagged fall through, no 'unknown' bucket)
    if (e.skill) {
      if (!bySkill[e.skill]) {
        bySkill[e.skill] = { count: 0, success: 0, failure: 0, sessions: new Set() };
      }
      bySkill[e.skill].count++;
      if (isFailure) bySkill[e.skill].failure++;
      else bySkill[e.skill].success++;
      if (e.session_id) bySkill[e.skill].sessions.add(e.session_id);
    }

    // By date
    if (date) {
      if (!byDate[date]) byDate[date] = { count: 0, success: 0, failure: 0 };
      byDate[date].count++;
      if (isFailure) byDate[date].failure++;
      else byDate[date].success++;
    }

    // Global
    if (isFailure) totalFailure++;
    else totalSuccess++;
    if (e.session_id) sessions.add(e.session_id);

    // Errors — bucket by category (so ENOENT on different paths collapse to
    // one "not_found" row) and keep one sample message per category.
    if (isFailure && e.error && e.error.message) {
      const category = categorizeError(e.error.message);
      if (!errors[category]) errors[category] = { count: 0, sample: null };
      errors[category].count++;
      if (!errors[category].sample) {
        errors[category].sample = String(e.error.message).slice(0, 100);
      }
    }
  }

  // Finalize tool stats (Set → count)
  const toolStats = {};
  for (const [tool, s] of Object.entries(byTool)) {
    toolStats[tool] = {
      count: s.count,
      success: s.success,
      failure: s.failure,
      failure_rate: s.count > 0 ? +(s.failure / s.count).toFixed(3) : 0,
      avg_response_size: s.count > 0 ? Math.round(s.totalResponseSize / s.count) : 0,
      unique_sessions: s.sessions.size,
    };
  }

  // Finalize skill stats
  const skillStats = {};
  for (const [skill, s] of Object.entries(bySkill)) {
    skillStats[skill] = {
      count: s.count,
      success: s.success,
      failure: s.failure,
      failure_rate: s.count > 0 ? +(s.failure / s.count).toFixed(3) : 0,
      unique_sessions: s.sessions.size,
    };
  }

  // Top errors — by category, with a representative sample message.
  const topErrors = Object.entries(errors)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([category, v]) => ({ category, count: v.count, sample: v.sample }));

  return {
    total: entries.length,
    success: totalSuccess,
    failure: totalFailure,
    failure_rate: entries.length > 0 ? +(totalFailure / entries.length).toFixed(3) : 0,
    unique_sessions: sessions.size,
    tools: toolStats,
    skills: skillStats,
    daily: byDate,
    top_errors: topErrors,
  };
}

// ─── console output ───────────────────────────────────────────────

function printSummary(metrics) {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║       Skill Radar — Aggregation      ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`\nTotal invocations: ${metrics.total}`);
  console.log(`Success: ${metrics.success}  |  Failure: ${metrics.failure}  |  Rate: ${(metrics.failure_rate * 100).toFixed(1)}%`);
  console.log(`Unique sessions: ${metrics.unique_sessions}`);

  if (Object.keys(metrics.tools).length > 0) {
    console.log('\n── Per Tool ──────────────────────────');
    console.log(`${'Tool'.padEnd(12)} ${'Count'.padStart(6)} ${'Fail%'.padStart(7)} ${'AvgSize'.padStart(8)} ${'Sessions'.padStart(9)}`);
    console.log('─'.repeat(45));
    for (const [tool, s] of Object.entries(metrics.tools).sort((a, b) => b[1].count - a[1].count)) {
      const failPct = (s.failure_rate * 100).toFixed(1);
      console.log(
        `${tool.padEnd(12)} ${String(s.count).padStart(6)} ${failPct.padStart(6)}% ${String(s.avg_response_size).padStart(7)}b ${String(s.unique_sessions).padStart(9)}`
      );
    }
  }

  if (Object.keys(metrics.skills).length > 0) {
    console.log('\n── Per Skill ──────────────────────────');
    console.log(`${'Skill'.padEnd(28)} ${'Count'.padStart(6)} ${'Fail%'.padStart(7)} ${'Sessions'.padStart(9)}`);
    console.log('─'.repeat(55));
    for (const [skill, s] of Object.entries(metrics.skills).sort((a, b) => b[1].count - a[1].count)) {
      const failPct = (s.failure_rate * 100).toFixed(1);
      console.log(
        `${skill.padEnd(28)} ${String(s.count).padStart(6)} ${failPct.padStart(6)}% ${String(s.unique_sessions).padStart(9)}`
      );
    }
  }

  if (Object.keys(metrics.daily).length > 0) {
    console.log('\n── Daily ─────────────────────────────');
    for (const [date, d] of Object.entries(metrics.daily).sort()) {
      console.log(`  ${date}: ${d.count} invoc, ${d.failure} fail`);
    }
  }

  if (metrics.top_errors.length > 0) {
    console.log('\n── Top Errors (by category) ─────────');
    for (const e of metrics.top_errors) {
      console.log(`  [${e.count}x ${e.category}] ${e.sample}`);
    }
  }

  console.log('');
}

// ─── main ─────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv);
  const tracesDir = getTracesDir(args);
  const entries = loadJSONL(tracesDir, args.days);
  const metrics = aggregate(entries);

  if (args.json) {
    const report = {
      generated_at: new Date().toISOString(),
      days_window: args.days || 'all',
      traces_dir: tracesDir,
      ...metrics,
    };
    const json = JSON.stringify(report, null, 2);
    if (args.out) {
      fs.writeFileSync(args.out, json + '\n');
      console.log(`Report written: ${args.out}`);
    } else {
      console.log(json);
    }
  } else {
    printSummary(metrics);
  }
}

main();
