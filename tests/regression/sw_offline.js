// Regression: the generated service worker never reaches the network.
// Sovereignty rule 1 (docs/architecture/SOVEREIGNTY.md). Node >= 18, no dependencies.
// Usage: node tests/regression/sw_offline.js
'use strict';

const assert = require('assert');
const path = require('path');
const { generateServiceWorker } = require(path.join(__dirname, '..', '..', 'src', 'ghost_persistence'));

const sw = generateServiceWorker();
const fetchHandler = sw.slice(sw.indexOf("addEventListener('fetch'"));

const checks = [
  ['fetch handler answers from cache', () => assert.ok(fetchHandler.includes('caches.match(event.request)'))],
  ['fetch handler has no network call', () => assert.ok(!/\bfetch\s*\(/.test(fetchHandler))],
  ['cache miss returns 404', () => assert.ok(fetchHandler.includes('status: 404'))],
  ['no hard-coded remote origin in the worker', () => assert.ok(!/https?:\/\//.test(sw))],
];
let passed = 0, failed = 0;
for (const [name, fn] of checks) {
  try { fn(); passed++; console.log(`  ok    ${name}`); }
  catch (err) { failed++; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
