// === M gate: WordNet semantic categories and cohesion ===
// Two signals, both from WordNet hypernym closures (src/wordnet.js):
//  1. Harm categories: content words whose hypernyms reach a configured harm root.
//     Blocks when at least min_category_hits distinct words do.
//  2. Cohesion: share of content words with a non-generic hypernym shared by another word.
//     Blocks when it falls below cohesion_min (word salad has little shared ancestry).
// Config: config/m_gate.json. Lists are removed; the categories are WordNet roots.
'use strict';

const fs = require('fs');
const path = require('path');
const W = require('./wordnet');

const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'm_gate.json'), 'utf8'));
const STOP = new Set(CFG.stopwords);

function firstSense(lemma) {
  const offsets = W.synsets(lemma, 'n');
  return offsets.length ? `n:${offsets[0]}` : null;
}
const ROOT_KEYS = new Set(CFG.categories.map(firstSense).filter(Boolean));
const GENERIC_KEYS = new Set();
for (const lemma of CFG.generic_lemmas) {
  for (const k of W.hypernymClosure(lemma, 'n', 2)) GENERIC_KEYS.add(k);
}

const closureCache = new Map();
function closureOf(word) {
  if (!closureCache.has(word)) {
    const set = new Set();
    for (const pos of ['n', 'v']) {
      for (const k of W.hypernymClosure(word, pos, CFG.max_depth)) {
        if (!GENERIC_KEYS.has(k)) set.add(k);
      }
    }
    closureCache.set(word, set);
  }
  return closureCache.get(word);
}

function contentWords(text) {
  const words = (text.toLowerCase().match(/[a-z]+/g) || []).filter(w => w.length >= 3 && !STOP.has(w));
  return [...new Set(words)];
}

function cohesionOf(words) {
  const sets = words.map(w => closureOf(w));
  const withSense = sets.map((s, i) => i).filter(i => sets[i].size > 0);
  if (withSense.length === 0) return 0;
  let linked = 0;
  for (const i of withSense) {
    const hasPartner = withSense.some(j => j !== i && [...sets[i]].some(k => sets[j].has(k)));
    if (hasPartner) linked++;
  }
  return linked / withSense.length;
}

function gateSemantic(text) {
  const words = contentWords(text);
  const categoryHits = words.filter(w => [...closureOf(w)].some(k => ROOT_KEYS.has(k)));
  const violations = [];
  if (categoryHits.length >= CFG.min_category_hits) {
    violations.push({ domain: 'harm_category', words: categoryHits });
  }
  let cohesion = null;
  if (words.length >= CFG.min_words_for_cohesion) {
    cohesion = cohesionOf(words);
    if (cohesion < CFG.cohesion_min) violations.push({ domain: 'cohesion', value: parseFloat(cohesion.toFixed(3)) });
  }
  return { passed: violations.length === 0, violations, categoryHits, cohesion, words: words.length };
}

module.exports = { gateSemantic, contentWords, closureOf };
