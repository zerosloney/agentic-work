#!/usr/bin/env node
// stop-signal.js — Stop hook: capture session-end signal
//
// Weak feedback signal: if the last assistant message contains error indicators
// or incompleteness markers, flag as potential negative feedback.
//
// Writes to: <ZCODE_PLUGIN_DATA>/signals/<date>.jsonl
//
// Never blocks: exit 0 + {} always.

const path = require('path');
const fs = require('fs');

function getDataDir() {
  return (
    process.env.ZCODE_PLUGIN_DATA ||
    path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar')
  );
}

// Heuristic: detect if the message suggests failure/incompleteness
function detectNegativeSignal(message) {
  if (!message || typeof message !== 'string') return null;

  const lower = message.toLowerCase();

  // Explicit error indicators
  const errorPatterns = [
    /\bfailed\b/,
    /\berror:\s/,
    /\bunable to\b/,
    /\bcould not\b/,
    /\bnot found\b/,
    /\bdoes not exist\b/,
    /\bpermission denied\b/,
    /\btimeout\b/,
    /\bsorry.*\b(unable|could not|fail)/,
  ];

  for (const re of errorPatterns) {
    if (re.test(lower)) {
      return 'error_indicator';
    }
  }

  // Incompleteness markers
  const incompletePatterns = [
    /\bi('?m| am) unable\b/,
    /\bwe cannot\b/,
    /\bnot possible\b/,
    /\byou may need to\b/,
    /\bplease try again\b/,
    /\bI couldn't\b/,
  ];

  for (const re of incompletePatterns) {
    if (re.test(lower)) {
      return 'incompleteness';
    }
  }

  return null;
}

function appendSignal(entry) {
  try {
    const dir = path.join(getDataDir(), 'signals');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const date = new Date().toISOString().slice(0, 10);
    const file = path.join(dir, `${date}.jsonl`);
    fs.appendFileSync(file, JSON.stringify(entry) + '\n');
  } catch {
    // swallow — observability must never break the user
  }
}

function readSessionId() {
  try {
    const f = path.join(getDataDir(), 'session.json');
    if (!fs.existsSync(f)) return null;
    const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
    return data.session_id || null;
  } catch {
    return null;
  }
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf-8');
  for await (const chunk of process.stdin) raw += chunk;

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const lastMessage = input.last_assistant_message || '';
  const signal = detectNegativeSignal(lastMessage);

  // Always log the stop event (for session correlation)
  const entry = {
    ts: new Date().toISOString(),
    event: 'Stop',
    session_id: input.session_id || readSessionId(),
    signal_type: signal, // null | 'error_indicator' | 'incompleteness'
    message_excerpt: lastMessage ? lastMessage.slice(0, 300) : null,
  };

  appendSignal(entry);

  if (signal) {
    process.stderr.write(`[skill-radar] Stop: detected ${signal}\n`);
  } else {
    process.stderr.write('[skill-radar] Stop: OK\n');
  }

  // Never block
  process.stdout.write(JSON.stringify({}));
}

main().catch((err) => {
  process.stderr.write(`[skill-radar] Stop error: ${err.message}\n`);
  process.stdout.write(JSON.stringify({}));
});
