'use strict';
// Runs every suite in its own process with a timeout. A suite fails on a non-zero exit,
// a timeout, a "Failed: N" line with N > 0, an "N failed" summary, or a printed "(exp ..., got ...)" mismatch.
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TIMEOUT_MS = 180000;
const SUITES = [
  ['regression/run', 'tests/regression/run.js'],
  ['e2e/kernel_integration', 'tests/e2e/kernel_integration_test.js'],
  ['e2e/ghost_kernel_e2e', 'tests/e2e/ghost_kernel_e2e_battery.js'],
  ['unit/gate_pragmatic', 'tests/unit/test_gate_pragmatic.js'],
  ['unit/gate_quarantine', 'tests/unit/test_gate_quarantine.js'],
  ['unit/gate_semantic', 'tests/unit/test_gate_semantic.js'],
  ['unit/gate_syntactic', 'tests/unit/test_gate_syntactic.js'],
  ['batteries/gate_lexical', 'tests/batteries/test_gate_lexical.js'],
  ['regression/gate_cohesion', 'tests/regression/test_gate_cohesion.js'],
  ['regression/prefilter_m2', 'tests/regression/test_prefilter_m2.js'],
];

function judge(out, status, signal) {
  const reasons = [];
  if (signal === 'SIGTERM' || status === null) reasons.push('timeout');
  else if (status !== 0) reasons.push(`exit ${status}`);
  if (/Failed:\s*[1-9]\d*/.test(out)) reasons.push('Failed > 0');
  if (/\b[1-9]\d* failed\b/.test(out)) reasons.push('N failed');
  const mismatches = (out.match(/\(exp (true|false), got (true|false)\)/g) || []).length;
  if (mismatches) reasons.push(`${mismatches} exp/got mismatch`);
  return reasons;
}

let bad = 0;
for (const [name, file] of SUITES) {
  const r = spawnSync(process.execPath, [path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', timeout: TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  const reasons = judge(out, r.status, r.signal);
  if (reasons.length) bad++;
  console.log(`${reasons.length ? 'FAIL' : 'PASS'}  ${name.padEnd(26)} ${reasons.join('; ') || 'ok'}`);
}
console.log(`\n${SUITES.length - bad}/${SUITES.length} suites passed`);
process.exit(bad ? 1 : 0);
