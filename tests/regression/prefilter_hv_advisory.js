'use strict';
// The HV stage runs only after the sync gates and the QC stage pass. So its classifier score must sit below
// the live QC block threshold (0.007265) and at or above the combined-rule threshold (0.001236).
const assert = require('assert');
const { runPrefilterAsync, DEFAULT_MODE } = require('../../src/prefilter');
const { config: HVCFG } = require('../../src/hv_client');
const { config: CLF } = require('../../src/clf_client');
let fails = 0;
async function check(name, fn) {
  try { await fn(); console.log('  ok    ' + name); }
  catch (e) { fails++; console.log('  FAIL  ' + name + ' :: ' + e.message); }
}
const CLEAN = 'The river flooded the low fields after three days of heavy rain.';
const MID = (HVCFG.t_clf + CLF.threshold) / 2;
assert(MID >= HVCFG.t_clf && MID < CLF.threshold, 'test band must sit between the two thresholds');
const clfMid = async () => ({ ok: true, scores: [MID], model: 'stub' });
const clfHigh = async () => ({ ok: true, scores: [CLF.threshold + 0.5], model: 'stub' });
const clfDown = async () => ({ ok: false, error: 'ECONNREFUSED' });
const hvHigh = async () => ({ ok: true, margins: [HVCFG.t_margin + 0.1] });
const hvLow = async () => ({ ok: true, margins: [-0.1] });
const hvDown = async () => ({ ok: false, error: 'ECONNREFUSED' });

(async () => {
  await check('advisory: both signals clear, flagged but never blocks', async () => {
    const pre = await runPrefilterAsync(CLEAN, [], DEFAULT_MODE, { classify: clfMid, margin: hvHigh });
    assert.strictEqual(pre.stages.HV.flagged, true);
    assert.strictEqual(pre.stages.HV.reason, 'advisory_flag');
    assert.notStrictEqual(pre.blockedBy, 'HV');
    assert.strictEqual(pre.pass, true);
  });
  await check('advisory: margin below threshold is not flagged', async () => {
    const pre = await runPrefilterAsync(CLEAN, [], DEFAULT_MODE, { classify: clfMid, margin: hvLow });
    assert.strictEqual(pre.stages.HV.flagged, false);
    assert.strictEqual(pre.stages.HV.reason, 'ok');
  });
  await check('QC still blocks above its own threshold, and HV does not run', async () => {
    const pre = await runPrefilterAsync(CLEAN, [], DEFAULT_MODE, { classify: clfHigh, margin: hvHigh });
    assert.strictEqual(pre.blockedBy, 'QC');
    assert.strictEqual(pre.stages.HV, undefined);
  });
  await check('fail-open: harm-vector service unreachable', async () => {
    const pre = await runPrefilterAsync(CLEAN, [], DEFAULT_MODE, { classify: clfMid, margin: hvDown });
    assert.strictEqual(pre.stages.HV.reason, 'hv_unavailable');
    assert.strictEqual(pre.stages.HV.pass, true);
    assert.strictEqual(pre.pass, true);
  });
  await check('classifier unavailable: HV records that it had no score', async () => {
    const pre = await runPrefilterAsync(CLEAN, [], DEFAULT_MODE, { classify: clfDown, margin: hvHigh });
    assert.strictEqual(pre.stages.HV.reason, 'classifier_unavailable');
  });
  await check('HV in block mode is refused in this build', async () => {
    const mode = Object.assign({}, DEFAULT_MODE, { HV: 'block' });
    await assert.rejects(runPrefilterAsync(CLEAN, [], mode, { classify: clfMid, margin: hvHigh }), /advisory-only/);
  });
  await check('HV off leaves no HV stage', async () => {
    const mode = Object.assign({}, DEFAULT_MODE, { HV: 'off' });
    const pre = await runPrefilterAsync(CLEAN, [], mode, { classify: clfMid, margin: hvHigh });
    assert.strictEqual(pre.stages.HV, undefined);
  });
  console.log(fails ? `${fails} failed` : 'all passed');
  process.exit(fails ? 1 : 0);
})();
