'use strict';

function now() {
  return process.hrtime.bigint();
}

function elapsedMs(started) {
  return Number(process.hrtime.bigint() - started) / 1e6;
}

function perfBudgetMs() {
  const n = Number(process.env.SKILL_RADAR_PERF_BUDGET_MS || 150);
  return Number.isFinite(n) && n >= 0 ? n : 150;
}

function recordDuration(entry, started) {
  const ms = elapsedMs(started);
  entry.hook_duration_ms = Math.round(ms * 10) / 10;
  return ms;
}

function warnIfSlow(label, ms) {
  const budget = perfBudgetMs();
  if (ms > budget) {
    process.stderr.write(`[skill-radar] perf budget exceeded: ${label} ${Math.round(ms * 10) / 10}ms > ${budget}ms\n`);
  }
}

module.exports = { elapsedMs, now, recordDuration, warnIfSlow };
