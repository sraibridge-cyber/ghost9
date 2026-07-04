const fs = require('fs');
let code = fs.readFileSync('src/taotie.js', 'utf8');

// Add helper function after the coherence_calculus require line
const helper = `
// [UPGRADE v9.1.0] SpectralGraph-based clustering replacing perVertexClusters
function spectralClusterNodes(nodes, keepRatio) {
  const sg = new SpectralGraph();
  nodes.forEach((node, idx) => {
    const scores = node.scores || {};
    const fullScores = {
      signal: scores.signal || scores.D1 || 0.9995,
      energy: scores.energy || scores.D2 || 0.9995,
      temporal: scores.temporal || scores.D3 || 0.9995,
      spatial: scores.spatial || scores.D4 || 0.9995,
      cognitive: scores.cognitive || scores.D5 || 0.9995,
      ethical: scores.ethical || scores.D6 || 0.9995,
      declarative: scores.declarative || scores.D7 || 0.9995,
      novelty: scores.novelty || scores.D8 || 0.9995
    };
    sg.addNode('node_' + idx, fullScores, node.mu || 0.9995);
  });
  sg.buildFullyConnected();
  const k = Math.max(1, Math.floor(nodes.length * keepRatio));
  sg.spectralCluster(k);
  
  // Convert cluster assignments to arrays of nodes
  const nodeMap = new Map(nodes.map((n, i) => ['node_' + i, n]));
  const clusterMap = new Map();
  for (const [nodeId, clusterId] of sg.clusters) {
    if (!clusterMap.has(clusterId)) clusterMap.set(clusterId, []);
    clusterMap.get(clusterId).push(nodeMap.get(nodeId));
  }
  return Array.from(clusterMap.values()).filter(c => c.length >= 2);
}

`;

// Insert helper after the coherence_calculus require
const insertAfter = "const { TAU, TAU_LTM: TAOTIE_TAU_LTM } = require('./coherence_calculus');";
code = code.replace(insertAfter, insertAfter + '\n' + helper);

// Replace perVertexClusters calls with spectralClusterNodes
code = code.replace(/perVertexClusters\(stm, keepRatio\)/g, 'spectralClusterNodes(stm, keepRatio)');

fs.writeFileSync('src/taotie.js', code);
console.log('Updated src/taotie.js');
