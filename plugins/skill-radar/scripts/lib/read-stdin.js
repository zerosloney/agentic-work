'use strict';
// read-stdin.js — read all of stdin with a hard timeout.
//
// Hook scripts must never hang: if the host platform spawns the hook but
// never closes stdin (observed risk on CodeBuddy's cmd → sh → node chain,
// which has no platform-side timeout), a plain `for await (process.stdin)`
// blocks forever. This helper resolves with whatever accumulated once
// 'end'/'error' fires OR the timeout elapses, then destroys stdin so the
// process can exit.

function readStdin(timeoutMs = 3000) {
  return new Promise((resolve) => {
    let raw = '';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { process.stdin.destroy(); } catch { /* ignore */ }
      resolve(raw);
    };
    const timer = setTimeout(finish, timeoutMs);
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { raw += chunk; });
    process.stdin.on('end', finish);
    process.stdin.on('error', finish);
  });
}

module.exports = { readStdin };
