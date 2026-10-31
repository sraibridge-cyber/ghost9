'use strict';
// Contract tests for M (see docs/architecture/M_GATE_CONTRACT.md). Metaphor is a documented limit and is not tested here.
const { gateSemantic } = require('../../src/gate_semantic');
const MUST_FLAG = ['The door was open and closed.', 'He is always late and never late.', 'The cat is alive and dead.',
  'The answer is true and false.', 'The square circle rolled down the hill.', 'The rock eats a sandwich.', 'The idea sleeps soundly.'];
const MUST_PASS = ['The table is made of oak.', 'She bought fresh bread this morning.', 'The fog drifts through the valley.',
  'The tornado roars across the plain.', 'The river flooded three neighbourhoods in 1927.'];
function anomalous(r) {
  if (r == null) return null;
  if (typeof r.pass === 'boolean') return !r.pass;
  if (typeof r.passed === 'boolean') return !r.passed;
  if (typeof r.flagged === 'boolean') return r.flagged;
  if (typeof r.verdict === 'string') return r.verdict !== 'coherent' && r.verdict !== 'pass';
  return null;
}
let fails = 0, n = 0;
for (const [label, list, want] of [['must-flag', MUST_FLAG, true], ['must-pass', MUST_PASS, false]]) {
  for (const s of list) {
    n++;
    const got = anomalous(gateSemantic(s));
    if (got !== want) { fails++; console.log(`FAIL ${label}: ${s} (expected anomalous=${want}, got ${got})`); }
  }
}
console.log(`contract_semantic: ${n - fails}/${n} passed`);
process.exit(fails ? 1 : 0);
