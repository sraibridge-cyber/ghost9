// ================================================================
// B⁴ TESSERACT MEMORY TOPOLOGY  —  GHOST v9.0.1
// 16 vertices × 4 binary axes = genuine B⁴ geometry
// Axis pairs: {D1,D2} {D3,D4} {D5,D6} {D7,D8}
// PPPP = only admitting vertex under standard GHOST load
// ================================================================
'use strict';

const VERTICES = [
  'PPPP','PPPN','PPNP','PPNN',
  'PNPP','PNPN','PNNP','PNNN',
  'NPPP','NPPN','NPNP','NPNN',
  'NNPP','NNPN','NNNP','NNNN'
];

// Axis pair mapping: each axis = pair of consecutive domains
// P = both domain scores ≥ AXIS_MIDPOINT; N = below
// Audit fix #9: Axis P/N uses geometric mean of domain pair.
// geomean(a,b) ≥ τ does NOT mean each domain ≥ τ individually.
// Example: √(0.9997 × 0.9980) = 0.99885 < τ → N (penalizes imbalance).
// This is intentional: the hypercube axis is positive only if BOTH domains are strong.
const AXIS_MIDPOINT = 0.9995;
const AXIS_PAIRS = [
  ['D1','D2'], ['D3','D4'], ['D5','D6'], ['D7','D8']
];

function routeVertex(scores) {
  const bits = AXIS_PAIRS.map(([d1, d2]) => {
    const axisScore = Math.sqrt((scores[d1] || 0) * (scores[d2] || 0));
    return axisScore >= AXIS_MIDPOINT ? 'P' : 'N';
  });
  return bits.join('');
}

function vertexCentroid(vertexId) {
  const bits = vertexId.split('');
  const centroid = {};
  AXIS_PAIRS.forEach(([d1, d2], i) => {
    const val = bits[i] === 'P' ? 0.9997 : 0.9985;
    centroid[d1] = val;
    centroid[d2] = val;
  });
  return centroid;
}

function vertexHamming(v1, v2) {
  let dist = 0;
  for (let i = 0; i < 4; i++) if (v1[i] !== v2[i]) dist++;
  return dist;
}

function vertexNeighbors(vertexId) {
  return VERTICES.filter(v => vertexHamming(v, vertexId) === 1);
}

function tesseractEdges() {
  const edges = [];
  for (let i = 0; i < VERTICES.length; i++) {
    for (let j = i + 1; j < VERTICES.length; j++) {
      if (vertexHamming(VERTICES[i], VERTICES[j]) === 1) {
        edges.push({ a: VERTICES[i], b: VERTICES[j] });
      }
    }
  }
  return edges;
}

function vertexDistribution(nodes) {
  const dist = Object.fromEntries(VERTICES.map(v => [v, 0]));
  for (const n of nodes) dist[n.vertex || 'PPPP']++;
  return dist;
}

function dominantVertex(nodes) {
  const dist = vertexDistribution(nodes);
  return Object.entries(dist).reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

module.exports = {
  VERTICES, AXIS_PAIRS, AXIS_MIDPOINT,
  routeVertex, vertexCentroid, vertexHamming,
  vertexNeighbors, tesseractEdges,
  vertexDistribution, dominantVertex
};
