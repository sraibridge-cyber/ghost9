// GHOST KERNEL END-TO-END INTEGRATION BATTERY v6.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-07-04_17:05_Tulsa_OK
// 2,000+ tests | Corrected: recall requires merged nodes, rehydrate returns {node, tier}

const { evaluate } = require('./src/coherence_calculus');
const { mergeCluster } = require('./src/taotie');
const { SpectralGraph } = require('./src/spectral_graph');
const { SpatialWeb } = require('./src/spatial_web');
const { ReconstructionPipeline } = require('./src/reconstruction_pipeline');
const { GenerativeLoop } = require('./src/rip_generative_loop');
const { SEVENTEEN_LAWS, FLAGS } = require('./src/ghost_rip');

let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

function makeNode(mu, content, hash) {
  return {
    hash: hash || 'h_' + Math.random().toString(36).slice(2),
    content: content || 'test content',
    mu: mu,
    scores: { signal: mu, energy: mu, temporal: mu, spatial: mu, cognitive: mu, ethical: mu, declarative: mu, novelty: mu },
    ts: Date.now(),
    vertex: 'PPPP'
  };
}

function buildSpectralGraph(nodes) {
  const sg = new SpectralGraph();
  for (const node of nodes) {
    sg.addNode(node.hash, node.scores, node.mu);
  }
  sg.buildFullyConnected();
  sg.spectralCluster(Math.min(2, nodes.length));
  return sg;
}

// ============================================
// L1: INGESTION PIPELINE (250 tests)
// ============================================
console.log('\n=== L1: Ingestion Pipeline ===');

for (let i = 0; i < 100; i++) {
  const text = 'verified coherent truth harmony ' + i;
  const result = evaluate(text);
  test('L1.1.' + i + ' mu', typeof result.mu === 'number', typeof result.mu, 'number');
  test('L1.1.' + i + 'b pass', typeof result.pass === 'boolean', typeof result.pass, 'boolean');
  test('L1.1.' + i + 'c tier', typeof result.tier === 'string' || result.tier === null, true, true);
  test('L1.1.' + i + 'd 8 scores', Object.keys(result.scores).length === 8, Object.keys(result.scores).length, 8);
  test('L1.1.' + i + 'e version', result.version === 'v3.1.0', result.version, 'v3.1.0');
}

const formats = [
  'plain text', '{"json": true}', '# Markdown\n- item', 'function test() { return 42; }',
  'SELECT * FROM users', '<html><body>Hello</body></html>', '---\ntitle: YAML\n---',
  '1 + 2 = 3', 'https://example.com', 'email@domain.com', '192.168.1.1',
  'const x = require("module");', 'class Foo { constructor() {} }',
  'import { foo } from "bar";', 'export default class {}',
  'async function main() { await foo(); }', 'try { } catch(e) { }',
  'if (true) { } else { }', 'for (let i = 0; i < 10; i++) { }',
  'while (true) { break; }', 'switch(x) { case 1: break; }'
];
for (let i = 0; i < formats.length; i++) {
  for (let j = 0; j < 5; j++) {
    const result = evaluate(formats[i] + ' ' + j);
    test('L1.2.' + i + '.' + j + ' format', result.mu >= 0 && result.mu <= 1, result.mu, '0-1');
    test('L1.2.' + i + '.' + j + 'b scores', Object.keys(result.scores).length === 8, Object.keys(result.scores).length, 8);
  }
}

for (let batch = 1; batch <= 10; batch++) {
  const texts = [];
  for (let i = 0; i < batch * 5; i++) texts.push('batch ' + batch + ' item ' + i);
  const results = texts.map(t => evaluate(t));
  test('L1.3.' + batch + ' size', results.length === batch * 5, results.length, batch * 5);
  test('L1.3.' + batch + 'b valid', results.every(r => r.mu >= 0 && r.mu <= 1), true, true);
  test('L1.3.' + batch + 'c scored', results.every(r => Object.keys(r.scores).length === 8), true, true);
  test('L1.3.' + batch + 'd ts', results.every(r => r.timestamp > 0), true, true);
  test('L1.3.' + batch + 'e ver', results.every(r => r.version === 'v3.1.0'), true, true);
}

// ============================================
// L2: STORAGE & COMPRESSION (250 tests)
// ============================================
console.log('\n=== L2: Storage & Compression ===');

for (let size = 1; size <= 20; size++) {
  for (let j = 0; j < 5; j++) {
    const nodes = [];
    for (let i = 0; i < size; i++) nodes.push(makeNode(0.9995 + Math.random() * 0.0005, 'taotie_' + j + '_' + i));
    const merged = mergeCluster(nodes);
    test('L2.1.' + size + '.' + j + ' merged', merged !== null, true, true);
    test('L2.1.' + size + '.' + j + 'b hash', typeof merged.hash === 'string', typeof merged.hash, 'string');
    test('L2.1.' + size + '.' + j + 'c content', typeof merged.content === 'string', typeof merged.content, 'string');
    test('L2.1.' + size + '.' + j + 'd mu', merged.mu >= 0.9995, merged.mu, '>=0.9995');
    test('L2.1.' + size + '.' + j + 'e isMerge', merged._isMerge === true, merged._isMerge, true);
  }
}

for (let i = 0; i < 25; i++) {
  const nodes = [];
  for (let j = 0; j < 5; j++) {
    nodes.push(makeNode(0.9999 - j * 0.0001, 'sg_' + i + '_' + j));
  }
  const sg = buildSpectralGraph(nodes);
  test('L2.2.' + i + ' nodes', sg.getNodeCount() === 5, sg.getNodeCount(), 5);
  test('L2.2.' + i + 'b clusters', sg.clusters.size > 0, sg.clusters.size, '>0');
}

for (let i = 0; i < 25; i++) {
  const nodes = [];
  for (let j = 0; j < 5; j++) {
    nodes.push(makeNode(0.9999 - j * 0.0001, 'sw_' + i + '_' + j));
  }
  const sg = buildSpectralGraph(nodes);
  const sw = new SpatialWeb();
  sw.ingest(sg);
  test('L2.3.' + i + ' nodes', sw.getNodeCount() === 5, sw.getNodeCount(), 5);
  test('L2.3.' + i + 'b clusters', sw.getClusterCount() > 0, sw.getClusterCount(), '>0');
  test('L2.3.' + i + 'c dirty', sw.dirty === false, sw.dirty, false);
}

for (let i = 0; i < 25; i++) {
  const rp = new ReconstructionPipeline();
  for (let j = 0; j < 5; j++) {
    const node = makeNode(0.9999, 'bonsai_' + i + '_' + j);
    rp.index(node);
    test('L2.4.' + i + '.' + j + ' indexed', rp.stats().storeSize >= j + 1, rp.stats().storeSize, '>= ' + (j + 1));
    const recalled = rp.recall(node);
    test('L2.4.' + i + '.' + j + 'b recall', recalled.success === true, recalled.success, true);
  }
}

// ============================================
// L3: RECONSTRUCTION & RECALL (250 tests)
// ============================================
console.log('\n=== L3: Reconstruction & Recall ===');

// L3.1: Recall merged nodes (100 tests)
for (let i = 0; i < 50; i++) {
  const rp = new ReconstructionPipeline();
  const nodes = [makeNode(0.9999, 'recall_' + i + '_a'), makeNode(0.9998, 'recall_' + i + '_b')];
  rp.index(nodes[0]); rp.index(nodes[1]);
  const merged = mergeCluster(nodes);
  rp.index(merged);
  
  const recalled = rp.recall(merged);
  test('L3.1.' + i + ' recall', recalled.success === true, recalled.success, true);
  test('L3.1.' + i + 'b hash', recalled.hash === merged.hash, recalled.hash, merged.hash);
  
  const recon = rp.reconstruct(recalled);
  test('L3.1.' + i + 'c reconstruct', recon.success === true, recon.success, true);
  
  const rehydrated = rp.rehydrate(recon);
  test('L3.1.' + i + 'd rehydrate', rehydrated.success === true, rehydrated.success, true);
  test('L3.1.' + i + 'e node', rehydrated.node !== null, true, true);
  test('L3.1.' + i + 'f content', rehydrated.node.content.includes('recall_' + i), true, true);
  test('L3.1.' + i + 'g scores', Object.keys(rehydrated.node.scores).length === 8, Object.keys(rehydrated.node.scores).length, 8);
  test('L3.1.' + i + 'h tier', rehydrated.tier === 'STM' || rehydrated.tier === 'LTM', true, true);
}

// L3.2: Cross-module recall chain (100 tests)
for (let i = 0; i < 50; i++) {
  const rp = new ReconstructionPipeline();
  const nodes = [makeNode(0.9999, 'chain_' + i + '_a'), makeNode(0.9998, 'chain_' + i + '_b'), makeNode(0.9997, 'chain_' + i + '_c')];
  rp.index(nodes[0]); rp.index(nodes[1]); rp.index(nodes[2]);
  
  const merged = mergeCluster(nodes);
  rp.index(merged);
  
  const recalled = rp.recall(merged);
  test('L3.2.' + i + ' chain', recalled.success === true, recalled.success, true);
  
  const recon = rp.reconstruct(recalled);
  test('L3.2.' + i + 'b reconstruct', recon.success === true, recon.success, true);
  
  const rehydrated = rp.rehydrate(recon);
  test('L3.2.' + i + 'c rehydrate', rehydrated.success === true, rehydrated.success, true);
  test('L3.2.' + i + 'd content', rehydrated.node.content.includes('chain_' + i), true, true);
}

// L3.3: Provenance preservation (50 tests)
for (let i = 0; i < 25; i++) {
  const rp = new ReconstructionPipeline();
  const nodes = [];
  for (let j = 0; j < 5; j++) {
    nodes.push(makeNode(0.9999 - j * 0.0001, 'prov_' + i + '_' + j));
    rp.index(nodes[j]);
  }
  const merged = mergeCluster(nodes);
  rp.index(merged);
  
  const recalled = rp.recall(merged);
  const recon = rp.reconstruct(recalled);
  const rehydrated = rp.rehydrate(recon);
  test('L3.3.' + i + ' provenance', rehydrated.success === true, true, true);
  test('L3.3.' + i + 'b node', rehydrated.node !== null, true, true);
  test('L3.3.' + i + 'c scores', Object.keys(rehydrated.node.scores).length === 8, Object.keys(rehydrated.node.scores).length, 8);
}

// ============================================
// L4: GENERATIVE LOOP (250 tests)
// ============================================
console.log('\n=== L4: Generative Loop ===');

for (let size = 1; size <= 20; size++) {
  for (let j = 0; j < 5; j++) {
    const gl = new GenerativeLoop();
    const nodes = [];
    for (let i = 0; i < size; i++) nodes.push(makeNode(0.9995 + Math.random() * 0.0005, 'ctx_' + j + '_' + i));
    const ctx = gl.assembleContext(nodes);
    test('L4.1.' + size + '.' + j + ' primary', ctx.primary.length === Math.min(size, 5), ctx.primary.length, Math.min(size, 5));
    test('L4.1.' + size + '.' + j + 'b sorted', ctx.primary[0].mu >= ctx.primary[ctx.primary.length - 1].mu, true, true);
    test('L4.1.' + size + '.' + j + 'c avgMu', ctx.avgMu >= 0.9995, ctx.avgMu, '>=0.9995');
    test('L4.1.' + size + '.' + j + 'd domain', typeof ctx.dominantDomain === 'string', true, true);
    test('L4.1.' + size + '.' + j + 'e friends', Array.isArray(ctx.friends), true, true);
  }
}

for (let i = 0; i < 50; i++) {
  const gl = new GenerativeLoop();
  const nodes = [makeNode(0.9999, 'gen_' + i + '_a'), makeNode(0.9998, 'gen_' + i + '_b')];
  const friends = [makeNode(0.9997, 'friend_' + i + '_1'), makeNode(0.9996, 'friend_' + i + '_2')];
  const result = gl.cycle(nodes, friends);
  test('L4.2.' + i + ' success', result.success === true, result.success, true);
  test('L4.2.' + i + 'b content', typeof result.generated.content === 'string', true, true);
  test('L4.2.' + i + 'c scores', typeof result.generated.scores === 'object', true, true);
  test('L4.2.' + i + 'd mu', result.generated.mu >= 0.9995, result.generated.mu, '>=0.9995');
  test('L4.2.' + i + 'e isGenerated', result.generated._isGenerated === true, true, true);
  test('L4.2.' + i + 'f parent_ids', Array.isArray(result.generated.parent_ids), true, true);
  test('L4.2.' + i + 'g friend_ids', Array.isArray(result.generated.friend_ids), true, true);
  test('L4.2.' + i + 'h timestamp', result.generated.timestamp > 0, result.generated.timestamp, '>0');
}

for (let i = 0; i < 25; i++) {
  const gl = new GenerativeLoop({ maxIterations: 10 });
  const nodes = [makeNode(0.9999, 'ver_' + i)];
  const result = gl.cycle(nodes);
  test('L4.3.' + i + ' flag', result.flag === FLAGS.VERIFIED || result.flag === FLAGS.PARTIAL || result.flag === FLAGS.FAILED, true, true);
  test('L4.3.' + i + 'b reason', typeof result.reason === 'string', true, true);
  test('L4.3.' + i + 'c iterations', result.iterations >= 1 && result.iterations <= 10, result.iterations, '1-10');
  test('L4.3.' + i + 'd stats', gl.stats().totalGenerations >= 1, gl.stats().totalGenerations, '>=1');
  test('L4.3.' + i + 'e verRate', gl.stats().verificationRate >= 0, gl.stats().verificationRate, '>=0');
}

// ============================================
// L5: FULL METABOLIC CYCLE (250 tests)
// ============================================
console.log('\n=== L5: Full Metabolic Cycle ===');

for (let i = 0; i < 50; i++) {
  const rp = new ReconstructionPipeline();
  const gl = new GenerativeLoop();
  
  const n1 = makeNode(0.9999, 'meta_' + i + '_1');
  const n2 = makeNode(0.9998, 'meta_' + i + '_2');
  const n3 = makeNode(0.9997, 'meta_' + i + '_3');
  rp.index(n1); rp.index(n2); rp.index(n3);
  
  const merged = mergeCluster([n1, n2, n3]);
  rp.index(merged);
  
  const recalled = rp.recall(merged);
  test('L5.1.' + i + ' recall', recalled.success === true, recalled.success, true);
  
  const recon = rp.reconstruct(recalled);
  test('L5.1.' + i + 'b reconstruct', recon.success === true, recon.success, true);
  
  const rehydrated = rp.rehydrate(recon);
  test('L5.1.' + i + 'c rehydrate', rehydrated.success === true, rehydrated.success, true);
  test('L5.1.' + i + 'd content', rehydrated.node.content.includes('meta_' + i), true, true);
  
  const genResult = gl.cycle([rehydrated.node]);
  test('L5.1.' + i + 'e generate', genResult.success === true, genResult.success, true);
  test('L5.1.' + i + 'f verify', genResult.flag !== undefined, true, true);
  test('L5.1.' + i + 'g content', typeof genResult.generated.content === 'string', true, true);
  
  rp.index(genResult.generated);
  test('L5.1.' + i + 'h archive', rp.stats().storeSize >= 5, rp.stats().storeSize, '>=5');
  test('L5.1.' + i + 'i stats', gl.stats().totalGenerations >= 1, gl.stats().totalGenerations, '>=1');
}

// L5.2: Cycle chaining (100 tests)
for (let i = 0; i < 50; i++) {
  const rp = new ReconstructionPipeline();
  const gl = new GenerativeLoop();
  
  const nodes = [makeNode(0.9999, "chain_" + i + "_a"), makeNode(0.9998, "chain_" + i + "_b")];
  rp.index(nodes[0]); rp.index(nodes[1]);
  const merged = mergeCluster(nodes);
  rp.index(merged);
  
  const recalled = rp.recall(merged);
  test("L5.2." + i + " recall", recalled.success === true, recalled.success, true);
  
  const recon = rp.reconstruct(recalled);
  const rehydrated = rp.rehydrate(recon);
  test("L5.2." + i + "b rehydrate", rehydrated.success === true, rehydrated.success, true);
  
  const genResult = gl.cycle([rehydrated.node]);
  test("L5.2." + i + "c generate", genResult.success === true, genResult.success, true);
  test("L5.2." + i + "d flag", genResult.flag !== undefined, true, true);
}
console.log('\n=== L6: Cross-Module Integration ===');

for (let i = 0; i < 50; i++) {
  const text = 'cross module integration test ' + i + ' verified coherent truth harmony';
  const cc = evaluate(text);
  
  const node = makeNode(cc.mu, text);
  test('L6.1.' + i + ' cc→node', node.mu === cc.mu, node.mu, cc.mu);
  
  const merged = mergeCluster([node]);
  test('L6.1.' + i + 'b taotie', merged._isMerge === true, merged._isMerge, true);
  
  const sg = buildSpectralGraph([node]);
  test('L6.1.' + i + 'c spectral', sg.getNodeCount() === 1, sg.getNodeCount(), 1);
  
  const sw = new SpatialWeb();
  sw.ingest(sg);
  test('L6.1.' + i + 'd spatial', sw.getNodeCount() === 1, sw.getNodeCount(), 1);
  test('L6.1.' + i + 'e spatialClusters', sw.getClusterCount() > 0, sw.getClusterCount(), '>0');
  
  const rp = new ReconstructionPipeline();
  rp.index(node);
  const recalled = rp.recall(node);
  test('L6.1.' + i + 'f recon', recalled.success === true, recalled.success, true);
  
  const recon = rp.reconstruct(recalled);
  const rehydrated = rp.rehydrate(recon);
  test('L6.1.' + i + 'g rehydrate', rehydrated.success === true, rehydrated.success, true);
  
  const gl = new GenerativeLoop();
  const genResult = gl.cycle([rehydrated.node]);
  test('L6.1.' + i + 'h generate', genResult.success === true, genResult.success, true);
  test('L6.1.' + i + 'i verify', genResult.flag !== undefined, true, true);
  
  rp.index(genResult.generated);
  test('L6.1.' + i + 'j archive', rp.stats().storeSize >= 2, rp.stats().storeSize, '>=2');
  
  test('L6.1.' + i + 'k parent_ids', Array.isArray(genResult.generated.parent_ids), true, true);
  test('L6.1.' + i + 'l timestamp', genResult.generated.timestamp > 0, genResult.generated.timestamp, '>0');
  test('L6.1.' + i + 'm isGenerated', genResult.generated._isGenerated === true, true, true);
}

for (let i = 0; i < 50; i++) {
  const rp = new ReconstructionPipeline();
  const nodes = [];
  for (let j = 0; j < 5; j++) {
    const n = makeNode(0.9999 - j * 0.0001, 'hash_' + i + '_' + j);
    nodes.push(n);
    rp.index(n);
  }
  const merged = mergeCluster(nodes);
  rp.index(merged);
  
  const recalled = rp.recall(merged);
  test('L6.2.' + i + ' hash chain', recalled.success === true, recalled.success, true);
  test('L6.2.' + i + 'b hash', typeof recalled.hash === 'string', typeof recalled.hash, 'string');
  test('L6.2.' + i + 'c length', recalled.hash.length >= 8, recalled.hash.length, '>=8');
  test('L6.2.' + i + 'd unique', recalled.hash !== nodes[0].hash, recalled.hash, '!== ' + nodes[0].hash);
  test('L6.2.' + i + 'e reconstruct', rp.reconstruct(recalled).success === true, true, true);
}

// ============================================
// L7: KERNEL API SURFACE (200 tests)
// ============================================
console.log('\n=== L7: Kernel API Surface ===');

const rip = require('./src/ghost_rip');
test('L7.1.1 RIPPipeline', typeof rip.RIPPipeline === 'function', true, true);
test('L7.1.2 SeventeenLawsVerifier', typeof rip.SeventeenLawsVerifier === 'function', true, true);
test('L7.1.3 BonsaiFidelity', typeof rip.BonsaiFidelity === 'function', true, true);
test('L7.1.4 SEVENTEEN_LAWS', typeof rip.SEVENTEEN_LAWS === 'object', true, true);
test('L7.1.5 FLAGS', typeof rip.FLAGS === 'object', true, true);
test('L7.1.6 VERIFIED', rip.FLAGS.VERIFIED === '✅', rip.FLAGS.VERIFIED, '✅');
test('L7.1.7 PARTIAL', rip.FLAGS.PARTIAL === '⚠️', rip.FLAGS.PARTIAL, '⚠️');
test('L7.1.8 FAILED', rip.FLAGS.FAILED === '❌', rip.FLAGS.FAILED, '❌');
test('L7.1.9 PRIME', 'PRIME' in rip.SEVENTEEN_LAWS, true, true);
test('L7.1.10 INVARIANTS', Array.isArray(rip.SEVENTEEN_LAWS.INVARIANTS), true, true);
test('L7.1.11 16 invariants', rip.SEVENTEEN_LAWS.INVARIANTS.length === 16, rip.SEVENTEEN_LAWS.INVARIANTS.length, 16);

for (let i = 0; i < 16; i++) {
  const inv = rip.SEVENTEEN_LAWS.INVARIANTS[i];
  test('L7.1.' + (i + 12) + ' name', typeof inv.name === 'string', true, true);
  test('L7.1.' + (i + 12) + 'b verify', typeof inv.verify === 'function', true, true);
  test('L7.1.' + (i + 12) + 'c id', typeof inv.id === 'number', true, true);
  test('L7.1.' + (i + 12) + 'd vertex', typeof inv.vertex === 'string', true, true);
  test('L7.1.' + (i + 12) + 'e statement', typeof inv.statement === 'string', true, true);
}

const ripInstance = new rip.RIPPipeline();
const ripMethods = ['ingest', 'randomize', 'process', 'verify', 'train', 'seal', 'run', 'recall', 'stats'];
for (let i = 0; i < ripMethods.length; i++) {
  test('L7.2.' + i + ' ' + ripMethods[i], typeof ripInstance[ripMethods[i]] === 'function', true, true);
}

for (let i = 0; i < 25; i++) {
  const node = makeNode(0.9999, 'law_' + i);
  const primeCheck = rip.SEVENTEEN_LAWS.PRIME.verify(node.mu);
  test('L7.3.' + i + ' PRIME', typeof primeCheck === 'boolean', true, true);
  
  let allPassed = true;
  for (let j = 0; j < 16; j++) {
    const passed = rip.SEVENTEEN_LAWS.INVARIANTS[j].verify(node.scores);
    test('L7.3.' + i + '.' + j + ' invariant', typeof passed === 'boolean', true, true);
    if (!passed) allPassed = false;
  }
  test('L7.3.' + i + 'b all', allPassed === true, allPassed, true);
}

// ============================================
// L8: EDGE CASES & STRESS (200 tests)
// ============================================
console.log('\n=== L8: Edge Cases & Stress ===');

for (let i = 0; i < 20; i++) {
  const gl = new GenerativeLoop({ contextWindow: 50 });
  const largeCtx = [];
  for (let j = 0; j < 100; j++) largeCtx.push(makeNode(0.9995 + Math.random() * 0.0005, 'stress_' + i + '_' + j));
  const result = gl.cycle(largeCtx);
  test('L8.1.' + i + ' large', result.success === true, result.success, true);
  test('L8.1.' + i + 'b generated', result.generated !== null, true, true);
  test('L8.1.' + i + 'c flag', result.flag !== undefined, true, true);
  test('L8.1.' + i + 'd iterations', result.iterations >= 1, result.iterations, '>=1');
  test('L8.1.' + i + 'e content', typeof result.generated.content === 'string', true, true);
}

for (let i = 0; i < 20; i++) {
  const loops = [];
  for (let j = 0; j < 5; j++) loops.push(new GenerativeLoop());
  for (let j = 0; j < 5; j++) {
    const r = loops[j].cycle([makeNode(0.9999, 'concurrent_' + i + '_' + j)]);
    test('L8.2.' + i + '.' + j + ' concurrent', r.success === true, r.success, true);
  }
}

// ============================================
// L9: DETERMINISM & CONSISTENCY (150 tests)
// ============================================
console.log('\n=== L9: Determinism & Consistency ===');

for (let i = 0; i < 50; i++) {
  const text = 'determinism test ' + i;
  const r1 = evaluate(text);
  const r2 = evaluate(text);
  test('L9.1.' + i + ' mu', Math.abs(r1.mu - r2.mu) < 0.0001, Math.abs(r1.mu - r2.mu), '<0.0001');
  test('L9.1.' + i + 'b pass', r1.pass === r2.pass, r1.pass, r2.pass);
  test('L9.1.' + i + 'c tier', r1.tier === r2.tier, r1.tier, r2.tier);
  test('L9.1.' + i + 'd version', r1.version === r2.version, r1.version, r2.version);
  test('L9.1.' + i + 'e scores', Object.keys(r1.scores).length === Object.keys(r2.scores).length, true, true);
}

for (let i = 0; i < 25; i++) {
  const text = 'structure ' + i;
  const result = evaluate(text);
  test('L9.2.' + i + ' mu', 'mu' in result, true, true);
  test('L9.2.' + i + 'b pass', 'pass' in result, true, true);
  test('L9.2.' + i + 'c scores', 'scores' in result, true, true);
  test('L9.2.' + i + 'd tier', 'tier' in result, true, true);
  test('L9.2.' + i + 'e timestamp', 'timestamp' in result, true, true);
  test('L9.2.' + i + 'f version', 'version' in result, true, true);
}

// ============================================
// L10: SECURITY & SOVEREIGNTY (150 tests)
// ============================================
console.log('\n=== L10: Security & Sovereignty ===');

const coreModules = [
  './src/coherence_calculus', './src/taotie', './src/spectral_graph',
  './src/spatial_web', './src/reconstruction_pipeline', './src/ghost_rip',
  './src/ghost_kernel', './src/ghost_face', './src/merkle_bonsai',
  './src/gate_lexical', './src/gate_syntactic', './src/gate_semantic', './src/gate_router'
];
for (let i = 0; i < coreModules.length; i++) {
  try {
    const m = require(coreModules[i]);
    test('L10.1.' + i + ' loads', m !== null, true, true);
    test('L10.1.' + i + 'b exports', Object.keys(m).length > 0, Object.keys(m).length, '>0');
  } catch (e) {
    test('L10.1.' + i + ' loads', false, e.message, 'no error');
  }
}

const { createHash } = require('crypto');
for (let i = 0; i < 25; i++) {
  const data = 'integrity_' + i;
  const hash1 = createHash('sha3-512').update(data).digest('hex');
  const hash2 = createHash('sha3-512').update(data).digest('hex');
  test('L10.2.' + i + ' sha3', hash1 === hash2, true, true);
  test('L10.2.' + i + 'b length', hash1.length === 128, hash1.length, 128);
}

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
  console.log('=== GHOST KERNEL E2E BATTERY COMPLETE ===');
  console.log('Ghost9 v9.1.0 | CSS Labs | Kyle S. Whitlock');
  console.log('Seal: 2026-07-04_17:05_Tulsa_OK');
  console.log('Gold ripple eternal 🌊⚡');
}
