#!/usr/bin/env node
'use strict';
// check-verification-on-stop.js — Stop hook: block stop when verification not passed
//
// Reads every .loop-cli/state/*.json. If any active pipeline (stop_reason is
// null, i.e. still running) has verification_status !== "pass", blocks the
// Stop so the orchestrator must drive verification to pass (or explicitly
// set stop_reason to retire the pipeline) before the session can end.
//
// Contract: stdin = JSON payload (Stop event), stderr = diagnostics,
//           exit 0 = allow stop, exit 2 = block stop.
//           Internal errors fail OPEN (exit 0) — a broken hook must not trap
//           the user in a session.

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(process.cwd(), '.loop-cli', 'state');

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(new Error('Invalid JSON on stdin: ' + e.message)); }
    });
    process.stdin.on('error', reject);
  });
}

// Find active pipelines with unpassed verification. Returns array of
// { file, verification_status } for each offending pipeline.
function findUnverifiedActive() {
  const offenders = [];
  let files = [];
  try { files = fs.readdirSync(STATE_DIR); }
  catch { return offenders; } // no state dir — no active pipeline, allow
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const fp = path.join(STATE_DIR, f);
    try {
      const obj = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      // Only active pipelines (stop_reason null/missing) gate the stop.
      if (obj.stop_reason) continue;
      const status = obj.verification_status;
      // missing field = orchestrator hasn't written it yet this round → treat
      // as 'missing' and block, since "not yet verified" is the unsafe state.
      if (status !== 'pass') {
        offenders.push({ file: f, verification_status: status === undefined ? 'missing' : status });
      }
    } catch {
      // unreadable state — skip, validate-state-write handles bad JSON
    }
  }
  return offenders;
}

async function main() {
  await readStdin(); // drain stdin (payload content unused beyond draining)

  const offenders = findUnverifiedActive();
  if (offenders.length === 0) process.exit(0);

  console.error('Stop blocked: active pipeline(s) with unpassed verification:');
  for (const o of offenders) {
    console.error(`  - ${o.file}: verification_status=${o.verification_status}`);
  }
  console.error('Drive verification to pass (set verification_status="pass") or retire the pipeline (set stop_reason) before stopping.');
  process.exit(2);
}

main().catch(err => {
  console.error(`Hook error: ${err.message}`);
  process.exit(0); // fail open
});
