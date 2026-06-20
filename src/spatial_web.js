// ================================================================
// GHOST v9.0.1 — spatial_web.js
// Spatial Web: Persistent Geometric Memory in Domain Space
// ----------------------------------------------------------------
// Nodes are points in R⁸ (one axis per domain D1–D8).
// The web is a weighted proximity graph: edge weight = 1/distance.
// As nodes accumulate the web grows denser → better void resolution.
// As node scores update the web repositions → persistent learning.
// Void = nodes with μ ≥ τ that have NOT settled into LTM attractors.
// Used jointly with spectral_graph Fiedler vector: intersection of
// spectral communities AND spatial clusters = Taotie merge targets.
// ================================================================

'use strict';

const DOMAIN_KEYS = ['D1','D2','D3','D4','D5','D6','D7','D8'];
const DIM = DOMAIN_KEYS.length;

const EPSILON    = 0.12;
const MIN_PTS    = 2;
const MAX_EDGES  = 50_000;

class SpatialWeb {
  constructor () {
    this._positions = new Map();
    this._adj       = new Map();
    this._void      = new Set();
    this._edgeCount = 0;
    this.learningCycles = 0;
  }

  static _pos (node) {
    const s = node.scores || {};
    const v = new Float64Array(DIM);
    for (let i = 0; i < DIM; i++) {
      v[i] = s[DOMAIN_KEYS[i]] ?? 0.5;
    }
    return v;
  }

  static _dist (a, b) {
    let sum = 0;
    for (let i = 0; i < DIM; i++) {
      const d = a[i] - b[i];
      sum += d * d;
    }
    return Math.sqrt(sum);
  }

  upsert (node) {
    const id  = node.id;
    const pos = SpatialWeb._pos(node);
    const isNew = !this._positions.has(id);

    if (!isNew) {
      this._removeEdges(id);
      this.learningCycles++;
    }

    this._positions.set(id, pos);
    if (!this._adj.has(id)) this._adj.set(id, new Map());

    let edgesAdded = 0;
    for (const [otherId, otherPos] of this._positions) {
      if (otherId === id) continue;
      const dist = SpatialWeb._dist(pos, otherPos);
      if (dist < EPSILON && dist > 0) {
        const w = 1 / dist;
        this._adj.get(id).set(otherId, w);
        if (!this._adj.has(otherId)) this._adj.set(otherId, new Map());
        this._adj.get(otherId).set(id, w);
        edgesAdded++;
        this._edgeCount++;
      }
    }

    if (this._edgeCount > MAX_EDGES) this._pruneWeakest();

    return { isNew, edgesAdded };
  }

  remove (id) {
    if (!this._positions.has(id)) return;
    this._removeEdges(id);
    this._positions.delete(id);
    this._adj.delete(id);
    this._void.delete(id);
  }

  _removeEdges (id) {
    const neighbors = this._adj.get(id);
    if (!neighbors) return;
    for (const [nbId] of neighbors) {
      const nbAdj = this._adj.get(nbId);
      if (nbAdj) {
        nbAdj.delete(id);
        this._edgeCount--;
      }
    }
    neighbors.clear();
  }

  computeVoid (ltmIds) {
    this._void.clear();
    for (const id of this._positions.keys()) {
      if (!ltmIds.has(id)) {
        this._void.add(id);
      }
    }
    return new Set(this._void);
  }

  get voidIds () { return new Set(this._void); }

  spatialClusters (voidIds = this._void, eps = EPSILON, minPts = MIN_PTS) {
    const ids    = [...voidIds];
    const n      = ids.length;
    if (n < 2) return [];

    const labels = new Array(n).fill(-1);
    const NOISE  = -2;
    let clusterIdx = 0;

    const posOf = id => this._positions.get(id);

    const regionQuery = (idx) => {
      const p = posOf(ids[idx]);
      if (!p) return [];
      const nbrs = [];
      for (let j = 0; j < n; j++) {
        if (j === idx) continue;
        const q = posOf(ids[j]);
        if (!q) continue;
        if (SpatialWeb._dist(p, q) <= eps) nbrs.push(j);
      }
      return nbrs;
    };

    for (let i = 0; i < n; i++) {
      if (labels[i] !== -1) continue;
      const nbrs = regionQuery(i);
      if (nbrs.length < minPts) { labels[i] = NOISE; continue; }

      labels[i] = clusterIdx;
      const seeds = [...nbrs];

      for (let si = 0; si < seeds.length; si++) {
        const j = seeds[si];
        if (labels[j] === NOISE) labels[j] = clusterIdx;
        if (labels[j] !== -1) continue;
        labels[j] = clusterIdx;
        const nbrs2 = regionQuery(j);
        if (nbrs2.length >= minPts) {
          for (const k of nbrs2) {
            if (!seeds.includes(k)) seeds.push(k);
          }
        }
      }
      clusterIdx++;
    }

    const clusters = [];
    for (let c = 0; c < clusterIdx; c++) {
      const members = [];
      for (let i = 0; i < n; i++) {
        if (labels[i] === c) members.push(ids[i]);
      }
      if (members.length >= 2) clusters.push(members);
    }
    return clusters;
  }

  jointVoidClusters (voidIds, spectralCommunities) {
    const spatClusters = this.spatialClusters(voidIds);

    const result = [];
    for (const cluster of spatClusters) {
      const byCommunity = new Map();
      for (const id of cluster) {
        const comm = spectralCommunities.get(id) ?? -1;
        if (!byCommunity.has(comm)) byCommunity.set(comm, []);
        byCommunity.get(comm).push(id);
      }
      for (const [, members] of byCommunity) {
        if (members.length >= 2) result.push(members);
      }
    }
    return result;
  }

  serialize () {
    const positions = {};
    for (const [id, pos] of this._positions) {
      positions[id] = Array.from(pos);
    }
    return {
      schema:         'spatial_web_v1',
      learningCycles: this.learningCycles,
      nodeCount:      this._positions.size,
      edgeCount:      this._edgeCount,
      positions,
      void:           [...this._void]
    };
  }

  static deserialize (snapshot) {
    if (snapshot?.schema !== 'spatial_web_v1') {
      throw new Error('spatial_web: unknown snapshot schema');
    }
    const web = new SpatialWeb();
    web.learningCycles = snapshot.learningCycles ?? 0;

    for (const [id, arr] of Object.entries(snapshot.positions ?? {})) {
      web._positions.set(id, new Float64Array(arr));
      web._adj.set(id, new Map());
    }

    const ids = [...web._positions.keys()];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const dist = SpatialWeb._dist(
          web._positions.get(ids[i]),
          web._positions.get(ids[j])
        );
        if (dist < EPSILON && dist > 0) {
          const w = 1 / dist;
          web._adj.get(ids[i]).set(ids[j], w);
          web._adj.get(ids[j]).set(ids[i], w);
          web._edgeCount++;
        }
      }
    }

    for (const id of (snapshot.void ?? [])) web._void.add(id);

    return web;
  }

  _pruneWeakest () {
    const all = [];
    for (const [a, nbrs] of this._adj) {
      for (const [b, w] of nbrs) {
        if (a < b) all.push({ w, a, b });
      }
    }
    all.sort((x, y) => x.w - y.w);
    const toRemove = all.length - MAX_EDGES;
    for (let i = 0; i < toRemove; i++) {
      const { a, b } = all[i];
      this._adj.get(a)?.delete(b);
      this._adj.get(b)?.delete(a);
      this._edgeCount--;
    }
  }

  stats () {
    const degrees = [];
    for (const [, nbrs] of this._adj) degrees.push(nbrs.size);
    const avgDeg = degrees.length
      ? degrees.reduce((a,b) => a+b, 0) / degrees.length
      : 0;
    return {
      nodes:          this._positions.size,
      edges:          this._edgeCount,
      voidNodes:      this._void.size,
      avgDegree:      +avgDeg.toFixed(3),
      learningCycles: this.learningCycles,
      epsilon:        EPSILON,
      dim:            DIM
    };
  }

  voidProximityMap (topN = 5) {
    const map = {};
    for (const id of this._void) {
      const pos  = this._positions.get(id);
      if (!pos) continue;
      const nbrs = this._adj.get(id);
      if (!nbrs) { map[id] = []; continue; }
      const sorted = [...nbrs.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([nid, w]) => ({ id: nid, weight: +w.toFixed(4) }));
      map[id] = sorted;
    }
    return map;
  }
}

module.exports = { SpatialWeb, EPSILON, DIM, DOMAIN_KEYS };
