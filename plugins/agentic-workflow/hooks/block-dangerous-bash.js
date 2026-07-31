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
//           exit 0 = allow, exit 2 = deny. Internal errors fail open (exit 0)
//           — a broken hook must not block legitimate work.
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
// intentional-simple: substring/regex on raw command, no shell-AST parsing.
// A determined adversarial prompt can obfuscate (env vars, $(), eval), but
// this catches the direct forms the agent deny-list enumerates, which is the
// documented contract. Deeper analysis (sandboxing) is out of scope for a hook.
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

async function main() {
  const raw = await readStdin();
  let input;
  try { input = JSON.parse(raw); }
  catch (e) { process.exit(0); } // empty/timeout/unparseable stdin → allow

  const cmd = extractCommand(input.tool_input);
  if (!cmd) process.exit(0); // not a bash call we can inspect → allow

  for (const entry of DENY_LIST) {
    if (entry.pattern.test(cmd)) {
      console.error(`Command blocked by agentic-workflow safety hook: ${entry.reason}`);
      console.error(`  command: ${cmd}`);
      console.error('  If this command is genuinely required, run it manually outside the pipeline.');
      process.exit(2);
    }
  }
  process.exit(0);
}

main().catch(err => {
  console.error(`Hook error: ${err.message}`);
  process.exit(0); // fail open
});
