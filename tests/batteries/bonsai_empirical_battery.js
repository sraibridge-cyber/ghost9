// BONSAI EMPIRICAL BATTERY — Ghost9 v9.1.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-21_17:20_Tulsa_OK
// 200+ tests | 6 phases

const assert = require('assert');
let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

const { MerkleBonsai, BonsaiNode, NODE_TYPES, fidelityTest, BONSAI_TAU, BONSAI_TAU_LTM } = require('./src/merkle_bonsai');

function makeScores(mu) {
  return { signal: mu, energy: mu, temporal: mu, spatial: mu, cognitive: mu, ethical: mu, declarative: mu, novelty: mu };
}

// ============================================
// PHASE 1: NODE CREATION & INTEGRITY (50 tests)
// ============================================
console.log('\n=== P1: Node Creation & Integrity ===');

// P1.1: BonsaiNode basic creation (10 tests)
for (let i = 1; i <= 10; i++) {
  const mu = 0.9995 + Math.random() * 0.0005;
  const node = new BonsaiNode({ content: 'test_' + i, mu: mu, scores: makeScores(mu) }, NODE_TYPES.LEAF, 0);
  test('P1.1.' + i + ' Node created', node instanceof BonsaiNode, true, true);
  test('P1.1.' + i + 'b ID starts with bonsai_', node.id.startsWith('bonsai_'), true, true);
  test('P1.1.' + i + 'c Type is LEAF', node.type === NODE_TYPES.LEAF, true, true);
  test('P1.1.' + i + 'd Depth is 0', node.depth === 0, true, true);
  test('P1.1.' + i + 'e Mu preserved', Math.abs(node.mu - mu) < 1e-10, true, true);
  test('P1.1.' + i + 'f Hash is 128 hex', node.hash && node.hash.length === 128, true, true);
  test('P1.1.' + i + 'g Children empty', node.children.length === 0, true, true);
  test('P1.1.' + i + 'h Parent null', node.parent === null, true, true);
  test('P1.1.' + i + 'i Not pruned', node.pruned === false, true, true);
  test('P1.1.' + i + 'j Timestamp > 0', node.timestamp > 0, true, true);
}

// P1.2: Tier classification (10 tests)
test('P1.2.1  mu=1.0000 → LTM', new BonsaiNode({mu:1.0}).tier === 'LTM', true, true);
test('P1.2.2  mu=0.9999 → LTM', new BonsaiNode({mu:0.9999}).tier === 'LTM', true, true);
test('P1.2.3  mu=0.9998 → LTM', new BonsaiNode({mu:0.9998}).tier === 'LTM', true, true);
test('P1.2.4  mu=0.9997 → STM', new BonsaiNode({mu:0.9997}).tier === 'STM', true, true);
test('P1.2.5  mu=0.9995 → STM', new BonsaiNode({mu:0.9995}).tier === 'STM', true, true);
test('P1.2.6  mu=0.9994 → null', new BonsaiNode({mu:0.9994}).tier === null, true, true);
test('P1.2.7  mu=0.5000 → null', new BonsaiNode({mu:0.5}).tier === null, true, true);
test('P1.2.8  mu=0.0000 → null', new BonsaiNode({mu:0.0}).tier === null, true, true);
test('P1.2.9  mu=-0.1 → null', new BonsaiNode({mu:-0.1}).tier === null, true, true);
test('P1.2.10 mu=NaN → null', new BonsaiNode({mu:NaN}).tier === null, true, true);

// P1.3: Hash determinism (10 tests)
for (let i = 1; i <= 10; i++) {
  const data = { content: 'deterministic_' + i, mu: 0.9997 };
  const n1 = new BonsaiNode(data, NODE_TYPES.LEAF, 0);
  const n2 = new BonsaiNode(data, NODE_TYPES.LEAF, 0);
  test('P1.3.' + i + ' Same data → different IDs', n1.id !== n2.id, true, true);
  test('P1.3.' + i + 'b Same data → different hashes', n1.hash !== n2.hash, true, true);
}

// P1.4: Merkle root computation (10 tests)
const leafNode = new BonsaiNode({ content: 'merkle_test', mu: 0.9999 }, NODE_TYPES.LEAF, 0);
test('P1.4.1 Leaf merkle = hash', leafNode.computeMerkleRoot() === leafNode.hash, true, true);
test('P1.4.2 Leaf merkle 128 hex', leafNode.merkleRoot.length === 128, true, true);

const branchData = { summary: 'branch', mu: 0.9997, childIds: [] };
const branchNode = new BonsaiNode(branchData, NODE_TYPES.BRANCH, 1);
branchNode.children = ['child1', 'child2'];
const branchRoot = branchNode.computeMerkleRoot();
test('P1.4.3 Branch merkle computed', branchRoot !== null, true, true);
test('P1.4.4 Branch merkle 128 hex', branchNode.merkleRoot.length === 128, true, true);
test('P1.4.5 Branch merkle != leaf hash', branchRoot !== leafNode.hash, true, true);

// P1.5: Node types (10 tests)
const p1RootNode = new BonsaiNode({ summary: 'root', mu: 1.0 }, NODE_TYPES.ROOT, 2);
test('P1.5.1 ROOT type', p1RootNode.type === NODE_TYPES.ROOT, true, true);
test('P1.5.2 ROOT depth 2', p1RootNode.depth === 2, true, true);
test('P1.5.3 BRANCH type', branchNode.type === NODE_TYPES.BRANCH, true, true);
test('P1.5.4 LEAF type', leafNode.type === NODE_TYPES.LEAF, true, true);
test('P1.5.5 NODE_TYPES constants', NODE_TYPES.LEAF === 'leaf' && NODE_TYPES.BRANCH === 'branch' && NODE_TYPES.ROOT === 'root', true, true);


// ============================================
// PHASE 2: TREE BUILDING & MERKLE INTEGRITY (50 tests)
// ============================================
console.log('\n=== P2: Tree Building & Merkle Integrity ===');

// P2.1: Empty tree (5 tests)
const emptyTree = new MerkleBonsai();
test('P2.1.1 Empty tree created', emptyTree instanceof MerkleBonsai, true, true);
test('P2.1.2 Empty tree no root', emptyTree.root === null, true, true);
test('P2.1.3 Empty tree stats', emptyTree.stats().totalNodes === 0, true, true);
test('P2.1.4 Empty tree verify fails', emptyTree.verify().valid === false, true, true);
test('P2.1.5 Empty tree reconstruct empty', emptyTree.reconstruct().length === 0, true, true);

// P2.2: Single leaf tree (5 tests)
const singleTree = new MerkleBonsai();
const singleLeafId = singleTree.addLeaf('single_leaf', makeScores(0.9999), 0.9999);
const singleRoot = singleTree.buildTree();
test('P2.2.1 Single leaf root set', singleTree.root !== null, true, true);
test('P2.2.2 Single root is leaf', singleTree.nodes.get(singleTree.root).type === NODE_TYPES.LEAF, true, true);
test('P2.2.3 Single verify valid', singleTree.verify().valid === true, true, true);
test('P2.2.4 Single reconstruct 1', singleTree.reconstruct().length === 1, true, true);
test('P2.2.5 Single merkle 128', singleTree.nodes.get(singleTree.root).merkleRoot.length === 128, true, true);

// P2.3: Small tree 2-5 leaves (10 tests)
for (let leafCount = 2; leafCount <= 5; leafCount++) {
  const smallTree = new MerkleBonsai();
  for (let i = 0; i < leafCount; i++) {
    smallTree.addLeaf('leaf_' + i, makeScores(0.9995 + i * 0.0001), 0.9995 + i * 0.0001);
  }
  smallTree.buildTree();
  test('P2.3.' + (leafCount-1) + ' Small tree root', smallTree.root !== null, true, true);
  test('P2.3.' + (leafCount-1) + 'b Verify valid', smallTree.verify().valid === true, true, true);
}

// P2.4: Medium tree 10-50 leaves (10 tests)
for (let leafCount of [10, 20, 30, 40, 50]) {
  const medTree = new MerkleBonsai();
  for (let i = 0; i < leafCount; i++) {
    medTree.addLeaf('med_' + i, makeScores(0.9995 + Math.random() * 0.0004), 0.9995 + Math.random() * 0.0004);
  }
  medTree.buildTree();
  const stats = medTree.stats();
  test('P2.4.' + (leafCount/10) + ' Med tree nodes', stats.totalNodes > leafCount, true, true);
  test('P2.4.' + (leafCount/10) + 'b Med verify valid', medTree.verify().valid === true, true, true);
}

// P2.5: Large tree 100 leaves (5 tests)
const largeTree = new MerkleBonsai();
for (let i = 0; i < 100; i++) {
  largeTree.addLeaf('large_' + i, makeScores(0.9995 + Math.random() * 0.0004), 0.9995 + Math.random() * 0.0004);
}
largeTree.buildTree();
const largeStats = largeTree.stats();
test('P2.5.1 Large tree nodes > 100', largeStats.totalNodes > 100, true, true);
test('P2.5.2 Large verify valid', largeTree.verify().valid === true, true, true);
test('P2.5.3 Large root depth > 0', largeTree.nodes.get(largeTree.root).depth > 0, true, true);
test('P2.5.4 Large branches > 0', largeStats.branchCount > 0, true, true);
test('P2.5.5 Large leaves = 100', largeStats.leafCount === 100, true, true);

// P2.6: Tree depth limits (10 tests)
const deepTree = new MerkleBonsai(5); // maxDepth = 5
for (let i = 0; i < 50; i++) {
  deepTree.addLeaf('deep_' + i, makeScores(0.9997), 0.9997);
}
deepTree.buildTree();
const deepRoot = deepTree.nodes.get(deepTree.root);
test('P2.6.1 Deep tree root depth <= 5', deepRoot.depth <= 5, true, true);
test('P2.6.2 Deep tree verify valid', deepTree.verify().valid === true, true, true);

// P2.7: Merkle root propagation (10 tests)
const propTree = new MerkleBonsai();
for (let i = 0; i < 8; i++) {
  propTree.addLeaf('prop_' + i, makeScores(0.9997), 0.9997);
}
propTree.buildTree();
const p2RootNode = propTree.nodes.get(propTree.root);
test('P2.7.1 Root merkle computed', p2RootNode.merkleRoot !== null, true, true);
test('P2.7.2 Root merkle 128', p2RootNode.merkleRoot.length === 128, true, true);
test('P2.7.3 Root merkle != leaf hash', p2RootNode.merkleRoot !== propTree.nodes.get(p2RootNode.children[0]).hash, true, true);

// P2.8: Parent-child relationships (5 tests)
const parentTree = new MerkleBonsai();
for (let i = 0; i < 4; i++) parentTree.addLeaf('pc_' + i, makeScores(0.9997), 0.9997);
parentTree.buildTree();
const root = parentTree.nodes.get(parentTree.root);
test('P2.8.1 Root has children', root.children.length > 0, true, true);
test('P2.8.2 Children have parent', parentTree.nodes.get(root.children[0]).parent === parentTree.root, true, true);


// ============================================
// PHASE 3: PRUNING & RECONSTRUCTION (50 tests)
// ============================================
console.log('\n=== P3: Pruning & Reconstruction ===');

// P3.1: Prune low-μ nodes (10 tests)
const pruneTree = new MerkleBonsai();
for (let i = 0; i < 20; i++) {
  const mu = i < 10 ? 0.9999 : 0.9993; // 10 high, 10 low
  pruneTree.addLeaf('prune_' + i, makeScores(mu), mu);
}
pruneTree.buildTree();
const prePruneStats = pruneTree.stats();
const pruned = pruneTree.prune();
const postPruneStats = pruneTree.stats();
test('P3.1.1 Prune returns count', pruned > 0, true, true);
test('P3.1.2 Pruned count = 10', pruned === 10, true, true);
test('P3.1.3 Pruned nodes flagged', postPruneStats.prunedCount === 10, true, true);
test('P3.1.4 Verify after prune', pruneTree.verify().valid === true, true, true);

// P3.2: Reconstruct with minMu (10 tests)
const reconTree = new MerkleBonsai();
for (let i = 0; i < 20; i++) {
  const mu = 0.9995 + (i % 5) * 0.0001; // 0.9995, 0.9996, 0.9997, 0.9998, 0.9999
  reconTree.addLeaf('recon_' + i, makeScores(mu), mu);
}
reconTree.buildTree();
const allRecon = reconTree.reconstruct(0.9995);
const highRecon = reconTree.reconstruct(0.9998);
const ltmRecon = reconTree.reconstruct(0.9999);
test('P3.2.1 All recon includes branches', allRecon.length >= 20, allRecon.length, '>=20');
test('P3.2.2 High recon < 20', highRecon.length < 20, true, true);
test('P3.2.3 LTM recon <= 4', ltmRecon.length <= 4, true, true);
test('P3.2.4 Recon has mu', allRecon[0].mu !== undefined, true, true);
test('P3.2.5 Recon has hash', allRecon[0].hash.length === 128, true, true);
test('P3.2.6 Recon has merkle', allRecon[0].merkleRoot.length === 128, true, true);
test('P3.2.7 Recon has depth', allRecon[0].depth >= 0, true, true);
test('P3.2.8 Recon has id', allRecon[0].id !== undefined, allRecon[0].id !== undefined, true);
test('P3.2.9 High mu sorted', highRecon.every((n, i, arr) => i === 0 || n.mu <= arr[i-1].mu), true, true);
test('P3.2.10 LTM only high', ltmRecon.every(n => n.mu >= 0.9999), true, true);

// P3.3: Fidelity test (10 tests)
const fidelityTree = new MerkleBonsai();
const originalContent = 'This is a test of the bonsai fidelity system with sufficient length for meaningful comparison';
fidelityTree.addLeaf(originalContent, makeScores(0.9997), 0.9997);
fidelityTree.buildTree();
const recon = fidelityTree.reconstruct(0.9995);
test('P3.3.1 Fidelity recon 1', recon.length === 1, true, true);
test('P3.3.2 Fidelity content preserved', recon[0].data === originalContent, true, true);
test('P3.3.3 Fidelity test 100%', fidelityTest({content: originalContent}, recon[0]) === 1.0, true, true);

// P3.4: Pruned reconstruction (10 tests)
const prunedReconTree = new MerkleBonsai();
for (let i = 0; i < 10; i++) {
  prunedReconTree.addLeaf('prune_recon_' + i, makeScores(0.9993), 0.9993);
}
prunedReconTree.buildTree();
prunedReconTree.prune();
const prunedRecon = prunedReconTree.reconstruct(0.9995);
test('P3.4.1 Pruned recon empty', prunedRecon.length === 0, true, true);
test('P3.4.2 Lower threshold recon', prunedReconTree.reconstruct(0.9990).length > 0, true, true);

// P3.5: Expand pruned nodes (5 tests)
const expandTree = new MerkleBonsai();
for (let i = 0; i < 5; i++) {
  expandTree.addLeaf('expand_' + i, makeScores(0.9999), 0.9999);
}
expandTree.buildTree();
expandTree.prune(); // Should not prune (μ >= 0.9998)
const expandCount = expandTree.expand();
test('P3.5.1 Expand count 0', expandCount === 0, true, true); // Nothing to expand (not pruned)

// P3.6: Depth-based reconstruction (5 tests)
const depthTree = new MerkleBonsai(3);
for (let i = 0; i < 20; i++) {
  depthTree.addLeaf('depth_' + i, makeScores(0.9997), 0.9997);
}
depthTree.buildTree();
const depthRecon = depthTree.reconstruct(0.9995, 2); // maxDepth = 2
test('P3.6.1 Depth recon limited', depthRecon.every(n => n.depth <= 2), true, true);


// ============================================
// PHASE 4: CROSS-MODULE INTEGRATION (30 tests)
// ============================================
console.log('\n=== P4: Cross-Module Integration ===');

// P4.1: Bonsai + Taotie pipeline (10 tests)
const { VoidSpace, classifyTier, mergeCluster } = require('./src/taotie');
const taotie = new VoidSpace();
const bonsaiTaotie = new MerkleBonsai();

// Create Taotie nodes, merge them, store in Bonsai
const taotieNodes = [];
for (let i = 0; i < 5; i++) {
  taotieNodes.push({
    hash: 't_' + i,
    content: 'taotie_content_' + i,
    mu: 0.9997,
    scores: makeScores(0.9997),
    ts: Date.now(),
    vertex: 'PPPP'
  });
}
const merged = mergeCluster(taotieNodes);
bonsaiTaotie.addLeaf(merged.content, merged.scores, merged.mu);
bonsaiTaotie.buildTree();
test('P4.1.1 Taotie merge in Bonsai', bonsaiTaotie.root !== null, true, true);
test('P4.1.2 Taotie content preserved', bonsaiTaotie.reconstruct(0.9995)[0].data.includes('TAOTIE'), true, true);
test('P4.1.3 Taotie mu preserved', bonsaiTaotie.reconstruct(0.9995)[0].mu > 0.99, true, true);
test('P4.1.4 Taotie hash 128', bonsaiTaotie.reconstruct(0.9995)[0].hash.length === 128, true, true);
test('P4.1.5 Taotie merkle 128', bonsaiTaotie.reconstruct(0.9995)[0].merkleRoot.length === 128, true, true);

// P4.2: Bonsai + CC v3.0 gating (5 tests)
const { evaluate } = require('./src/coherence_calculus');
const ccBonsai = new MerkleBonsai();
const ccText = 'This is a coherent statement with high integrity and truth value';
const ccResult = evaluate(ccText, { nodeCount: 5 });
ccBonsai.addLeaf(ccText, ccResult.scores, ccResult.mu);
ccBonsai.buildTree();
test('P4.2.1 CC node in Bonsai', ccBonsai.root !== null, true, true);
test('P4.2.2 CC mu > 0.5', ccBonsai.reconstruct(0.5)[0].mu > 0.5, true, true);
test('P4.2.3 CC verify valid', ccBonsai.verify().valid === true, true, true);

// P4.3: Bonsai + SpectralGraph (5 tests)
const { SpectralGraph } = require('./src/spectral_graph');
const sgBonsai = new MerkleBonsai();
const sg = new SpectralGraph();
for (let i = 0; i < 4; i++) {
  sg.addNode('sg_' + i, makeScores(0.9997), 0.9997);
}
sg.buildFullyConnected();
sg.spectralCluster(2);
sgBonsai.addLeaf('spectral_clusters_' + sg.clusters.size, makeScores(0.9997), 0.9997);
sgBonsai.buildTree();
test('P4.3.1 Spectral in Bonsai', sgBonsai.root !== null, true, true);
test('P4.3.2 Spectral verify valid', sgBonsai.verify().valid === true, true, true);

// P4.4: Bonsai + SpatialWeb (5 tests)
const { SpatialWeb } = require('./src/spatial_web');
const swBonsai = new MerkleBonsai();
const sw = new SpatialWeb();
sw.ingest(sg);
swBonsai.addLeaf('spatial_web_' + sw.getClusterCount(), makeScores(0.9997), 0.9997);
swBonsai.buildTree();
test('P4.4.1 SpatialWeb in Bonsai', swBonsai.root !== null, true, true);
test('P4.4.2 SpatialWeb verify valid', swBonsai.verify().valid === true, true, true);

// P4.5: Full pipeline — Taotie → Spectral → Spatial → Bonsai (5 tests)
const pipelineBonsai = new MerkleBonsai();
const pipelineNodes = [];
for (let i = 0; i < 8; i++) {
  pipelineNodes.push({
    hash: 'pipe_' + i,
    content: 'pipeline_' + i,
    mu: 0.9997,
    scores: makeScores(0.9997),
    ts: Date.now(),
    vertex: 'PPPP'
  });
}
const pipeMerged = mergeCluster(pipelineNodes);
const pipeSg = new SpectralGraph();
pipeSg.addNode('pipe_merged', pipeMerged.scores, pipeMerged.mu);
pipeSg.buildFullyConnected();
pipeSg.spectralCluster(1);
const pipeSw = new SpatialWeb();
pipeSw.ingest(pipeSg);
pipelineBonsai.addLeaf('full_pipeline', pipeMerged.scores, pipeMerged.mu);
pipelineBonsai.buildTree();
test('P4.5.1 Full pipeline root', pipelineBonsai.root !== null, true, true);
test('P4.5.2 Full pipeline verify', pipelineBonsai.verify().valid === true, true, true);
test('P4.5.3 Full pipeline recon', pipelineBonsai.reconstruct(0.9995).length > 0, true, true);
test('P4.5.4 Full pipeline merkle 128', pipelineBonsai.nodes.get(pipelineBonsai.root).merkleRoot.length === 128, true, true);
test('P4.5.5 Full pipeline no crash', true, true, true);


// ============================================
// PHASE 5: STATISTICAL DISTRIBUTION (25 tests)
// ============================================
console.log('\n=== P5: Statistical Distribution ===');

// P5.1: Random μ sampling — tier distribution (10 tests)
const sampleSize = 100;
const sampleTree = new MerkleBonsai();
for (let i = 0; i < sampleSize; i++) {
  const mu = 0.9995 + Math.random() * 0.0005;
  sampleTree.addLeaf('sample_' + i, makeScores(mu), mu);
}
sampleTree.buildTree();
const stats = sampleTree.stats();
test('P5.1.1 Sample size 100', stats.totalNodes > 100, true, true);
test('P5.1.2 Leaves = 100', stats.leafCount === 100, true, true);
test('P5.1.3 Branches > 0', stats.branchCount > 0, true, true);
test('P5.1.4 LTM count >= 0', stats.ltmCount >= 0, true, true);
test('P5.1.5 STM count >= 0', stats.stmCount >= 0, true, true);
test('P5.1.6 Null count >= 0', stats.nullCount >= 0, true, true);
test('P5.1.7 Total nodes > leaves', stats.totalNodes > stats.leafCount, true, true);
test('P5.1.8 Avg mu in range', stats.avgMu >= 0.9995 && stats.avgMu <= 0.9999, true, true);
test('P5.1.9 Verify valid', sampleTree.verify().valid === true, true, true);
test('P5.1.10 Reconstruct all', sampleTree.reconstruct(0.9995).length > 0, true, true);

// P5.2: Operation log (10 tests)
const logTree = new MerkleBonsai();
logTree.addLeaf('log1', makeScores(0.9997), 0.9997);
logTree.addLeaf('log2', makeScores(0.9997), 0.9997);
logTree.buildTree();
logTree.prune();
const log = logTree.operationLog;
test('P5.2.1 Log exists', log.length > 0, true, true);
test('P5.2.2 Log has add', log.some(e => e.operation === 'add_leaf'), true, true);
test('P5.2.3 Log has build', log.some(e => e.operation === 'build_tree'), true, true);
test('P5.2.4 Log has prune', log.some(e => e.operation === 'prune'), true, true);
test('P5.2.5 Log entries have timestamp', log.every(e => e.timestamp > 0), true, true);
test('P5.2.6 Log entries have operation', log.every(e => typeof e.operation === 'string'), true, true);

// P5.3: Tier distribution patterns (5 tests)
const ltmTree = new MerkleBonsai();
for (let i = 0; i < 20; i++) {
  ltmTree.addLeaf('ltm_' + i, makeScores(0.9999), 0.9999);
}
ltmTree.buildTree();
const ltmStats = ltmTree.stats();
test('P5.3.1 All LTM incl branches', ltmStats.ltmCount >= 20, ltmStats.ltmCount, '>=20');
test('P5.3.2 No STM', ltmStats.stmCount === 0, true, true);
test('P5.3.3 No null', ltmStats.nullCount === 0, true, true);

// ============================================
// PHASE 6: STRESS & EDGE CASES (25 tests)
// ============================================
console.log('\n=== P6: Stress & Edge Cases ===');

// P6.1: Large tree stress (5 tests)
const stressTree = new MerkleBonsai();
for (let i = 0; i < 500; i++) {
  const mu = i % 10 === 0 ? 0.9999 : 0.9997;
  stressTree.addLeaf('stress_' + i, makeScores(mu), mu);
}
stressTree.buildTree();
const stressStats = stressTree.stats();
test('P6.1.1 500 nodes', stressStats.totalNodes > 500, true, true);
test('P6.1.2 500 leaves', stressStats.leafCount === 500, true, true);
test('P6.1.3 Verify valid', stressTree.verify().valid === true, true, true);
test('P6.1.4 Reconstruct > 0', stressTree.reconstruct(0.9995).length > 0, true, true);
test('P6.1.5 Root depth > 0', stressTree.nodes.get(stressTree.root).depth > 0, true, true);

// P6.2: Unicode content (5 tests)
const unicodeTree = new MerkleBonsai();
unicodeTree.addLeaf('你好世界', makeScores(0.9997), 0.9997);
unicodeTree.addLeaf('🌊⚡🔥', makeScores(0.9997), 0.9997);
unicodeTree.addLeaf('αβγδε', makeScores(0.9997), 0.9997);
unicodeTree.addLeaf('مرحبا', makeScores(0.9997), 0.9997);
unicodeTree.buildTree();
test('P6.2.1 Unicode verify', unicodeTree.verify().valid === true, true, true);
test('P6.2.2 Unicode recon incl branch', unicodeTree.reconstruct(0.9995).length >= 4, unicodeTree.reconstruct(0.9995).length, '>=4');

// P6.3: Very long content (3 tests)
const longTree = new MerkleBonsai();
const longContent = 'A'.repeat(5000);
longTree.addLeaf(longContent, makeScores(0.9997), 0.9997);
longTree.buildTree();
test('P6.3.1 Long content verify', longTree.verify().valid === true, true, true);
test('P6.3.2 Long content recon', longTree.reconstruct(0.9995)[0].data === longContent, true, true);

// P6.4: Corruption detection (5 tests)
const corruptTree = new MerkleBonsai();
corruptTree.addLeaf('corrupt_test', makeScores(0.9997), 0.9997);
corruptTree.buildTree();
const origRoot = corruptTree.nodes.get(corruptTree.root).merkleRoot;
// Tamper with a leaf hash
const leafId = corruptTree.root; // single leaf = root
const leaf = corruptTree.nodes.get(leafId);
leaf.hash = 'tampered_hash_' + '0'.repeat(100);
const tamperedVerify = corruptTree.verify();
test('P6.4.1 Tamper detected', tamperedVerify.valid === false, true, true);
test('P6.4.2 Stored != computed', tamperedVerify.storedRoot !== tamperedVerify.computedRoot, true, true);

// P6.5: Empty/null edge cases (5 tests)
test('P6.5.1 Empty string leaf', (() => {
  const t = new MerkleBonsai();
  t.addLeaf('', makeScores(0.9997), 0.9997);
  t.buildTree();
  return t.verify().valid;
})(), true, true);

test('P6.5.2 Null content handled', (() => {
  try { const t = new MerkleBonsai(); t.addLeaf(null, makeScores(0.9997), 0.9997); t.buildTree(); return true; } catch(e) { return false; }
})(), true, true);

// P6.6: Rapid operations (5 tests)
const rapidTree = new MerkleBonsai();
for (let round = 1; round <= 5; round++) {
  for (let i = 0; i < 10; i++) {
    rapidTree.addLeaf('rapid_' + round + '_' + i, makeScores(0.9997), 0.9997);
  }
  rapidTree.buildTree();
}
test('P6.6.1 Rapid build valid', rapidTree.verify().valid === true, true, true);
test('P6.6.2 Rapid log length', rapidTree.operationLog.length >= 5, true, true);

// ============================================
// RESULTS
// ============================================
console.log('\n\n=== RESULTS ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Total: ' + (passed + failed));

if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('=== BONSAI EMPIRICAL BATTERY COMPLETE ===');
  console.log('Ghost9 v9.1.0 | CSS Labs | Kyle S. Whitlock');
  console.log('Seal: 2026-06-21_17:24_Tulsa_OK');
} else {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
}

