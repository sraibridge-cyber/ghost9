// taotie.js — Devouring Engine v9.1.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-07-03_19:38_Tulsa_OK
// Metabolic cycle: ingest → compress → merge → seal

const crypto = require('crypto');
const { evaluate, whitlock } = require('./coherence_calculus');
const { STM_MIN, LTM_MIN } = require('./thresholds');

function classifyTier(mu) {
  if (mu === null || mu === undefined || isNaN(mu) || mu < 0) {
    return null;
  }
  if (mu >= LTM_MIN) {
    return 'LTM';
  }
  if (mu >= STM_MIN) {
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
    const inputCount = nodes ? nodes.length : 0;

    if (!nodes || nodes.length === 0 || nodes.length < this.threshold) {
      this.skipped = true;
      this.sweepLog.push({ before: inputCount, ltmProtected: 0, strategy: 'skip_below_threshold', ts: Date.now(), totalDevoured: this.totalDevoured });
      return { skipped: true, merged: [], nodes: nodes || [], survivors: nodes || [], count: inputCount, devoured: [], devoured_count: 0, before: inputCount, after: inputCount, clusterCount: 0, strategy: 'skip_below_threshold' };
    }

    const allLTM = nodes.every(n => (n.mu || 0) >= LTM_MIN);
    if (allLTM) {
      this.skipped = true;
      this.sweepLog.push({ before: nodes.length, ltmProtected: nodes.length, strategy: 'skip_all_ltm', ts: Date.now(), totalDevoured: this.totalDevoured });
      return { skipped: true, merged: [], nodes: nodes, survivors: nodes, count: nodes.length, devoured: [], devoured_count: 0, before: nodes.length, after: nodes.length, clusterCount: 0, strategy: 'skip_all_ltm' };
    }

    this.sweepCount++;
    this.skipped = false;

    // Only nodes at or above the constitutional bar are merged. Everything else
    // is kept as-is, so no node disappears from state without being archived.
    const validNodes = nodes.filter(n => n.mu === undefined || n.mu >= STM_MIN);
    const kept = nodes.filter(n => !validNodes.includes(n));

    const merged = [];
    const devoured = [];
    for (let i = 0; i < validNodes.length; i += this.batchSize) {
      const batch = validNodes.slice(i, i + this.batchSize);
      if (batch.length >= 2) {
        merged.push(mergeCluster(batch));
        devoured.push(...batch);
        this.totalDevoured += batch.length;
      } else {
        kept.push(...batch);
      }
    }

    const survivors = [...kept, ...merged];
    const result = {
      skipped: false,
      merged: merged,
      nodes: survivors,
      survivors: survivors,
      count: survivors.length,
      devoured: devoured,
      devoured_count: devoured.length,
      before: inputCount,
      after: survivors.length,
      clusterCount: merged.length,
      strategy: 'merge'
    };

    this.sweepLog.push({ before: inputCount, ltmProtected: kept.length, strategy: 'merge', ts: Date.now(), totalDevoured: this.totalDevoured });
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
    const mus = nodes.map(n => n.mu || STM_MIN);
    const tiers = nodes.map(n => classifyTier(n.mu || STM_MIN));
    const ltm = nodes.filter(n => (n.mu || 0) >= LTM_MIN).length;
    const stm = nodes.filter(n => (n.mu || 0) >= STM_MIN && (n.mu || 0) < LTM_MIN).length;
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
      return sum + ((n.scores && n.scores[d]) || STM_MIN);
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
    pass: muVal >= STM_MIN,
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
