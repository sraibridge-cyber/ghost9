// ================================================================
// SPECTRAL GRAPH & SPATIAL WEB  —  GHOST v9.0.1
// Used by the Taotie devouring operator to identify merge candidates
//
// Method: Gaussian-kernel adjacency → graph Laplacian →
//         Fiedler vector (shifted power iteration) →
//         1D k-means spectral clustering, per B⁴ vertex subgraph
//
// All math runs in pure Node.js — zero npm dependencies.
// ================================================================
'use strict';

const DOMAINS = ['D1','D2','D3','D4','D5','D6','D7','D8'];
const W_EACH  = 0.125;

// ── Metric ────────────────────────────────────────────────────

function domainDist(s1, s2) {
  let sum = 0;
  for (const d of DOMAINS) {
    const a = s1[d] ?? 0.9995;
    const b = s2[d] ?? 0.9995;
    sum += W_EACH * (a - b) ** 2;
  }
  return Math.sqrt(sum);
}

// Audit fix #10: Log-space distance — better aligned with CC geometric-mean structure.
function domainDistLog(s1, s2) {
  let sum = 0;
  for (const d of DOMAINS) {
    const a = Math.log(Math.max(s1[d] ?? 0.9995, 1e-12));
    const b = Math.log(Math.max(s2[d] ?? 0.9995, 1e-12));
    sum += W_EACH * (a - b) ** 2;
  }
  return Math.sqrt(sum);
}

// ── Adjacency matrix ──────────────────────────────────────────

function buildAdjacency(nodes, sigma = 0.02) {
  const n  = nodes.length;
  const s2 = 2 * sigma * sigma;
  const A  = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const w   = Math.exp(-(domainDist(nodes[i].scores, nodes[j].scores) ** 2) / s2);
      A[i][j]   = w;
      A[j][i]   = w;
    }
  }
  return A;
}

// ── Graph Laplacian ───────────────────────────────────────────

function buildLaplacian(A) {
  const n = A.length;
  const L = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    let deg = 0;
    for (let j = 0; j < n; j++) {
      if (j !== i) { L[i][j] = -A[i][j]; deg += A[i][j]; }
    }
    L[i][i] = deg;
  }
  return L;
}

// ── Fiedler vector ────────────────────────────────────────────

function fiedlerVector(L, maxIter = 400, tol = 1e-9) {
  const n = L.length;
  if (n <= 1) return [1];
  if (n === 2) return [1, -1];

  let alpha = 0;
  for (let i = 0; i < n; i++) {
    let rs = 0;
    for (let j = 0; j < n; j++) rs += Math.abs(L[i][j]);
    if (rs > alpha) alpha = rs;
  }
  alpha += 1.0;

  let v = Array.from({ length: n }, () => Math.random() - 0.5);
  const m0 = v.reduce((a, b) => a + b, 0) / n;
  v = v.map(x => x - m0);
  let nrm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (nrm < 1e-14) {
    v = Array.from({ length: n }, (_, i) => i % 2 === 0 ? 1 : -1);
    const m1 = v.reduce((a, b) => a + b, 0) / n;
    v = v.map(x => x - m1);
    nrm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  }
  v = v.map(x => x / nrm);

  for (let iter = 0; iter < maxIter; iter++) {
    const w = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      w[i] = alpha * v[i];
      for (let j = 0; j < n; j++) w[i] -= L[i][j] * v[j];
    }

    const wm = w.reduce((a, b) => a + b, 0) / n;
    const wd = Array.from(w).map(x => x - wm);

    const wn = Math.sqrt(wd.reduce((s, x) => s + x * x, 0));
    if (wn < 1e-14) break;
    const vNew = wd.map(x => x / wn);

    const d1 = Math.sqrt(vNew.reduce((s, x, i) => s + (x - v[i]) ** 2, 0));
    const d2 = Math.sqrt(vNew.reduce((s, x, i) => s + (x + v[i]) ** 2, 0));
    v = vNew;
    if (Math.min(d1, d2) < tol) break;
  }

  return Array.from(v);
}

// ── 1D k-means on Fiedler coordinates ────────────────────────

function kmeans1D(vals, k, maxIter = 150) {
  const n = vals.length;
  k = Math.min(k, n);
  if (k <= 1) return [vals.map((_, i) => i)];
  if (k >= n) return vals.map((_, i) => [i]);

  const sorted  = [...vals].sort((a, b) => a - b);
  const step    = n / k;
  let centroids = Array.from({ length: k }, (_, c) =>
    sorted[Math.min(Math.floor((c + 0.5) * step), n - 1)]
  );

  let labels = new Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    const next = vals.map(v => {
      let best = 0, bd = Infinity;
      for (let c = 0; c < k; c++) {
        const d = Math.abs(v - centroids[c]);
        if (d < bd) { bd = d; best = c; }
      }
      return best;
    });
    const changed = next.some((l, i) => l !== labels[i]);
    labels = next;
    if (!changed) break;

    for (let c = 0; c < k; c++) {
      const pts = vals.filter((_, i) => labels[i] === c);
      if (pts.length > 0) centroids[c] = pts.reduce((a, b) => a + b, 0) / pts.length;
    }
  }

  const clusters = Array.from({ length: k }, () => []);
  labels.forEach((l, i) => clusters[l].push(i));
  return clusters.filter(c => c.length > 0);
}

// ── Main spectral clustering ──────────────────────────────────

function spectralClusters(nodes, k) {
  const n = nodes.length;
  if (n <= 1) return [[0]];
  k = Math.max(1, Math.min(k, n));
  const A  = buildAdjacency(nodes);
  const L  = buildLaplacian(A);
  const fv = fiedlerVector(L);
  return kmeans1D(fv, k);
}

// ── Per-vertex clustering (scalable path) ─────────────────────

function perVertexClusters(nodes, reductionRatio = 0.60) {
  const byVertex = {};
  for (const node of nodes) {
    const v = node.vertex || 'PPPP';
    if (!byVertex[v]) byVertex[v] = [];
    byVertex[v].push(node);
  }

  const result = [];
  for (const vNodes of Object.values(byVertex)) {
    if (vNodes.length < 2) continue;
    const k        = Math.max(1, Math.floor(vNodes.length * reductionRatio));
    const idxSets  = spectralClusters(vNodes, k);
    for (const idxs of idxSets) {
      if (idxs.length >= 2) result.push(idxs.map(i => vNodes[i]));
    }
  }
  return result;
}

// ── Spatial web (void space visualization) ───────────────────

function spatialWeb(nodes, epsilon = 0.05) {
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = domainDist(nodes[i].scores, nodes[j].scores);
      if (d < epsilon) edges.push({ i, j, dist: parseFloat(d.toFixed(6)) });
    }
  }
  return edges.sort((a, b) => a.dist - b.dist);
}

module.exports = {
  domainDist, domainDistLog, buildAdjacency, buildLaplacian,
  fiedlerVector, kmeans1D, spectralClusters,
  perVertexClusters, spatialWeb
};
