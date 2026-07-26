'use strict';
const path = require('path');

function resolveHome() {
  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) {
    throw new Error('Cannot resolve HOME: neither USERPROFILE nor HOME is set');
  }
  return home;
}

function joinHome(...segments) {
  return path.join(resolveHome(), ...segments);
}

module.exports = { resolveHome, joinHome };