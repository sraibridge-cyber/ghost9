// taotie.js — Devouring Engine v9.1.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-07-03_19:38_Tulsa_OK
// Metabolic cycle: ingest → compress → merge → seal

const crypto = require('crypto');
const { evaluate, whitlock } = require('./coherence_calculus');

function classifyTier(mu) {
  if (mu === null || mu === undefined || isNaN(mu) || mu < 0) {
    return null;
  }
  if (mu >= 0.9998) {
    return 'LTM';
  }
  if (mu >= 0.9995) {
    return 'STM';
  }
  return null;
}

function computeHash(data) {
  return crypto.createHash('sha3-512').update(JSON.stringify(data)).digest('hex');
}

class VoidSpace {
  constructor(maxNodes = 50, trigger = 7, target = 30) {
    this.maxNodes = maxNodes;
    this.trigger = trigger;
    this.triggerAt = trigger;
    this.target = target;
    this.targetCount = target;
    this.threshold = trigger;
    this.batchSize = 5;
    this.maxAge = target;
    this.sweepCount = 0;
    this.lastSweep = 0;
    this.nodes = [];
    this.skipped = false;
    this.sweepLog = [];
    this.totalDevoured = 0;
  }

  needsSweep(n) {
    return n >= this.threshold;
  }

  sweep(nodes) {
    this.nodes = nodes || [];
    this.lastSweep = Date.now();

    if (!nodes || nodes.length === 0 || nodes.length < this.threshold) {
      this.skipped = true;
      const result = { 
        skipped: true, 
        merged: [], 
        nodes: nodes || [], 
        survivors: nodes || [], 
        count: nodes ? nodes.length : 0,
        devoured: 0,
      devoured_count: 0
      };
      this.sweepLog.push({
        before: nodes ? nodes.length : 0,
        ltmProtected: 0,
        strategy: 'skip_below_threshold',
        ts: Date.now(),
        totalDevoured: this.totalDevoured
      });
      return result;
    }

    const allLTM = nodes.every(n => (n.mu || 0) >= 0.9998);
    if (allLTM) {
      this.skipped = true;
      const result = {
        skipped: true,
        merged: [],
        nodes: nodes,
        survivors: nodes,
        count: nodes.length,
        devoured: 0,
      devoured_count: 0
      };
      this.sweepLog.push({
        before: nodes.length,
        ltmProtected: nodes.length,
        strategy: 'skip_all_ltm',
        ts: Date.now(),
        totalDevoured: this.totalDevoured
      });
      return result;
    }

    this.sweepCount++;
    this.skipped = false;

    const validNodes = nodes.filter(n => {
      if (n.mu !== undefined) return n.mu >= 0.9995;
      return true;
    });

    const merged = [];
    let devoured = 0;
    for (let i = 0; i < validNodes.length; i += this.batchSize) {
      const batch = validNodes.slice(i, i + this.batchSize);
      if (batch.length > 0) {
        merged.push(mergeCluster(batch));
        devoured += batch.length;
        this.totalDevoured += batch.length;
      }
    }

    const result = {
      skipped: false,
      merged: merged,
      nodes: validNodes,
      survivors: validNodes,
      count: validNodes.length,
      devoured: devoured,
      devoured_count: devoured
    };

    this.sweepLog.push({
      before: nodes.length,
      ltmProtected: nodes.length - validNodes.length,
      strategy: 'merge',
      ts: Date.now(),
      totalDevoured: this.totalDevoured
    });

    return result;
  }

  voidStats(nodes) {
    if (!nodes || nodes.length === 0) {
      return { 
        total: 0, 
        ltm_count: 0, 
        stm_count: 0, 
        tiers: [],
        capacity_pct: 0,
        trigger_at: this.trigger,
        near_trigger: false
      };
    }
    const mus = nodes.map(n => n.mu || 0.9995);
    const tiers = nodes.map(n => classifyTier(n.mu || 0.9995));
    const ltm = nodes.filter(n => (n.mu || 0) >= 0.9998).length;
    const stm = nodes.filter(n => (n.mu || 0) >= 0.9995 && (n.mu || 0) < 0.9998).length;
    const capacity_pct = (nodes.length / this.maxNodes) * 100;
    const near_trigger = nodes.length >= this.threshold - 2;
    return {
      total: nodes.length,
      ltm_count: ltm,
      stm_count: stm,
      avgMu: mus.reduce((a, b) => a + b, 0) / mus.length,
      minMu: Math.min(...mus),
      maxMu: Math.max(...mus),
      tiers: tiers,
      capacity_pct: capacity_pct,
      trigger_at: this.trigger,
      near_trigger: near_trigger,
      near_trigger_at_7: this.threshold === 7 && near_trigger
    };
  }
}

function mergeCluster(cluster) {
  if (!cluster || cluster.length === 0) {
    throw new Error('Empty cluster: cannot merge');
  }

  const parent_ids = cluster.map(n => n.hash || computeHash(n)).filter(Boolean);
  const contents = cluster.map(n => n.content || n.input || JSON.stringify(n)).join(' | ');
  const content = 'TAOTIE_MERGED: ' + contents.substring(0, 200);

  const oldDomains = ['signal', 'energy', 'temporal', 'spatial', 'cognitive', 'ethical', 'declarative', 'novelty'];
  const scores = {};

  for (const d of oldDomains) {
    scores[d] = cluster.reduce((sum, n) => {
      return sum + ((n.scores && n.scores[d]) || 0.9995);
    }, 0) / cluster.length;
  }

  const dMap = { signal: 'D1', energy: 'D2', temporal: 'D3', spatial: 'D4',
                 cognitive: 'D5', ethical: 'D6', declarative: 'D7', novelty: 'D8' };
  const avgScores = {};
  for (const [oldKey, newKey] of Object.entries(dMap)) {
    avgScores[newKey] = scores[oldKey];
  }

  const scoreValues = Object.values(scores);
  const muVal = Math.exp(scoreValues.reduce((sum, s) => sum + Math.log(s), 0) / scoreValues.length);
  const hash = computeHash({ scores, mu: muVal, content, count: cluster.length });
  const merkle_root = hash;
  const wc = whitlock(cluster.length);

  return {
    scores: scores,
    mu: muVal,
    pass: muVal >= 0.9995,
    tier: classifyTier(muVal),
    vertex: 'PPPP',
    hash: hash,
    merkle_root: merkle_root,
    content: content,
    ts: Date.now(),
    parent_ids: parent_ids,
    merge_count: cluster.length,
    _isMerge: true,
    avgScores: avgScores,
    whitlock: wc,
    count: cluster.length,
    timestamp: Date.now()
  };
}

function devour(items) {
  const evaluated = items.map(item => {
    if (typeof item === 'string') {
      return evaluate(item);
    }
    return item;
  });
  return mergeCluster(evaluated);
}

module.exports = { VoidSpace, mergeCluster, devour, classifyTier };
