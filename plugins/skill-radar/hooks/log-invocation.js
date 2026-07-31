#!/usr/bin/env node
// log-invocation.js — PostToolUse + PostToolUseFailure trace collector
//
// Appends one JSONL line per tool invocation to:
//   <ZCODE_PLUGIN_DATA>/traces/<YYYY-MM-DD>.jsonl  (ZCode)
//   <CODEBUDDY_PLUGIN_DATA>/traces/...             (CodeBuddy)
//
// Supports --event <name> and --platform <zcode|codebuddy> args for
// cross-platform use. CodeBuddy requires shell wrapper + command output
// in hookSpecificOutput format.
//
// Never blocks: exit 0 + {} on any error. Observability layer must not
// interfere with the user's workflow. Raw tool input is not stored unless
// SKILL_RADAR_CAPTURE_RAW=1 is set.

const path = require('path');
const fs = require('fs');

// inferSkill lives under scripts/lib/ (sibling of hooks/). Resolve relative
// to this file so it works regardless of process cwd.
const { inferSkill } = require(path.join(__dirname, '..', 'scripts', 'lib', 'infer-skill.js'));
const { readStdin } = require(path.join(__dirname, '..', 'scripts', 'lib', 'read-stdin.js'));
const { getDataDir, resolveSessionId } = require(path.join(__dirname, '..', 'scripts', 'lib', 'session.js'));
const { now, recordDuration, warnIfSlow } = require(path.join(__dirname, '..', 'scripts', 'lib', 'perf.js'));

// ─── args ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { event: null, platform: 'zcode' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--event') args.event = argv[++i];
    else if (argv[i] === '--platform') args.platform = argv[++i];
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

// ─── trace writing ───────────────────────────────────────────────

function appendTrace(entry) {
  try {
    const dir = getTracesDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const file = path.join(dir, `${date}.jsonl`);
    fs.appendFileSync(file, JSON.stringify(entry) + '\n');
  } catch {
    // swallow — observability must never break the user
  }
}

// ─── excerpt helper ───────────────────────────────────────────────

function excerpt(str, max = 500) {
  if (str == null) return null;
  const s = typeof str === 'string' ? str : JSON.stringify(str);
  return s.length > max ? s.slice(0, max) + `...[${s.length - max} more]` : s;
}

const SENSITIVE_KEY_RE = /(pass(word)?|secret|token|api[-_]?key|credential|auth|cookie|session|private[-_]?key)/i;
const LARGE_CONTENT_KEYS = new Set(['content', 'old_string', 'new_string', 'replace_string', 'insert', 'text']);

function redactString(s) {
  return s
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[redacted]')
    .replace(/([?&](?:token|api_key|key|secret|password)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/((?:password|passwd|token|secret|api[-_]?key)\s*=\s*)[^\s"'`]+/gi, '$1[redacted]')
    .replace(/(--(?:password|passwd|token|secret|api-key)\s+)[^\s"'`]+/gi, '$1[redacted]')
    .replace(/(https?:\/\/)[^:\s/@]+:[^@\s/]+@/gi, '$1[redacted]@');
}

function redactValue(value, key = '') {
  if (SENSITIVE_KEY_RE.test(key)) return '[redacted]';
  if (value == null) return value;
  if (typeof value === 'string') {
    if (LARGE_CONTENT_KEYS.has(key)) return `[redacted:${value.length} chars]`;
    return excerpt(redactString(value), 1000);
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redactValue(v, key));

  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = redactValue(v, k);
  return out;
}

function shouldCaptureRawInput() {
  return ['1', 'true', 'yes'].includes(String(process.env.SKILL_RADAR_CAPTURE_RAW || '').toLowerCase());
}

// ─── main ─────────────────────────────────────────────────────────

async function main() {
  const started = now();
  const args = parseArgs(process.argv);
  if (!isEnabled()) {
    process.stdout.write(args.platform === 'codebuddy'
      ? JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '' } })
      : JSON.stringify({}));
    return;
  }

  // Hard timeout: never hang if the platform doesn't close stdin (P1-2).
  const raw = await readStdin(3000);

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  // Event name: from --event arg (CodeBuddy wrapper) or stdin (ZCode).
  // Normalize CodeBuddy kebab-case args to the canonical schema event names
  // so downstream aggregation (which compares against 'PostToolUseFailure') works.
  const argEventMap = {
    'post-tool-use': 'PostToolUse',
    'post-tool-use-failure': 'PostToolUseFailure',
    'session-start': 'SessionStart',
    'stop': 'Stop',
  };
  const argEvent = args.event ? (argEventMap[args.event] || args.event) : null;
  const eventName = argEvent
    || input.event
    || (input.tool_response && input.tool_response.error ? 'PostToolUseFailure' : 'PostToolUse');

  const toolName = input.tool_name || 'unknown';
  const toolResponse = input.tool_response || {};
  const toolInput = input.tool_input || null;

  // Build trace entry — only include fields that exist
  const entry = {
    ts: new Date().toISOString(),
    event: eventName,
    tool_name: toolName,
    session_id: resolveSessionId(input),
    platform: args.platform || 'zcode',
  };

  // Optional fields — present only when non-empty
  if (toolInput) {
    entry.tool_input_size = JSON.stringify(toolInput).length;
    entry.tool_input = shouldCaptureRawInput() ? toolInput : redactValue(toolInput);
    if (!shouldCaptureRawInput()) entry.tool_input_redacted = true;
    // Tag the likely skill at trace time so aggregation can group by skill
    // without re-running inference offline.
    const skill = inferSkill(toolName, toolInput);
    if (skill) entry.skill = skill;
  }

  entry.tool_response_size = JSON.stringify(toolResponse).length;
  entry.tool_response_excerpt = excerpt(redactValue(toolResponse));

  // Failure-specific: capture error detail
  if (eventName === 'PostToolUseFailure') {
    entry.error = {
      message: excerpt(redactValue(toolResponse.error || toolResponse.message || null), 500),
      stack: excerpt(redactValue(toolResponse.stack || null), 500),
    };
  }

  const elapsed = recordDuration(entry, started);

  appendTrace(entry);

  // Debug trace (visible in platform logs, not injected into conversation)
  process.stderr.write(
    `[skill-radar] ${eventName} ${toolName} (${entry.tool_response_size}b)\n`
  );
  warnIfSlow(`${eventName} ${toolName}`, elapsed);

  // Output format: ZCode uses flat {}, CodeBuddy uses hookSpecificOutput
  if (args.platform === 'codebuddy') {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: '',
      },
    }));
  } else {
    // ZCode: empty object = no injection, never block
    process.stdout.write(JSON.stringify({}));
  }
}

main().catch((err) => {
  process.stderr.write(`[skill-radar] error: ${err.message}\n`);
  // Match the platform's expected output shape even on the error path.
  if (parseArgs(process.argv).platform === 'codebuddy') {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '' },
    }));
  } else {
    process.stdout.write(JSON.stringify({}));
  }
});
