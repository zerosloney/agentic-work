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

const { readStdin } = require(path.join(__dirname, '..', 'scripts', 'lib', 'read-stdin.js'));
const { now, recordDuration, warnIfSlow } = require(path.join(__dirname, '..', 'scripts', 'lib', 'perf.js'));
const { getDataDir, resolveSessionId } = require(path.join(__dirname, '..', 'scripts', 'lib', 'session.js'));
const { excerpt, redactString } = require(path.join(__dirname, '..', 'scripts', 'lib', 'redaction.js'));

function parseArgs(argv) {
  const args = { platform: 'zcode' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--platform') args.platform = argv[++i];
  }
  return args;
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
  //
  // Participle patterns require an auxiliary/adverb prefix so negated
  // forms ("not fixed", "never resolved", "haven't fixed") do NOT
  // suppress — the word boundary alone can't tell "is fixed" from
  // "not fixed".
  const RESOLVED_PARTICIPLES = '(fixed|resolved|solved|corrected|patched)';
  const resolutionPatterns = [
    /\b(now|already|previously)\s+(pass|passes|passed|working|works|succeed)/,
    // Passive/completion: "is fixed", "has been resolved", "got patched",
    // "now fixed", "finally resolved", "'s corrected".
    new RegExp(`\\b(has|have|had|is|was|were|been|got|gotten|becomes?|become|'s|'ve|'d|now|finally|already|successfully)\\s+${RESOLVED_PARTICIPLES}\\b`),
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

// Output format: ZCode uses flat {}, CodeBuddy uses hookSpecificOutput.
function writeOutput(platform) {
  if (platform === 'codebuddy') {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext: '',
      },
    }));
  } else {
    process.stdout.write(JSON.stringify({}));
  }
}

async function main() {
  const started = now();
  const args = parseArgs(process.argv);
  // Hard timeout: never hang if the platform doesn't close stdin (P1-2).
  const raw = await readStdin(3000);

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    writeOutput(args.platform);
    return;
  }

  const lastMessage = input.last_assistant_message || '';
  const signal = detectNegativeSignal(lastMessage);

  // Always log the stop event (for session correlation)
  const entry = {
    ts: new Date().toISOString(),
    event: 'Stop',
    session_id: resolveSessionId(input),
    platform: args.platform,
    signal_type: signal, // null | 'error_indicator' | 'incompleteness'
    message_excerpt: lastMessage ? excerpt(redactString(lastMessage), 300) : null,
  };
  const elapsed = recordDuration(entry, started);

  appendSignal(entry);

  if (signal) {
    process.stderr.write(`[skill-radar] Stop: detected ${signal}\n`);
  } else {
    process.stderr.write('[skill-radar] Stop: OK\n');
  }
  warnIfSlow('Stop', elapsed);

  // Never block
  writeOutput(args.platform);
}

// ─── self-check ───────────────────────────────────────────────────
// Run with `node stop-signal.js --test`. Verifies the participle
// prefix fix: negated forms must NOT suppress, completion forms MUST.

function selfTest() {
  const cases = [
    // [message, expectedSignal]
    // Negated participles → must NOT suppress (signal fires)
    ['I have not fixed the bug yet', 'error_indicator'],  // contains "not" but also no error pattern → actually returns null. Let me pick real ones.
  ];
  // Re-define cases carefully against the actual patterns.
  const testCases = [
    // Completion contexts → suppress (null)
    ['The build is fixed now', null],
    ['This has been resolved', null],
    ['Issue got patched in v2', null],
    ['It was corrected by the reviewer', null],
    ['The bug is now fixed', null],
    ['Everything is finally resolved', null],
    ['The test now passes', null],
    ['no longer fails', null],
    ['after the fix everything works', null],
    ["it's been resolved", null],

    // Negated participles → must NOT suppress (signal fires on error pattern)
    ['I have not fixed it, build still failed', 'error_indicator'],
    ['never resolved: permission denied', 'error_indicator'],
    ["haven't fixed the timeout error", 'error_indicator'],

    // Error patterns without resolution → fire
    ['the deploy failed', 'error_indicator'],
    ['sorry, unable to connect', 'error_indicator'],  // matches sorry.*unable error pattern first
    ['we cannot proceed without credentials', 'incompleteness'],

    // Neutral → null
    ['all done thanks', null],
  ];

  let pass = 0, fail = 0;
  for (const [msg, expected] of testCases) {
    const got = detectNegativeSignal(msg);
    const ok = got === expected;
    if (ok) pass++;
    else {
      fail++;
      console.error(`  FAIL: "${msg}" → expected ${expected}, got ${got}`);
    }
  }
  console.error(`stop-signal self-test: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

if (process.argv.includes('--test')) {
  selfTest();
} else {
  main().catch((err) => {
    process.stderr.write(`[skill-radar] Stop error: ${err.message}\n`);
    writeOutput(parseArgs(process.argv).platform);
  });
}
