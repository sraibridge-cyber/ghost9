// === WordNet reader (hypernym walks) ===
// Reads the WordNet 3.1 dictionary files shipped by the required `wordnet-db` package.
// Lookups read only the bytes they need (positional reads), so memory stays small.
// Used by the M gate (src/gate_semantic.js). No network access.
'use strict';

const fs = require('fs');
const path = require('path');

const DICT = path.join(path.dirname(require.resolve('wordnet-db/package.json')), 'dict');
const POS_FILES = { n: 'noun', v: 'verb', a: 'adj', s: 'adj', r: 'adv' };
const HYPERNYM_POINTERS = new Set(['@', '@i']);

const indexCache = {};
const dataFds = {};

function indexMap(pos) {
  const key = POS_FILES[pos];
  if (!indexCache[key]) {
    const map = new Map();
    const lines = fs.readFileSync(path.join(DICT, `index.${key}`), 'utf8').split('\n');
    for (const line of lines) {
      if (!line || line.startsWith('  ')) continue;
      const f = line.split(' ');
      const lemma = f[0];
      const ptrCount = parseInt(f[3], 10);
      const synCount = parseInt(f[2], 10);
      const offsets = f.slice(4 + ptrCount + 2, 4 + ptrCount + 2 + synCount).map(x => parseInt(x, 10));
      map.set(lemma, offsets);
    }
    indexCache[key] = map;
  }
  return indexCache[key];
}

function dataFd(pos) {
  const key = POS_FILES[pos];
  if (!dataFds[key]) dataFds[key] = fs.openSync(path.join(DICT, `data.${key}`), 'r');
  return dataFds[key];
}

// Parses one synset line at a byte offset in data.<pos>.
function synset(pos, offset) {
  const fd = dataFd(pos);
  const buf = Buffer.alloc(8192);
  const n = fs.readSync(fd, buf, 0, buf.length, offset);
  const line = buf.toString('utf8', 0, n).split('\n')[0];
  const [head, gloss = ''] = line.split(' | ');
  const f = head.split(' ');
  const wCnt = parseInt(f[3], 16);
  const words = [];
  for (let i = 0; i < wCnt; i++) words.push(f[4 + i * 2].replace(/\(.*\)$/, '').toLowerCase());
  const ptrStart = 4 + wCnt * 2;
  const pCnt = parseInt(f[ptrStart], 10);
  const pointers = [];
  for (let i = 0; i < pCnt; i++) {
    const base = ptrStart + 1 + i * 4;
    pointers.push({ symbol: f[base], offset: parseInt(f[base + 1], 10), pos: f[base + 2] });
  }
  return { offset, pos: f[2], words, pointers, gloss: gloss.trim() };
}

// Synset offsets for a lemma. pos: 'n', 'v', 'a', 'r'.
function synsets(lemma, pos = 'n') {
  return indexMap(pos).get(lemma.toLowerCase()) || [];
}

// Set of 'pos:offset' keys reachable by walking hypernyms up to maxDepth from the lemma's senses.
function hypernymClosure(lemma, pos = 'n', maxDepth = 6) {
  const seen = new Set();
  let frontier = synsets(lemma, pos).map(o => ({ pos, offset: o, depth: 0 }));
  while (frontier.length) {
    const next = [];
    for (const node of frontier) {
      const key = `${node.pos}:${node.offset}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (node.depth >= maxDepth) continue;
      const s = synset(node.pos, node.offset);
      for (const p of s.pointers) {
        if (!HYPERNYM_POINTERS.has(p.symbol)) continue;
        next.push({ pos: p.pos, offset: p.offset, depth: node.depth + 1 });
      }
    }
    frontier = next;
  }
  return seen;
}

module.exports = { synsets, synset, hypernymClosure, DICT };
