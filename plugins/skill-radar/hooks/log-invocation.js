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
// interfere with the user's workflow.

const path = require('path');
const fs = require('fs');

// inferSkill lives under scripts/lib/ (sibling of hooks/). Resolve relative
// to this file so it works regardless of process cwd.
const { inferSkill } = require(path.join(__dirname, '..', 'scripts', 'lib', 'infer-skill.js'));

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

function getDataDir() {
  // Platform-specific data dir env vars
  const envDir = process.env.ZCODE_PLUGIN_DATA || process.env.CODEBUDDY_PLUGIN_DATA;
  if (envDir) return envDir;
  return path.join(process.env.HOME || process.env.USERPROFILE || '.', '.skill-radar');
}

function getTracesDir() {
  return path.join(getDataDir(), 'traces');
}

function getSessionFile() {
  return path.join(getDataDir(), 'session.json');
}

// ─── session ──────────────────────────────────────────────────────

function readSessionId() {
  try {
    const f = getSessionFile();
    if (!fs.existsSync(f)) return null;
    const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
    return data.session_id || null;
  } catch {
    return null;
  }
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

// ─── main ─────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
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
    session_id: input.session_id || readSessionId(),
    platform: args.platform || 'zcode',
  };

  // Optional fields — present only when non-empty
  if (toolInput) {
    entry.tool_input = toolInput;
    entry.tool_input_size = JSON.stringify(toolInput).length;
    // Tag the likely skill at trace time so aggregation can group by skill
    // without re-running inference offline.
    const skill = inferSkill(toolName, toolInput);
    if (skill) entry.skill = skill;
  }

  entry.tool_response_size = JSON.stringify(toolResponse).length;
  entry.tool_response_excerpt = excerpt(toolResponse);

  // Failure-specific: capture error detail
  if (eventName === 'PostToolUseFailure') {
    entry.error = {
      message: toolResponse.error || toolResponse.message || null,
      stack: toolResponse.stack || null,
    };
  }

  appendTrace(entry);

  // Debug trace (visible in platform logs, not injected into conversation)
  process.stderr.write(
    `[skill-radar] ${eventName} ${toolName} (${entry.tool_response_size}b)\n`
  );

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
  process.stdout.write(JSON.stringify({}));
});
