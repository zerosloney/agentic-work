#!/usr/bin/env node
'use strict';
// secret-store.js — Cross-platform secret storage for plugin sensitive config.
//
// Resolution order for GET:
//   1. Environment variable (key uppercased, non-alnum → '_'), e.g. api_key → API_KEY
//   2. OS keychain:
//      - Windows: Credential Manager via CredRead/CredWrite P/Invoke (PowerShell)
//      - macOS:   Keychain via `security` CLI
//      - Linux:   libsecret via `secret-tool` CLI (when available)
//
// Convention for plugin manifests (P1-3): userConfig entries marked
// "sensitive": true are NOT stored in plugin config files. At runtime the
// plugin (or its MCP server/hook) resolves the value through this module:
//   const { getSecret } = require('./secret-store');
//   const apiKey = await getSecret('my-plugin.api_key');
//
// Keys are namespaced as `<plugin>.<config-key>`; the OS-level credential
// target is `agentic-work:<key>` to avoid collisions with other tools.
//
// CLI:
//   node scripts/lib/secret-store.js get <key>           # print value (or exit 3)
//   node scripts/lib/secret-store.js set <key> <value>   # store in OS keychain
//   node scripts/lib/secret-store.js delete <key>        # remove from keychain
//   node scripts/lib/secret-store.js has <key>           # exit 0 if resolvable
//
// Exit codes: 0 ok, 1 error, 3 secret not found.

const { spawnSync } = require('child_process');

const TARGET_PREFIX = 'agentic-work:';

function targetFor(key) {
  return TARGET_PREFIX + key;
}

function envNameFor(key) {
  return key.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

// ─── platform backends ──────────────────────────────────────────

// Windows: Credential Manager via Advapi32 CredRead/CredWrite/CredDelete.
// PowerShell 5.1 compatible (no PS7-only syntax).
function winCred(action, target, value) {
  const ps = `
Add-Type -Namespace Win32 -Name Cred -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("advapi32.dll", SetLastError=true, CharSet=System.Runtime.InteropServices.CharSet.Unicode)]
public static extern bool CredRead(string target, int type, int flags, out System.IntPtr cred);
[System.Runtime.InteropServices.DllImport("advapi32.dll", SetLastError=true, CharSet=System.Runtime.InteropServices.CharSet.Unicode)]
public static extern bool CredWrite(ref CREDENTIAL cred, int flags);
[System.Runtime.InteropServices.DllImport("advapi32.dll", SetLastError=true, CharSet=System.Runtime.InteropServices.CharSet.Unicode)]
public static extern bool CredDelete(string target, int type, int flags);
[System.Runtime.InteropServices.DllImport("advapi32.dll", SetLastError=true)]
public static extern bool CredFree(System.IntPtr buffer);
[System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential, CharSet=System.Runtime.InteropServices.CharSet.Unicode)]
public struct CREDENTIAL {
  public int Flags; public int Type; public string TargetName; public string Comment;
  public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
  public int CredentialBlobSize; public System.IntPtr CredentialBlob;
  public int Persist; public int AttributeCount; public System.IntPtr Attributes;
  public string TargetAlias; public string UserName;
}
'@
$action = ${JSON.stringify(action)}; $target = ${JSON.stringify('x')}.Replace('x', ''); $target = ${JSON.stringify(target)}
if ($action -eq 'read') {
  $ptr = [System.IntPtr]::Zero
  if (-not [Win32.Cred]::CredRead($target, 1, 0, [ref]$ptr)) { exit 3 }
  $cred = [System.Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][Win32.Cred+CREDENTIAL])
  $pwd = [System.Runtime.InteropServices.Marshal]::PtrToStringUni($cred.CredentialBlob, $cred.CredentialBlobSize / 2)
  [Win32.Cred]::CredFree($ptr) | Out-Null
  [Console]::Out.Write($pwd)
  exit 0
} elseif ($action -eq 'write') {
  $secret = ${JSON.stringify('x')}.Replace('x', ''); $secret = ${JSON.stringify(value || '')}
  $bytes = [System.Text.Encoding]::Unicode.GetBytes($secret)
  $blob = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $blob, $bytes.Length)
  $c = New-Object Win32.Cred+CREDENTIAL
  $c.Type = 1; $c.TargetName = $target; $c.CredentialBlobSize = $bytes.Length
  $c.CredentialBlob = $blob; $c.Persist = 2; $c.UserName = 'agentic-work'
  $ok = [Win32.Cred]::CredWrite([ref]$c, 0)
  [System.Runtime.InteropServices.Marshal]::FreeHGlobal($blob)
  if (-not $ok) { exit 1 }
  exit 0
} elseif ($action -eq 'delete') {
  if ([Win32.Cred]::CredDelete($target, 1, 0)) { exit 0 } else { exit 3 }
}
exit 2
`;
  const r = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf-8' });
  return r;
}

function macCred(action, target, value) {
  if (action === 'read') {
    return spawnSync('security', ['find-generic-password', '-s', target, '-w'], { encoding: 'utf-8' });
  }
  if (action === 'write') {
    // -U updates an existing item instead of failing.
    return spawnSync('security', ['add-generic-password', '-s', target, '-a', 'agentic-work', '-w', value, '-U'], { encoding: 'utf-8' });
  }
  if (action === 'delete') {
    return spawnSync('security', ['delete-generic-password', '-s', target], { encoding: 'utf-8' });
  }
  return { status: 2 };
}

function linuxCred(action, target, value) {
  if (action === 'read') {
    return spawnSync('secret-tool', ['lookup', 'service', target], { encoding: 'utf-8' });
  }
  if (action === 'write') {
    return spawnSync('secret-tool', ['store', '--label', target, 'service', target], {
      encoding: 'utf-8',
      input: value,
    });
  }
  if (action === 'delete') {
    return spawnSync('secret-tool', ['clear', 'service', target], { encoding: 'utf-8' });
  }
  return { status: 2 };
}

function backend() {
  if (process.platform === 'win32') return winCred;
  if (process.platform === 'darwin') return macCred;
  return linuxCred;
}

function backendAvailable() {
  if (process.platform === 'win32') return true; // PowerShell + Advapi32 always present
  if (process.platform === 'darwin') return whichOk('security');
  return whichOk('secret-tool');
}

function whichOk(bin) {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(cmd, [bin], { encoding: 'utf-8' }).status === 0;
}

// ─── public API ─────────────────────────────────────────────────

async function getSecret(key) {
  const envName = envNameFor(key);
  if (process.env[envName]) return process.env[envName];
  if (!backendAvailable()) return null;
  const r = backend()('read', targetFor(key));
  if (r.status === 0 && r.stdout) return r.stdout;
  return null;
}

async function setSecret(key, value) {
  if (!backendAvailable()) {
    throw new Error(`no keychain backend available on ${process.platform} (Linux needs libsecret/secret-tool). Set env var ${envNameFor(key)} instead.`);
  }
  const r = backend()('write', targetFor(key), value);
  if (r.status !== 0) {
    throw new Error(`keychain write failed (exit ${r.status}): ${(r.stderr || '').trim()}`);
  }
}

async function deleteSecret(key) {
  if (!backendAvailable()) return false;
  const r = backend()('delete', targetFor(key));
  return r.status === 0;
}

// ─── CLI ────────────────────────────────────────────────────────

async function cli() {
  const [, , cmd, key, ...rest] = process.argv;
  if (!cmd || !key || !['get', 'set', 'delete', 'has'].includes(cmd)) {
    console.error('Usage: node secret-store.js (get|set|delete|has) <key> [value]');
    process.exit(2);
  }
  try {
    if (cmd === 'get') {
      const v = await getSecret(key);
      if (v === null) process.exit(3);
      process.stdout.write(v);
      return;
    }
    if (cmd === 'has') {
      const v = await getSecret(key);
      process.exit(v === null ? 3 : 0);
    }
    if (cmd === 'set') {
      const value = rest.join(' ');
      if (!value) {
        console.error('Error: set requires a value');
        process.exit(2);
      }
      await setSecret(key, value);
      console.log(`✅ stored: ${key} (target ${targetFor(key)})`);
      return;
    }
    if (cmd === 'delete') {
      const ok = await deleteSecret(key);
      if (!ok) process.exit(3);
      console.log(`✅ deleted: ${key}`);
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

if (require.main === module) cli();

module.exports = { getSecret, setSecret, deleteSecret, envNameFor };
