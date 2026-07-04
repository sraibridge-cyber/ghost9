// reconstruction_pipeline.js — Reconstruction Engine v9.1.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-07-04_12:48_Tulsa_OK
// Metabolic cycle: archive → recall → reconstruct → verify → rehydrate

const crypto = require('crypto');
const { classifyTier } = require('./taotie');

// ============================================
// ReconstructionPipeline — Sovereign Memory Recall
// ============================================
class ReconstructionPipeline {
  constructor(options = {}) {
    this.nodeStore = options.nodeStore || new Map();      // hash → node lookup
    this.bonsai = options.bonsai || null;                  // MerkleBonsai instance
    this.recallLog = [];                                    // audit trail
    this.fidelityThreshold = options.fidelityThreshold || 0.85;
    this.minMu = options.minMu || 0.9995;
    this.maxDepth = options.maxDepth || 10;
  }

  // --- Store a node for later reconstruction ---
  index(node) {
    if (!node || !node.hash) return false;
    this.nodeStore.set(node.hash, node);
    return true;
  }

  // --- Batch index multiple nodes ---
  indexBatch(nodes) {
    let count = 0;
    for (const n of nodes) {
      if (this.index(n)) count++;
    }
    return count;
  }

  // --- RECALL: Retrieve a merged node's parents by parent_ids ---
  recall(mergedNode) {
    if (!mergedNode || !mergedNode._isMerge) {
      return { success: false, error: 'Not a merge node', parents: [] };
    }

    const parent_ids = mergedNode.parent_ids || [];
    const parents = [];
    const missing = [];

    for (const pid of parent_ids) {
      const parent = this.nodeStore.get(pid);
      if (parent) {
        parents.push(parent);
      } else {
        missing.push(pid);
      }
    }

    const result = {
      hash: mergedNode.hash,
      success: missing.length === 0,
      parents: parents,
      missing: missing,
      parentCount: parent_ids.length,
      recoveredCount: parents.length,
      fidelity: null,  // populated by reconstruct
      timestamp: Date.now()
    };

    this.recallLog.push({
      action: 'recall',
      hash: mergedNode.hash,
      parentCount: parent_ids.length,
      recoveredCount: parents.length,
      missingCount: missing.length,
      ts: Date.now()
    });

    return result;
  }

  // --- RECONSTRUCT: Rebuild from recalled parents ---
  reconstruct(recallResult) {
    if (!recallResult.success || recallResult.parents.length === 0) {
      return { ...recallResult, reconstructed: null, fidelity: 0 };
    }

    const parents = recallResult.parents;
    
    // Reconstruct content by joining parent contents
    const contents = parents.map(n => n.content || n.input || '').join(' | ');
    const reconstructedContent = 'TAOTIE_MERGED: ' + contents.substring(0, 200);
    
    // Reconstruct scores by averaging parent scores
    const oldDomains = ['signal', 'energy', 'temporal', 'spatial', 'cognitive', 'ethical', 'declarative', 'novelty'];
    const scores = {};
    for (const d of oldDomains) {
      scores[d] = parents.reduce((sum, n) => {
        return sum + ((n.scores && n.scores[d]) || 0.9995);
      }, 0) / parents.length;
    }
    
    // Compute μ via geometric mean
    const scoreValues = Object.values(scores);
    const muVal = Math.exp(scoreValues.reduce((sum, s) => sum + Math.log(s), 0) / scoreValues.length);
    
    // Build reconstructed node
    const reconstructed = {
      scores: scores,
      mu: muVal,
      pass: muVal >= 0.9995,
      tier: classifyTier(muVal),
      vertex: 'PPPP',
      content: reconstructedContent,
      parent_ids: parents.map(n => n.hash),
      hash: recallResult.hash || computeHash({ scores, mu, content }),
      merge_count: parents.length,
      _isMerge: true,
      timestamp: Date.now()
    };

    // Compute fidelity against original merged node (if available)
    const fidelity = this.fidelityTest(recallResult, reconstructed);

    return {
      ...recallResult,
      reconstructed: reconstructed,
      fidelity: fidelity,
      verified: fidelity >= this.fidelityThreshold
    };
  }

  // --- FIDELITY TEST: Compare recalled vs reconstructed ---
  fidelityTest(recallResult, reconstructed) {
    // Find the original merged node in store
    const original = this.nodeStore.get(recallResult.hash);
    if (!original || !original.content) return 0;

    const origContent = original.content || '';
    const reconContent = reconstructed.content || '';

    // Levenshtein distance approximation
    const maxLen = Math.max(origContent.length, reconContent.length);
    if (maxLen === 0) return 1.0;

    let matches = 0;
    for (let i = 0; i < Math.min(origContent.length, reconContent.length); i++) {
      if (origContent[i] === reconContent[i]) matches++;
    }
    
    // Also compare μ values
    const muDiff = Math.abs((original.mu || 0) - (reconstructed.mu || 0));
    const muFidelity = Math.max(0, 1 - muDiff);

    // Combined fidelity: 70% content, 30% μ
    const contentFidelity = matches / maxLen;
    return (contentFidelity * 0.7) + (muFidelity * 0.3);
  }

  // --- REHYDRATE: Return verified reconstructed node to active memory ---
  rehydrate(reconstructResult) {
    if (!reconstructResult.verified) {
      return { success: false, error: 'Fidelity below threshold', fidelity: reconstructResult.fidelity };
    }

    const node = reconstructResult.reconstructed;
    
    // Re-index the reconstructed node (it becomes a first-class citizen)
    this.index(node);

    this.recallLog.push({
      action: 'rehydrate',
      hash: node.hash,
      fidelity: reconstructResult.fidelity,
      ts: Date.now()
    });

    return {
      success: true,
      node: node,
      fidelity: reconstructResult.fidelity,
      tier: node.tier
    };
  }

  // --- FULL PIPELINE: recall → reconstruct → verify → rehydrate ---
  process(mergedNode) {
    const recallResult = this.recall(mergedNode);
    const reconstructResult = this.reconstruct(recallResult);
    return this.rehydrate(reconstructResult);
  }

  // --- STATS: Pipeline performance metrics ---
  stats() {
    const recalls = this.recallLog.filter(l => l.action === 'recall');
    const rehydrates = this.recallLog.filter(l => l.action === 'rehydrate');
    return {
      totalRecalls: recalls.length,
      totalRehydrates: rehydrates.length,
      successRate: recalls.length > 0 ? rehydrates.length / recalls.length : 0,
      storeSize: this.nodeStore.size,
      lastActivity: this.recallLog.length > 0 ? this.recallLog[this.recallLog.length - 1].ts : 0
    };
  }
}

module.exports = { ReconstructionPipeline };
