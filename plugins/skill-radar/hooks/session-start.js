#!/usr/bin/env node
// session-start.js — SessionStart hook
//
// Resolves a session_id on session start and persists it to:
//   <ZCODE_PLUGIN_DATA>/session.json
//
// log-invocation.js reads this file to correlate traces by session.

const path = require('path');

const { readStdin } = require(path.join(__dirname, '..', 'scripts', 'lib', 'read-stdin.js'));
const { elapsedMs, now, warnIfSlow } = require(path.join(__dirname, '..', 'scripts', 'lib', 'perf.js'));
const {
  exportSessionToEnvFiles,
  generateSessionId,
  getDataDir,
  persistSession,
  resolveSessionId,
} = require(path.join(__dirname, '..', 'scripts', 'lib', 'session.js'));

function parseArgs(argv) {
  const args = { platform: 'zcode' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--platform') args.platform = argv[++i];
  }
  return args;
}

async function readHookInput() {
  try {
    const raw = await readStdin(50);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function main() {
  const started = now();
  const args = parseArgs(process.argv);
  try {
    const input = await readHookInput();
    const sessionId = resolveSessionId(input, getDataDir()) || generateSessionId();
    const data = {
      session_id: sessionId,
      platform: args.platform,
      started_at: new Date().toISOString(),
    };
    persistSession(data);
    exportSessionToEnvFiles(sessionId);

    process.stderr.write(`[skill-radar] session started: ${data.session_id}\n`);
  } catch {
    // swallow — observability must never break the user
  }
  warnIfSlow('SessionStart', elapsedMs(started));

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
