#!/usr/bin/env node
// session-start.js — SessionStart hook
//
// Generates a session_id on session start and persists it to:
//   <ZCODE_PLUGIN_DATA>/session.json
//
// log-invocation.js reads this file to correlate traces by session.

const path = require('path');
const fs = require('fs');

function parseArgs(argv) {
  const args = { platform: 'zcode' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--platform') args.platform = argv[++i];
  }
  return args;
}

function getDataDir() {
  const envDir = process.env.ZCODE_PLUGIN_DATA || process.env.CODEBUDDY_PLUGIN_DATA;
  if (envDir) return envDir;
  return path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
}

function generateSessionId() {
  // Simple uuid v4-ish: timestamp + random. Avoids crypto dependency.
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `sess_${ts}_${rand}`;
}

function main() {
  const args = parseArgs(process.argv);
  try {
    const dir = getDataDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const sessionFile = path.join(dir, 'session.json');
    const data = {
      session_id: generateSessionId(),
      started_at: new Date().toISOString(),
    };
    // Atomic write: tmp + rename, so a crash mid-write never leaves a
    // truncated session.json (which would break session correlation for
    // every trace in the session).
    const tmpFile = `${sessionFile}.tmp.${process.pid}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2) + '\n');
    try {
      fs.renameSync(tmpFile, sessionFile);
    } catch {
      // Windows can refuse rename over a concurrently-open file; fall back
      // to direct write, then always clean up the tmp file.
      fs.writeFileSync(sessionFile, JSON.stringify(data, null, 2) + '\n');
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }

    process.stderr.write(`[skill-radar] session started: ${data.session_id}\n`);
  } catch {
    // swallow — observability must never break the user
  }

  // Never block. Output format: ZCode flat {}, CodeBuddy hookSpecificOutput.
  if (args.platform === 'codebuddy') {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: '',
      },
    }));
  } else {
    process.stdout.write(JSON.stringify({}));
  }
}

main();
