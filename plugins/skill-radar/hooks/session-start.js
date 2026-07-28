#!/usr/bin/env node
// session-start.js — SessionStart hook
//
// Generates a session_id on session start and persists it to:
//   <ZCODE_PLUGIN_DATA>/session.json
//
// log-invocation.js reads this file to correlate traces by session.

const path = require('path');
const fs = require('fs');

function getDataDir() {
  return (
    process.env.ZCODE_PLUGIN_DATA ||
    path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar')
  );
}

function generateSessionId() {
  // Simple uuid v4-ish: timestamp + random. Avoids crypto dependency.
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `sess_${ts}_${rand}`;
}

function main() {
  try {
    const dir = getDataDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const sessionFile = path.join(dir, 'session.json');
    const data = {
      session_id: generateSessionId(),
      started_at: new Date().toISOString(),
    };
    fs.writeFileSync(sessionFile, JSON.stringify(data, null, 2) + '\n');

    process.stderr.write(`[skill-radar] session started: ${data.session_id}\n`);
  } catch {
    // swallow — observability must never break the user
  }

  // Never block
  process.stdout.write(JSON.stringify({}));
}

main();
