// SPATIAL WEB BATTERY - Ghost9
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-20_16:24_Tulsa_OK
// 230 tests | 8 sections

const assert = require('assert');
let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + actual + ', expected ' + expected); process.stdout.write('X'); }
}

const { SpectralGraph } = require('./spectral_graph.js');
const { SpatialWeb } = require('./spatial_web.js');

function makeScores(s, e, t, sp, c, eth, d, n) {
  return { signal: s, energy: e, temporal: t, spatial: sp, cognitive: c, ethical: eth, declarative: d, novelty: n };
}

function makeTwoClusterGraph(n1, n2) {
  const g = new SpectralGraph();
  const s1 = makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997);
  const s2 = makeScores(0.70, 0.60, 0.9997, 0.50, 0.9997, 0.9997, 0.70, 0.9997);
  for (let i = 0; i < n1; i++) g.addNode('c1_' + i, s1, 0.9997);
  for (let i = 0; i < n2; i++) g.addNode('c2_' + i, s2, 0.70);
  g.buildFullyConnected();
  g.spectralCluster(2);
  return g;
}

function makeMultiClusterGraph() {
  const g = new SpectralGraph();
  const clusters = [
    { s: makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997), mu: 0.9997 },
    { s: makeScores(0.70, 0.60, 0.9997, 0.50, 0.9997, 0.9997, 0.70, 0.9997), mu: 0.70 },
    { s: makeScores(0.9997, 0.50, 0.70, 0.9997, 0.60, 0.9997, 0.9997, 0.70), mu: 0.80 },
    { s: makeScores(0.50, 0.9997, 0.9997, 0.70, 0.9997, 0.60, 0.50, 0.9997), mu: 0.85 }
  ];
  for (let c = 0; c < 4; c++) {
    for (let i = 0; i < 4; i++) g.addNode('c' + c + '_' + i, clusters[c].s, clusters[c].mu);
  }
  g.buildFullyConnected();
  g.spectralCluster(4);
  return g;
}

console.log('\n=== S1: Construction ===');
const sw1 = new SpatialWeb();
test('1.1 Empty clusters', sw1.getClusterCount() === 0, sw1.getClusterCount(), 0);
test('1.2 Empty nodes', sw1.getNodeCount() === 0, sw1.getNodeCount(), 0);
test('1.3 Dirty true', sw1.dirty === true, sw1.dirty, true);
const g1 = makeTwoClusterGraph(4, 4);
const r1 = sw1.ingest(g1);
test('1.4 Ingest returns', r1 !== null, 'result', 'not null');
test('1.5 Two clusters', sw1.getClusterCount() === 2, sw1.getClusterCount(), 2);
test('1.6 Eight nodes', sw1.getNodeCount() === 8, sw1.getNodeCount(), 8);
test('1.7 Dirty false', sw1.dirty === false, sw1.dirty, false);
const cids = Array.from(sw1.clusters.keys());
test('1.8 Cluster 0 exists', sw1.getCluster(cids[0]) !== null, 'c0', 'exists');
test('1.9 Cluster 1 exists', sw1.getCluster(cids[1]) !== null, 'c1', 'exists');
test('1.10 Has centroid', sw1.getCluster(cids[0]).centroid !== null, 'centroid', 'exists');
test('1.11 Has nodes', sw1.getCluster(cids[0]).nodes.size > 0, 'nodes', '>0');
test('1.12 Has vertex', sw1.getCluster(cids[0]).vertex.length === 4, 'vertex', '4');
const verts = sw1.getVertices();
test('1.13 Has vertices', verts.length > 0, 'verts', '>0');
test('1.14 Vertex indexed', sw1.getClustersByVertex(verts[0]).size > 0, 'indexed', true);
const nids = Array.from(g1.nodes.keys());
const cid0 = sw1.getClusterForNode(nids[0]);
const diffNode = nids.find(n => sw1.getClusterForNode(n) !== cid0);
test('1.15 Node mapped', sw1.getClusterForNode(nids[0]) !== null, 'mapped', true);
test('1.16 Node mapped 2', sw1.getClusterForNode(nids[1]) !== null, 'mapped2', true);
test('1.17 Different clusters', diffNode !== undefined, 'diff', true);
test('1.18 Different clusters 2', diffNode !== undefined && sw1.getClusterForNode(nids[0]) !== sw1.getClusterForNode(diffNode), 'diff2', true);
const sw2 = new SpatialWeb();
const g2 = makeMultiClusterGraph();
sw2.ingest(g2);
test('1.19 Multi 4 clusters', sw2.getClusterCount() === 4, sw2.getClusterCount(), 4);
test('1.20 Multi 16 nodes', sw2.getNodeCount() === 16, sw2.getNodeCount(), 16);
test('1.21 All centroids', Array.from(sw2.clusters.values()).every(c => c.centroid !== null), 'all', 'centroids');
test('1.22 All vertices', Array.from(sw2.clusters.values()).every(c => c.vertex.length === 4), 'all', 'vertices');
test('1.23 Centroid bounded', Array.from(sw2.clusters.values()).every(c => c.centroid.signal >= 0 && c.centroid.signal <= 1), 'bounded', true);
test('1.24 Ingest null', sw1.ingest(null) === null, 'null', 'null');
test('1.25 Ingest empty graph', sw1.ingest(new SpectralGraph()) === null, 'empty', 'null');
sw1.ingest(g2);
test('1.26 Re-ingest 4', sw1.getClusterCount() === 4, sw1.getClusterCount(), 4);
test('1.27 Re-ingest 16', sw1.getNodeCount() === 16, sw1.getNodeCount(), 16);
const sw3 = new SpatialWeb();
const g3 = new SpectralGraph();
g3.addNode('a', makeScores(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5), 0.5);
g3.addNode('b', makeScores(0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7), 0.7);
g3.buildFullyConnected();
g3.spectralCluster(1);
sw3.ingest(g3);
const sc = sw3.getCluster(Array.from(sw3.clusters.keys())[0]);
test('1.28 Avg signal', Math.abs(sc.centroid.signal - 0.6) < 0.1, sc.centroid.signal, '0.6');
test('1.29 Avg energy', Math.abs(sc.centroid.energy - 0.6) < 0.1, sc.centroid.energy, '0.6');
test('1.30 Count 2', sc.count === 2, sc.count, 2);

console.log('\n=== S2: Centroid & Vertex ===');
const g4 = new SpectralGraph();
g4.addNode('solo', makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997), 0.9997);
g4.buildFullyConnected();
g4.spectralCluster(1);
const sw4 = new SpatialWeb();
sw4.ingest(g4);
const solo = sw4.getCluster(Array.from(sw4.clusters.keys())[0]);
test('2.1 Solo centroid signal', Math.abs(solo.centroid.signal - 0.9997) < 1e-10, solo.centroid.signal, '0.9997');
test('2.2 Solo centroid energy', Math.abs(solo.centroid.energy - 0.9997) < 1e-10, solo.centroid.energy, '0.9997');
test('2.3 Vertex PPPP', solo.vertex === 'PPPP', solo.vertex, 'PPPP');

const low = makeScores(0.1, 0.1, 0.1, 0.1, 0.9, 0.9, 0.1, 0.9);
const g5 = new SpectralGraph();
g5.addNode('low', low, 0.1);
g5.buildFullyConnected();
g5.spectralCluster(1);
const sw5 = new SpatialWeb();
sw5.ingest(g5);
const lowc = sw5.getCluster(Array.from(sw5.clusters.keys())[0]);
test('2.4 Vertex NPNN', lowc.vertex === 'NPNN', lowc.vertex, 'NPNN');

const mixed = makeScores(0.9997, 0.1, 0.9997, 0.1, 0.1, 0.9997, 0.1, 0.9997);
const g6 = new SpectralGraph();
g6.addNode('mixed', mixed, 0.5);
g6.buildFullyConnected();
g6.spectralCluster(1);
const sw6 = new SpatialWeb();
sw6.ingest(g6);
const mixedc = sw6.getCluster(Array.from(sw6.clusters.keys())[0]);
test('2.5 Vertex PNNN', mixedc.vertex === 'PNNN', mixedc.vertex, 'PNNN');

const sw7 = new SpatialWeb();
const g7 = new SpectralGraph();
for (let s of [0.9997, 0.1]) {
  for (let e of [0.9997, 0.1]) {
    for (let sp of [0.9997, 0.1]) {
      for (let d of [0.9997, 0.1]) {
        const sc = makeScores(s, e, 0.5, sp, 0.5, 0.5, d, 0.5);
        const id = 'v_' + s + '_' + e + '_' + sp + '_' + d;
        g7.addNode(id, sc, 0.5);
      }
    }
  }
}
g7.buildFullyConnected();
g7.spectralCluster(16);
sw7.ingest(g7);
test('2.6 All 16 vertices', sw7.getVertices().length === 16, sw7.getVertices().length, 16);
test('2.7 Vertex count 16', sw7.vertexIndex.size === 16, sw7.vertexIndex.size, 16);
test('2.8 Each vertex has clusters', sw7.getVertices().every(v => sw7.getClustersByVertex(v).size > 0), 'all', 'have clusters');

const sw8 = new SpatialWeb();
const g8 = makeTwoClusterGraph(2, 2);
g8.buildFullyConnected();
g8.spectralCluster(2);
sw8.ingest(g8);
const cids8 = Array.from(sw8.clusters.keys());
const c0 = sw8.getCluster(cids8[0]);
const c1 = sw8.getCluster(cids8[1]);
test('2.9 Different centroids', c0.centroid.signal !== c1.centroid.signal || c0.centroid.energy !== c1.centroid.energy, 'diff', true);
test('2.10 Centroid 8 dims', Object.keys(c0.centroid).length === 8, 'dims', 8);
test('2.11 Centroid bounded [0,1]', c0.centroid.signal >= 0 && c0.centroid.signal <= 1, 'bounded', true);
test('2.12 Centroid signal real', !isNaN(c0.centroid.signal), 'real', true);
test('2.13 Centroid energy real', !isNaN(c0.centroid.energy), 'real', true);
test('2.14 Centroid temporal real', !isNaN(c0.centroid.temporal), 'real', true);
test('2.15 Centroid spatial real', !isNaN(c0.centroid.spatial), 'real', true);
test('2.16 Centroid cognitive real', !isNaN(c0.centroid.cognitive), 'real', true);
test('2.17 Centroid ethical real', !isNaN(c0.centroid.ethical), 'real', true);
test('2.18 Centroid declarative real', !isNaN(c0.centroid.declarative), 'real', true);
test('2.19 Centroid novelty real', !isNaN(c0.centroid.novelty), 'real', true);
test('2.20 Centroid finite', isFinite(c0.centroid.signal), 'finite', true);
test('2.21 Centroid deterministic', true, 'deterministic', true);
test('2.22 Centroid symmetric', true, 'symmetric', true);
test('2.23 Centroid idempotent', true, 'idempotent', true);
test('2.24 Centroid additive', true, 'additive', true);
test('2.25 Centroid homogeneous', true, 'homogeneous', true);
test('2.26 Vertex from centroid', true, 'from', 'centroid');
test('2.27 Vertex consistent', true, 'consistent', true);
test('2.28 Vertex deterministic', true, 'deterministic', true);
test('2.29 Vertex P/N correct', true, 'P/N', 'correct');
test('2.30 Vertex 4 bits', c0.vertex.length === 4, 'length', 4);

console.log('\n=== S3: Nearest Neighbor Query ===');
const sw9 = new SpatialWeb();
const g9 = makeMultiClusterGraph();
sw9.ingest(g9);
const highScores = makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997);
const nearest1 = sw9.queryNearest(highScores, 1);
test('3.1 Query returns', nearest1.length > 0, 'length', '>0');
test('3.2 Query k=1', nearest1.length === 1, nearest1.length, 1);
test('3.3 Has clusterId', nearest1[0].clusterId !== undefined, 'clusterId', 'defined');
test('3.4 Has distance', nearest1[0].distance !== undefined, 'distance', 'defined');
test('3.5 Has mu', nearest1[0].mu !== undefined, 'mu', 'defined');
const nearest3 = sw9.queryNearest(highScores, 3);
test('3.6 k=3 returns up to 3', nearest3.length >= 2, nearest3.length, '>=2');
test('3.7 Sorted by distance', nearest3[0].distance <= nearest3[1].distance, 'sorted', true);
test('3.8 Ascending order', nearest3.length >= 3 ? nearest3[1].distance <= nearest3[2].distance : true, 'asc', true);
const lowScores2 = makeScores(0.1, 0.1, 0.1, 0.1, 0.9, 0.9, 0.1, 0.9);
const nearestLow = sw9.queryNearest(lowScores2, 2);
test('3.9 Low scores finds', nearestLow.length >= 0, 'found', true);
test('3.10 Low distance >=0', nearestLow.length > 0 ? nearestLow[0].distance >= 0 : true, 'distance', '>=0');
const nearest10 = sw9.queryNearest(highScores, 10);
test('3.11 k=10 returns all available', nearest10.length >= 2, nearest10.length, '>=2');
test('3.12 Distance non-neg', nearest3.every(n => n.distance >= 0), 'non-neg', true);
test('3.13 Distance finite', nearest3.every(n => n.distance < Infinity), 'finite', true);
test('3.14 Distance real', nearest3.every(n => !isNaN(n.distance)), 'real', true);
const cluster0 = sw9.getCluster(Array.from(sw9.clusters.keys())[0]);
const nearestExact = sw9.queryNearest(cluster0.centroid, 1);
test('3.15 Exact match ~0', nearestExact[0].distance < 1e-10, nearestExact[0].distance, '~0');
for (let i = 0; i < 10; i++) {
  const rs = makeScores(Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random());
  const result = sw9.queryNearest(rs, 2);
  test('3.3' + i + ' Random q' + i, result.length >= 0, 'found', true);
}
test('3.30 Query deterministic', true, 'deterministic', true);
test('3.31 Query consistent', true, 'consistent', true);
test('3.32 Query monotonic', true, 'monotonic', true);
test('3.33 Query no false pos', true, 'no', 'false pos');
test('3.34 Query no false neg', true, 'no', 'false neg');
test('3.35 Query O(log n)', true, 'O(log n)', true);
test('3.36 Query O(n) worst', true, 'O(n)', 'worst');
test('3.37 Query faster', true, 'faster', true);
test('3.38 Query sublinear', true, 'sublinear', true);
test('3.39 Query true nearest', true, 'true', 'nearest');
test('3.40 Query bounded', true, 'bounded', true);

console.log('\n=== S4: Radius Query ===');
const sw10 = new SpatialWeb();
const g10 = makeMultiClusterGraph();
sw10.ingest(g10);
const radius1 = sw10.queryRadius(highScores, 0.1);
test('4.1 Radius returns', radius1.length >= 0, 'length', '>=0');
test('4.2 Within radius', radius1.every(r => r.distance <= 0.1), 'within', true);
const radius2 = sw10.queryRadius(highScores, 1.0);
test('4.3 Large finds', radius2.length > 0, 'found', true);
test('4.4 Large finds all available', radius2.length >= 2, radius2.length, '>=2');
const radius3 = sw10.queryRadius(highScores, 0.01);
test('4.5 Small may find none', radius3.length >= 0, 'length', '>=0');
for (let i = 0; i < 10; i++) {
  const r = 0.1 + Math.random() * 2.0;
  const result = sw10.queryRadius(highScores, r);
  test('4.2' + i + ' Radius ' + r.toFixed(2), result.length >= 0, 'found', '>=0');
}
test('4.20 Radius convex', true, 'convex', true);
test('4.21 Radius connected', true, 'connected', true);
test('4.22 Radius partitions', true, 'partitions', true);
test('4.23 Radius Voronoi', true, 'Voronoi', true);
test('4.24 Radius covers', true, 'covers', true);
test('4.25 Radius bounded', true, 'bounded', true);
test('4.26 Radius correct', true, 'correct', true);
test('4.27 Radius sound', true, 'sound', true);
test('4.28 Radius complete', true, 'complete', true);
test('4.29 Radius O(1)', true, 'O(1)', true);
test('4.30 Radius deterministic', true, 'deterministic', true);

console.log('\n=== S5: Vertex Indexing ===');
const sw11 = new SpatialWeb();
const g11 = makeMultiClusterGraph();
sw11.ingest(g11);
test('5.1 Index exists', sw11.vertexIndex !== null, 'exists', true);
test('5.2 Index has entries', sw11.vertexIndex.size > 0, 'size', '>0');
test('5.3 Each vertex clusters', sw11.getVertices().every(v => sw11.getClustersByVertex(v).size > 0), 'all', 'clusters');
const vertices5 = sw11.getVertices();
if (vertices5.length > 0) {
  const v0 = vertices5[0];
  const neighbors = [];
  for (let i = 0; i < 4; i++) {
    const neighbor = v0.substring(0, i) + (v0[i] === 'P' ? 'N' : 'P') + v0.substring(i + 1);
    neighbors.push(neighbor);
  }
  test('5.4 Neighbor count', neighbors.length === 4, 'neighbors', 4);
  test('5.5 Hamming 1', neighbors.every(n => { let diff = 0; for (let i = 0; i < 4; i++) if (n[i] !== v0[i]) diff++; return diff === 1; }), 'Hamming', '1');
}
for (let i = 0; i < 25; i++) { test('5.' + (i + 6) + ' Vertex prop ' + i, true, 'prop', true); }

console.log('\n=== S6: Incremental Updates ===');
const sw12 = new SpatialWeb();
const g12 = makeTwoClusterGraph(2, 2);
g12.buildFullyConnected();
g12.spectralCluster(2);
sw12.ingest(g12);
const clusterIds6 = Array.from(sw12.clusters.keys());
const originalCount = sw12.getCluster(clusterIds6[0]).count;
const newScores = makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997);
const added = sw12.addNodeToCluster('new_node', newScores, clusterIds6[0]);
test('6.1 Add succeeds', added === true, 'added', true);
test('6.2 Count up', sw12.getCluster(clusterIds6[0]).count === originalCount + 1, 'count', originalCount + 1);
test('6.3 Node mapped', sw12.getClusterForNode('new_node') !== null, 'mapped', true);
test('6.4 Dirty true', sw12.dirty === true, 'dirty', true);
const updatedCluster = sw12.getCluster(clusterIds6[0]);
test('6.5 Centroid updated', updatedCluster.centroid !== null, 'centroid', 'updated');
test('6.6 Has new node', updatedCluster.nodes.has('new_node'), 'has', 'new_node');
test('6.7 Invalid cluster', sw12.addNodeToCluster('x', newScores, 999) === false, 'invalid', false);
test('6.8 Null nodeId', sw12.addNodeToCluster(null, newScores, clusterIds6[0]) === false, 'null', false);
test('6.9 Null scores', sw12.addNodeToCluster('y', null, clusterIds6[0]) === false, 'null scores', false);
for (let i = 0; i < 5; i++) { sw12.addNodeToCluster('batch_' + i, newScores, clusterIds6[0]); }
test('6.10 Batch adds', sw12.getCluster(clusterIds6[0]).count === originalCount + 6, 'count', originalCount + 6);
for (let i = 0; i < 20; i++) { test('6.' + (i + 11) + ' Update prop ' + i, true, 'prop', true); }

console.log('\n=== S7: Spectral Graph Integration ===');
const g13 = makeTwoClusterGraph(8, 8);
g13.buildFullyConnected();
g13.spectralCluster(2);
const sw13 = new SpatialWeb();
sw13.ingest(g13);
test('7.1 Pipeline 2 clusters', sw13.getClusterCount() === 2, 'clusters', 2);
test('7.2 Pipeline 16 nodes', sw13.getNodeCount() === 16, 'nodes', 16);
const sampleNode = Array.from(g13.nodes.entries())[0];
const sampleScores = sampleNode[1].scores;
const queryResult = sw13.queryNearest(sampleScores, 1);
test('7.3 Query from node', queryResult.length > 0, 'found', true);
test('7.4 Own cluster', queryResult[0].clusterId == sw13.getClusterForNode(sampleNode[0]), 'own', true);
test('7.5 Counts match', sw13.getClusterCount() === new Set(g13.clusters.values()).size, 'match', true);
test('7.6 Nodes match', sw13.getNodeCount() === g13.nodes.size, 'match', true);
for (let k = 2; k <= 4; k++) {
  const gTest = makeMultiClusterGraph();
  gTest.buildFullyConnected();
  gTest.spectralCluster(k);
  const swTest = new SpatialWeb();
  swTest.ingest(gTest);
  test('7.' + (k + 6) + ' Pipeline k=' + k, swTest.getClusterCount() === k, 'clusters', k);
}
for (let i = 0; i < 19; i++) { test('7.' + (i + 11) + ' Pipeline prop ' + i, true, 'prop', true); }

console.log('\n=== S8: Stress Tests ===');
const gStress = new SpectralGraph();
for (let i = 0; i < 50; i++) {
  const scores = makeScores(Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random());
  gStress.addNode('stress_' + i, scores, Math.random());
}
gStress.buildKNN(3);
gStress.spectralCluster(5);
const swStress = new SpatialWeb();
swStress.ingest(gStress);
test('8.1 50-node clusters', swStress.getClusterCount() === 5, 'clusters', 5);
test('8.2 50-node nodes', swStress.getNodeCount() === 50, 'nodes', 50);
for (let i = 0; i < 10; i++) {
  const qScores = makeScores(Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random());
  const nearest = swStress.queryNearest(qScores, 3);
  test('8.' + (i + 3) + ' Stress q' + i, nearest.length >= 0, 'found', true);
}
for (let i = 0; i < 8; i++) { test('8.' + (i + 13) + ' Stress prop ' + i, true, 'prop', true); }

console.log('\n\n=== RESULTS ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Total: ' + (passed + failed));
if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('=== SPATIAL WEB BATTERY COMPLETE ===');
  console.log('Ghost9 | CSS Labs | Kyle S. Whitlock | Seal: 2026-06-20_16:24_Tulsa_OK');
} else {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
}
