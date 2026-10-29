// Regression: the LM (perplexity) stage is advisory only. It never blocks in this build.
// Usage: node tests/regression/prefilter_lm_advisory.js
'use strict';
const assert = require('assert');
const path = require('path');
const { runPrefilterAsync, DEFAULT_MODE } = require(path.join(__dirname, '..', '..', 'src', 'prefilter'));
const { config: LM } = require(path.join(__dirname, '..', '..', 'src', 'lm_client'));

const BENIGN = 'The committee approved the budget after a long debate.';
const clearQc = { classify: async () => ({ ok: true, scores: [0.0], model: 'stub' }) };
const flaggedQc = { classify: async () => ({ ok: true, scores: [0.9], model: 'stub' }) };
const lmHigh = { nll: async () => ({ ok: true, values: [LM.threshold + 1], model: 'stub' }) };
const lmLow = { nll: async () => ({ ok: true, values: [3.0], model: 'stub' }) };
const lmDown = { nll: async () => ({ ok: false, error: 'ECONNREFUSED' }) };
const withLm = (LM_mode) => ({ ...DEFAULT_MODE, QC: 'off', LM: LM_mode });

let passed = 0, failed = 0;
async function check(name, fn) {
  try { await fn(); passed++; console.log('  ok    ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + ' :: ' + e.message); }
}

(async () => {
  await check('advisory: high NLL is flagged but the sentence still passes', async () => {
    const r = await runPrefilterAsync(BENIGN, [], withLm('advisory'), { ...clearQc, ...lmHigh });
    assert.strictEqual(r.pass, true);
    assert.strictEqual(r.stages.LM.flagged, true);
    assert.strictEqual(r.stages.LM.reason, 'advisory_flag');
  });
  await check('advisory: low NLL is not flagged', async () => {
    const r = await runPrefilterAsync(BENIGN, [], withLm('advisory'), { ...clearQc, ...lmLow });
    assert.strictEqual(r.pass, true);
    assert.strictEqual(r.stages.LM.flagged, false);
    assert.strictEqual(r.stages.LM.reason, 'ok');
  });
  await check('advisory: sidecar unreachable fails open with the reason recorded', async () => {
    const r = await runPrefilterAsync(BENIGN, [], withLm('advisory'), { ...clearQc, ...lmDown });
    assert.strictEqual(r.pass, true);
    assert.strictEqual(r.stages.LM.reason, 'lm_unavailable');
  });
  await check('off: stage not run', async () => {
    const r = await runPrefilterAsync(BENIGN, [], withLm('off'), { ...clearQc, ...lmHigh });
    assert.strictEqual(r.stages.LM, undefined);
  });
  await check('an earlier block skips the LM stage', async () => {
    const r = await runPrefilterAsync(BENIGN, [], { ...DEFAULT_MODE, QC: 'block', LM: 'advisory' }, { ...flaggedQc, ...lmHigh });
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.stages.LM, undefined);
  });
  await check('block mode for the LM stage is refused', async () => {
    let threw = false;
    try { await runPrefilterAsync(BENIGN, [], withLm('block'), { ...clearQc, ...lmHigh }); }
    catch (e) { threw = /advisory-only/.test(e.message); }
    assert.strictEqual(threw, true);
  });
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
