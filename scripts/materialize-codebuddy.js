#!/usr/bin/env node
'use strict';
// materialize-codebuddy.js — Assemble self-contained CodeBuddy plugins into dist/.
//
// Usage:
//   node scripts/materialize-codebuddy.js                  # materialize all
//   node scripts/materialize-codebuddy.js --plugin dotnet-work
//   node scripts/materialize-codebuddy.js --dry-run
//
// Produces dist/codebuddy/<name>-codebuddy/ — a self-contained plugin tree
// (manifest + skills/commands/agents with codebuddy overrides applied) that
// can be referenced verbatim by .codebuddy-plugin/marketplace.json `source`.
//
// This script is pure file assembly: it does NOT touch the CodeBuddy CLI,
// does NOT install, and has no --uninstall (delete dist/codebuddy/ to revert).
// Idempotent: re-running replaces existing output.
//
// After editing any shared content (plugins/<name>/) or codebuddy agent
// overrides (plugins/<name>/codebuddy/agents/), re-run this script and commit
// the dist/ changes alongside the source changes.

const fs = require('fs');
const path = require('path');
const {
  REPO_ROOT,
  materializePlugin,
} = require('./lib/materialize');

const PLUGINS = ['dotnet-work', 'loop-workflow'];
const DIST_ROOT = path.join(REPO_ROOT, 'dist', 'codebuddy');

function parseArgs(argv) {
  const args = { plugin: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --plugin requires a value (dotnet-work | loop-workflow)');
        process.exit(2);
      }
      args.plugin = next;
      i++;
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    } else {
      console.error(`Error: unknown argument: ${argv[i]}`);
      process.exit(2);
    }
  }
  return args;
}

function selectPlugins(args) {
  if (!args.plugin) return PLUGINS;
  if (!PLUGINS.includes(args.plugin)) {
    console.error(`Unknown plugin: ${args.plugin}. Available: ${PLUGINS.join(', ')}`);
    process.exit(1);
  }
  return [args.plugin];
}

function main() {
  const args = parseArgs(process.argv);
  const plugins = selectPlugins(args);

  console.log(args.dryRun
    ? 'Materializing agentic-work for CodeBuddy (dry-run)...\n'
    : 'Materializing agentic-work for CodeBuddy...\n');

  if (!args.dryRun) {
    fs.mkdirSync(DIST_ROOT, { recursive: true });
  } else {
    console.log(`would ensure: ${DIST_ROOT}`);
  }

  for (const pluginName of plugins) {
    console.log(`→ ${pluginName}`);
    materializePlugin(pluginName, DIST_ROOT, { dryRun: args.dryRun });
  }

  console.log(args.dryRun
    ? '\n[dry-run] No files written.'
    : `\n✅ Materialized into ${DIST_ROOT}`);
}

main();
