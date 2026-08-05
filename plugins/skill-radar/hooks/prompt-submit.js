#!/usr/bin/env node
// prompt-submit.js — UserPromptSubmit trace collector
//
// Appends one JSONL line per user prompt submission to:
//   <data-dir>/traces/<YYYY-MM-DD>.jsonl
//
// Records prompt submission timing (enables prompt→first-tool latency analysis
// and per-session prompt counting). Raw prompt text is NEVER stored — only
// length and a short excerpt — to avoid logging user secrets/PII.
//
// Never blocks: exit 0 + {} on any error. Observability layer must not
// interfere with the user's workflow.

const path = require('path');
const fs = require('fs');

const { readStdin } = require(path.join(__dirname, '..', 'scripts', 'lib', 'read-stdin.js'));
const { getDataDir, resolveSessionId } = require(path.join(__dirname, '..', 'scripts', 'lib', 'session.js'));
const { now, recordDuration, warnIfSlow } = require(path.join(__dirname, '..', 'scripts', 'lib', 'perf.js'));
const { excerpt, redactValue } = require(path.join(__dirname, '..', 'scripts', 'lib', 'redaction.js'));

// ─── args ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { platform: 'zcode' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--platform') args.platform = argv[++i];
  }
  return args;
}

// ─── paths ────────────────────────────────────────────────────────

function getTracesDir() {
  return path.join(getDataDir(), 'traces');
}

function isEnabled() {
  return !['1', 'true', 'yes'].includes(String(process.env.SKILL_RADAR_DISABLED || '').toLowerCase());
}

function writeOutput(platform) {
  // UserPromptSubmit never injects context. Output shape per platform.
  if (platform === 'codebuddy') {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: '',
      },
    }));
  } else {
    process.stdout.write(JSON.stringify({}));
  }
}

// ─── trace writing ───────────────────────────────────────────────

function appendTrace(entry) {
  try {
    const dir = getTracesDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC, matches load-jsonl.js)
    const file = path.join(dir, `${date}.jsonl`);
    fs.appendFileSync(file, JSON.stringify(entry) + '\n');
  } catch {
    // swallow — observability must never break the user
  }
}

// ─── main ─────────────────────────────────────────────────────────

async function main() {
  const started = now();
  const args = parseArgs(process.argv);
  if (!isEnabled()) {
    writeOutput(args.platform);
    return;
  }

  // Hard timeout: never hang if the platform doesn't close stdin.
  const raw = await readStdin(3000);

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    writeOutput(args.platform);
    return;
  }

  // UserPromptSubmit payload: { prompt: "user text", ... } (ZCode/CodeBuddy).
  // Some platforms nest under different keys; tolerate all.
  const promptText = input.prompt || input.user_prompt || input.message || '';
  const promptStr = typeof promptText === 'string' ? promptText : JSON.stringify(promptText);

  const entry = {
    ts: new Date().toISOString(),
    event: 'UserPromptSubmit',
    session_id: resolveSessionId(input),
    platform: args.platform,
    prompt_size: promptStr.length,
    // Excerpt only, redacted — never store full prompt (may contain secrets/PII)
    prompt_excerpt: excerpt(redactValue(promptStr), 200),
    prompt_redacted: true,
  };

  const elapsed = recordDuration(entry, started);
  appendTrace(entry);

  process.stderr.write(`[skill-radar] UserPromptSubmit (${entry.prompt_size}b)\n`);
  warnIfSlow('UserPromptSubmit', elapsed);

  writeOutput(args.platform);
}

main().catch((err) => {
  process.stderr.write(`[skill-radar] UserPromptSubmit error: ${err.message}\n`);
  writeOutput(parseArgs(process.argv).platform);
});
