#!/usr/bin/env node
'use strict';
// block-dangerous-bash.js — PreToolUse hook: deny irreversibly dangerous bash
//
// Backfills the executor bash deny-list that ZCode expresses via nested
// `permission.bash` frontmatter but CodeBuddy/Qoder (permissionMode) and
// Qwen Code (approvalMode + tools allowlist) cannot express. Without this
// hook, coding-builder / ralph-worker on those platforms can run any command
// including `git push`, `rm -rf`, `sudo`, `mkfs` — relying solely on agent
// text self-discipline.
//
// Scope: ALWAYS active (not pipeline-gated). These commands are globally
// irreversible/outbound — blocking them is a baseline safety rail regardless
// of whether a pipeline is running. This is intentionally stricter than the
// forbidden_scope / verification hooks, which only gate during active pipelines.
//
// Contract: stdin = JSON tool payload, stderr = diagnostics,
//           exit 0 = allow, exit 2 = deny. Unparseable-but-nonempty JSON
//           fails closed; empty stdin (timeout/no payload) and payloads whose
//           command field we cannot locate fail open — the former is a
//           platform stdin bug, the latter is an unrecognised payload shape,
//           and neither should block an entire platform's Bash calls.
//
// The deny-list mirrors the `permission.bash` deny entries in
// zcode/agents/coding-builder.md and zcode/agents/ralph-worker.md so the
// enforced set stays in one logical place (those agents' frontmatter for
// ZCode, this hook for the platforms that cannot express per-command deny).

// Each entry: { pattern: RegExp, reason: string }.
// Patterns are tested against the normalized bash command string. Anchored
// loosely (substring with word-boundary-ish context) to catch the dangerous
// form while avoiding false positives on benign tokens.
//
// This is defense-in-depth, not a shell sandbox. Normalize common whitespace
// obfuscation and reject command substitution so direct deny-list checks
// cannot be bypassed by the common `$(...)`/eval forms. Plain shell operators
// (`|` `&` `;` `<` `>`) and `${VAR}` expansion are intentionally NOT denied —
// they're routine in normal agent commands, and every deny-list entry is a
// substring match, so chained dangerous tokens are still caught.
const DENY_LIST = [
  { pattern: /\bgit\s+push\b/, reason: 'git push — outbound remote write' },
  { pattern: /\bgit\s+reset\s+--hard\b/, reason: 'git reset --hard — discards uncommitted work' },
  { pattern: /\bgit\s+clean\b/, reason: 'git clean — deletes untracked files' },
  { pattern: /\bgit\s+rebase\b/, reason: 'git rebase — rewrites commit history' },
  { pattern: /\brm\s+-[rf]+\b/, reason: 'rm -rf — recursive forced delete' },
  { pattern: /\brm\s+-[fr]+\s+-[fr]+\b/, reason: 'rm -rf — recursive forced delete' },
  { pattern: /\bsudo\b/, reason: 'sudo — privilege escalation' },
  { pattern: /\bdd\s+/, reason: 'dd — low-level block write' },
  { pattern: /\bmkfs\b/, reason: 'mkfs — filesystem format' },
  { pattern: /\b(?:eval|exec)\b/, reason: 'eval/exec — shell indirection' },
  { pattern: /\b(?:bash|sh|cmd|powershell)(?:\.exe)?\s+(?:-c|\/c|-command)\b/i, reason: 'nested shell — command indirection' },
  // Command substitution ($(...) / backticks) can hide any of the above
  // (e.g. `$(git push)`). Bash/variable expansion `${VAR}` alone is benign
  // and must NOT be denied — agent commands routinely use $HOME, $PWD, etc.
  // Shell operators (`&` `|` `;` `<` `>`) are likewise left alone: every
  // deny-list entry is a substring match, so `x | git push` and
  // `rm -rf / && true` are still caught via the dangerous token itself.
  { pattern: /\$\(|`/, reason: 'command substitution — hides further commands' },
];

const path = require('path');
const { readStdin } = require(path.join(__dirname, '..', 'scripts', 'lib', 'read-stdin.js'));

// Extract the command string from a Bash tool payload across platforms.
// ZCode/CodeBuddy/Trae/Qoder: tool_input.command. Qwen Code: tool_input.command
// as well (run_shell_command). Some platforms nest under .command, others
// under .cmd; we check the common shapes.
function extractCommand(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return null;
  if (typeof toolInput.command === 'string') return toolInput.command;
  if (typeof toolInput.cmd === 'string') return toolInput.cmd;
  return null;
}

function normalizeCommand(command) {
  return command
    .replace(/\$\{?IFS\}?/g, ' ')
    .replace(/\\\s/g, ' ')
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deny(reason) {
  console.error(`Command blocked by agentic-workflow safety hook: ${reason}`);
  process.exit(2);
}

async function main() {
  const raw = await readStdin();
  // Empty stdin (timeout / no payload) cannot be inspected — fail open so a
  // platform that misbehaves on stdin does not block every Bash call.
  if (!raw || !raw.trim()) process.exit(0);
  let input;
  try { input = JSON.parse(raw); }
  catch (e) { deny('malformed tool payload — not valid JSON'); }

  const cmd = extractCommand(input.tool_input);
  // We could not find a command field under the keys this hook knows about
  // (command / cmd). Rather than deny — which would block an entire platform
  // if its payload uses a different key — fail open: a payload we can't
  // inspect is also one we can't prove dangerous. Deny still fires for any
  // payload where we DO find a command matching the deny-list.
  if (!cmd) process.exit(0);
  const normalized = normalizeCommand(cmd);

  for (const entry of DENY_LIST) {
    if (entry.pattern.test(normalized)) deny(entry.reason);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(`Hook error: ${err.message}`);
  process.exit(2);
});
