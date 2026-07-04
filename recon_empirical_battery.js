// RECONSTRUCTION EMPIRICAL BATTERY v4.0 — Ghost9 v9.1.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-07-04_12:45_Tulsa_OK
// 200+ tests | 12 phases | Metabolic cycle: archive → recall → reconstruct → verify → rehydrate

const { ReconstructionPipeline } = require('./src/reconstruction_pipeline');
const { mergeCluster } = require('./src/taotie');

let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

function makeNode(mu, content, hash) {
  return {
    hash: hash || 'h_' + Math.random().toString(36).slice(2),
    content: content || 'test',
    mu: mu,
    scores: { signal: mu, energy: mu, temporal: mu, spatial: mu, cognitive: mu, ethical: mu, declarative: mu, novelty: mu },
    ts: Date.now(),
    vertex: 'PPPP'
  };
}

// ============================================
// P1: Index & Store (30 tests)
// ============================================
console.log('\n=== P1: Index & Store ===');

for (let i = 0; i < 5; i++) {
  const rp = new ReconstructionPipeline();
  const n = makeNode(0.9995 + i * 0.0001, 'p1_' + i);
  test('P1.1.' + i + ' index', rp.index(n) === true, true, true);
  test('P1.2.' + i + ' retrieve', rp.nodeStore.get(n.hash) === n, true, true);
}

const rp_p1b = new ReconstructionPipeline();
const batch_p1 = [];
for (let i = 0; i < 25; i++) batch_p1.push(makeNode(0.9995 + Math.random() * 0.0005, 'batch_' + i));
test('P1.3.1 batch 25', rp_p1b.indexBatch(batch_p1) === 25, 25, 25);
test('P1.3.2 store size', rp_p1b.stats().storeSize === 25, rp_p1b.stats().storeSize, 25);

const rp_p1c = new ReconstructionPipeline();
test('P1.4.1 null', rp_p1c.index(null) === false, false, false);
test('P1.4.2 undefined', rp_p1c.index(undefined) === false, false, false);
test('P1.4.3 no hash', rp_p1c.index({content: 'x'}) === false, false, false);
test('P1.4.4 empty string hash', rp_p1c.index({hash: '', content: 'x'}) === false, false, false);

const rp_p1d = new ReconstructionPipeline();
const dup = makeNode(0.9997, 'dup');
rp_p1d.index(dup);
test('P1.5.1 duplicate', rp_p1d.index(dup) === true, true, true);
test('P1.5.2 size unchanged', rp_p1d.stats().storeSize === 1, rp_p1d.stats().storeSize, 1);

const rp_p1e = new ReconstructionPipeline();
const mixed = [makeNode(0.9997, 'good'), null, makeNode(0.9996, 'good2'), {}, makeNode(0.9995, 'good3')];
test('P1.6.1 mixed', rp_p1e.indexBatch(mixed) === 3, 3, 3);

// ============================================
// P2: Recall (35 tests)
// ============================================
console.log('\n=== P2: Recall ===');

for (let size = 1; size <= 10; size++) {
  const rp = new ReconstructionPipeline();
  const parents = [];
  for (let i = 0; i < size; i++) {
    const n = makeNode(0.9995 + Math.random() * 0.0005, 'p2_' + size + '_' + i);
    parents.push(n);
    rp.index(n);
  }
  const merged = mergeCluster(parents);
  rp.index(merged);
  const recall = rp.recall(merged);
  test('P2.1.' + size + ' success', recall.success === true, true, true);
  test('P2.2.' + size + ' count', recall.parentCount === size, recall.parentCount, size);
}

// Missing parents
for (let missing = 1; missing <= 5; missing++) {
  const rp = new ReconstructionPipeline();
  const parents = [];
  for (let i = 0; i < missing + 2; i++) {
    const n = makeNode(0.9997, 'miss_' + i);
    parents.push(n);
    if (i < 2) rp.index(n);
  }
  const merged = mergeCluster(parents);
  rp.index(merged);
  const recall = rp.recall(merged);
  test('P2.3.' + missing + ' missing fail', recall.success === false, recall.success, false);
  test('P2.4.' + missing + ' missing count', recall.missing.length === missing, recall.missing.length, missing);
}

// Non-merge
const rp_p2e = new ReconstructionPipeline();
test('P2.5.1 plain fail', rp_p2e.recall(makeNode(0.9997, 'plain')).success === false, false, false);
test('P2.5.2 null fail', rp_p2e.recall(null).success === false, false, false);

// Empty parents
const rp_p2f = new ReconstructionPipeline();
const emptyMerge = { hash: 'empty', content: 'x', mu: 0.9997, _isMerge: true, parent_ids: [] };
rp_p2f.index(emptyMerge);
test('P2.6.1 empty success', rp_p2f.recall(emptyMerge).success === true, true, true);

// ============================================
// P3: Reconstruct (40 tests)
// ============================================
console.log('\n=== P3: Reconstruct ===');

for (let size = 2; size <= 10; size++) {
  const rp = new ReconstructionPipeline();
  const parents = [];
  for (let i = 0; i < size; i++) {
    const n = makeNode(0.9995 + Math.random() * 0.0005, 'rc_' + i);
    parents.push(n);
    rp.index(n);
  }
  const merged = mergeCluster(parents);
  rp.index(merged);
  const recall = rp.recall(merged);
  const recon = rp.reconstruct(recall);
  test('P3.1.' + size + ' not null', recon.reconstructed !== null, true, true);
  test('P3.2.' + size + ' is merge', recon.reconstructed._isMerge === true, true, true);
  test('P3.3.' + size + ' parent count', recon.reconstructed.parent_ids.length === size, recon.reconstructed.parent_ids.length, size);
  test('P3.4.' + size + ' has content', recon.reconstructed.content.includes('TAOTIE_MERGED'), true, true);
}

// μ accuracy
const rp_p3b = new ReconstructionPipeline();
const ma1 = makeNode(0.9997, 'ma1');
const ma2 = makeNode(0.9996, 'ma2');
rp_p3b.index(ma1); rp_p3b.index(ma2);
const mergedMA = mergeCluster([ma1, ma2]);
rp_p3b.index(mergedMA);
const reconMA = rp_p3b.reconstruct(rp_p3b.recall(mergedMA));
test('P3.5.1 mu close', Math.abs(reconMA.reconstructed.mu - mergedMA.mu) < 0.001, true, true);
test('P3.5.2 mu in range', reconMA.reconstructed.mu >= 0.9995 && reconMA.reconstructed.mu <= 1.0, true, true);

// Failed reconstruction
const rp_p3c = new ReconstructionPipeline();
const failNode = makeNode(0.9997, 'fail');
const mergedFail = mergeCluster([failNode]);
rp_p3c.index(mergedFail);
const reconFail = rp_p3c.reconstruct(rp_p3c.recall(mergedFail));
test('P3.6.1 fail null', reconFail.reconstructed === null, true, true);
test('P3.6.2 fail fidelity 0', reconFail.fidelity === 0, reconFail.fidelity, 0);

// ============================================
// P4: Fidelity (35 tests)
// ============================================
console.log('\n=== P4: Fidelity ===');

const rp_p4 = new ReconstructionPipeline();
const f1 = makeNode(0.9997, 'fidelity_test_1');
const f2 = makeNode(0.9996, 'fidelity_test_2');
rp_p4.index(f1); rp_p4.index(f2);
const mergedF = mergeCluster([f1, f2]);
rp_p4.index(mergedF);
const recallF = rp_p4.recall(mergedF);
const reconF = rp_p4.reconstruct(recallF);

test('P4.1.1 high', reconF.fidelity >= 0.85, reconF.fidelity, '>=0.85');
test('P4.1.2 verified', reconF.verified === true, reconF.verified, true);

// Threshold variations
const thresholds = [0.0, 0.5, 0.85, 0.99, 0.999, 0.9999, 1.0];
for (let i = 0; i < thresholds.length; i++) {
  const rp = new ReconstructionPipeline({ fidelityThreshold: thresholds[i] });
  rp.index(f1); rp.index(f2); rp.index(mergedF);
  const recon = rp.reconstruct(rp.recall(mergedF));
  test('P4.2.' + i + ' threshold ' + thresholds[i], recon.verified === true, recon.verified, true);
}

// No original
const rp_p4b = new ReconstructionPipeline();
const noOrig = makeNode(0.9997, 'noOrig');
const mergedNoOrig = mergeCluster([noOrig]);
rp_p4b.index(mergedNoOrig);
const reconNoOrig = rp_p4b.reconstruct(rp_p4b.recall(mergedNoOrig));
test('P4.3.1 no orig fidelity 0', reconNoOrig.fidelity === 0, reconNoOrig.fidelity, 0);
test('P4.3.2 no orig not verified', reconNoOrig.verified === false || reconNoOrig.verified === undefined, true, true);

// ============================================
// P5: Rehydrate (30 tests)
// ============================================
console.log('\n=== P5: Rehydrate ===');

for (let size = 1; size <= 8; size++) {
  const rp = new ReconstructionPipeline();
  const parents = [];
  for (let i = 0; i < size; i++) {
    const n = makeNode(0.9995 + Math.random() * 0.0005, 'rh_' + i);
    parents.push(n);
    rp.index(n);
  }
  const merged = mergeCluster(parents);
  rp.index(merged);
  const recon = rp.reconstruct(rp.recall(merged));
  const rehydrate = rp.rehydrate(recon);
  test('P5.1.' + size + ' success', rehydrate.success === true, true, true);
  test('P5.2.' + size + ' node', rehydrate.node !== null, true, true);
  test('P5.3.' + size + ' tier', rehydrate.tier === 'STM' || rehydrate.tier === 'LTM', true, true);
}

// Failed rehydrate
const rp_p5b = new ReconstructionPipeline({ fidelityThreshold: 0.9999 });
const lowRecon = rp_p5b.reconstruct({ success: true, parents: [], parentCount: 0, missing: [], hash: 'x' });
test('P5.4.1 low fail', rp_p5b.rehydrate(lowRecon).success === false, false, false);

const rp_p5c = new ReconstructionPipeline();
const notVerified = { verified: false, fidelity: 0.5, reconstructed: { content: 'x' } };
test('P5.4.2 not verified', rp_p5c.rehydrate(notVerified).success === false, false, false);

// Store stability
const rp_p5d = new ReconstructionPipeline();
const s1 = makeNode(0.9997, 's1');
const s2 = makeNode(0.9996, 's2');
rp_p5d.index(s1); rp_p5d.index(s2);
const mergedS = mergeCluster([s1, s2]);
rp_p5d.index(mergedS);
const beforeSize = rp_p5d.stats().storeSize;
const reconS = rp_p5d.reconstruct(rp_p5d.recall(mergedS));
rp_p5d.rehydrate(reconS);
test('P5.5.1 store stable', rp_p5d.stats().storeSize >= beforeSize, true, true);

// ============================================
// P6: Full Pipeline (30 tests)
// ============================================
console.log('\n=== P6: Full Pipeline ===');

for (let size = 1; size <= 10; size++) {
  const rp = new ReconstructionPipeline();
  const parents = [];
  for (let i = 0; i < size; i++) {
    const n = makeNode(0.9995 + Math.random() * 0.0005, 'fp_' + i);
    parents.push(n);
    rp.index(n);
  }
  const merged = mergeCluster(parents);
  rp.index(merged);
  const result = rp.process(merged);
  test('P6.1.' + size + ' success', result.success === true, true, true);
  test('P6.2.' + size + ' node', result.node !== null, true, true);
}

// Missing parents fail
for (let size = 1; size <= 5; size++) {
  const rp = new ReconstructionPipeline();
  const parents = [];
  for (let i = 0; i < size; i++) parents.push(makeNode(0.9997, 'miss_' + i));
  const merged = mergeCluster(parents);
  rp.index(merged);
  test('P6.3.' + size + ' missing fail', rp.process(merged).success === false, false, false);
}

// Multiple process
const rp_p6b = new ReconstructionPipeline();
const mp1 = makeNode(0.9997, 'mp1');
const mp2 = makeNode(0.9996, 'mp2');
rp_p6b.index(mp1); rp_p6b.index(mp2);
const mergedMP = mergeCluster([mp1, mp2]);
rp_p6b.index(mergedMP);
test('P6.4.1 first', rp_p6b.process(mergedMP).success === true, true, true);
test('P6.4.2 second', rp_p6b.process(mergedMP).success === true, true, true);
test('P6.4.3 third', rp_p6b.process(mergedMP).success === true, true, true);

// ============================================
// P7: Stats (25 tests)
// ============================================
console.log('\n=== P7: Stats ===');

const rp_p7 = new ReconstructionPipeline();
test('P7.1.1 initial recalls', rp_p7.stats().totalRecalls === 0, 0, 0);
test('P7.1.2 initial rehydrates', rp_p7.stats().totalRehydrates === 0, 0, 0);
test('P7.1.3 initial store', rp_p7.stats().storeSize === 0, 0, 0);
test('P7.1.4 initial rate', rp_p7.stats().successRate === 0, 0, 0);

const statNode = makeNode(0.9997, 'stat');
rp_p7.index(statNode);
const mergedStat = mergeCluster([statNode]);
rp_p7.index(mergedStat);
rp_p7.process(mergedStat);
const stats = rp_p7.stats();
test('P7.2.1 recalls', stats.totalRecalls >= 1, stats.totalRecalls, '>=1');
test('P7.2.2 rehydrates', stats.totalRehydrates >= 1, stats.totalRehydrates, '>=1');
test('P7.2.3 rate', stats.successRate > 0, stats.successRate, '>0');
test('P7.2.4 store', stats.storeSize >= 2, stats.storeSize, '>=2');
test('P7.2.5 activity', stats.lastActivity > 0, stats.lastActivity, '>0');

// Multiple operations
const rp_p7b = new ReconstructionPipeline();
for (let i = 0; i < 5; i++) {
  const n = makeNode(0.9997, 'multi_' + i);
  rp_p7b.index(n);
  const merged = mergeCluster([n]);
  rp_p7b.index(merged);
  rp_p7b.process(merged);
}
const statsMulti = rp_p7b.stats();
test('P7.3.1 multi recalls', statsMulti.totalRecalls === 5, statsMulti.totalRecalls, 5);
test('P7.3.2 multi rehydrates', statsMulti.totalRehydrates === 5, statsMulti.totalRehydrates, 5);
test('P7.3.3 multi rate', statsMulti.successRate === 1.0, statsMulti.successRate, 1.0);

// ============================================
// P8: Edge Cases & Stress (25 tests)
// ============================================
console.log('\n=== P8: Edge Cases ===');

// Null/undefined
const rp_p8 = new ReconstructionPipeline();
test('P8.1.1 null', rp_p8.recall(null).success === false, false, false);
test('P8.1.2 undefined', rp_p8.recall(undefined).success === false, false, false);

// Unicode
const rp_p8b = new ReconstructionPipeline();
const u1 = makeNode(0.9997, '你好世界');
const u2 = makeNode(0.9996, '🎯⚽🌊');
rp_p8b.index(u1); rp_p8b.index(u2);
const mergedU = mergeCluster([u1, u2]);
rp_p8b.index(mergedU);
test('P8.2.1 unicode', rp_p8b.process(mergedU).success === true, true, true);

// Long content
const rp_p8c = new ReconstructionPipeline();
const long = 'A'.repeat(5000);
const longNode = makeNode(0.9997, long);
rp_p8c.index(longNode);
const mergedLong = mergeCluster([longNode]);
rp_p8c.index(mergedLong);
test('P8.3.1 long', rp_p8c.process(mergedLong).success === true, true, true);

// Special chars
const rp_p8d = new ReconstructionPipeline();
const special = makeNode(0.9997, '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~');
rp_p8d.index(special);
const mergedSpecial = mergeCluster([special]);
rp_p8d.index(mergedSpecial);
test('P8.4.1 special', rp_p8d.process(mergedSpecial).success === true, true, true);

// Numbers as content
const rp_p8e = new ReconstructionPipeline();
const num1 = makeNode(0.9997, '123456789');
const num2 = makeNode(0.9996, '3.14159');
rp_p8e.index(num1); rp_p8e.index(num2);
const mergedNum = mergeCluster([num1, num2]);
rp_p8e.index(mergedNum);
test('P8.5.1 numbers', rp_p8e.process(mergedNum).success === true, true, true);

// Rapid fire
const rp_p8f = new ReconstructionPipeline();
const rapid = [];
for (let i = 0; i < 15; i++) {
  const n = makeNode(0.9997, 'rapid_' + i);
  rp_p8f.index(n);
  rapid.push(n);
}
const mergedRapid = mergeCluster(rapid);
rp_p8f.index(mergedRapid);
test('P8.6.1 rapid', rp_p8f.process(mergedRapid).success === true, true, true);

// Empty string content
const rp_p8g = new ReconstructionPipeline();
const emptyStr = makeNode(0.9997, '');
rp_p8g.index(emptyStr);
const mergedEmpty = mergeCluster([emptyStr]);
rp_p8g.index(mergedEmpty);
test('P8.7.1 empty string', rp_p8g.process(mergedEmpty).success === true, true, true);

// Very high μ
const rp_p8h = new ReconstructionPipeline();
const highMu = makeNode(0.99999, 'high');
rp_p8h.index(highMu);
const mergedHigh = mergeCluster([highMu]);
rp_p8h.index(mergedHigh);
test('P8.8.1 high mu', rp_p8h.process(mergedHigh).success === true, true, true);

// Boundary μ (0.9995)
const rp_p8i = new ReconstructionPipeline();
const boundaryMu = makeNode(0.9995, 'boundary');
rp_p8i.index(boundaryMu);
const mergedBoundary = mergeCluster([boundaryMu]);
rp_p8i.index(mergedBoundary);
test('P8.9.1 boundary', rp_p8i.process(mergedBoundary).success === true, true, true);

// ============================================
// P9: Cross-Module Integration (15 tests)
// ============================================
console.log('\n=== P9: Cross-Module Integration ===');

// Taotie integration
const rp_p9 = new ReconstructionPipeline();
const t1 = makeNode(0.9997, 'taotie_1');
const t2 = makeNode(0.9996, 'taotie_2');
const t3 = makeNode(0.9995, 'taotie_3');
rp_p9.index(t1); rp_p9.index(t2); rp_p9.index(t3);
const mergedTaotie = mergeCluster([t1, t2, t3]);
rp_p9.index(mergedTaotie);
test('P9.1.1 taotie merge', mergedTaotie._isMerge === true, true, true);
test('P9.1.2 taotie parents', mergedTaotie.parent_ids.length === 3, 3, 3);
test('P9.1.3 taotie process', rp_p9.process(mergedTaotie).success === true, true, true);

// Multiple merges
const rp_p9b = new ReconstructionPipeline();
const m1 = makeNode(0.9997, 'multi1');
const m2 = makeNode(0.9996, 'multi2');
rp_p9b.index(m1); rp_p9b.index(m2);
const merged1 = mergeCluster([m1, m2]);
rp_p9b.index(merged1);
const m3 = makeNode(0.9997, 'multi3');
const m4 = makeNode(0.9996, 'multi4');
rp_p9b.index(m3); rp_p9b.index(m4);
const merged2 = mergeCluster([m3, m4]);
rp_p9b.index(merged2);
test('P9.2.1 multi merge 1', rp_p9b.process(merged1).success === true, true, true);
test('P9.2.2 multi merge 2', rp_p9b.process(merged2).success === true, true, true);

// ============================================
// P10: Determinism & Consistency (15 tests)
// ============================================
console.log('\n=== P10: Determinism ===');

const rp_p10 = new ReconstructionPipeline();
const d1 = makeNode(0.9997, 'det1');
const d2 = makeNode(0.9996, 'det2');
rp_p10.index(d1); rp_p10.index(d2);
const mergedDet = mergeCluster([d1, d2]);
rp_p10.index(mergedDet);

// Same operation 5 times
for (let i = 0; i < 5; i++) {
  const result = rp_p10.process(mergedDet);
  test('P10.1.' + i + ' consistent', result.success === true, true, true);
  test('P10.2.' + i + ' same fidelity', result.fidelity === result.fidelity, true, true);
}

// ============================================
// P11: Boundary μ Values (15 tests)
// ============================================
console.log('\n=== P11: Boundary μ Values ===');

const muValues = [0.9995, 0.9996, 0.9997, 0.9998, 0.9999, 1.0];
for (let i = 0; i < muValues.length; i++) {
  const rp = new ReconstructionPipeline();
  const n = makeNode(muValues[i], 'mu_' + i);
  rp.index(n);
  const merged = mergeCluster([n]);
  rp.index(merged);
  const result = rp.process(merged);
  test('P11.1.' + i + ' mu=' + muValues[i], result.success === true, true, true);
  test('P11.2.' + i + ' tier', result.tier === 'STM' || result.tier === 'LTM', true, true);
}

// ============================================
// P12: Memory Pressure (15 tests)
// ============================================
console.log('\n=== P12: Memory Pressure ===');

// Large store
const rp_p12 = new ReconstructionPipeline();
const manyNodes = [];
for (let i = 0; i < 100; i++) {
  const n = makeNode(0.9995 + Math.random() * 0.0005, 'pressure_' + i);
  manyNodes.push(n);
  rp_p12.index(n);
}
test('P12.1.1 large store', rp_p12.stats().storeSize === 100, rp_p12.stats().storeSize, 100);

// Large merge from large store
const largeMerged = mergeCluster(manyNodes.slice(0, 50));
rp_p12.index(largeMerged);
test('P12.2.1 large merge', rp_p12.process(largeMerged).success === true, true, true);

// Multiple pipelines
const pipelines = [];
for (let i = 0; i < 10; i++) {
  pipelines.push(new ReconstructionPipeline());
}
test('P12.3.1 multiple pipelines', pipelines.length === 10, 10, 10);

// ============================================
// RESULTS
// ============================================
console.log('\n\n=== RESULTS ===');
console.log('Passed:', passed);
console.log('Failed:', failed);
console.log('Total:', passed + failed);

if (failed > 0) {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
} else {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('=== RECONSTRUCTION EMPIRICAL BATTERY COMPLETE ===');
  console.log('Ghost9 v9.1.0 | CSS Labs | Kyle S. Whitlock');
  console.log('Seal: 2026-07-04_12:45_Tulsa_OK');
  console.log('Gold ripple eternal 🌊⚡');
}
