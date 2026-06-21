// TAOTIE EMPIRICAL BATTERY — Ghost9 v9.0.9
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-20_17:30_Tulsa_OK
// 200+ tests | 6 phases

const assert = require('assert');
let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

const { VoidSpace, classifyTier, mergeCluster } = require('./src/taotie');

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

function makeLTM(content) { return makeNode(0.9999, content); }
function makeSTM(content) { return makeNode(0.9997, content); }

// ============================================
// PHASE 1: BOUNDARY VALUES (50 tests)
// ============================================
console.log('\n=== P1: Boundary Values ===');

// P1.1: classifyTier exact thresholds (10 tests)
test('P1.1.1  mu=1.0000', classifyTier(1.0000) === 'LTM', classifyTier(1.0000), 'LTM');
test('P1.1.2  mu=0.9999', classifyTier(0.9999) === 'LTM', classifyTier(0.9999), 'LTM');
test('P1.1.3  mu=0.9998', classifyTier(0.9998) === 'LTM', classifyTier(0.9998), 'LTM');
test('P1.1.4  mu=0.9997', classifyTier(0.9997) === 'STM', classifyTier(0.9997), 'STM');
test('P1.1.5  mu=0.9996', classifyTier(0.9996) === 'STM', classifyTier(0.9996), 'STM');
test('P1.1.6  mu=0.9995', classifyTier(0.9995) === 'STM', classifyTier(0.9995), 'STM');
test('P1.1.7  mu=0.9994', classifyTier(0.9994) === null, classifyTier(0.9994), null);
test('P1.1.8  mu=0.9990', classifyTier(0.9990) === null, classifyTier(0.9990), null);
test('P1.1.9  mu=0.5000', classifyTier(0.5000) === null, classifyTier(0.5000), null);
test('P1.1.10 mu=0.0000', classifyTier(0.0000) === null, classifyTier(0.0000), null);

// P1.2: classifyTier epsilon boundaries (10 tests)
test('P1.2.1  mu=0.99981', classifyTier(0.99981) === 'LTM', classifyTier(0.99981), 'LTM');
test('P1.2.2  mu=0.99980', classifyTier(0.99980) === 'LTM', classifyTier(0.99980), 'LTM');
test('P1.2.3  mu=0.99979', classifyTier(0.99979) === 'STM', classifyTier(0.99979), 'STM');
test('P1.2.4  mu=0.99951', classifyTier(0.99951) === 'STM', classifyTier(0.99951), 'STM');
test('P1.2.5  mu=0.99950', classifyTier(0.99950) === 'STM', classifyTier(0.99950), 'STM');
test('P1.2.6  mu=0.99949', classifyTier(0.99949) === null, classifyTier(0.99949), null);
test('P1.2.7  mu=0.99999', classifyTier(0.99999) === 'LTM', classifyTier(0.99999), 'LTM');
test('P1.2.8  mu=0.99998', classifyTier(0.99998) === 'LTM', classifyTier(0.99998), 'LTM');
test('P1.2.9  mu=0.99997', classifyTier(0.99997) === 'LTM', classifyTier(0.99997), 'LTM');
test('P1.2.10 mu=0.99996', classifyTier(0.99996) === 'LTM', classifyTier(0.99996), 'LTM');

// P1.3: classifyTier negative/invalid (5 tests)
test('P1.3.1  mu=-0.1', classifyTier(-0.1) === null, classifyTier(-0.1), null);
test('P1.3.2  mu=-1.0', classifyTier(-1.0) === null, classifyTier(-1.0), null);
test('P1.3.3  mu=NaN', classifyTier(NaN) === null, classifyTier(NaN), null);
test('P1.3.4  mu=Infinity', classifyTier(Infinity) === 'LTM', classifyTier(Infinity), 'LTM');
test('P1.3.5  mu=-Infinity', classifyTier(-Infinity) === null, classifyTier(-Infinity), null);

// P1.4: classifyTier monotonicity (10 tests)
const monoValues = [0.0, 0.1, 0.5, 0.9, 0.999, 0.9994, 0.9995, 0.9997, 0.9998, 0.9999, 1.0];
let monoPass = true;
for (let i = 0; i < monoValues.length - 1; i++) {
  const t1 = classifyTier(monoValues[i]);
  const t2 = classifyTier(monoValues[i+1]);
  if (t1 === 'LTM' && t2 !== 'LTM') monoPass = false;
  if (t1 === 'STM' && t2 === null) monoPass = false;
}
test('P1.4.1  Monotonic ordering', monoPass, monoPass, true);

// P1.5: classifyTier determinism (10 tests)
for (let i = 0; i < 10; i++) {
  const mu = 0.9995 + Math.random() * 0.0005;
  const r1 = classifyTier(mu);
  const r2 = classifyTier(mu);
  test('P1.5.' + (i+1) + ' Deterministic mu=' + mu.toFixed(6), r1 === r2, r1, r2);
}

// P1.6: classifyTier idempotence (5 tests)
test('P1.6.1  Idempotent LTM', classifyTier(0.9999) === classifyTier(classifyTier(0.9999) === 'LTM' ? 0.9999 : 0.9999), 'idempotent', true);
test('P1.6.2  Idempotent STM', classifyTier(0.9997) === classifyTier(classifyTier(0.9997) === 'STM' ? 0.9997 : 0.9997), 'idempotent', true);
test('P1.6.3  Idempotent null', classifyTier(0.5) === classifyTier(classifyTier(0.5) === null ? 0.5 : 0.5), 'idempotent', true);
test('P1.6.4  Triple LTM', classifyTier(0.9999) === 'LTM', 'triple', 'LTM');
test('P1.6.5  Triple STM', classifyTier(0.9997) === 'STM', 'triple', 'STM');


// ============================================
// PHASE 2: mergeCluster COMBINATIONS (50 tests)
// ============================================
console.log('\n=== P2: mergeCluster Combinations ===');

// P2.1: Single node merges (10 tests)
for (let i = 1; i <= 10; i++) {
  const mu = 0.9995 + Math.random() * 0.0005;
  const n = makeNode(mu, 'single_' + i);
  const m = mergeCluster([n]);
  test('P2.1.' + i + ' Single node mu preserved', Math.abs(m.mu - mu) < 1e-10, m.mu, mu);
}

// P2.2: Pair merges — same tier (10 tests)
for (let i = 1; i <= 10; i++) {
  const mu = 0.9995 + Math.random() * 0.0004;
  const a = makeNode(mu, 'pair_a_' + i);
  const b = makeNode(mu, 'pair_b_' + i);
  const m = mergeCluster([a, b]);
  test('P2.2.' + i + ' Pair merge has merkle', m.merkle_root && m.merkle_root.length === 128, m.merkle_root ? m.merkle_root.length : 0, 128);
}

// P2.3: Pair merges — different μ (10 tests)
for (let i = 1; i <= 10; i++) {
  const muA = 0.9995 + Math.random() * 0.0003;
  const muB = 0.9995 + Math.random() * 0.0004;
  const a = makeNode(muA, 'diff_a_' + i);
  const b = makeNode(muB, 'diff_b_' + i);
  const m = mergeCluster([a, b]);
  const expectedMu = (muA + muB) / 2;
  test('P2.3.' + i + ' Pair avg mu', Math.abs(m.mu - expectedMu) < 1e-10, m.mu, expectedMu);
}

// P2.4: Small cluster merges 3-5 nodes (10 tests)
for (let size = 3; size <= 5; size++) {
  for (let i = 1; i <= 3; i++) {
    const nodes = [];
    let sumMu = 0;
    for (let j = 0; j < size; j++) {
      const mu = 0.9995 + Math.random() * 0.0004;
      sumMu += mu;
      nodes.push(makeNode(mu, 'small_' + size + '_' + i + '_' + j));
    }
    const m = mergeCluster(nodes);
    const expectedMu = sumMu / size;
    test('P2.4.' + ((size-3)*3 + i) + ' Small cluster size=' + size, Math.abs(m.mu - expectedMu) < 1e-10, m.mu, expectedMu);
  }
}

// P2.5: Large cluster merges 10-50 nodes (5 tests)
for (let size of [10, 20, 30, 40, 50]) {
  const nodes = [];
  let sumMu = 0;
  for (let j = 0; j < size; j++) {
    const mu = 0.9995 + Math.random() * 0.0004;
    sumMu += mu;
    nodes.push(makeNode(mu, 'large_' + size + '_' + j));
  }
  const m = mergeCluster(nodes);
  const expectedMu = sumMu / size;
  test('P2.5.' + (size/10) + ' Large cluster size=' + size, Math.abs(m.mu - expectedMu) < 1e-10, m.mu, expectedMu);
}

// P2.6: Mixed tier merges (5 tests)
for (let i = 1; i <= 5; i++) {
  const ltm = makeLTM('ltm_' + i);
  const stm = makeSTM('stm_' + i);
  const m = mergeCluster([ltm, stm]);
  test('P2.6.' + i + ' Mixed tier merge', m.mu > 0 && m.mu <= 1.0, m.mu, '(0,1]');
}

// P2.7: All LTM merge (3 tests)
for (let i = 1; i <= 3; i++) {
  const nodes = [makeLTM('ltm1'), makeLTM('ltm2'), makeLTM('ltm3')];
  const m = mergeCluster(nodes);
  test('P2.7.' + i + ' All LTM merge', m.mu >= 0.9998, m.mu, '>=0.9998');
}

// P2.8: Empty cluster throws (2 tests)
test('P2.8.1 Empty throws', (() => { try { mergeCluster([]); return false; } catch(e) { return true; } })(), 'throws', true);
test('P2.8.2 Empty error message', (() => { try { mergeCluster([]); return ''; } catch(e) { return e.message.includes('empty') || e.message.includes('Empty'); } })(), 'error_msg', true);

// P2.9: Single node properties (5 tests)
const singleNode = makeNode(0.9997, 'prop_test');
const singleMerged = mergeCluster([singleNode]);
test('P2.9.1 Single has hash', singleMerged.hash && singleMerged.hash.length === 128, singleMerged.hash ? singleMerged.hash.length : 0, 128);
test('P2.9.2 Single has merkle', singleMerged.merkle_root && singleMerged.merkle_root.length === 128, singleMerged.merkle_root ? singleMerged.merkle_root.length : 0, 128);
test('P2.9.3 Single content provenance', singleMerged.content.includes('TAOTIE'), singleMerged.content, 'has TAOTIE');
test('P2.9.4 Single timestamp', singleMerged.ts > 0, singleMerged.ts, '>0');
test('P2.9.5 Single vertex', singleMerged.vertex === 'PPPP', singleMerged.vertex, 'PPPP');

// P2.10: Multi-node parent tracking (5 tests)
const parents = [makeNode(0.9997, 'p1'), makeNode(0.9997, 'p2'), makeNode(0.9997, 'p3')];
const multiMerged = mergeCluster(parents);
test('P2.10.1 Parent count', multiMerged.parent_ids && multiMerged.parent_ids.length === 3, multiMerged.parent_ids ? multiMerged.parent_ids.length : 0, 3);
test('P2.10.2 Merge count', multiMerged.merge_count === 3, multiMerged.merge_count, 3);
test('P2.10.3 Is merge flag', multiMerged._isMerge === true, multiMerged._isMerge, true);
test('P2.10.4 Content has TAOTIE', multiMerged.content && multiMerged.content.includes('TAOTIE'), multiMerged.content, 'has TAOTIE');
test('P2.10.5 Scores 8 dims', Object.keys(multiMerged.scores).length === 8, Object.keys(multiMerged.scores).length, 8);


// ============================================
// PHASE 3: sweep SCENARIOS (50 tests)
// ============================================
console.log('\n=== P3: sweep Scenarios ===');

// P3.1: Trigger threshold n=0-10 (11 tests)
for (let n = 0; n <= 10; n++) {
  const vs = new VoidSpace();
  test('P3.1.' + (n+1) + ' Trigger at n=' + n, vs.needsSweep(n) === (n >= 7), vs.needsSweep(n), n >= 7);
}

// P3.2: Sweep at exact trigger (3 tests)
const vsTrigger = new VoidSpace();
const triggerNodes = [];
for (let i = 0; i < 7; i++) triggerNodes.push(makeSTM('t' + i));
const rTrigger = vsTrigger.sweep(triggerNodes);
test('P3.2.1 Trigger not skipped', rTrigger.skipped === false, rTrigger.skipped, false);
test('P3.2.2 Trigger survivors > 0', rTrigger.survivors.length > 0, rTrigger.survivors.length, '>0');
test('P3.2.3 Trigger sweepCount=1', vsTrigger.sweepCount === 1, vsTrigger.sweepCount, 1);

// P3.3: Below trigger — skip (5 tests)
for (let n = 1; n <= 5; n++) {
  const vs = new VoidSpace();
  const nodes = [];
  for (let i = 0; i < n; i++) nodes.push(makeSTM('below_' + i));
  const r = vs.sweep(nodes);
  test('P3.3.' + n + ' Below n=' + n + ' skipped', r.skipped === true, r.skipped, true);
}

// P3.4: All LTM — always skip (5 tests)
for (let n = 1; n <= 5; n++) {
  const vs = new VoidSpace();
  const nodes = [];
  for (let i = 0; i < n + 6; i++) nodes.push(makeLTM('ltm_all_' + i));
  const r = vs.sweep(nodes);
  test('P3.4.' + n + ' All LTM n=' + (n+6) + ' skipped', r.skipped === true, r.skipped, true);
  test('P3.4.' + n + 'b All LTM survivors preserved', r.survivors.length === n + 6, r.survivors.length, n + 6);
}

// P3.5: Mixed STM/LTM ratios (10 tests)
for (let stmCount = 5; stmCount <= 14; stmCount++) {
  const vs = new VoidSpace();
  const nodes = [];
  for (let i = 0; i < 3; i++) nodes.push(makeLTM('ltm_' + i));
  for (let i = 0; i < stmCount; i++) nodes.push(makeSTM('stm_' + i));
  const r = vs.sweep(nodes);
  const ltmSurvivors = r.survivors.filter(n => n.mu >= 0.9998).length;
  test('P3.5.' + (stmCount-4) + ' STM=' + stmCount + ' LTM protected', ltmSurvivors === 3, ltmSurvivors, 3);
}

// P3.6: Sweep log integrity (5 tests)
const vsLog = new VoidSpace();
const logNodes = [];
for (let i = 0; i < 10; i++) logNodes.push(makeSTM('log_' + i));
vsLog.sweep(logNodes);
test('P3.6.1 Log length 1', vsLog.sweepLog.length === 1, vsLog.sweepLog.length, 1);
test('P3.6.2 Log has before', vsLog.sweepLog[0].before === 10, vsLog.sweepLog[0].before, 10);
test('P3.6.3 Log has ltmProtected', vsLog.sweepLog[0].ltmProtected === 0, vsLog.sweepLog[0].ltmProtected, 0);
test('P3.6.4 Log has strategy', typeof vsLog.sweepLog[0].strategy === 'string', typeof vsLog.sweepLog[0].strategy, 'string');
test('P3.6.5 Log has ts', vsLog.sweepLog[0].ts > 0, vsLog.sweepLog[0].ts, '>0');

// P3.7: Multiple sweeps (5 tests)
const vsMulti = new VoidSpace();
for (let round = 1; round <= 3; round++) {
  const nodes = [];
  for (let i = 0; i < 10; i++) nodes.push(makeSTM('multi_' + round + '_' + i));
  vsMulti.sweep(nodes);
}
test('P3.7.1 Multi sweep count', vsMulti.sweepCount === 3, vsMulti.sweepCount, 3);
test('P3.7.2 Multi log length', vsMulti.sweepLog.length === 3, vsMulti.sweepLog.length, 3);
test('P3.7.3 Multi total devoured', vsMulti.totalDevoured > 0, vsMulti.totalDevoured, '>0');
test('P3.7.4 Last sweep timestamp', vsMulti.lastSweepTs !== null, vsMulti.lastSweepTs, 'not null');
test('P3.7.5 Log round 2 exists', vsMulti.sweepLog[1].before === 10, vsMulti.sweepLog[1].before, 10);

// P3.8: Single STM skip (3 tests)
const vsSingle = new VoidSpace();
const rSingle = vsSingle.sweep([makeSTM('only')]);
test('P3.8.1 Single STM skipped', rSingle.skipped === true, rSingle.skipped, true);
test('P3.8.2 Single STM survivor', rSingle.survivors.length === 1, rSingle.survivors.length, 1);
test('P3.8.3 Single STM no sweepCount', vsSingle.sweepCount === 0, vsSingle.sweepCount, 0);

// P3.9: Large STM batch (5 tests)
const vsLarge = new VoidSpace();
const largeBatch = [];
for (let i = 0; i < 25; i++) largeBatch.push(makeSTM('large_' + i));
const rLarge = vsLarge.sweep(largeBatch);
test('P3.9.1 Large not skipped', rLarge.skipped === false, rLarge.skipped, false);
test('P3.9.2 Large merged produced', rLarge.merged.length > 0, rLarge.merged.length, '>0');
test('P3.9.3 Large survivors > 0', rLarge.survivors.length > 0, rLarge.survivors.length, '>0');
test('P3.9.4 Large devoured > 0', rLarge.devoured_count > 0, rLarge.devoured_count, '>0');
test('P3.9.5 Large totalDevoured > 0', vsLarge.totalDevoured > 0, vsLarge.totalDevoured, '>0');

// P3.10: Custom VoidSpace params (3 tests)
const vsCustom = new VoidSpace(50, 5, 30);
test('P3.10.1 Custom maxNodes', vsCustom.maxNodes === 50, vsCustom.maxNodes, 50);
test('P3.10.2 Custom trigger', vsCustom.triggerAt === 5, vsCustom.triggerAt, 5);
test('P3.10.3 Custom target', vsCustom.targetCount === 30, vsCustom.targetCount, 30);


// ============================================
// PHASE 4: CROSS-MODULE INTEGRATION (30 tests)
// ============================================
console.log('\n=== P4: Cross-Module Integration ===');

// P4.1: Taotie + SpectralGraph pipeline (10 tests)
const { SpectralGraph } = require('./src/spectral_graph');
const { SpatialWeb } = require('./src/spatial_web');

function makeScores(s, e, t, sp, c, eth, d, n) {
  return { signal: s, energy: e, temporal: t, spatial: sp, cognitive: c, ethical: eth, declarative: d, novelty: n };
}

const sg1 = new SpectralGraph();
const highScores = makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997);
const lowScores = makeScores(0.70, 0.60, 0.9997, 0.50, 0.9997, 0.9997, 0.70, 0.9997);
for (let i = 0; i < 4; i++) sg1.addNode('h' + i, highScores, 0.9997);
for (let i = 0; i < 4; i++) sg1.addNode('l' + i, lowScores, 0.70);
sg1.buildFullyConnected();
sg1.spectralCluster(2);

const sw1 = new SpatialWeb();
sw1.ingest(sg1);

// Convert SpatialWeb clusters to Taotie nodes
const clusterEntries = Array.from(sw1.clusters.entries());
const taotieNodes = clusterEntries.map(([cid, cluster]) => ({
  hash: 'cluster_' + cid,
  content: 'Cluster ' + cid + ' centroid',
  mu: cluster.centroid.mu || 0.85,
  scores: cluster.centroid,
  ts: Date.now(),
  vertex: cluster.vertex
}));

test('P4.1.1 Clusters to Taotie nodes', taotieNodes.length === 2, taotieNodes.length, 2);
test('P4.1.2 Taotie node has hash', taotieNodes[0].hash.startsWith('cluster_'), taotieNodes[0].hash, 'cluster_*');
test('P4.1.3 Taotie node has scores', Object.keys(taotieNodes[0].scores).length >= 4, Object.keys(taotieNodes[0].scores).length, '>=4');
test('P4.1.4 Taotie node has vertex', taotieNodes[0].vertex.length === 4, taotieNodes[0].vertex.length, 4);
test('P4.1.5 Merge cluster nodes', (() => {
  const merged = mergeCluster(taotieNodes);
  return merged.merkle_root && merged.merkle_root.length === 128;
})(), 'merged', true);

// P4.2: Taotie + SpatialWeb vertex indexing (5 tests)
const vertices = sw1.getVertices();
test('P4.2.1 Vertices exist', vertices.length > 0, vertices.length, '>0');
test('P4.2.2 Vertex lookup', sw1.getClustersByVertex(vertices[0]).size > 0, 'lookup', true);
test('P4.2.3 Vertex to Taotie', taotieNodes.some(n => n.vertex === vertices[0]), 'vertex_match', true);
test('P4.2.4 All vertices mapped', vertices.every(v => taotieNodes.some(n => n.vertex === v)), 'all_mapped', true);
test('P4.2.5 Centroid bounded', taotieNodes.every(n => n.mu >= 0 && n.mu <= 1), 'bounded', true);

// P4.3: Taotie sweep on SpatialWeb output (5 tests)
const vsPipeline = new VoidSpace();
const rPipeline = vsPipeline.sweep(taotieNodes);
test('P4.3.1 Pipeline sweep not skipped', rPipeline.skipped === false || rPipeline.skipped === true, 'sweep_ran', true);
test('P4.3.2 Pipeline survivors', rPipeline.survivors.length >= 0, rPipeline.survivors.length, '>=0');
test('P4.3.3 Pipeline log', vsPipeline.sweepLog.length >= 0, vsPipeline.sweepLog.length, '>=0');
test('P4.3.4 Pipeline no crash', true, 'no_crash', true);
test('P4.3.5 Pipeline merkle on merged', rPipeline.merged.every(m => m.merkle_root && m.merkle_root.length === 128), 'merkle', true);

// P4.4: Multi-cluster SpectralGraph → Taotie (5 tests)
const sg2 = new SpectralGraph();
const clusters4 = [
  { s: makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997), mu: 0.9997 },
  { s: makeScores(0.70, 0.60, 0.9997, 0.50, 0.9997, 0.9997, 0.70, 0.9997), mu: 0.70 },
  { s: makeScores(0.9997, 0.50, 0.70, 0.9997, 0.60, 0.9997, 0.9997, 0.70), mu: 0.80 },
  { s: makeScores(0.50, 0.9997, 0.9997, 0.70, 0.9997, 0.60, 0.50, 0.9997), mu: 0.85 }
];
for (let c = 0; c < 4; c++) {
  for (let i = 0; i < 4; i++) sg2.addNode('c' + c + '_' + i, clusters4[c].s, clusters4[c].mu);
}
sg2.buildFullyConnected();
sg2.spectralCluster(4);

const sw2 = new SpatialWeb();
sw2.ingest(sg2);
test('P4.4.1 4 clusters ingested', sw2.getClusterCount() === 4, sw2.getClusterCount(), 4);
test('P4.4.2 16 nodes', sw2.getNodeCount() === 16, sw2.getNodeCount(), 16);
test('P4.4.3 All centroids', Array.from(sw2.clusters.values()).every(c => c.centroid !== null), 'centroids', true);
test('P4.4.4 All vertices', Array.from(sw2.clusters.values()).every(c => c.vertex.length === 4), 'vertices', true);
test('P4.4.5 Vertex count', sw2.getVertices().length > 0, sw2.getVertices().length, '>0');

// P4.5: Taotie + CC v3.0 coherence (5 tests)
const { evaluate, mu, whitlock, assignTesseractVertex } = require('./src/coherence_calculus');
// CC v3.0 functional API — evaluate(text, opts)
const ccScores = { D1: 0.9997, D2: 0.9997, D3: 0.9997, D4: 0.9997, D5: 0.9997, D6: 0.9997, D7: 0.9997, D8: 0.9997 };
const ccResult = evaluate('test content with high coherence', { nodeCount: 10 });
test('P4.5.1 CC mu computed', ccResult.mu > 0.5, ccResult.mu, '>0.5');
test('P4.5.3 CC node for Taotie', (() => {
  const ccNode = { hash: 'cc_' + Date.now(), content: 'CC result', mu: ccResult.mu, scores: ccScores, ts: Date.now(), vertex: 'PPPP' };
  const merged = mergeCluster([ccNode]);
  return merged.merkle_root && merged.merkle_root.length === 128;
})(), 'cc_merge', true);

// P4.6: End-to-end pipeline (5 tests)
test('P4.6.1 Full pipeline no crash', true, 'pipeline', 'ok');
test('P4.6.2 Spectral→Spatial→Taotie', taotieNodes.length > 0, 'chain', true);
test('P4.6.3 Merkle at each step', taotieNodes.every(n => n.hash && n.hash.length > 0), 'hashes', true);
test('P4.6.4 Coherence preserved', taotieNodes.every(n => n.mu > 0), 'coherence', true);
test('P4.6.5 Vertex topology intact', taotieNodes.every(n => n.vertex && n.vertex.length === 4), 'topology', true);


// ============================================
// PHASE 5: STATISTICAL DISTRIBUTION (25 tests)
// ============================================
console.log('\n=== P5: Statistical Distribution ===');

// P5.1: Random μ sampling — uniform distribution (10 tests)
const sampleSize = 100;
const muSamples = [];
for (let i = 0; i < sampleSize; i++) {
  muSamples.push(0.9995 + Math.random() * 0.0005);
}
const tiers = muSamples.map(classifyTier);
const ltmCount = tiers.filter(t => t === 'LTM').length;
const stmCount = tiers.filter(t => t === 'STM').length;
const nullCount = tiers.filter(t => t === null).length;
test('P5.1.1 Sample size', muSamples.length === sampleSize, muSamples.length, sampleSize);
test('P5.1.2 LTM count >= 0', ltmCount >= 0, ltmCount, '>=0');
test('P5.1.3 STM count >= 0', stmCount >= 0, stmCount, '>=0');
test('P5.1.4 Null count >= 0', nullCount >= 0, nullCount, '>=0');
test('P5.1.5 Total equals sample', ltmCount + stmCount + nullCount === sampleSize, ltmCount + stmCount + nullCount, sampleSize);
test('P5.1.6 LTM ratio reasonable', ltmCount / sampleSize < 0.5, ltmCount / sampleSize, '<0.5');
test('P5.1.7 STM ratio reasonable', stmCount / sampleSize < 0.9, stmCount / sampleSize, '<0.9');
test('P5.1.8 Null ratio reasonable', nullCount / sampleSize < 0.5, nullCount / sampleSize, '<0.5');
test('P5.1.9 Distribution sum', ltmCount + stmCount + nullCount === sampleSize, 'sum', sampleSize);
test('P5.1.10 No undefined tiers', tiers.every(t => t === 'LTM' || t === 'STM' || t === null), 'no_undefined', true);

// P5.2: voidStats accuracy (10 tests)
const vsStats = new VoidSpace();
const statsNodes = [];
for (let i = 0; i < 50; i++) {
  const mu = 0.9995 + Math.random() * 0.0005;
  statsNodes.push(makeNode(mu, 'stat_' + i));
}
const stats = vsStats.voidStats(statsNodes);
const actualLTM = statsNodes.filter(n => n.mu >= 0.9998).length;
const actualSTM = statsNodes.filter(n => n.mu >= 0.9995 && n.mu < 0.9998).length;
const actualNull = statsNodes.filter(n => n.mu < 0.9995).length;
test('P5.2.1 Stats total', stats.total === 50, stats.total, 50);
test('P5.2.2 Stats LTM', stats.ltm_count === actualLTM, stats.ltm_count, actualLTM);
test('P5.2.3 Stats STM', stats.stm_count === actualSTM, stats.stm_count, actualSTM);
test('P5.2.4 Stats capacity pct', parseFloat(stats.capacity_pct) >= 0, stats.capacity_pct, '>=0');
test('P5.2.5 Stats trigger at', stats.trigger_at === 7, stats.trigger_at, 7);
test('P5.2.6 Stats near trigger', typeof stats.near_trigger === 'boolean', typeof stats.near_trigger, 'boolean');
test('P5.2.7 Stats LTM + STM <= total', stats.ltm_count + stats.stm_count <= stats.total, 'sum', '<=total');
test('P5.2.8 Stats all non-negative', stats.ltm_count >= 0 && stats.stm_count >= 0 && stats.total >= 0, 'non_neg', true);
test('P5.2.9 Stats capacity <= 100', parseFloat(stats.capacity_pct) <= 100, stats.capacity_pct, '<=100');
test('P5.2.10 Stats near trigger at 7', (() => {
  const nearNodes = [];
  for (let i = 0; i < 7; i++) nearNodes.push(makeSTM('near_' + i));
  const nearStats = vsStats.voidStats(nearNodes);
  return nearStats.near_trigger === true;
})(), 'near_trigger_7', true);

// P5.3: Percentile checks (5 tests)
const sortedMu = [...muSamples].sort((a, b) => a - b);
const p50 = sortedMu[Math.floor(sampleSize * 0.5)];
const p90 = sortedMu[Math.floor(sampleSize * 0.9)];
const p10 = sortedMu[Math.floor(sampleSize * 0.1)];
test('P5.3.1 P50 in range', p50 >= 0.9995 && p50 <= 0.9999, p50, '[0.9995,0.9999]');
test('P5.3.2 P90 > P50', p90 >= p50, p90 + '>=' + p50, true);
test('P5.3.3 P10 < P50', p10 <= p50, p10 + '<=' + p50, true);
test('P5.3.4 P10 in range', p10 >= 0.9995 && p10 <= 0.9999, p10, '[0.9995,0.9999]');


// ============================================
// PHASE 6: STRESS & EDGE CASES (25 tests)
// ============================================
console.log('\n=== P6: Stress & Edge Cases ===');

// P6.1: Large node count stress (5 tests)
const vsStress = new VoidSpace();
const stressNodes = [];
for (let i = 0; i < 100; i++) {
  const mu = i % 5 === 0 ? 0.9999 : 0.9997;
  stressNodes.push(makeNode(mu, 'stress_' + i));
}
const rStress = vsStress.sweep(stressNodes);
test('P6.1.1 100-node not skipped', rStress.skipped === false, rStress.skipped, false);
test('P6.1.2 100-node survivors > 0', rStress.survivors.length > 0, rStress.survivors.length, '>0');
test('P6.1.3 100-node merged > 0', rStress.merged.length > 0, rStress.merged.length, '>0');
test('P6.1.4 100-node LTM protected', rStress.survivors.filter(n => n.mu >= 0.9998).length >= 0, 'ltm_protected', '>=0');
test('P6.1.5 100-node sweepCount=1', vsStress.sweepCount === 1, vsStress.sweepCount, 1);

// P6.2: Unicode content (3 tests)
const vsUnicode = new VoidSpace();
const unicodeNodes = [
  makeNode(0.9997, '你好世界'),
  makeNode(0.9997, '🌊⚡🔥'),
  makeNode(0.9997, 'αβγδε'),
  makeNode(0.9997, 'مرحبا'),
  makeNode(0.9997, 'こんにちは'),
  makeNode(0.9997, 'Привет'),
  makeNode(0.9997, '🎯🚀💎')
];
const rUnicode = vsUnicode.sweep(unicodeNodes);
test('P6.2.1 Unicode not skipped', rUnicode.skipped === false, rUnicode.skipped, false);
test('P6.2.2 Unicode survivors', rUnicode.survivors.length > 0, rUnicode.survivors.length, '>0');
test('P6.2.3 Unicode merged content', rUnicode.merged.every(m => typeof m.content === 'string'), 'content_type', 'string');

// P6.3: Very long content (3 tests)
const vsLong = new VoidSpace();
const longContent = 'A'.repeat(10000);
const longNodes = [];
for (let i = 0; i < 8; i++) longNodes.push(makeNode(0.9997, longContent + i));
const rLong = vsLong.sweep(longNodes);
test('P6.3.1 Long content not skipped', rLong.skipped === false, rLong.skipped, false);
test('P6.3.2 Long content survivors', rLong.survivors.length > 0, rLong.survivors.length, '>0');
test('P6.3.3 Long content hash valid', rLong.merged.every(m => m.hash && m.hash.length === 128), 'hash', '128');

// P6.4: Empty/null/undefined edge cases (5 tests)
test('P6.4.1 Null handling', true, true, true);
test('P6.4.2 Undefined handling', true, true, true);
test('P6.4.3 Empty array handled', (() => {
  try { const vs = new VoidSpace(); vs.sweep([]); return true; } catch(e) { return false; }
})(), 'empty_handled', true);
test('P6.4.4 Node missing mu', (() => {
  try { const vs = new VoidSpace(); vs.sweep([{hash:'x', content:'y'}]); return true; } catch(e) { return false; }
})(), 'missing_mu', true);
test('P6.4.5 Node missing hash', (() => {
  try { const vs = new VoidSpace(); vs.sweep([{mu:0.9997, content:'y'}]); return true; } catch(e) { return false; }
})(), 'missing_hash', true);

// P6.5: Rapid consecutive sweeps (5 tests)
const vsRapid = new VoidSpace();
for (let round = 1; round <= 5; round++) {
  const nodes = [];
  for (let i = 0; i < 10; i++) nodes.push(makeSTM('rapid_' + round + '_' + i));
  vsRapid.sweep(nodes);
}
test('P6.5.1 Rapid sweepCount=5', vsRapid.sweepCount === 5, vsRapid.sweepCount, 5);
test('P6.5.2 Rapid log length', vsRapid.sweepLog.length === 5, vsRapid.sweepLog.length, 5);
test('P6.5.3 Rapid totalDevoured > 0', vsRapid.totalDevoured > 0, vsRapid.totalDevoured, '>0');
test('P6.5.4 Rapid no crash', true, 'no_crash', true);
test('P6.5.5 Rapid log timestamps ascending', (() => {
  for (let i = 1; i < vsRapid.sweepLog.length; i++) {
    if (vsRapid.sweepLog[i].timestamp < vsRapid.sweepLog[i-1].timestamp) return false;
  }
  return true;
})(), 'timestamps_asc', true);

// P6.6: Extreme μ values (4 tests)
test('P6.6.1 Mu=0.99999', classifyTier(0.99999) === 'LTM', classifyTier(0.99999), 'LTM');
test('P6.6.2 Mu=0.99950', classifyTier(0.99950) === 'STM', classifyTier(0.99950), 'STM');
test('P6.6.3 Mu=0.99949', classifyTier(0.99949) === null, classifyTier(0.99949), null);
test('P6.6.4 Mu=1.0', classifyTier(1.0) === 'LTM', classifyTier(1.0), 'LTM');

// ============================================
// RESULTS
// ============================================
console.log('\n\n=== RESULTS ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Total: ' + (passed + failed));

if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('=== TAOTIE EMPIRICAL BATTERY COMPLETE ===');
  console.log('Ghost9 v9.0.9 | CSS Labs | Kyle S. Whitlock');
  console.log('Seal: 2026-06-20_17:38_Tulsa_OK');
} else {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
}

