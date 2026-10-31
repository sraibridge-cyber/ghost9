'use strict';
// Contract tests for S (see docs/architecture/S_GATE_CONTRACT.md). Expectations come from the contract only.
const { gateSyntactical } = require('../../src/gate_syntactic');
const MUST_PASS = ['She runs fast.', "Don't go.", "Can't you see?", 'Hello! How are you?', 'Go.', 'Stop.',
  'Call 555-1234.', 'Born on 1990-01-01.', 'It costs €10.', "The dog's bone.", 'she runs fast'];
const MUST_FAIL = ['Run walk jump.', 'Eat sleep drink.', 'My the car broke.', 'This that is wrong.', 'Are happy.', 'Red is car my.'];
function verdict(r) {
  if (r == null) return null;
  if (typeof r.pass === 'boolean') return r.pass;
  if (typeof r.passed === 'boolean') return r.passed;
  return r.verdict === 'pass' ? true : r.verdict === 'fail' ? false : null;
}
let fails = 0, n = 0;
for (const [label, list, want] of [['must-pass', MUST_PASS, true], ['must-fail', MUST_FAIL, false]]) {
  for (const s of list) {
    n++;
    const got = verdict(gateSyntactical(s));
    if (got !== want) { fails++; console.log(`FAIL ${label}: ${s} (expected ${want}, got ${got})`); }
  }
}
console.log(`contract_syntactic: ${n - fails}/${n} passed`);
process.exit(fails ? 1 : 0);
