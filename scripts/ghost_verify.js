// ================================================================
// GHOST v9.0.1 — Chain Integrity Verifier
// Usage: node scripts/ghost_verify.js [state_file]
// Output: PASS | TAMPER | EMPTY
// Requires: Node.js ≥ 18 (native SHA3-512, no npm deps)
// ================================================================
'use strict';

const { createHash } = require('crypto');
const fs             = require('fs');
const path           = require('path');

const STATE_PATH = process.argv[2]
  || path.join(__dirname, '..', 'data', 'state.json');

function computeMerkle(nodes) {
  if (nodes.length === 0) return null;
  let layer = nodes.map(n => n.hash);
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const pair = layer[i] + (layer[i + 1] || layer[i]);
      next.push(createHash('sha3-512').update(pair).digest('hex'));
    }
    layer = next;
  }
  return layer[0];
}

if (!fs.existsSync(STATE_PATH)) {
  console.log('EMPTY — no state file found at', STATE_PATH);
  process.exit(0);
}

let state;
try {
  state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
} catch (e) {
  console.error('ERROR — cannot parse state.json:', e.message);
  process.exit(2);
}

const nodes = state.nodes || [];

if (nodes.length === 0) {
  console.log('EMPTY — kernel has no nodes');
  process.exit(0);
}

let badHashes = 0;
for (const node of nodes) {
  if (!node.hash) { badHashes++; continue; }
  const expected = createHash('sha3-512')
    .update(`${node.content}|${node.ts}`)
    .digest('hex');
  if (node._isMerge || node.merge_count > 1) continue;
  if (expected !== node.hash) badHashes++;
}

const computed = computeMerkle(nodes);
const stored   = state.merkle_root;

console.log('═══════════════════════════════════════════════');
console.log('  GHOST v9.0.1 — Chain Integrity Verifier');
console.log('═══════════════════════════════════════════════');
console.log(`  Nodes:            ${nodes.length}`);
console.log(`  STM nodes:        ${nodes.filter(n => (n.tier||'STM') === 'STM').length}`);
console.log(`  LTM nodes:        ${nodes.filter(n => (n.tier||'STM') === 'LTM').length}`);
console.log(`  Merged super-nodes: ${nodes.filter(n => n.merge_count > 1).length}`);
console.log(`  Bad hashes:       ${badHashes}`);
console.log('');
console.log(`  Stored Merkle:    ${stored ? stored.slice(0,32) + '…' : '(null)'}`);
console.log(`  Computed Merkle:  ${computed ? computed.slice(0,32) + '…' : '(null)'}`);
console.log('');

if (!stored) {
  console.log('  STATUS: EMPTY (no stored root)');
  process.exit(0);
}

if (computed === stored && badHashes === 0) {
  console.log('  STATUS: ✅ PASS — chain integrity confirmed');
  process.exit(0);
} else if (badHashes > 0) {
  console.log(`  STATUS: ❌ TAMPER — ${badHashes} node hash(es) invalid`);
  process.exit(1);
} else {
  console.log('  STATUS: ❌ TAMPER — Merkle root mismatch');
  process.exit(1);
}
