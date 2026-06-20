// =====================================================================
// TAOTIE DEVOURING OPERATOR — GHOST v9.1.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-20_18:03_Tulsa_OK
// =====================================================================
// Three-layer devouring kernel with full GHOST v9.1.0 integration:
//   Layer 1 — CC Gating:       evaluate() gates all nodes before void entry
//   Layer 2 — STM/LTM Tier:    classifyTier() by μ vs τ_LTM = 0.9998
//   Layer 3 — Spectral Merge:  SpectralGraph clusters STM nodes
//   Layer 4 — Tesseract Vertex: assignTesseractVertex() on super-nodes
//   Layer 5 — Whitlock Comm:    whitlock(n) for inter-node resonance
// =====================================================================

'use strict';

const { createHash } = require('crypto');
const { SpectralGraph } = require('./spectral_graph');
const { SpatialWeb } = require('./spatial_web');
const {
  evaluate, mu, whitlock, assignTesseractVertex,
  TAU, TAU_LTM, N_DOMAINS
} = require('./coherence_calculus');

const TAOTIE_TAU_LTM = 0.9998;
const TAOTIE_TARGET = 0.60;

// --- Tier Classification ---
function classifyTier(muVal) {
  if (muVal >= TAOTIE_TAU_LTM) return 'LTM';
  if (muVal >= TAU) return 'STM';
  return null;
}

// --- Merkle Root Generation ---
function merkleRoot(nodes) {
  const hash = createHash('sha3-512');
  for (const n of nodes) hash.update(n.hash || n.content || '');
  return hash.digest('hex');
}

// --- Super-Node Merge with Tesseract Vertex ---
function mergeCluster(cluster) {
  if (!cluster || cluster.length === 0) {
    throw new Error('mergeCluster: empty cluster');
  }

  // Compute average scores
  const avgScores = {};
  const domains = ['signal', 'energy', 'temporal', 'spatial', 'cognitive', 'ethical', 'declarative', 'novelty'];
  for (const d of domains) {
    avgScores[d] = cluster.reduce((sum, n) => sum + ((n.scores && n.scores[d]) || 0.9995), 0) / cluster.length;
  }

  // Compute μ via CC v3.0
  const muVal = mu(avgScores);

  // Assign Tesseract B⁴ vertex
  const vertex = assignTesseractVertex(avgScores);

  // Generate Merkle root
  const root = merkleRoot(cluster);

  // Compute Whitlock coefficient for communication
  const wc = whitlock(cluster.length);

  return {
    hash: root,
    merkle_root: root,
    content: 'TAOTIE_MERGE[' + cluster.map(n => n.content || n.hash || '').join('|') + ']',
    mu: muVal,
    scores: avgScores,
    tier: classifyTier(muVal),
    vertex: vertex,
    parent_ids: cluster.map(n => n.hash || n.id || ''),
    merge_count: cluster.length,
    _isMerge: true,
    whitlock: wc,
    ts: Date.now()
  };
}

// --- Spectral Clustering via v9.1.0 SpectralGraph ---
function spectralClusterNodes(nodes, keepRatio) {
  const sg = new SpectralGraph();
  const domains = ['signal', 'energy', 'temporal', 'spatial', 'cognitive', 'ethical', 'declarative', 'novelty'];

  nodes.forEach((node, idx) => {
    const scores = node.scores || {};
    const fullScores = {};
    for (const d of domains) {
      fullScores[d] = scores[d] || scores['D' + (domains.indexOf(d) + 1)] || 0.9995;
    }
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

// --- VoidSpace Class ---
class VoidSpace {
  constructor(maxNodes = 10000, triggerAt = 7, targetCount = null) {
    this.targetCount = targetCount || Math.floor(maxNodes * 0.6);
    this.maxNodes = maxNodes;
    this.triggerAt = triggerAt;
    this.lastSweepTs = null;
    this.sweepCount = 0;
    this.totalDevoured = 0;
    this.sweepLog = [];
  }

  needsSweep(n) {
    return n >= this.triggerAt;
  }

  // CC Gating: evaluate nodes before they enter the void
  gate(node, opts = {}) {
    if (!node.content && !node.scores) return { pass: false, reason: 'no_content_or_scores' };
    const ccResult = evaluate(node.content || '', {
      nodeCount: opts.nodeCount || 0,
      context: opts.context || [],
      storedNodes: opts.storedNodes || [],
      recent: opts.recent || []
    });
    return {
      pass: ccResult.pass,
      tier: ccResult.tier,
      mu: ccResult.mu,
      tau: ccResult.tau,
      vertex: assignTesseractVertex(ccResult.scores),
      whitlock: whitlock(opts.nodeCount || 0)
    };
  }

  sweep(allNodes, spatialWeb = null) {
    const before = allNodes.length;
    const ltm = allNodes.filter(n => (n.tier || classifyTier(n.mu)) === 'LTM');
    const stm = allNodes.filter(n => (n.tier || classifyTier(n.mu)) === 'STM');

    // [FIX-EXCESS] OP3 mode
    const excess = this.triggerAt < 100
      ? Math.max(1, before - 1)
      : (before - this.targetCount);

    if (excess <= 0 || stm.length < 2) {
      return {
        survivors: allNodes, merged: [], devoured: [], devoured_count: 0,
        clusterCount: 0, before, after: before, skipped: true
      };
    }

    let clusters;

    if (spatialWeb && typeof spatialWeb.jointVoidClusters === 'function') {
      const stmTarget = Math.max(1, stm.length - excess);
      const keepRatio = stmTarget / stm.length;
      const spectralClusters = spectralClusterNodes(stm, keepRatio);

      const spectralCommunities = new Map();
      spectralClusters.forEach((cluster, label) => {
        for (const n of cluster) spectralCommunities.set(n.id || n.hash, label);
      });

      const ltmIds = new Set(ltm.map(n => n.id || n.hash));
      const voidIds = spatialWeb.computeVoid(ltmIds);

      if (spectralCommunities.size === 0) {
        console.warn('[Taotie] No spectral communities — falling back to spectral-only');
        clusters = spectralClusters;
      } else {
        const rawClusters = spatialWeb.jointVoidClusters(voidIds, spectralCommunities);
        const idToNode = new Map(stm.map(n => [n.id || n.hash, n]));
        clusters = rawClusters
          .map(ids => ids.map(id => idToNode.get(id)).filter(Boolean))
          .filter(c => c.length >= 2);
      }

      if (clusters.length === 0) clusters = spectralClusters;

    } else {
      const stmTarget = Math.max(1, stm.length - excess);
      const keepRatio = stmTarget / stm.length;
      clusters = spectralClusterNodes(stm, keepRatio);
    }

    const devouredSet = new Set();
    const devouredObjs = [];
    const merged = [];

    for (const cluster of clusters) {
      const superNode = mergeCluster(cluster);
      merged.push(superNode);
      for (const n of cluster) {
        if (!devouredSet.has(n.hash)) {
          devouredSet.add(n.hash);
          devouredObjs.push(n);
        }
      }
    }

    const survivors = [
      ...ltm,
      ...stm.filter(n => !devouredSet.has(n.hash)),
      ...merged
    ];

    const record = {
      ts: Date.now(), before, after: survivors.length,
      devoured: devouredSet.size, clusterCount: clusters.length,
      ltmProtected: ltm.length, strategy: spatialWeb ? 'joint_spectral_spatial' : 'spectral_only'
    };
    this.lastSweepTs = record.ts;
    this.sweepCount++;
    this.totalDevoured += devouredSet.size;
    this.sweepLog.push(record);

    return {
      survivors, merged, devoured: devouredObjs,
      devoured_count: devouredSet.size, clusterCount: clusters.length,
      before, after: survivors.length, skipped: false
    };
  }

  voidStats(allNodes, spatialWeb = null) {
    const ltm = allNodes.filter(n => (n.tier || classifyTier(n.mu)) === 'LTM');
    const stm = allNodes.filter(n => (n.tier || classifyTier(n.mu)) === 'STM');
    const total = allNodes.length;
    const capacity_pct = (total / this.maxNodes * 100).toFixed(2);

    const stats = {
      stm_count: stm.length,
      ltm_count: ltm.length,
      total,
      capacity_pct,
      trigger_at: this.triggerAt,
      near_trigger: total >= this.triggerAt - 1
    };

    if (spatialWeb && typeof spatialWeb.stats === 'function') {
      const webStats = spatialWeb.stats();
      stats.spatial_clusters = webStats.clusters || 0;
      stats.spatial_nodes = webStats.nodes || 0;
    }

    return stats;
  }
}

module.exports = { VoidSpace, classifyTier, mergeCluster, spectralClusterNodes };
