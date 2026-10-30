'use strict';
const assert = require('assert');
const { runPrefilterAsync, DEFAULT_MODE } = require('../../src/prefilter');

const text = 'The city council voted to expand the bike lanes along the river next spring. Crews will start in March after the permits clear. The project is funded by a state grant.';

(async () => {
  let n = 0;
  assert.strictEqual(DEFAULT_MODE.M2, 'advisory');
  n++;
  const clf = { classify: async () => ({ ok: false, error: 'off-test' }), lm: {}, hv: {} };
  const ok = await runPrefilterAsync(text, [], DEFAULT_MODE, { ...clf, m2: { gate: async () => ({ verdict: 'pass', score: 0.4, threshold: 0.2265, units: 3, config_hash: 'h', blocks: false }) } });
  assert.strictEqual(ok.stages.M2.verdict, 'pass');
  assert.strictEqual(ok.stages.M2.blocks, false);
  n++;
  const flagged = await runPrefilterAsync(text, [], DEFAULT_MODE, { ...clf, m2: { gate: async () => ({ verdict: 'flag', score: 0.01, threshold: 0.2265, units: 3, config_hash: 'h', blocks: false }) } });
  assert.strictEqual(flagged.stages.M2.flagged, true);
  assert.strictEqual(flagged.blockedBy === 'M2', false, 'advisory M2 must never block');
  n++;
  const boom = await runPrefilterAsync(text, [], DEFAULT_MODE, { ...clf, m2: { gate: async () => { throw new Error('runtime down'); } } });
  assert.strictEqual(boom.stages.M2.verdict, 'unmeasured');
  assert.strictEqual(boom.stages.M2.reason, 'm2_error');
  assert.notStrictEqual(boom.blockedBy, 'M2');
  n++;
  const offRun = await runPrefilterAsync(text, [], { ...DEFAULT_MODE, M2: 'off' }, clf);
  assert.strictEqual(offRun.stages.M2, undefined);
  n++;
  let threw = false;
  try { await runPrefilterAsync(text, [], { ...DEFAULT_MODE, M2: 'block' }, clf); } catch (e) { threw = /advisory-only/.test(e.message); }
  assert.ok(threw, 'M2 in block mode must be refused in this build');
  n++;
  console.log(`test_prefilter_m2: ${n}/${n} passed`);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
