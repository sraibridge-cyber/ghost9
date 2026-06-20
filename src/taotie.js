// ================================================================
// TAOTIE DEVOURING OPERATOR  —  GHOST v9.0.9
//
// Three-layer devouring kernel:
//   Layer 1 — Ingest:      CC gate (μ ≥ τ, dual-tau: 0.9960 bootstrap / 0.9995 production)
//   Layer 2 — Separation:  STM/LTM tier by μ vs τ_LTM = 0.9998
//   Layer 3 — Taotie:      Joint spectral+spatial merge at n=7 (OP3-informed)
//
// Mathematical guarantees:
//   1. Coherence:   geometric mean ≥ weakest element — μ* ≥ min(μᵢ)
//   2. Provenance:  every consumed node → merkle_root on super-node
//   3. No loss:     devoured array returned for archival — nothing deleted
//
// Sweep trigger:  n ≥ 7 (OP3-informed: keeps system in bootstrap zone, P ≈ 0.90)
// Sweep target:   merge down to 1 super-node (SHA3-512 Merkle root)
// Only STM nodes are eligible; LTM nodes are permanently protected.
//
// Fixes applied 2026-06-13:
//   [FIX-EXCESS] excess = max(1, before - 1) in OP3 mode (was before - triggerAt = 0 — sweep never fired)
//   [FIX-HEADER] Updated header/version to v9.0.9, removed dead TAOTIE_TRIGGER constant
// SEAL: 2026-06-13 Tulsa
// ================================================================
'use strict';

const { createHash } = require('crypto');
const { perVertexClusters } = require('./spectral_graph');

const { TAU, TAU_LTM: TAOTIE_TAU_LTM } = require('./coherence_calculus');
const TAU_LTM = 0.9998;
const TAOTIE_TARGET = 0.60;
const MAX_NODES_DEF = 10_000;
const DOMAINS = ['D1','D2','D3','D4','D5','D6','D7','D8'];

function classifyTier(mu) {
  if (mu >= TAU_LTM) return 'LTM';
  if (mu >= TAU) return 'STM';
  return null;
}

function mergeCluster(cluster) {
  if (cluster.length === 0) throw new Error('Taotie: cannot merge empty cluster');
  if (cluster.length === 1) {
    const n = cluster[0];
    const merkle_root = createHash('sha3-512').update(n.hash || '').digest('hex');
    return { ...n, merkle_root };
  }

  const scores = {};
  for (const d of DOMAINS) {
    const logSum = cluster.reduce((s, n) => {
      const v = (n.scores && n.scores[d]) != null ? n.scores[d] : 0.9995;
      return s + Math.log(Math.max(v, 1e-12));
    }, 0);
    scores[d] = Math.exp(logSum / cluster.length);
  }

  const muMerged = Math.exp(
    DOMAINS.reduce((s, d) => s + Math.log(Math.max(scores[d], 1e-12)), 0) / DOMAINS.length
  );

  const ts = Math.max(...cluster.map(n => n.ts || 0));
  const mergeCount = cluster.reduce((s, n) => s + (n.merge_count || 1), 0);
  const parentIds = cluster.map(n => n.hash).filter(Boolean);

  const merkle_root = createHash('sha3-512')
    .update(parentIds.slice().sort().join('|'))
    .digest('hex');

  const mergeTs = Date.now();
  const hash = createHash('sha3-512')
    .update(`${merkle_root}|${ts}|merge_${mergeTs}`)
    .digest('hex');

  const dominant = cluster.reduce((a, b) => a.mu > b.mu ? a : b);

  const content = `[TAOTIE×${cluster.length}] ` +
    cluster.map(n => n.content || '').join(' ‖ ').slice(0, 2048);

  return {
    hash, content, mu: muMerged, tier: classifyTier(muMerged),
    scores, vertex: dominant.vertex || 'PPPP', merge_count: mergeCount,
    parent_ids: parentIds, merkle_root, ts, _isMerge: true
  };
}

class VoidSpace {
  constructor(maxNodes = MAX_NODES_DEF) {
    this.maxNodes = maxNodes;
    this.triggerAt = 7; // OP3-informed: merge at n=7 to stay below D8 Jaccard cliff (P ≈ 0.90 permanently)
    this.targetCount = Math.floor(maxNodes * TAOTIE_TARGET);
    this.lastSweepTs = null;
    this.sweepCount = 0;
    this.totalDevoured = 0;
    this.sweepLog = [];
  }

  needsSweep(currentCount) {
    return currentCount >= this.triggerAt;
  }

  sweep(allNodes, spatialWeb = null) {
    const before = allNodes.length;
    const ltm = allNodes.filter(n => (n.tier || classifyTier(n.mu)) === 'LTM');
    const stm = allNodes.filter(n => (n.tier || classifyTier(n.mu)) === 'STM');

    // [FIX-EXCESS] In OP3 mode (triggerAt < 100), excess was calculated as:
    //   before - triggerAt = 7 - 7 = 0  →  excess <= 0  →  always skipped (sweep never fired).
    // Fix: in OP3 mode, target is 1 surviving node — merge everything. excess = max(1, before - 1).
    const excess = this.triggerAt < 100
      ? Math.max(1, before - 1)           // OP3 mode: merge all STM down to 1 super-node
      : (before - this.targetCount);       // Legacy capacity mode: merge to 60% of maxNodes

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
      const spectralClusters = perVertexClusters(stm, keepRatio);

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
      clusters = perVertexClusters(stm, keepRatio);
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
    this.sweepLog = [record, ...this.sweepLog].slice(0, 20);

    return {
      ...record, survivors, merged, devoured: devouredObjs,
      devoured_count: devouredSet.size, skipped: false
    };
  }

  voidStats(allNodes, spatialWeb = null) {
    const stm = allNodes.filter(n => (n.tier || classifyTier(n.mu)) === 'STM');
    const ltm = allNodes.filter(n => (n.tier || classifyTier(n.mu)) === 'LTM');

    const base = {
      stm_count: stm.length, ltm_count: ltm.length, total: allNodes.length,
      capacity_pct: (allNodes.length / this.maxNodes * 100).toFixed(1),
      trigger_at: this.triggerAt, target: this.targetCount,
      near_trigger: allNodes.length >= this.triggerAt * 0.90
    };

    if (spatialWeb && typeof spatialWeb.stats === 'function') {
      const webStats = spatialWeb.stats();
      return {
        ...base, spatial_web: webStats, void_edges: webStats.edges,
        learning_cycles: webStats.learningCycles
      };
    }

    return base;
  }
}

module.exports = { VoidSpace, classifyTier, mergeCluster };
