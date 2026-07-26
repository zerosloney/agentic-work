#!/usr/bin/env node
'use strict';
// install-opencode.js — Install agentic-work plugins for opencode
//
// Usage:
//   node scripts/install-opencode.js                  # install all
//   node scripts/install-opencode.js --plugin dotnet-work
//   node scripts/install-opencode.js --uninstall
//   node scripts/install-opencode.js --dry-run
//
// Copies plugins/<name>/opencode/{skills,agents,commands} to
// %USERPROFILE%/.config/opencode/{skills,agents,commands}/

const fs = require('fs');
const path = require('path');
const { copyDirRecursive } = require('./lib/copy-dir');
const { joinHome } = require('./lib/resolve-home');

const HOME = joinHome('.config', 'opencode');
const PLUGINS = [
  { name: 'dotnet-work',   src: 'plugins/dotnet-work/opencode' },
  { name: 'loop-workflow', src: 'plugins/loop-workflow/opencode' }
];
const SUBDIRS = ['skills', 'agents', 'commands'];

function parseArgs(argv) {
  const args = { plugin: null, uninstall: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--plugin') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --plugin requires a value (dotnet-work | loop-workflow)');
        process.exit(2);
      }
      args.plugin = next;
      i++;
    } else if (argv[i] === '--uninstall') args.uninstall = true;
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

function selectPlugins(args) {
  if (!args.plugin) return PLUGINS;
  const found = PLUGINS.find(p => p.name === args.plugin);
  if (!found) {
    console.error(`Unknown plugin: ${args.plugin}. Available: ${PLUGINS.map(p => p.name).join(', ')}`);
    process.exit(1);
  }
  return [found];
}

function install(args) {
  console.log('Installing agentic-work for opencode...\n');
  const plugins = selectPlugins(args);
  for (const plugin of plugins) {
    const srcBase = path.join(__dirname, '..', plugin.src);
    for (const sub of SUBDIRS) {
      const src = path.join(srcBase, sub);
      if (!fs.existsSync(src)) continue;
      const dest = path.join(HOME, sub);
      // opencode skills/<name>/ nested; agents/commands/ flat
      if (sub === 'skills') {
        const sourceSkills = fs.readdirSync(src);
        // Remove stale skills that no longer exist in source
        if (fs.existsSync(dest)) {
          for (const existing of fs.readdirSync(dest)) {
            if (!sourceSkills.includes(existing)) {
              const stalePath = path.join(dest, existing);
              if (!args.dryRun) fs.rmSync(stalePath, { recursive: true, force: true });
              console.log(`  ${args.dryRun ? 'would remove stale' : 'removed stale'}: ${sub}/${existing}/`);
            }
          }
        }
        for (const skill of sourceSkills) {
          const skillSrc = path.join(src, skill);
          const skillDest = path.join(dest, skill);
          if (!args.dryRun) copyDirRecursive(skillSrc, skillDest);
          console.log(`  ${args.dryRun ? 'would copy' : 'copied'}: ${sub}/${skill}/`);
        }
      } else {
        const sourceFiles = fs.readdirSync(src);
        // Remove stale files that no longer exist in source
        if (fs.existsSync(dest)) {
          for (const existing of fs.readdirSync(dest)) {
            if (!sourceFiles.includes(existing)) {
              const stalePath = path.join(dest, existing);
              if (!args.dryRun) fs.rmSync(stalePath, { force: true });
              console.log(`  ${args.dryRun ? 'would remove stale' : 'removed stale'}: ${sub}/${existing}`);
            }
          }
        }
        for (const file of sourceFiles) {
          const fSrc = path.join(src, file);
          const fDest = path.join(dest, file);
          if (!args.dryRun) fs.copyFileSync(fSrc, fDest);
          console.log(`  ${args.dryRun ? 'would copy' : 'copied'}: ${sub}/${file}`);
        }
      }
    }
  }
  console.log(args.dryRun ? '\n[dry-run] No files written.' : '\n✅ Installation complete.');
}

function uninstall(args) {
  console.log('Uninstalling agentic-work from opencode...\n');
  const plugins = selectPlugins(args);
  for (const plugin of plugins) {
    const srcBase = path.join(__dirname, '..', plugin.src);
    for (const sub of SUBDIRS) {
      const src = path.join(srcBase, sub);
      if (!fs.existsSync(src)) continue;
      if (sub === 'skills') {
        for (const skill of fs.readdirSync(src)) {
          const dest = path.join(HOME, sub, skill);
          if (fs.existsSync(dest) && !args.dryRun) fs.rmSync(dest, { recursive: true, force: true });
          console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${sub}/${skill}/`);
        }
      } else {
        for (const file of fs.readdirSync(src)) {
          const dest = path.join(HOME, sub, file);
          if (fs.existsSync(dest) && !args.dryRun) fs.rmSync(dest, { force: true });
          console.log(`  ${args.dryRun ? 'would remove' : 'removed'}: ${sub}/${file}`);
        }
      }
    }
  }
  console.log(args.dryRun ? '\n[dry-run] No files removed.' : '\n✅ Uninstallation complete.');
}

const args = parseArgs(process.argv);
args.uninstall ? uninstall(args) : install(args);