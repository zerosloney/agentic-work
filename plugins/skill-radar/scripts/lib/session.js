'use strict';
// Shared session helpers for skill-radar hooks.

const fs = require('fs');
const path = require('path');

function getDataDir() {
  const envDir = process.env.ZCODE_PLUGIN_DATA || process.env.CODEBUDDY_PLUGIN_DATA;
  if (envDir) return envDir;
  return path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
}

function generateSessionId() {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `sess_${ts}_${rand}`;
}

function readLegacySessionId(dataDir = getDataDir()) {
  try {
    const f = path.join(dataDir, 'session.json');
    if (!fs.existsSync(f)) return null;
    const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
    return data.session_id || null;
  } catch {
    return null;
  }
}

function envSessionId() {
  return process.env.SKILL_RADAR_SESSION_ID
    || process.env.ZCODE_SESSION_ID
    || process.env.CODEBUDDY_SESSION_ID
    || process.env.TRAE_SESSION_ID
    || process.env.QODER_SESSION_ID
    || process.env.QWEN_SESSION_ID
    || null;
}

function resolveSessionId(input, dataDir = getDataDir()) {
  return (input && input.session_id) || envSessionId() || readLegacySessionId(dataDir);
}

function safeName(id) {
  return String(id).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 128);
}

function writeJsonAtomic(file, data) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  try {
    fs.renameSync(tmp, file);
  } catch {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
}

function persistSession(data, dataDir = getDataDir()) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  writeJsonAtomic(path.join(dataDir, 'session.json'), data);
  writeJsonAtomic(path.join(dataDir, 'sessions', `${safeName(data.session_id)}.json`), data);
}

function appendEnvFileLine(file, sessionId) {
  if (!file || !sessionId) return;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `SKILL_RADAR_SESSION_ID=${JSON.stringify(sessionId)}\n`);
  } catch {
    // swallow — env propagation is best effort
  }
}

function exportSessionToEnvFiles(sessionId) {
  appendEnvFileLine(process.env.TRAE_ENV_FILE, sessionId);
  appendEnvFileLine(process.env.CLAUDE_ENV_FILE, sessionId);
}

module.exports = {
  exportSessionToEnvFiles,
  generateSessionId,
  getDataDir,
  persistSession,
  resolveSessionId,
};
