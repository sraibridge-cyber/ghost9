// Regression: the QC classifier stage fails open when unreachable, and blocks only on a flagged score in block mode.
// Usage: node tests/regression/prefilter_failopen.js
'use strict';
const assert = require('assert');
const path = require('path');
const { runPrefilterAsync, DEFAULT_MODE } = require(path.join(__dirname, '..', '..', 'src', 'prefilter'));
const { config: CLF } = require(path.join(__dirname, '..', '..', 'src', 'clf_client'));

const BENIGN = 'The committee approved the budget after a long debate.';
const modeWith = QC => ({ ...DEFAULT_MODE, QC });
const down = { classify: async () => ({ ok: false, error: 'connect ECONNREFUSED' }) };
const flagged = { classify: async () => ({ ok: true, scores: [CLF.threshold + 0.5], model: 'stub' }) };
const clear = { classify: async () => ({ ok: true, scores: [0.0], model: 'stub' }) };

let passed = 0, failed = 0;
async function check(name, fn) {
  try { await fn(); passed++; console.log('  ok    ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + ' :: ' + e.message); }
}

(async () => {
  await check('block mode + classifier unreachable: sentence passes (fail-open)', async () => {
    const r = await runPrefilterAsync(BENIGN, [], modeWith('block'), down);
    assert.strictEqual(r.pass, true);
    assert.strictEqual(r.stages.QC.reason, 'classifier_unavailable');
    assert.strictEqual(r.stages.QC.pass, true);
  });
  await check('advisory mode + classifier unreachable: sentence passes', async () => {
    const r = await runPrefilterAsync(BENIGN, [], modeWith('advisory'), down);
    assert.strictEqual(r.pass, true);
  });
  await check('block mode + flagged score: blocked by QC', async () => {
    const r = await runPrefilterAsync(BENIGN, [], modeWith('block'), flagged);
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.blockedBy, 'QC');
    assert.strictEqual(r.stages.QC.flagged, true);
  });
  await check('advisory mode + flagged score: reported, not blocked', async () => {
    const r = await runPrefilterAsync(BENIGN, [], modeWith('advisory'), flagged);
    assert.strictEqual(r.pass, true);
    assert.strictEqual(r.stages.QC.flagged, true);
  });
  await check('block mode + clear score: passes', async () => {
    const r = await runPrefilterAsync(BENIGN, [], modeWith('block'), clear);
    assert.strictEqual(r.pass, true);
    assert.strictEqual(r.stages.QC.flagged, false);
  });
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
