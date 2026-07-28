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
  const envDir = process.env.ZCODE_PLUGIN_DATA || process.env.CODEBUDDY_PLUGIN_DATA;
  if (envDir) return envDir;
  return path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
}

// Heuristic: detect if the message suggests failure/incompleteness.
//
// To reduce false positives, before pattern matching we strip:
//   - fenced code blocks (```...```) and inline code (`...`) — error strings
//     quoted from logs would otherwise trigger 'error:' / 'not found' etc.
//   - blockquote lines (> ...) — same reason for quoted log excerpts.
// Then we reject the whole message if it contains resolution markers
// ("now passes", "fixed", "resolved", "no longer fails") — the agent quoting
// a failure it has just resolved is not a negative signal.
function detectNegativeSignal(message) {
  if (!message || typeof message !== 'string') return null;

  // Strip code fences, inline code, and blockquotes. These are the main
  // sources of false positives (agents quote logs/errors while explaining).
  const stripped = message
    .replace(/```[\s\S]*?```/g, ' ')   // fenced code blocks
    .replace(/`[^`\n]*`/g, ' ')         // inline code
    .replace(/^\s*>.*$/gm, ' ');        // blockquote lines

  const lower = stripped.toLowerCase();

  // Resolution context: agent describes a failure it already fixed.
  // One match suppresses the whole message — quoting a solved failure is
  // not a fresh negative signal.
  const resolutionPatterns = [
    /\b(now|already|previously)\s+(pass|passes|passed|working|works|succeed)/,
    /\b(fixed|resolved|solved|corrected|patched)\b/,
    /\bno longer (fails|errors|times out)/,
    /\bafter (the )?fix/,
  ];
  for (const re of resolutionPatterns) {
    if (re.test(lower)) return null;
  }

  // Require at least one explicit error pattern AND enough signal to not
  // fire on stray fragments.
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

  const incompletePatterns = [
    /\bi('?m| am) unable\b/,
    /\bwe cannot\b/,
    /\bnot possible\b/,
    /\byou may need to\b/,
    /\bplease try again\b/,
    /\bi couldn't\b/,
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
