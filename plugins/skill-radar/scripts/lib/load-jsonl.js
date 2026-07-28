// load-jsonl.js — shared JSONL reader for skill-radar analysis scripts.
//
// Eliminates the ~40-line duplication across aggregate-traces.js /
// feedback-scoring.js / evolve.js, and fixes a timezone bug they all shared:
// `new Date("YYYY-MM-DD")` parses date-only strings in the LOCAL timezone,
// while trace `ts` fields are UTC ISO strings. Comparing them could drop or
// include boundary-day traces by up to ±TZ hours. Here the filename date is
// parsed as UTC ("YYYY-MM-DDT00:00:00Z") and the entry.ts cutoff comparison
// is already in ms-since-epoch (timezone-agnostic).

'use strict';

const fs = require('fs');
const path = require('path');

// Parse a YYYY-MM-DD filename stem as a UTC timestamp.
// `new Date("YYYY-MM-DD")` is treated as local midnight — wrong here.
function parseFileDateUtc(fileStem) {
  return new Date(fileStem + 'T00:00:00Z').getTime();
}

// Load all JSONL entries under <dir>/<YYYY-MM-DD>.jsonl, optionally limited
// to the last <daysLimit> days. Malformed lines are skipped. Files older than
// the window are skipped at the filename stage for efficiency; per-entry ts is
// checked again for precision.
function loadJSONL(dir, daysLimit) {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
  const entries = [];
  const cutoff = daysLimit ? Date.now() - daysLimit * 86400000 : 0;
  const fileCutoff = cutoff - 86400000; // 1-day buffer so we don't exclude
                                        // the boundary day's late entries

  for (const file of files) {
    if (daysLimit) {
      const fileDate = parseFileDateUtc(file.replace('.jsonl', ''));
      if (Number.isNaN(fileDate) || fileDate < fileCutoff) continue;
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
        // skip malformed lines
      }
    }
  }

  return entries;
}

module.exports = { loadJSONL, parseFileDateUtc };
