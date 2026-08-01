'use strict';

// Regression tests for the agentic-workflow fixes. Uses only Node built-ins so
// it can run in the repository's bundled Node runtime.

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const derive = require(path.join(repoRoot, 'scripts', 'lib', 'derive-platform.js'));
const scopeHook = path.join(repoRoot, 'plugins', 'agentic-workflow', 'hooks', 'block-forbidden-scope.js');
const stateValidator = path.join(repoRoot, 'plugins', 'agentic-workflow', 'scripts', 'validate-state.js');

function runNode(args, options = {}) {
  return cp.spawnSync(process.execPath, args, {
    cwd: options.cwd || repoRoot,
    input: options.input,
    encoding: 'utf8',
  });
}

function makeTempProject(state) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-workflow-test-'));
  fs.mkdirSync(path.join(root, '.loop-cli', 'state'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.loop-cli', 'state', 'coding-pipeline.json'),
    JSON.stringify(state),
  );
  return root;
}

function testDerivedDelegationTool() {
  for (const platform of ['codebuddy', 'qoder']) {
    for (const agent of ['coding-orchestrator.md', 'ralph-orchestrator.md']) {
      const result = derive.deriveAgentFile(
        path.join(repoRoot, 'plugins', 'agentic-workflow', 'agents', agent),
        platform,
      );
      assert.match(result.out, /tools: Bash, Read, Glob, Grep, Task/,
        `${platform}/${agent} must retain Task delegation tool`);
    }
  }
}

function testForbiddenScopePaths() {
  const root = makeTempProject({ version: 1, forbidden_scope: ['src/*'] });
  try {
    const targets = [
      [path.join(root, 'src', 'file.ts'), 2],
      [path.join(root, 'src', 'nested', 'file.ts'), 2],
      ['src/file.ts', 2],
      [path.join(root, 'other', 'file.ts'), 0],
    ];
    for (const [filePath, expectedStatus] of targets) {
      const result = runNode([scopeHook], {
        cwd: root,
        input: JSON.stringify({ tool_input: { file_path: filePath } }),
      });
      assert.strictEqual(result.status, expectedStatus,
        `unexpected scope result for ${filePath}: ${result.stderr}`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function validV1(extra = {}) {
  return {
    version: 1,
    prompt: 'test',
    max_iterations: 0,
    completion_promise: null,
    outer_iteration: 0,
    tasks: [],
    consecutive_failures: 0,
    stall_counter: 0,
    fail_history: [],
    round: 0,
    stop_reason: null,
    ...extra,
  };
}

function validV2(extra = {}) {
  return {
    version: 2,
    prompt: 'test',
    max_iterations: 0,
    completion_promise: null,
    outer_iteration: 0,
    nodes: {
      n1: { status: 'pending', failures: 0, result: null, subtask_of: null },
    },
    active_set: ['n1'],
    consecutive_failures: 0,
    stall_counter: 0,
    fail_history: [{ node_id: 'n1', round: 1, reason: 'test' }],
    round: 0,
    stop_reason: null,
    ...extra,
  };
}

function validateState(state) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-workflow-state-'));
  const file = path.join(root, 'state.json');
  fs.writeFileSync(file, JSON.stringify(state));
  try {
    return runNode([stateValidator, file]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function testUnknownStateFields() {
  assert.strictEqual(validateState(validV1()).status, 0);
  assert.notStrictEqual(validateState(validV1({ unexpected_field: true })).status, 0);
  assert.notStrictEqual(validateState(validV1({ tasks: [{
    id: 't1', title: 'test', status: 'pending', depends_on: [],
    accept_criteria: [], failures: 0, unexpected_field: true,
  }] })).status, 0);

  assert.strictEqual(validateState(validV2()).status, 0);
  assert.notStrictEqual(validateState(validV2({ unexpected_field: true })).status, 0);
  assert.notStrictEqual(validateState(validV2({ nodes: {
    n1: { status: 'pending', failures: 0, result: null, unexpected_field: true },
  } })).status, 0);
}

function testCompletionPromiseGuardText() {
  for (const agent of ['coding-orchestrator.md', 'ralph-orchestrator.md']) {
    const content = fs.readFileSync(
      path.join(repoRoot, 'plugins', 'agentic-workflow', 'agents', agent),
      'utf8',
    );
    assert.match(content, /不能替代正常 DONE 门禁/);
    assert.doesNotMatch(content, /绕过 verdict/);
  }
}

testDerivedDelegationTool();
testForbiddenScopePaths();
testUnknownStateFields();
testCompletionPromiseGuardText();
console.log('agentic-workflow regression tests passed');
