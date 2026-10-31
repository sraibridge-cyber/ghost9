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

function gateSemanticLegacy(text) {
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


// ===== M gate v2 (contract: docs/architecture/M_GATE_CONTRACT.md) =====
// Meaning only. Flags: coordinated contradictions, self-contradictory modifier-noun pairs,
// and selectional anomalies (an inanimate subject with a verb that needs an animate agent).
// Animacy comes from WordNet hypernyms. The opposite and self-contradictory pairs are a closed list, documented in the contract.
const wn = require('./wordnet');
const { tagSentences } = require('./cc_features');

const OPPOSITES = [['open','closed'],['alive','dead'],['true','false'],['full','empty'],['hot','cold'],['early','late'],['awake','asleep'],['present','absent']];
const SELF_CONTRADICTORY = [['square','circle'],['round','square'],['square','triangle'],['married','bachelor']];
const ANIMATE_VERBS = new Set(['eat','sleep','think','love','dance','whisper','read','drive','write','laugh','cry','dream','breathe','talk','walk','smile','sing']);
const ANIMATE_PRONOUNS = new Set(['he','she','they','i','we','you','who']);
const ANIMATE_ROOTS = ['organism', 'person', 'animal', 'living_thing'];

let rootKeys = null;
function animateRootKeys() {
  if (rootKeys) return rootKeys;
  rootKeys = new Set();
  for (const r of ANIMATE_ROOTS) {
    try { for (const off of wn.synsets(r, 'n').slice(0, 2)) rootKeys.add(`n:${off}`); } catch (e) { /* missing root */ }
  }
  return rootKeys;
}
const animacyCache = new Map();
function isAnimateNoun(lemma) {
  if (animacyCache.has(lemma)) return animacyCache.get(lemma);
  let ok = false;
  try {
    const closure = wn.firstSenseClosure(lemma, 'n', 10);
    const roots = animateRootKeys();
    for (const k of closure) if (roots.has(k)) { ok = true; break; }
  } catch (e) { ok = false; }
  animacyCache.set(lemma, ok);
  return ok;
}
function verbLemma(word) {
  if (ANIMATE_VERBS.has(word)) return word;
  for (const suf of ['es', 's', 'ed', 'ing']) {
    if (word.endsWith(suf)) {
      const stem = word.slice(0, -suf.length);
      if (ANIMATE_VERBS.has(stem)) return stem;
      if (ANIMATE_VERBS.has(stem + 'e')) return stem + 'e';
    }
  }
  return null;
}

function contradictions(words) {
  const hits = [];
  const set = new Set(words);
  for (const [a, b] of OPPOSITES) {
    if (!set.has(a) || !set.has(b)) continue;
    // Only a coordinated pair counts: "X and Y" with the two words adjacent to "and".
    for (let i = 1; i < words.length - 1; i++) {
      if (words[i] !== 'and') continue;
      const l = words[i - 1], r = words[i + 1];
      if ((l === a && r === b) || (l === b && r === a)) hits.push({ type: 'contradiction', pair: [a, b] });
    }
  }
  if (set.has('always') && set.has('never')) hits.push({ type: 'contradiction', pair: ['always', 'never'] });
  for (const [a, b] of SELF_CONTRADICTORY) {
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i] === a && words[i + 1] === b) hits.push({ type: 'self_contradiction', pair: [a, b] });
    }
  }
  return hits;
}

function selectional(tags) {
  const hits = [];
  for (let i = 0; i < tags.length; i++) {
    const verb = verbLemma(tags[i].word);
    if (!verb) continue;
    // Subject: nearest noun or pronoun before the verb, skipping determiners and adjectives.
    let j = i - 1;
    while (j >= 0 && !['NN', 'NNS', 'NNP', 'NNPS', 'PRP'].includes(tags[j].pos)) j--;
    if (j < 0) continue;
    const subj = tags[j].word;
    if (tags[j].pos === 'PRP') {
      if (!ANIMATE_PRONOUNS.has(subj)) hits.push({ type: 'selectional', subject: subj, verb });
      continue;
    }
    const lemma = subj.endsWith('s') && !isAnimateNoun(subj) ? subj.replace(/s$/, '') : subj;
    if (!isAnimateNoun(lemma) && !isAnimateNoun(subj)) hits.push({ type: 'selectional', subject: subj, verb });
  }
  return hits;
}

function gateSemantic(text) {
  const sentences = tagSentences(text);
  const violations = [];
  for (const s of sentences) {
    const words = s.tags.map(t => t.word);
    for (const h of contradictions(words)) violations.push(h);
    for (const h of selectional(s.tags)) violations.push(h);
  }
  return {
    passed: violations.length === 0,
    violations,
    categoryHits: [],
    cohesion: null,
    words: sentences.reduce((n, s) => n + s.tags.length, 0),
  };
}

module.exports = { gateSemantic, gateSemanticLegacy, contentWords: typeof contentWords === 'function' ? contentWords : undefined, closureOf: typeof closureOf === 'function' ? closureOf : undefined, isAnimateNoun };
