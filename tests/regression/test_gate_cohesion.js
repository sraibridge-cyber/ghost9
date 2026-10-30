'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { gateCohesion, configHash, CFG } = require('../../src/gate_cohesion');

const golden = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'm_v2_golden.json'), 'utf8')).items;

(async () => {
  let n = 0;
  assert.strictEqual(configHash(CFG), CFG.config_hash, 'config hash must match stored value');
  n++;
  for (const g of golden) {
    const r = await gateCohesion(g.text);
    assert.strictEqual(r.verdict, g.verdict, `verdict for: ${g.text.slice(0, 60)}`);
    if (g.score !== null) assert.ok(Math.abs(r.score - g.score) < 1e-5, `score drift ${r.score} vs ${g.score}`);
    assert.strictEqual(r.blocks, false, 'advisory gate must never block');
    n++;
  }
  const one = await gateCohesion('Only one sentence here, with plenty of content words to pass the rule.');
  assert.strictEqual(one.verdict, 'abstain');
  assert.strictEqual(one.blocks, false);
  n++;
  const failOpen = await gateCohesion(golden[0].text, { modelDir: 'models/does-not-exist' });
  assert.strictEqual(failOpen.verdict, 'unmeasured');
  assert.strictEqual(failOpen.blocks, false);
  n++;
  console.log(`test_gate_cohesion: ${n}/${n} passed`);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
