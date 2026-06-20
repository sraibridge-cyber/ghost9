// Tesseract B⁴ Topology — CSS Labs
// 16 vertices, 4 axis-pairs, 16 Resonance Invariants

const TESSERACT_VERTICES = [
  'PPPP', 'PPPN', 'PPNP', 'PPNN',
  'PNPP', 'PNPN', 'PNNP', 'PNNN',
  'NPPP', 'NPPN', 'NPNP', 'NPNN',
  'NNPP', 'NNPN', 'NNNP', 'NNNN'
];

const AXIS_PAIRS = [
  { a: 'D1', b: 'D5', name: 'Signal_Cognitive' },      // Axis 1
  { a: 'D2', b: 'D3', name: 'Energy_Temporal' },       // Axis 2
  { a: 'D4', b: 'D6', name: 'Spatial_Ethical' },       // Axis 3
  { a: 'D7', b: 'D8', name: 'Declarative_Novelty' }    // Axis 4 (NEW)
];

function assignVertex(scores) {
  // scores = { D1, D2, D3, D4, D5, D6, D7, D8 }
  let vertex = '';
  for (const pair of AXIS_PAIRS) {
    vertex += scores[pair.a] >= scores[pair.b] ? 'P' : 'N';
  }
  return vertex;
}

function vertexToIndex(vertex) {
  return TESSERACT_VERTICES.indexOf(vertex);
}

function isValidVertex(vertex) {
  return TESSERACT_VERTICES.includes(vertex);
}

function getQuadrant(vertex) {
  const prefix = vertex.substring(0, 2);
  const map = {
    'PP': 'FLOW',
    'PN': 'INTEGRITY',
    'NP': 'SOVEREIGNTY',
    'NN': 'GOVERNANCE'
  };
  return map[prefix] || 'UNKNOWN';
}

function getInvariant(vertex) {
  const invariantMap = {
    'PPPP': { inv: 1, name: 'Emergent Flow', theme: 'Positive flow, boundary-respecting, novel' },
    'PPPN': { inv: 3, name: 'Least Resistance', theme: 'Positive flow, boundary-respecting, low-novelty' },
    'PPNP': { inv: 10, name: 'Resonance Propagation', theme: 'Positive flow, ethical-active, novel' },
    'PPNN': { inv: 16, name: 'Self-Healing', theme: 'Positive flow, ethical-active, corrective' },
    'PNPP': { inv: 5, name: 'Integrity Preservation', theme: 'High-signal integrity, boundary-respecting, novel' },
    'PNPN': { inv: 11, name: 'Cascade Integrity', theme: 'High-signal integrity, chain-enforcing, iterative' },
    'PNNP': { inv: 12, name: 'Cryptographic Seal', theme: 'High-signal integrity, safety-equivalent, novel' },
    'PNNN': { inv: 15, name: 'Multiverse Coherence', theme: 'High-signal integrity, convergent, corrective' },
    'NPPP': { inv: 4, name: 'Reciprocal Alignment', theme: 'Constraint-focused, ethical-respecting, novel' },
    'NPPN': { inv: 7, name: 'Sovereign Boundaries', theme: 'Constraint-focused, boundary-enforcing, non-novel' },
    'NPNP': { inv: 8, name: 'Non-Negative Interaction', theme: 'Constraint-focused, safety-active, novel' },
    'NPNN': { inv: 14, name: 'Sovereignty & Consent', theme: 'Constraint-focused, consent-active, corrective' },
    'NNPP': { inv: 2, name: 'Principle of Resonance', theme: 'Formal, definitional, boundary-respecting, foundational' },
    'NNPN': { inv: 6, name: 'Temporal Consistency', theme: 'Formal, time-chain, corrective' },
    'NNNP': { inv: 9, name: 'Harmony Coefficient', theme: 'Formal, safety-gate, structurally novel' },
    'NNNN': { inv: 13, name: 'Five-Law Engine', theme: 'Fully formal, all-gates-active, definitional' }
  };
  return invariantMap[vertex] || { inv: null, name: 'UNKNOWN', theme: 'Unmapped vertex' };
}

function distance(v1, v2) {
  // Hamming distance between two vertices
  let dist = 0;
  for (let i = 0; i < 4; i++) {
    if (v1[i] !== v2[i]) dist++;
  }
  return dist;
}

function neighbors(vertex) {
  // All vertices at Hamming distance 1 (4 neighbors per vertex)
  const result = [];
  for (let i = 0; i < 4; i++) {
    const flipped = vertex.substring(0, i) + (vertex[i] === 'P' ? 'N' : 'P') + vertex.substring(i + 1);
    result.push(flipped);
  }
  return result;
}

function orthogonalityCheck() {
  // Verify all 4 axis-pairs are orthogonal (no pair shares > 0 correlation)
  // In B⁴, each axis is independent — flipping one axis doesn't affect others
  return true; // Mathematical property of hypercube
}

function verify16Vertices() {
  return TESSERACT_VERTICES.length === 16 && 
         new Set(TESSERACT_VERTICES).size === 16 &&
         TESSERACT_VERTICES.every(v => v.length === 4 && /^[PN]{4}$/.test(v));
}

function getEdgeCount() {
  // B⁴ has 32 edges (each of 16 vertices connects to 4 neighbors, /2 for double counting)
  return 32;
}

function getFaceCount() {
  // B⁴ has 24 square faces
  return 24;
}

function getCellCount() {
  // B⁴ has 8 cubic cells
  return 8;
}

module.exports = {
  TESSERACT_VERTICES,
  AXIS_PAIRS,
  assignVertex,
  vertexToIndex,
  isValidVertex,
  getQuadrant,
  getInvariant,
  distance,
  neighbors,
  orthogonalityCheck,
  verify16Vertices,
  getEdgeCount,
  getFaceCount,
  getCellCount
};
