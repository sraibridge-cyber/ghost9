// =====================================================================
// MERKLE BONSAI — GHOST v9.1.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-21_17:19_Tulsa_OK
// =====================================================================
// Merkle tree variant with prunable depth for sovereign memory recall.
// Root = SHA3-512 of branch hashes
// Branches = summaries (high depth, lower fidelity)
// Leaves = full fidelity (low depth, high μ)
// Selective reconstruction: prune μ < τ, expand μ > τ
// =====================================================================

'use strict';

const { createHash } = require('crypto');
const { mu, TAU, TAU_LTM } = require('./coherence_calculus');

const BONSAI_TAU = 0.9995;
const BONSAI_TAU_LTM = 0.9998;

// --- Node Types ---
const NODE_TYPES = {
  LEAF: 'leaf',           // Full fidelity memory node
  BRANCH: 'branch',       // Summary/aggregated node
  ROOT: 'root'            // Top-level integrity anchor
};

// --- Bonsai Node ---
class BonsaiNode {
  constructor(data, type = NODE_TYPES.LEAF, depth = 0) {
    this.id = this._generateId();
    this.type = type;
    this.depth = depth;
    this.data = data;                    // Original content or summary
    this.mu = data.mu !== undefined ? data.mu : 0.9995;         // Coherence score
    this.tier = this.mu >= BONSAI_TAU_LTM ? 'LTM' : (this.mu >= BONSAI_TAU ? 'STM' : null);
    this.children = [];                   // Child node IDs
    this.parent = null;                   // Parent node ID
    this.hash = null;                     // SHA3-512 hash
    this.merkleRoot = null;               // Aggregate hash of subtree
    this.timestamp = Date.now();
    this.pruned = false;                  // Pruning flag
    this._computeHash();
  }

  _generateId() {
    return 'bonsai_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  _computeHash() {
    const hash = createHash('sha3-512');
    hash.update(this.id);
    hash.update(this.type);
    hash.update(String(this.depth));
    hash.update(String(this.mu));
    hash.update(this.data.content || this.data.summary || '');
    this.hash = hash.digest('hex');
  }

  // Compute merkle root from children hashes
  computeMerkleRoot() {
    if (this.children.length === 0) {
      this.merkleRoot = this.hash;
      return this.hash;
    }
    const hash = createHash('sha3-512');
    hash.update(this.hash);
    for (const childId of this.children) {
      // Child merkle roots will be set by the tree
      hash.update(childId);
    }
    this.merkleRoot = hash.digest('hex');
    return this.merkleRoot;
  }

  // Prune if μ < τ (replace with summary)
  shouldPrune() {
    return this.mu < BONSAI_TAU && !this.pruned;
  }

  // Expand if μ > τ_LTM (restore full fidelity)
  shouldExpand() {
    return this.mu >= BONSAI_TAU_LTM && this.pruned;
  }

  // Create summary for pruned node
  summarize() {
    return {
      id: this.id,
      type: NODE_TYPES.BRANCH,
      depth: this.depth,
      mu: this.mu,
      summary: this.data.content ? this.data.content.substring(0, 100) + '...' : 'pruned',
      childCount: this.children.length,
      timestamp: this.timestamp
    };
  }
}

// --- Merkle Bonsai Tree ---
class MerkleBonsai {
  constructor(maxDepth = 10, pruneThreshold = BONSAI_TAU, expandThreshold = BONSAI_TAU_LTM) {
    this.maxDepth = maxDepth;
    this.pruneThreshold = pruneThreshold;
    this.expandThreshold = expandThreshold;
    this.nodes = new Map();               // All nodes by ID
    this.root = null;                     // Root node ID
    this.leafCount = 0;
    this.branchCount = 0;
    this.prunedCount = 0;
    this.operationLog = [];               // Audit trail
  }

  // Add a leaf node (memory entry)
  addLeaf(content, scores, muVal) {
    const data = {
      content: content,
      scores: scores || {},
      mu: muVal || 0.9995
    };
    const node = new BonsaiNode(data, NODE_TYPES.LEAF, 0);
    this.nodes.set(node.id, node);
    this.leafCount++;
    this._log('add_leaf', node.id, node.mu);
    return node.id;
  }

  // Build tree from flat leaves — cluster by μ proximity, then build hierarchy
  buildTree() {
    const leaves = Array.from(this.nodes.values()).filter(n => n.type === NODE_TYPES.LEAF);
    if (leaves.length === 0) return null;

    // Sort by μ descending (highest coherence = deeper in tree = closer to root)
    leaves.sort((a, b) => b.mu - a.mu);

    // Build bottom-up: group leaves into branches, branches into higher branches
    let currentLevel = leaves.map(n => n.id);
    let depth = 1;

    while (currentLevel.length > 1 && depth < this.maxDepth) {
      const nextLevel = [];
      const groupSize = Math.max(2, Math.floor(currentLevel.length / Math.pow(2, depth - 1)));

      for (let i = 0; i < currentLevel.length; i += groupSize) {
        const group = currentLevel.slice(i, i + groupSize);
        const branch = this._createBranch(group, depth);
        nextLevel.push(branch.id);
      }

      currentLevel = nextLevel;
      depth++;
    }

    // Final root
    if (currentLevel.length === 1) {
      this.root = currentLevel[0];
    } else {
      this.root = this._createBranch(currentLevel, depth).id;
    }

    // Compute merkle roots bottom-up
    this._computeMerkleRoots(this.root);

    this._log('build_tree', this.root, currentLevel.length);
    return this.root;
  }

  _createBranch(childIds, depth) {
    // Compute average μ of children
    const childNodes = childIds.map(id => this.nodes.get(id)).filter(Boolean);
    const avgMu = childNodes.reduce((sum, n) => sum + n.mu, 0) / childNodes.length;

    const data = {
      summary: 'Branch at depth ' + depth + ' with ' + childIds.length + ' children',
      mu: avgMu,
      childIds: childIds
    };

    const branch = new BonsaiNode(data, NODE_TYPES.BRANCH, depth);
    branch.children = childIds;
    for (const childId of childIds) {
      const child = this.nodes.get(childId);
      if (child) child.parent = branch.id;
    }

    this.nodes.set(branch.id, branch);
    this.branchCount++;
    return branch;
  }

  _computeMerkleRoots(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    if (node.children.length === 0) {
      node.merkleRoot = node.hash;
      return node.merkleRoot;
    }

    const hash = createHash('sha3-512');
    hash.update(node.hash);
    for (const childId of node.children) {
      const childRoot = this._computeMerkleRoots(childId);
      hash.update(childRoot || '');
    }
    node.merkleRoot = hash.digest('hex');
    return node.merkleRoot;
  }

  // Prune nodes with μ < threshold (replace with summary)
  prune() {
    let pruned = 0;
    for (const [id, node] of this.nodes) {
      if (node.type === NODE_TYPES.LEAF && node.shouldPrune()) {
        // Replace leaf data with summary
        node.data = node.summarize();
        node.type = NODE_TYPES.BRANCH;
        node.pruned = true;
        pruned++;
      }
    }
    this.prunedCount += pruned;
    this._log('prune', null, pruned);
    return pruned;
  }

  // Expand nodes with μ > threshold (restore full fidelity if archived)
  expand() {
    let expanded = 0;
    for (const [id, node] of this.nodes) {
      if (node.shouldExpand()) {
        node.pruned = false;
        // Note: full restoration requires archive access
        expanded++;
      }
    }
    this._log('expand', null, expanded);
    return expanded;
  }

  // Selective reconstruction: return nodes matching query with μ >= minMu
  reconstruct(minMu = BONSAI_TAU, maxDepth = this.maxDepth) {
    const results = [];
    const queue = this.root ? [this.root] : [];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      const node = this.nodes.get(nodeId);
      if (!node) continue;

      if (node.mu >= minMu) {
        results.push({
          id: node.id,
          type: node.type,
          mu: node.mu,
          depth: node.depth,
          data: node.pruned ? node.data.summary : node.data.content,
          hash: node.hash,
          merkleRoot: node.merkleRoot
        });

        // If not at max depth and node has children, queue them
        if (node.depth < maxDepth && node.children.length > 0) {
          queue.push(...node.children);
        }
      }
    }

    return results;
  }

  // Verify integrity: recompute merkle root and compare
  verify() {
    if (!this.root) return { valid: false, reason: 'no_root' };

    const storedRoot = this.nodes.get(this.root).merkleRoot;
    const computedRoot = this._computeMerkleRoots(this.root);

    return {
      valid: storedRoot === computedRoot,
      storedRoot: storedRoot,
      computedRoot: computedRoot,
      nodeCount: this.nodes.size,
      leafCount: this.leafCount,
      branchCount: this.branchCount
    };
  }

  // Get tree statistics
  stats() {
    const nodes = Array.from(this.nodes.values());
    return {
      totalNodes: nodes.length,
      leafCount: this.leafCount,
      branchCount: this.branchCount,
      prunedCount: this.prunedCount,
      maxDepth: this.maxDepth,
      rootDepth: this.root ? this.nodes.get(this.root).depth : 0,
      avgMu: nodes.reduce((sum, n) => sum + n.mu, 0) / nodes.length,
      ltmCount: nodes.filter(n => n.mu >= BONSAI_TAU_LTM).length,
      stmCount: nodes.filter(n => n.mu >= BONSAI_TAU && n.mu < BONSAI_TAU_LTM).length,
      nullCount: nodes.filter(n => n.mu < BONSAI_TAU).length
    };
  }

  _log(operation, nodeId, value) {
    this.operationLog.push({
      operation,
      nodeId,
      value,
      timestamp: Date.now()
    });
  }
}

// --- Fidelity Test: Reconstruction Accuracy ---
function fidelityTest(original, reconstructed) {
  if (!original || !reconstructed) return 0;
  const origContent = original.content || '';
  const reconContent = reconstructed.content || reconstructed.data || '';
  const maxLen = Math.max(origContent.length, reconContent.length);
  if (maxLen === 0) return 1.0;

  // Levenshtein distance approximation for fidelity
  let matches = 0;
  for (let i = 0; i < Math.min(origContent.length, reconContent.length); i++) {
    if (origContent[i] === reconContent[i]) matches++;
  }
  return matches / maxLen;
}

module.exports = { MerkleBonsai, BonsaiNode, NODE_TYPES, fidelityTest, BONSAI_TAU, BONSAI_TAU_LTM };
