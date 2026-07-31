#!/usr/bin/env node
'use strict';

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function runNode(args, opts = {}) {
  return cp.spawnSync(process.execPath, args, {
    cwd: opts.cwd || ROOT,
    env: { ...process.env, ...(opts.env || {}) },
    input: opts.input,
    encoding: 'utf-8',
  });
}

function testSkillRadarRedactsTrace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-radar-p0-'));
  const payload = {
    event: 'PostToolUse',
    tool_name: 'Edit',
    session_id: 'sess_test',
    tool_input: {
      file_path: 'plugins/skill-radar/hooks/log-invocation.js',
      content: 'super-secret-file-body',
      password: 'p@ssw0rd',
      command: 'curl -H "Authorization: Bearer abc.def.ghi" --token raw-token https://user:pass@example.test?password=query-secret',
    },
    tool_response: {
      ok: true,
      token: 'response-token',
    },
  };

  const res = runNode(['plugins/skill-radar/hooks/log-invocation.js'], {
    env: {
      ZCODE_PLUGIN_DATA: tmp,
      SKILL_RADAR_CAPTURE_RAW: '',
      SKILL_RADAR_DISABLED: '',
    },
    input: JSON.stringify(payload),
  });

  assert.strictEqual(res.status, 0, res.stderr);
  const traceFile = path.join(tmp, 'traces', `${new Date().toISOString().slice(0, 10)}.jsonl`);
  const entry = JSON.parse(fs.readFileSync(traceFile, 'utf-8').trim());

  assert.strictEqual(entry.tool_input_redacted, true);
  assert.strictEqual(entry.tool_input.password, '[redacted]');
  assert.strictEqual(entry.tool_input.content, '[redacted:22 chars]');
  assert.match(entry.tool_input.command, /Bearer \[redacted\]/);
  assert.doesNotMatch(JSON.stringify(entry), /p@ssw0rd|super-secret-file-body|response-token|raw-token|query-secret|user:pass/);
}

function testTraeRefusesMalformedHooks() {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'trae-home-p0-'));
  const tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'trae-project-p0-'));
  fs.writeFileSync(path.join(tmpProject, 'package.json'), '{}\n');
  const traeDir = path.join(tmpProject, '.trae');
  fs.mkdirSync(traeDir, { recursive: true });
  const hooksFile = path.join(traeDir, 'hooks.json');
  const original = '{ this is not json';
  fs.writeFileSync(hooksFile, original);

  const res = runNode([path.join(ROOT, 'scripts', 'install-trae.js'), '--plugin', 'skill-radar'], {
    cwd: tmpProject,
    env: { USERPROFILE: tmpHome, HOME: tmpHome },
  });

  assert.notStrictEqual(res.status, 0, 'install-trae should reject malformed hooks.json');
  assert.match(res.stderr, /Refusing to overwrite unreadable hooks file/);
  assert.strictEqual(fs.readFileSync(hooksFile, 'utf-8'), original);
}

function readJsonl(file) {
  return fs.readFileSync(file, 'utf-8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
}

function todayJsonl(dir) {
  return path.join(dir, `${new Date().toISOString().slice(0, 10)}.jsonl`);
}

function testSkillRadarSessionAndPerf() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-radar-p1-'));
  const envFile = path.join(tmp, 'env.txt');

  const start = runNode(['plugins/skill-radar/hooks/session-start.js', '--platform', 'trae'], {
    env: {
      ZCODE_PLUGIN_DATA: tmp,
      TRAE_ENV_FILE: envFile,
      SKILL_RADAR_PERF_BUDGET_MS: '10000',
    },
    input: JSON.stringify({ session_id: 'host_session_a', hook_event_name: 'SessionStart' }),
  });
  assert.strictEqual(start.status, 0, start.stderr);
  assert.deepStrictEqual(JSON.parse(start.stdout), {});
  assert.match(fs.readFileSync(envFile, 'utf-8'), /SKILL_RADAR_SESSION_ID="host_session_a"/);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(tmp, 'sessions', 'host_session_a.json'), 'utf-8')).session_id, 'host_session_a');

  fs.writeFileSync(path.join(tmp, 'session.json'), JSON.stringify({ session_id: 'stale_session' }) + '\n');
  const traceInputWins = runNode(['plugins/skill-radar/hooks/log-invocation.js'], {
    env: {
      ZCODE_PLUGIN_DATA: tmp,
      SKILL_RADAR_PERF_BUDGET_MS: '0',
    },
    input: JSON.stringify({
      session_id: 'host_session_b',
      tool_name: 'Bash',
      tool_input: { command: 'dotnet test' },
      tool_response: { ok: true },
    }),
  });
  assert.strictEqual(traceInputWins.status, 0, traceInputWins.stderr);
  assert.match(traceInputWins.stderr, /perf budget exceeded/);

  const traceEnvWins = runNode(['plugins/skill-radar/hooks/log-invocation.js'], {
    env: {
      ZCODE_PLUGIN_DATA: tmp,
      SKILL_RADAR_SESSION_ID: 'host_session_c',
      SKILL_RADAR_PERF_BUDGET_MS: '10000',
    },
    input: JSON.stringify({
      tool_name: 'Edit',
      tool_input: { file_path: 'plugins/skill-radar/README.md', content: 'x' },
      tool_response: { ok: true },
    }),
  });
  assert.strictEqual(traceEnvWins.status, 0, traceEnvWins.stderr);

  const traces = readJsonl(todayJsonl(path.join(tmp, 'traces')));
  assert.strictEqual(traces.at(-2).session_id, 'host_session_b');
  assert.strictEqual(traces.at(-2).hook_duration_ms >= 0, true);
  assert.strictEqual(traces.at(-1).session_id, 'host_session_c');

  const stop = runNode(['plugins/skill-radar/hooks/stop-signal.js', '--platform', 'trae'], {
    env: {
      ZCODE_PLUGIN_DATA: tmp,
      SKILL_RADAR_SESSION_ID: 'host_session_d',
      SKILL_RADAR_PERF_BUDGET_MS: '10000',
    },
    input: JSON.stringify({
      hook_event_name: 'Stop',
      last_assistant_message: 'all done thanks',
    }),
  });
  assert.strictEqual(stop.status, 0, stop.stderr);
  const signals = readJsonl(todayJsonl(path.join(tmp, 'signals')));
  assert.strictEqual(signals.at(-1).session_id, 'host_session_d');
  assert.strictEqual(signals.at(-1).hook_duration_ms >= 0, true);
}

testSkillRadarRedactsTrace();
testTraeRefusesMalformedHooks();
testSkillRadarSessionAndPerf();
console.log('skill-radar security/session checks passed');
