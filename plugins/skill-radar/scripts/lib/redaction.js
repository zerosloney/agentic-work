'use strict';

const SENSITIVE_KEY_RE = /(pass(word)?|secret|token|api[-_]?key|credential|auth|cookie|session|private[-_]?key)/i;
const LARGE_CONTENT_KEYS = new Set(['content', 'old_string', 'new_string', 'replace_string', 'insert', 'text']);

function excerpt(value, max = 500) {
  if (value == null) return null;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > max ? text.slice(0, max) + `...[${text.length - max} more]` : text;
}

function redactString(value) {
  return value
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[redacted]')
    .replace(/([?&](?:token|api_key|key|secret|password)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/((?:password|passwd|token|secret|api[-_]?key)\s*=\s*)[^\s"'`]+/gi, '$1[redacted]')
    .replace(/(--(?:password|passwd|token|secret|api-key)\s+)[^\s"'`]+/gi, '$1[redacted]')
    .replace(/(https?:\/\/)[^:\s/@]+:[^@\s/]+@/gi, '$1[redacted]@');
}

function redactValue(value, key = '') {
  if (SENSITIVE_KEY_RE.test(key)) return '[redacted]';
  if (value == null) return value;
  if (typeof value === 'string') {
    if (LARGE_CONTENT_KEYS.has(key)) return `[redacted:${value.length} chars]`;
    return excerpt(redactString(value), 1000);
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redactValue(item, key));

  const out = {};
  for (const [childKey, childValue] of Object.entries(value).slice(0, 50)) {
    out[childKey] = redactValue(childValue, childKey);
  }
  return out;
}

// Raw capture is debugging-only, not an unlimited bypass. Keep structure bounded
// and redact key-shaped secrets even when raw capture is explicitly enabled.
function limitRawValue(value, key = '', depth = 0) {
  if (SENSITIVE_KEY_RE.test(key)) return '[redacted]';
  if (value == null) return value;
  if (typeof value === 'string') return excerpt(redactString(value), 4000);
  if (typeof value !== 'object' || depth >= 5) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => limitRawValue(item, key, depth + 1));

  const out = {};
  for (const [childKey, childValue] of Object.entries(value).slice(0, 50)) {
    out[childKey] = limitRawValue(childValue, childKey, depth + 1);
  }
  return out;
}

module.exports = { excerpt, limitRawValue, redactString, redactValue };
