// categorize-error.js — shared error pattern bucketing.
//
// Used by evolve.js (dominant-pattern analysis) and aggregate-traces.js
// (top_errors grouping by category instead of raw string, so ENOENT errors
// on different paths collapse to one "not_found" bucket). Single source of
// truth so the two scripts never drift on category names.

'use strict';

function categorizeError(msg) {
  if (!msg) return 'unknown';
  const lower = String(msg).toLowerCase();
  if (/permission denied|access denied|eacces/.test(lower)) return 'permission';
  if (/not found|enoent|does not exist|no such file/.test(lower)) return 'not_found';
  if (/timeout|etimedout/.test(lower)) return 'timeout';
  if (/syntax|parse|unexpected|invalid/.test(lower)) return 'syntax';
  if (/connection|econnrefused|network/.test(lower)) return 'connection';
  if (/memory|heap|out of memory/.test(lower)) return 'resource';
  return 'other';
}

module.exports = { categorizeError };
