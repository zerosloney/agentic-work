'use strict';

const fs = require('fs');
const path = require('path');

function readJsonWithRecovery(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    const backup = `${file}.corrupt.${Date.now()}.bak`;
    fs.copyFileSync(file, backup);
    console.error(`Warning: invalid JSON in ${file}; backed up original to ${backup}: ${err.message}`);
    return fallback;
  }
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', 'utf-8');
    fs.renameSync(temp, file);
  } catch (err) {
    try { fs.rmSync(temp, { force: true }); } catch (_) { /* preserve original error */ }
    throw new Error(`Atomic JSON write failed for ${file}: ${err.message}`);
  }
}

module.exports = { readJsonWithRecovery, writeJsonAtomic };
