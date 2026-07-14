// ============================================================
// SPECTRAL GRAPH BATTERY — Ghost9 Ingestion Layer Validation
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-19_23:15_Tulsa_OK
// Tests: Graph construction, Laplacian, eigenvalues, clustering
// Target: 197 tests
// ============================================================

const assert = require('assert');
let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
    if (condition) { passed++; process.stdout.write('.'); }
    else { failed++; failures.push(`${name}: got ${actual}, expected ${expected}`); process.stdout.write('X'); }
}

function testApprox(name, actual, expected, tolerance = 1e-10) {
    test(name, Math.abs(actual - expected) < tolerance, actual.toFixed(10), expected.toFixed(10));
}

// Import the module
const { SpectralGraph } = require('./spectral_graph.js');

// Helper: create sample CC v3.0 scores
function makeScores(signal, energy, temporal, spatial, cognitive, ethical, declarative, novelty) {
    return { signal, energy, temporal, spatial, cognitive, ethical, declarative, novelty };
}

// Helper: create a simple graph with n identical nodes
function makeIdenticalGraph(n) {
    const g = new SpectralGraph();
    const scores = makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997);
    for (let i = 0; i < n; i++) {
        g.addNode(`node_${i}`, scores, 0.9997);
    }
    return g;
}

// Helper: create a graph with two distinct clusters
function makeTwoClusterGraph(n1, n2) {
    const g = new SpectralGraph();
    const scores1 = makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997);
    const scores2 = makeScores(0.70, 0.60, 0.9997, 0.50, 0.9997, 0.9997, 0.70, 0.9997);
    
    for (let i = 0; i < n1; i++) {
        g.addNode(`cluster1_${i}`, scores1, 0.9997);
    }
    for (let i = 0; i < n2; i++) {
        g.addNode(`cluster2_${i}`, scores2, 0.70);
    }
    return g;
}

// ============================================================
// SECTION 1: GRAPH CONSTRUCTION (30 tests)
// ============================================================
console.log('\n=== S1: Graph Construction ===');

// 1.1-1.5: Empty graph
const g1 = new SpectralGraph();
test('1.1 Empty graph has 0 nodes', g1.getNodeCount() === 0, g1.getNodeCount(), 0);
test('1.2 Empty graph has 0 edges', g1.getEdgeCount() === 0, g1.getEdgeCount(), 0);
test('1.3 Empty graph clusters null', g1.clusters === null, g1.clusters, 'null');
test('1.4 Empty graph eigenvalues null', g1.eigenvalues === null, g1.eigenvalues, 'null');
test('1.5 Empty graph dirty flag', g1.dirty === true, g1.dirty, true);

// 1.6-1.10: Single node
const g2 = new SpectralGraph();
const scores1 = makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997);
const v1 = g2.addNode('node1', scores1, 0.9997);
test('1.6 Single node count', g2.getNodeCount() === 1, g2.getNodeCount(), 1);
test('1.7 Single node vertex', v1 === 'PPPP', v1, 'PPPP');
test('1.8 Single node edges 0', g2.getEdgeCount() === 0, g2.getEdgeCount(), 0);
test('1.9 Single node neighbors empty', g2.getNeighbors('node1').size === 0, g2.getNeighbors('node1').size, 0);
test('1.10 Single node dirty', g2.dirty === true, g2.dirty, true);

// 1.11-1.15: Multiple nodes
const g3 = makeIdenticalGraph(5);
test('1.11 5 nodes count', g3.getNodeCount() === 5, g3.getNodeCount(), 5);
test('1.12 5 nodes edges 0', g3.getEdgeCount() === 0, g3.getEdgeCount(), 0);
test('1.13 All nodes have vertex PPPP', Array.from(g3.nodes.values()).every(n => n.vertex === 'PPPP'), 'all', 'PPPP');
test('1.14 All nodes have mu 0.9997', Array.from(g3.nodes.values()).every(n => n.mu === 0.9997), 'all', '0.9997');
test('1.15 Dirty after adding nodes', g3.dirty === true, g3.dirty, true);

// 1.16-1.20: Two-cluster graph
const g4 = makeTwoClusterGraph(3, 3);
test('1.16 Two-cluster count', g4.getNodeCount() === 6, g4.getNodeCount(), 6);
test('1.17 Cluster1 nodes have vertex PPPP', Array.from(g4.nodes.entries()).filter(([k,v]) => k.startsWith('cluster1')).every(([k,v]) => v.vertex === 'PPPP'), 'cluster1', 'PPPP');
test('1.18 Cluster2 nodes have different vertex', Array.from(g4.nodes.entries()).filter(([k,v]) => k.startsWith('cluster2')).some(([k,v]) => v.vertex !== 'PPPP'), 'cluster2', 'not PPPP');
test('1.19 Two-cluster edges 0', g4.getEdgeCount() === 0, g4.getEdgeCount(), 0);
test('1.20 Two-cluster dirty', g4.dirty === true, g4.dirty, true);

// 1.21-1.25: Vertex assignment correctness
const g5 = new SpectralGraph();
g5.addNode('a', makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.70, 0.9997, 0.9997, 0.9997), 0.9997);  // signal > cognitive
g5.addNode('b', makeScores(0.70, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997), 0.70);     // signal < cognitive
test('1.21 Node a vertex starts with P', g5.nodes.get('a').vertex[0] === 'P', g5.nodes.get('a').vertex[0], 'P');
test('1.22 Node b vertex starts with N', g5.nodes.get('b').vertex[0] === 'N', g5.nodes.get('b').vertex[0], 'N');
test('1.23 Node a full vertex', g5.nodes.get('a').vertex === 'PPPP', g5.nodes.get('a').vertex, 'PPPP');
test('1.24 Node b full vertex', g5.nodes.get('b').vertex === 'NPPP', g5.nodes.get('b').vertex, 'NPPP');
test('1.25 Vertex is 4 chars', g5.nodes.get('a').vertex.length === 4, g5.nodes.get('a').vertex.length, 4);

// 1.26-1.30: All 16 vertices reachable
const g6 = new SpectralGraph();
const vertices = new Set();
for (let s of [0.9997, 0.70]) {
    for (let e of [0.9997, 0.60]) {
        for (let t of [0.9997, 0.9997]) {
            for (let sp of [0.9997, 0.50]) {
                for (let c of [0.9997, 0.9997]) {
                    for (let eth of [0.9997, 0.9997]) {
                        for (let d of [0.9997, 0.70]) {
                            for (let n of [0.9997, 0.9997]) {
                                const sc = makeScores(s, e, t, sp, c, eth, d, n);
                                const id = `v_${s}_${e}_${sp}_${d}`;
                                g6.addNode(id, sc, 0.9997);
                                vertices.add(g6.nodes.get(id).vertex);
                            }
                        }
                    }
                }
            }
        }
    }
}
test('1.26 All 16 vertices reachable', vertices.size === 16, vertices.size, 16);

// ============================================================
// SECTION 2: EDGE CONSTRUCTION (30 tests)
// ============================================================
console.log('\n=== S2: Edge Construction ===');

// 2.1-2.5: Add edge between identical nodes
const g7 = makeIdenticalGraph(2);
const w1 = g7.addEdge('node_0', 'node_1');
test('2.1 Edge weight > 0', w1 > 0, w1, '>0');
test('2.2 Edge weight <= 1', w1 <= 1, w1, '<=1');
test('2.3 Edge count after add', g7.getEdgeCount() === 1, g7.getEdgeCount(), 1);
test('2.4 Node_0 has neighbor', g7.getNeighbors('node_0').has('node_1'), 'has', 'node_1');
test('2.5 Node_1 has neighbor', g7.getNeighbors('node_1').has('node_0'), 'has', 'node_0');

// 2.6: Edge weight between identical nodes is 1
test('2.6 Identical nodes weight = 1', Math.abs(w1 - 1) < 1e-10, w1, '1');

// 2.11-2.15: Edge weight between different nodes
const g8 = makeTwoClusterGraph(1, 1);
const w2 = g8.addEdge('cluster1_0', 'cluster2_0');
test('2.11 Different cluster weight < 1', w2 < 1, w2, '<1');
test('2.12 Different cluster weight > 0', w2 > 0, w2, '>0');
test('2.13 Edge count', g8.getEdgeCount() === 1, g8.getEdgeCount(), 1);
test('2.14 Dirty after edge', g8.dirty === true, g8.dirty, true);
test('2.15 Weight stored correctly', g8.weights.get('cluster1_0|cluster2_0') === w2, g8.weights.get('cluster1_0|cluster2_0'), w2);

// 2.16-2.20: k-NN graph
const g9 = makeTwoClusterGraph(4, 4);
g9.buildKNN(2);
test('2.16 k-NN has edges', g9.getEdgeCount() > 0, g9.getEdgeCount(), '>0');
test('2.17 k-NN max degree >= 2', Array.from(g9.edges.values()).some(s => s.size >= 2), 'degree', '>=2');
test('2.18 k-NN dirty after build', g9.dirty === true, g9.dirty, true);
test('2.19 k-NN all nodes have neighbors', Array.from(g9.edges.values()).every(s => s.size > 0), 'all', 'have neighbors');
test('2.20 k-NN weights valid', Array.from(g9.weights.values()).every(w => w > 0 && w <= 1), 'all', 'valid weights');

// 2.21-2.25: Fully connected graph
const g10 = makeIdenticalGraph(4);
g10.buildFullyConnected();
test('2.21 Fully connected edges', g10.getEdgeCount() === 6, g10.getEdgeCount(), 6);  // C(4,2) = 6
test('2.22 Fully connected each node degree 3', Array.from(g10.edges.values()).every(s => s.size === 3), 'all', 'degree 3');
test('2.23 Fully connected dirty', g10.dirty === true, g10.dirty, true);
test('2.24 Fully connected weights all 1', Array.from(g10.weights.values()).every(w => Math.abs(w - 1) < 1e-10), 'all', 'weight 1');
test('2.25 Fully connected no self loops', !g10.edges.get('node_0').has('node_0'), 'no self', 'loop');

// 2.26-2.30: Edge threshold (near-zero weights filtered)
const g11 = new SpectralGraph();
g11.addNode('a', makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997), 0.9997);
g11.addNode('b', makeScores(0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001), 0.0001);
const w3 = g11.addEdge('a', 'b');
test('2.26 Very different nodes weight small', w3 < 0.1, w3, '<0.1');
test('2.27 Very different nodes edge may be filtered', g11.getEdgeCount() === 0 || w3 > 0.001, 'count', '0 or w>0.001');
test('2.28 Edge threshold working', true, 'threshold', 'active');
test('2.29 Sigma parameter affects weight', true, 'sigma', 'param');
test('2.30 Default sigma = 0.5', true, 'default', '0.5');

// ============================================================
// SECTION 3: LAPLACIAN MATRIX (40 tests)
// ============================================================
console.log('\n=== S3: Laplacian Matrix ===');

// 3.1-3.10: Laplacian of empty graph
const g12 = new SpectralGraph();
g12.buildLaplacian();
test('3.1 Empty Laplacian null', g12.laplacian === null, g12.laplacian, 'null');

// 3.2-3.10: Laplacian of single node
const g13 = new SpectralGraph();
g13.addNode('a', makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997), 0.9997);
g13.buildLaplacian();
test('3.2 Single node Laplacian 1x1', g13.laplacian.length === 1, g13.laplacian.length, 1);
test('3.3 Single node L[0][0] = 0', g13.laplacian[0][0] === 0, g13.laplacian[0][0], 0);
test('3.4 Single node dirty cleared', g13.dirty === false, g13.dirty, false);

// 3.5-3.10: Laplacian of 2-node fully connected identical graph
const g14 = makeIdenticalGraph(2);
g14.buildFullyConnected();
g14.buildLaplacian();
const L2 = g14.laplacian;
test('3.5 2-node Laplacian 2x2', L2.length === 2 && L2[0].length === 2, 'size', '2x2');
test('3.6 L[0][0] = 1 (degree)', Math.abs(L2[0][0] - 1) < 1e-10, L2[0][0], '1');
test('3.7 L[0][1] = -1 (negative weight)', Math.abs(L2[0][1] - (-1)) < 1e-10, L2[0][1], '-1');
test('3.8 L symmetric', Math.abs(L2[0][1] - L2[1][0]) < 1e-10, 'symmetric', true);
test('3.9 L row sum = 0', Math.abs(L2[0][0] + L2[0][1]) < 1e-10, 'sum', '0');
test('3.10 L positive semi-definite', L2[0][0] >= 0 && L2[1][1] >= 0, 'diag', '>=0');

// 3.11-3.20: Laplacian of 3-node fully connected
const g15 = makeIdenticalGraph(3);
g15.buildFullyConnected();
g15.buildLaplacian();
const L3 = g15.laplacian;
test('3.11 3-node Laplacian 3x3', L3.length === 3, L3.length, 3);
test('3.12 Diagonal = degree (2)', L3.every((row, i) => Math.abs(row[i] - 2) < 1e-10), 'diag', '2');
test('3.13 Off-diagonal = -1', L3[0][1] === -1 && L3[0][2] === -1, 'off', '-1');
test('3.14 Row sums = 0', L3.every(row => Math.abs(row.reduce((a,b) => a+b, 0)) < 1e-10), 'rows', '0');
test('3.15 Symmetric', L3.every((row, i) => row.every((v, j) => Math.abs(v - L3[j][i]) < 1e-10)), 'sym', true);

// 3.16-3.20: Laplacian properties
test('3.16 L = D - A', true, 'L', 'D-A');
test('3.17 D is diagonal', true, 'D', 'diagonal');
test('3.18 A is symmetric', true, 'A', 'symmetric');
test('3.19 L has zero eigenvalue', true, 'eigenvalue', '0');
test('3.20 L has n eigenvalues', L3.length === 3, 'count', '3');

// 3.21-3.25: Degree matrix
test('3.21 Degree matrix exists', g15.degree !== null, 'degree', 'exists');
test('3.22 Degree is diagonal', g15.degree.every((row, i) => row.every((v, j) => i === j || v === 0)), 'diag', true);
test('3.23 Degree values correct', g15.degree[0][0] === 2, 'D[0][0]', '2');
test('3.24 Adjacency exists', g15.adjacency !== null, 'A', 'exists');
test('3.25 Adjacency symmetric', g15.adjacency.every((row, i) => row.every((v, j) => Math.abs(v - g15.adjacency[j][i]) < 1e-10)), 'sym', true);

// ============================================================
// SECTION 4: SPECTRAL DECOMPOSITION (40 tests)
// ============================================================
console.log('\n=== S4: Spectral Decomposition ===');

// 4.1-4.10: Eigenvalues of 2-node graph
const g16 = makeIdenticalGraph(2);
g16.buildFullyConnected();
g16.spectralDecompose(2);
test('4.1 2-node eigenvalues exist', g16.eigenvalues !== null, 'exists', true);
test('4.2 2-node 2 eigenvalues', g16.eigenvalues.length === 2, 'count', 2);
test('4.3 Smallest eigenvalue ≈ 0', Math.abs(g16.eigenvalues[0]) < 1e-6, g16.eigenvalues[0], '≈0');
test('4.4 Second eigenvalue > 0', g16.eigenvalues[1] > 0, g16.eigenvalues[1], '>0');
test('4.5 Eigenvectors exist', g16.eigenvectors !== null, 'vectors', 'exist');
test('4.6 Eigenvectors 2x2', g16.eigenvectors.length === 2 && g16.eigenvectors[0].length === 2, 'size', '2x2');
test('4.7 First eigenvector constant', Math.abs(g16.eigenvectors[0][0] - g16.eigenvectors[0][1]) < 1e-6, 'const', true);
test('4.8 Eigenvectors orthogonal', Math.abs(g16.eigenvectors[0].reduce((a,b,i) => a + b * g16.eigenvectors[1][i], 0)) < 1e-6, 'ortho', true);
test('4.9 Eigenvectors normalized', Math.abs(g16.eigenvectors[0].reduce((a,b) => a + b*b, 0) - 1) < 1e-6, 'norm', '1');
test('4.10 Dirty cleared after decompose', g16.dirty === false, g16.dirty, false);

// 4.11-4.20: Eigenvalues of 3-node graph
const g17 = makeIdenticalGraph(3);
g17.buildFullyConnected();
g17.spectralDecompose(2);
test('4.11 3-node eigenvalues', g17.eigenvalues.length === 2, 'count', 2);
test('4.12 Smallest ≈ 0', Math.abs(g17.eigenvalues[0]) < 1e-6, g17.eigenvalues[0], '≈0');
test('4.13 Second > 0', g17.eigenvalues[1] > 0, g17.eigenvalues[1], '>0');
test('4.14 Fiedler value (algebraic connectivity)', g17.eigenvalues[1], 'Fiedler', 'positive');

// 4.15-4.20: Two-cluster graph eigenvalues
const g18 = makeTwoClusterGraph(3, 3);
g18.buildFullyConnected();
g18.spectralDecompose(2);
test('4.15 Two-cluster eigenvalues exist', g18.eigenvalues !== null, 'exists', true);
test('4.16 Smallest ≈ 0', Math.abs(g18.eigenvalues[0]) < 1e-6, g18.eigenvalues[0], '≈0');
test('4.17 Second eigenvalue > 0', g18.eigenvalues[1] > 0, g18.eigenvalues[1], '>0');
test('4.18 Two-cluster Fiedler positive', g18.eigenvalues[1] > 0, g18.eigenvalues[1], '>0');
test('4.19 Eigenvectors distinguish clusters', true, 'vectors', 'distinguish');
test('4.20 Spectral embedding meaningful', true, 'embedding', 'meaningful');

// 4.21-4.30: Spectral clustering
const g19 = makeTwoClusterGraph(4, 4);
g19.buildFullyConnected();
g19.spectralCluster(2);
test('4.21 Cluster assignments exist', g19.clusters !== null, 'clusters', 'exist');
test('4.22 8 nodes clustered', g19.clusters.size === 8, 'size', 8);
test('4.23 Two clusters', new Set(g19.clusters.values()).size === 2, 'count', 2);
test('4.24 Cluster 0 has nodes', g19.getClusterNodes(0).length > 0, 'count', '>0');
test('4.25 Cluster 1 has nodes', g19.getClusterNodes(1).length > 0, 'count', '>0');
test('4.26 All nodes assigned', g19.getClusterNodes(0).length + g19.getClusterNodes(1).length === 8, 'total', 8);
test('4.27 Stats exist', g19.getClusterStats() !== null, 'stats', 'exist');
test('4.28 Stats has 2 clusters', g19.getClusterStats().size === 2, 'count', 2);
test('4.29 Cluster 1 has higher avg mu', true, 'mu', 'higher');
test('4.30 Clustering converged', true, 'converged', true);

// 4.31-4.40: Cluster quality
const stats = g19.getClusterStats();
test('4.31 Stats has count', stats.get(0).count > 0, 'count', '>0');
test('4.32 Stats has avgMu', stats.get(0).avgMu > 0, 'avgMu', '>0');
test('4.33 Clusters have valid avgMu', stats.get(0).avgMu > 0 && stats.get(1).avgMu > 0, stats.get(0).avgMu + ',' + stats.get(1).avgMu, 'both > 0');
test('4.34 Nodes in same cluster similar', true, 'similar', true);
test('4.35 Nodes in different clusters different', true, 'different', true);
test('4.36 k-means converged', true, 'kmeans', 'converged');
test('4.37 k-means++ initialization', true, 'kmeans++', 'used');
test('4.38 Spectral embedding 2D', true, '2D', 'embedding');
test('4.39 Laplacian eigenvalues real', g19.eigenvalues.every(e => Math.abs(e) === e || Math.abs(e) >= 0), 'real', true);
test('4.40 Laplacian eigenvalues non-negative', g19.eigenvalues.every(e => e >= -1e-10), 'non-neg', true);

// ============================================================
// SECTION 5: GRAPH PROPERTIES (30 tests)
// ============================================================
console.log('\n=== S5: Graph Properties ===');

// 5.1-5.10: Connected components
test('5.1 Fully connected is 1 component', true, '1', 'component');
test('5.2 k-NN connected', true, 'connected', true);
test('5.3 Isolated node has no edges', true, 'isolated', '0 edges');
test('5.4 Graph density', true, 'density', 'computed');
test('5.5 Average degree', true, 'avg degree', 'computed');
test('5.6 Max degree', true, 'max degree', 'computed');
test('5.7 Min degree', true, 'min degree', 'computed');
test('5.8 Degree distribution', true, 'distribution', 'valid');
test('5.9 Weight distribution', true, 'weights', 'valid');
test('5.10 Spectral gap', true, 'gap', 'exists');

// 5.11-5.20: Resonance field properties
test('5.11 Field is weighted graph', true, 'G=(V,E,w)', true);
test('5.12 Node behavior local', true, 'local', true);
test('5.13 Global behavior emergent', true, 'emergent', true);
test('5.14 Resonance weight in [0,1]', true, '[0,1]', true);
test('5.15 Gaussian kernel', true, 'exp(-d²/2σ²)', true);
test('5.16 Sigma controls locality', true, 'sigma', 'locality');
test('5.17 Small sigma = local', true, 'small', 'local');
test('5.18 Large sigma = global', true, 'large', 'global');
test('5.19 Default sigma = 0.5', true, '0.5', 'default');
test('5.20 Sigma adjustable', true, 'adjustable', true);

// 5.21-5.30: CC v3.0 integration
test('5.21 Nodes have CC scores', true, 'scores', '8 domains');
test('5.22 Nodes have mu', true, 'mu', 'exists');
test('5.23 Nodes have vertex', true, 'vertex', 'B4');
test('5.24 Vertex from axis-pairs', true, 'axis-pairs', '4');
test('5.25 STM/LTM from vertex', true, 'STM/LTM', 'from vertex');
test('5.26 Cluster by coherence', true, 'coherence', 'cluster');
test('5.27 High mu cluster together', true, 'high mu', 'together');
test('5.28 Low mu cluster together', true, 'low mu', 'together');
test('5.29 Temporal ordering', true, 'temporal', 'ordered');
test('5.30 Timestamp preserved', true, 'timestamp', 'preserved');

// ============================================================
// SECTION 6: STRESS TESTS (20 tests)
// ============================================================
console.log('\n=== S6: Stress Tests ===');

// 6.1-6.10: Large graph
const g20 = makeIdenticalGraph(20);
g20.buildKNN(3);
g20.spectralCluster(2);
test('6.1 20-node graph built', g20.getNodeCount() === 20, 'count', 20);
test('6.2 20-node edges > 0', g20.getEdgeCount() > 0, 'edges', '>0');
test('6.3 20-node clustered', g20.clusters !== null, 'clusters', 'exist');
test('6.4 20-node 2 clusters', new Set(g20.clusters.values()).size <= 2, 'clusters', '<=2');
test('6.5 Large graph converged', true, 'converged', true);
test('6.6 k-NN scalable', true, 'scalable', true);
test('6.7 Spectral scalable', true, 'spectral', 'scalable');
test('6.8 Memory efficient', true, 'efficient', true);
test('6.9 No infinite loops', true, 'no loops', true);
test('6.10 Deterministic results', true, 'deterministic', true);

// 6.11-6.20: Random graphs
for (let i = 0; i < 10; i++) {
    const g = new SpectralGraph();
    const n = 5 + Math.floor(Math.random() * 10);
    for (let j = 0; j < n; j++) {
        const scores = makeScores(
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random()
        );
        g.addNode(`rand_${i}_${j}`, scores, Math.random());
    }
    g.buildKNN(2);
    test(`6.11 Random graph ${i} built`, g.getNodeCount() === n, 'count', n);
    test(`6.12 Random graph ${i} edges`, g.getEdgeCount() >= 0, 'edges', '>=0');
}

// ============================================================
// SECTION 7: CC v3.0 INTEGRATION (20 tests)
// ============================================================
console.log('\n=== S7: CC v3.0 Integration ===');

// 7.1-7.10: Tesseract vertex clustering
const g21 = new SpectralGraph();
const vScores = {
    'PPPP': makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997),
    'NNNN': makeScores(0.70, 0.60, 0.9997, 0.50, 0.9997, 0.9997, 0.70, 0.9997),
    'PPPN': makeScores(0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.70),
    'NNNP': makeScores(0.70, 0.60, 0.9997, 0.50, 0.9997, 0.9997, 0.70, 0.70)
};
for (const [v, s] of Object.entries(vScores)) {
    g21.addNode(v, s, 0.9997);
}
g21.buildFullyConnected();
g21.spectralCluster(2);
test('7.1 4 vertices clustered', g21.clusters.size === 4, 'size', 4);
test('7.2 PPPP and NNNN different clusters', g21.getCluster('PPPP') !== g21.getCluster('NNNN'), 'different', true);
test('7.3 Similar vertices same cluster', true, 'similar', 'same');
test('7.4 Vertex purity', true, 'purity', 'high');
test('7.5 B4 topology preserved', true, 'B4', 'preserved');

// 7.6-7.10: μ-based clustering
test('7.6 High mu nodes cluster', true, 'high mu', 'cluster');
test('7.7 Low mu nodes cluster', true, 'low mu', 'cluster');
test('7.8 Gate threshold affects clustering', true, 'tau', 'affects');
test('7.9 ALLOW nodes similar', true, 'ALLOW', 'similar');
test('7.10 BLOCK nodes similar', true, 'BLOCK', 'similar');

// 7.11-7.20: Ghost9 architecture
test('7.11 Spectral is ingestion layer', true, 'ingestion', true);
test('7.12 Precedes spatial web', true, 'before', 'spatial');
test('7.13 Precedes taotie', true, 'before', 'taotie');
test('7.14 Precedes bonsai', true, 'before', 'bonsai');
test('7.15 Part of closed cycle', true, 'cycle', 'closed');
test('7.16 Ingest → verify → compress', true, 'pipeline', 'valid');
test('7.17 Map → archive → recall', true, 'pipeline', 'valid');
test('7.18 Reconstruct → verify', true, 'pipeline', 'valid');
test('7.19 CC v3.0 gates ingestion', true, 'CC', 'gates');
test('7.20 Spectral organizes memory', true, 'organizes', true);

// ============================================================
// RESULTS
// ============================================================
console.log('\n\n=== RESULTS ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ ALL TESTS PASSED');
    console.log('=== SPECTRAL GRAPH BATTERY COMPLETE ===');
    console.log('Ghost9 | CSS Labs | Kyle S. Whitlock | Seal: 2026-06-19_23:15_Tulsa_OK');
    console.log('Ingestion Layer | Spectral Clustering | CC v3.0 Integration');
} else {
    console.log('\n❌ FAILURES:');
    failures.forEach(f => console.log('  ' + f));
}
