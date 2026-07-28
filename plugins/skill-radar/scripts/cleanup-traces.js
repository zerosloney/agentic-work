#!/usr/bin/env node
// cleanup-traces.js — retention for skill-radar trace/signal stores.
//
// Deletes JSONL files older than --prune-days N under <data-dir>/traces and
// <data-dir>/signals. Files are named YYYY-MM-DD.jsonl; the cutoff is computed
// in UTC to match how they are written (trace ts is UTC ISO).
//
// Usage:
//   node cleanup-traces.js --prune-days 30              # delete files older than 30 days
//   node cleanup-traces.js --prune-days 30 --dry-run    # preview, delete nothing
//   node cleanup-traces.js --prune-days 30 --data-dir /path
//
// Exits 0 on success. Never throws — prints diagnostics and returns non-zero
// only on argument errors.

'use strict';

const fs = require('fs');
const path = require('path');
const { parseFileDateUtc } = require(path.join(__dirname, 'lib', 'load-jsonl.js'));

function parseArgs(argv) {
  const args = { pruneDays: null, dataDir: null, dryRun: false, keep: ['traces', 'signals'] };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--prune-days') args.pruneDays = parseInt(argv[++i], 10);
    else if (argv[i] === '--data-dir') args.dataDir = argv[++i];
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

function getDataDir(args) {
  if (args.dataDir) return args.dataDir;
  return process.env.ZCODE_PLUGIN_DATA
    || process.env.CODEBUDDY_PLUGIN_DATA
    || path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
}

// Scan a subdir, return list of {file, mtime, ageDays} for JSONL files older
// than the cutoff. Uses the filename date (UTC) as the authoritative age —
// matches how load-jsonl.js reads them.
function findStale(subdir, cutoffMs) {
  if (!fs.existsSync(subdir)) return [];
  const stale = [];
  for (const file of fs.readdirSync(subdir)) {
    if (!file.endsWith('.jsonl')) continue;
    const fileDate = parseFileDateUtc(file.replace('.jsonl', ''));
    if (Number.isNaN(fileDate)) continue;       // skip non-date filenames
    if (fileDate >= cutoffMs) continue;          // within retention window
    const full = path.join(subdir, file);
    try {
      const stat = fs.statSync(full);
      stale.push({ file: full, fileDate, sizeBytes: stat.size });
    } catch {
      // stat failed (race / permission) — skip, don't crash cleanup
    }
  }
  return stale;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.pruneDays || args.pruneDays <= 0) {
    console.error('cleanup-traces: --prune-days N (N > 0) is required');
    console.error('Usage: node cleanup-traces.js --prune-days 30 [--dry-run] [--data-dir PATH]');
    process.exit(2);
  }

  const dataDir = getDataDir(args);
  const cutoffMs = Date.now() - args.pruneDays * 86400000;

  let totalFiles = 0;
  let totalBytes = 0;
  const perSubdir = {};

  for (const sub of args.keep) {
    const stale = findStale(path.join(dataDir, sub), cutoffMs);
    perSubdir[sub] = stale;
    for (const f of stale) {
      totalFiles++;
      totalBytes += f.sizeBytes;
    }
  }

  if (totalFiles === 0) {
    console.log(`cleanup-traces: nothing older than ${args.pruneDays} days under ${dataDir}`);
    return;
  }

  const mode = args.dryRun ? '[dry-run] would delete' : 'deleting';
  console.log(`cleanup-traces: ${mode} ${totalFiles} file(s), ${(totalBytes / 1024).toFixed(1)} KB older than ${args.pruneDays} days`);
  for (const [sub, stale] of Object.entries(perSubdir)) {
    if (stale.length === 0) continue;
    console.log(`  ${sub}/ (${stale.length} file(s)):`);
    for (const f of stale) {
      const d = new Date(f.fileDate).toISOString().slice(0, 10);
      console.log(`    ${d}  ${(f.sizeBytes / 1024).toFixed(1)} KB  ${path.basename(f.file)}`);
      if (!args.dryRun) {
        try { fs.unlinkSync(f.file); }
        catch (err) { console.error(`    failed to delete ${f.file}: ${err.message}`); }
      }
    }
  }

  if (args.dryRun) {
    console.log('\n(dry-run: no files deleted. Re-run without --dry-run to apply.)');
  }
}

main();
