'use strict';
const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest, opts = {}) {
  const skip = opts.skip || (() => false);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(s, d, opts);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

module.exports = { copyDirRecursive };