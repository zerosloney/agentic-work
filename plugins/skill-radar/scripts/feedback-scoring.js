#!/usr/bin/env node
// feedback-scoring.js — Phase 3: feedback scoring
//
// Reads JSONL traces and produces per-tool + per-session scores.
// Scoring model (baseline — no threshold tuning until real data accumulates):
//
//   tool_score = 1 - failure_rate
//   session_score = weighted avg of tool scores in session
//
// Output:
//   1. Console summary (table + alerts)
//   2. JSON scoring report (--json --out <file>)
//
// Usage:
//   node feedback-scoring.js                       # console summary
//   node feedback-scoring.js --json --out scores.json
//   node feedback-scoring.js --days 7              # last 7 days
//   node feedback-scoring.js --data-dir /path
//   node feedback-scoring.js --threshold 0.7       # alert if score < threshold

const path = require('path');
const fs = require('fs');

// ─── args ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { json: false, out: null, days: null, dataDir: null, threshold: 0.7 };
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

function getTracesDir(args) {
  if (args.dataDir) return path.join(args.dataDir, 'traces');
  const base =
    process.env.ZCODE_PLUGIN_DATA ||
    path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
  return path.join(base, 'traces');
}

// ─── load traces ──────────────────────────────────────────────────

function loadTraces(tracesDir, daysLimit) {
  if (!fs.existsSync(tracesDir)) return [];

  const files = fs.readdirSync(tracesDir).filter((f) => f.endsWith('.jsonl'));
  const entries = [];
  const cutoff = daysLimit ? Date.now() - daysLimit * 86400000 : 0;

  for (const file of files) {
    if (daysLimit) {
      const fileDate = new Date(file.replace('.jsonl', '')).getTime();
      if (fileDate < cutoff - 86400000) continue;
    }
    const lines = fs.readFileSync(path.join(tracesDir, file), 'utf-8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (!daysLimit || new Date(entry.ts).getTime() >= cutoff) {
          entries.push(entry);
        }
      } catch {
        // skip malformed
      }
    }
  }

  return entries;
}

// ─── load signals ──────────────────────────────────────────────────

function loadSignals(dataDir, daysLimit) {
  const signalsDir = path.join(dataDir, 'signals');
  if (!fs.existsSync(signalsDir)) return [];

  const files = fs.readdirSync(signalsDir).filter((f) => f.endsWith('.jsonl'));
  const signals = [];
  const cutoff = daysLimit ? Date.now() - daysLimit * 86400000 : 0;

  for (const file of files) {
    if (daysLimit) {
      const fileDate = new Date(file.replace('.jsonl', '')).getTime();
      if (fileDate < cutoff - 86400000) continue;
    }
    const lines = fs.readFileSync(path.join(signalsDir, file), 'utf-8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (!daysLimit || new Date(entry.ts).getTime() >= cutoff) {
          signals.push(entry);
        }
      } catch {
        // skip
      }
    }
  }

  return signals;
}

// ─── scoring ───────────────────────────────────────────────────────

function computeScores(entries, signals) {
  // Aggregate per tool
  const toolAgg = {};
  // Aggregate per session
  const sessionAgg = {};

  for (const e of entries) {
    const tool = e.tool_name || 'unknown';
    const session = e.session_id || 'no-session';
    const isFailure = e.event === 'PostToolUseFailure';

    // Tool aggregation
    if (!toolAgg[tool]) toolAgg[tool] = { total: 0, failures: 0 };
    toolAgg[tool].total++;
    if (isFailure) toolAgg[tool].failures++;

    // Session aggregation
    if (!sessionAgg[session]) {
      sessionAgg[session] = { total: 0, failures: 0, tools: new Set(), start: e.ts, end: e.ts };
    }
    sessionAgg[session].total++;
    if (isFailure) sessionAgg[session].failures++;
    sessionAgg[session].tools.add(tool);
    if (e.ts < sessionAgg[session].start) sessionAgg[session].start = e.ts;
    if (e.ts > sessionAgg[session].end) sessionAgg[session].end = e.ts;
  }

  // Compute tool scores
  const toolScores = {};
  for (const [tool, agg] of Object.entries(toolAgg)) {
    const failureRate = agg.total > 0 ? agg.failures / agg.total : 0;
    toolScores[tool] = {
      total: agg.total,
      failures: agg.failures,
      failure_rate: +failureRate.toFixed(3),
      score: +(1 - failureRate).toFixed(3),
    };
  }

  // Index signals by session
  const signalsBySession = {};
  for (const s of signals) {
    const sid = s.session_id || 'no-session';
    if (!signalsBySession[sid]) signalsBySession[sid] = [];
    signalsBySession[sid].push(s);
  }

  // Compute session scores
  const sessionScores = {};
  for (const [session, agg] of Object.entries(sessionAgg)) {
    const failureRate = agg.total > 0 ? agg.failures / agg.total : 0;
    const duration = new Date(agg.end).getTime() - new Date(agg.start).getTime();

    // Signal penalty: each negative Stop signal reduces score
    const sessionSignals = signalsBySession[session] || [];
    const negativeSignals = sessionSignals.filter((s) => s.signal_type);
    const signalPenalty = Math.min(0.3, negativeSignals.length * 0.15);

    const baseScore = 1 - failureRate;
    const adjustedScore = Math.max(0, baseScore - signalPenalty);

    sessionScores[session] = {
      total: agg.total,
      failures: agg.failures,
      failure_rate: +failureRate.toFixed(3),
      score: +adjustedScore.toFixed(3),
      base_score: +baseScore.toFixed(3),
      stop_signals: negativeSignals.length,
      tools_used: [...agg.tools],
      duration_ms: duration,
      start: agg.start,
      end: agg.end,
    };
  }

  // Overall score (weighted by invocation count)
  const totalInvocations = entries.length;
  const totalFailures = entries.filter((e) => e.event === 'PostToolUseFailure').length;
  const overallScore = totalInvocations > 0
    ? +(1 - totalFailures / totalInvocations).toFixed(3)
    : 1.0;

  return {
    overall_score: overallScore,
    total_invocations: totalInvocations,
    total_failures: totalFailures,
    tool_scores: toolScores,
    session_scores: sessionScores,
  };
}

// ─── console output ───────────────────────────────────────────────

function printSummary(scores, threshold) {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     Skill Radar — Feedback Score     ║');
  console.log('╚══════════════════════════════════════╝');

  console.log(`\nOverall score: ${(scores.overall_score * 100).toFixed(1)}%  (${scores.total_failures}/${scores.total_invocations} failures)`);

  // Tool scores
  if (Object.keys(scores.tool_scores).length > 0) {
    console.log('\n── Per Tool ──────────────────────────');
    console.log(`${'Tool'.padEnd(12)} ${'Score'.padStart(6)} ${'Fail%'.padStart(7)} ${'Count'.padStart(6)}`);
    console.log('─'.repeat(35));
    for (const [tool, s] of Object.entries(scores.tool_scores).sort((a, b) => a[1].score - b[1].score)) {
      const alert = s.score < threshold ? ' ⚠️' : '';
      console.log(
        `${tool.padEnd(12)} ${(s.score * 100).toFixed(0).padStart(5)}% ${(s.failure_rate * 100).toFixed(1).padStart(6)}% ${String(s.total).padStart(6)}${alert}`
      );
    }
  }

  // Session scores
  if (Object.keys(scores.session_scores).length > 0) {
    console.log('\n── Per Session ───────────────────────');
    console.log(`${'Session'.padEnd(22)} ${'Score'.padStart(6)} ${'Fail%'.padStart(7)} ${'Tools'.padStart(6)}`);
    console.log('─'.repeat(45));
    for (const [session, s] of Object.entries(scores.session_scores).sort((a, b) => a[1].score - b[1].score)) {
      const alert = s.score < threshold ? ' ⚠️' : '';
      const shortId = session.length > 20 ? session.slice(0, 17) + '...' : session;
      console.log(
        `${shortId.padEnd(22)} ${(s.score * 100).toFixed(0).padStart(5)}% ${(s.failure_rate * 100).toFixed(1).padStart(6)}% ${String(s.tools_used.length).padStart(6)}${alert}`
      );
    }
  }

  // Stop signals summary
  const sessionsWithSignals = Object.entries(scores.session_scores).filter(([, s]) => s.stop_signals > 0);
  if (sessionsWithSignals.length > 0) {
    console.log('\n── Stop Signals ──────────────────────');
    for (const [session, s] of sessionsWithSignals) {
      const shortId = session.length > 20 ? session.slice(0, 17) + '...' : session;
      console.log(`  ${shortId}: ${s.stop_signals} negative signal(s), base=${(s.base_score * 100).toFixed(0)}% → adj=${(s.score * 100).toFixed(0)}%`);
    }
  }

  // Alerts
  const lowTools = Object.entries(scores.tool_scores).filter(([, s]) => s.score < threshold);
  if (lowTools.length > 0) {
    console.log(`\n⚠️  Tools below threshold (${threshold}):`);
    for (const [tool, s] of lowTools) {
      console.log(`   ${tool}: score ${(s.score * 100).toFixed(0)}% (${s.failures}/${s.total} failures)`);
    }
  }

  console.log('');
}

// ─── main ─────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv);
  const tracesDir = getTracesDir(args);
  const dataDir = args.dataDir
    ? args.dataDir
    : process.env.ZCODE_PLUGIN_DATA ||
      path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
  const entries = loadTraces(tracesDir, args.days);
  const signals = loadSignals(dataDir, args.days);
  const scores = computeScores(entries, signals);

  if (args.json) {
    const report = {
      generated_at: new Date().toISOString(),
      days_window: args.days || 'all',
      threshold: args.threshold,
      ...scores,
    };
    const json = JSON.stringify(report, null, 2);
    if (args.out) {
      fs.writeFileSync(args.out, json + '\n');
      console.log(`Score report written: ${args.out}`);
    } else {
      console.log(json);
    }
  } else {
    printSummary(scores, args.threshold);
  }
}

main();
