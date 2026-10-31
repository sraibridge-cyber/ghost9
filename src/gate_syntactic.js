// =====================================================================
// S-GATE v4 — syntactic well-formedness (contract: docs/architecture/S_GATE_CONTRACT.md)
// Structure only. Checks: a finite verb or accepted fragment, a subject before the first finite verb,
// no verb pile in an imperative, no determiner followed by a determiner, balanced brackets and quotes.
// Verb forms the tagger mislabels (e.g. "runs" as NNS after a subject) are repaired with WordNet verb lemmas.
// =====================================================================
'use strict';

const { tagSentences } = require('./cc_features');
const wn = require('./wordnet');

const FINITE = new Set(['VBZ', 'VBD', 'VBP', 'MD']);
const SUBJECT_HEAD = new Set(['NN', 'NNS', 'NNP', 'NNPS', 'PRP', 'CD', 'EX', 'WP']);
const NOMINAL = new Set(['DT', 'NN', 'NNS', 'NNP', 'NNPS', 'JJ', 'JJR', 'JJS', 'CD', 'POS', 'PRP$', 'IN', 'TO', 'CC']);
const DET = new Set(['DT', 'PRP$']);
const VERB = /^VB/;
// Auxiliaries and modals, including the stems of contractions (ca for can't, wo for won't).
const AUX = new Set(['be', 'been', 'being', 'am', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ca', 'wo']);

const cache = new Map();
function isVerbLemma(l) {
  if (!l || l.length < 2) return false;
  if (cache.has(l)) return cache.get(l);
  let ok = false;
  try { ok = wn.synsets(l, 'v').length > 0; } catch (e) { ok = false; }
  cache.set(l, ok);
  return ok;
}
// A third-person or past form that WordNet knows as a verb (runs -> run, whispers -> whisper).
function isVerbForm(w) {
  if (isVerbLemma(w)) return true;
  if (w.endsWith('ies')) return isVerbLemma(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) return isVerbLemma(w.slice(0, -2)) || isVerbLemma(w.slice(0, -1));
  if (w.endsWith('s')) return isVerbLemma(w.slice(0, -1));
  if (w.endsWith('ed')) return isVerbLemma(w.slice(0, -2)) || isVerbLemma(w.slice(0, -1));
  if (w.endsWith('ing')) return isVerbLemma(w.slice(0, -3)) || isVerbLemma(w.slice(0, -3) + 'e');
  return false;
}

function punctuationBalanced(text) {
  const pairs = [['(', ')'], ['[', ']'], ['{', '}']];
  for (const [o, c] of pairs) {
    let depth = 0;
    for (const ch of text) {
      if (ch === o) depth++;
      else if (ch === c) depth--;
      if (depth < 0) return false;
    }
    if (depth !== 0) return false;
  }
  return (text.match(/"/g) || []).length % 2 === 0;
}

function checkSentence(tags, text = '') {
  const v = [];
  // One-token fragments: commands, interjections, a bare noun.
  if (tags.length === 1) {
    if (['VB', 'UH', 'NN', 'NNS', 'NNP', 'CD'].includes(tags[0].pos)) return v;
    v.push('too_short');
    return v;
  }
  if (tags.length < 2) { v.push('too_short'); return v; }

  // Negative imperative: "Don't go." tags as do / n't / VB.
  const negImperative = tags[0].word === 'do' && tags[1].word === "n't" && tags[2] && tags[2].pos === 'VB';
  const imperative = tags[0].pos === 'VB' || negImperative;
  // A verb followed directly by another verb in an imperative is a verb pile: "Run walk jump."
  if (imperative && tags.length > 1) {
    const second = tags[negImperative ? 3 : 1];
    if (second && VERB.test(second.pos) && !AUX.has(second.word)) { v.push('verb_pile'); return v; }
  }

  const finiteAt = i => {
    const t = tags[i];
    if (FINITE.has(t.pos)) return true;
    if (t.pos === 'VBN' && i > 0 && SUBJECT_HEAD.has(tags[i - 1].pos)) return true;
    // Mislabelled verb after a subject: "She runs fast." tags runs as NNS.
    if (i > 0 && ['NNS', 'NN', 'VBP', 'VB'].includes(t.pos) && ['PRP', 'NN', 'NNS', 'NNP', 'NNPS'].includes(tags[i - 1].pos) && isVerbForm(t.word)) return true;
    return false;
  };
  let firstFinite = -1;
  for (let i = 0; i < tags.length; i++) { if (finiteAt(i)) { firstFinite = i; break; } }

  // Accepted fragments with no verb: noun phrases ("The dog's bone."), and a participle headline with a number ("Born on 1990-01-01.").
  const nominalOnly = firstFinite < 0 && tags.every(t => NOMINAL.has(t.pos));
  const numberedHeadline = firstFinite < 0 && tags[0].pos === 'VBN' && (tags.some(t => t.pos === 'CD') || /\d/.test(text));
  if (firstFinite < 0 && !imperative && !nominalOnly && !numberedHeadline) v.push('missing_verb');

  // Questions invert: "How do I file..." has the subject after the auxiliary.
  const inverted = firstFinite >= 0 && AUX.has(tags[firstFinite].word) &&
    tags.slice(firstFinite + 1).some(t => SUBJECT_HEAD.has(t.pos));
  if (firstFinite >= 0 && !imperative && !inverted && !tags.slice(0, firstFinite).some(t => SUBJECT_HEAD.has(t.pos))) {
    v.push('missing_subject');
  }

  // Runs of finite verbs (auxiliaries and modals stack legitimately).
  let run = 0;
  for (const t of tags) {
    run = VERB.test(t.pos) && !AUX.has(t.word) ? run + 1 : 0;
    if (run >= 3) { v.push('verb_pile'); break; }
  }

  // A determiner or possessive must head a noun: no determiner directly before another determiner, relative word, or the end of the sentence.
  for (let i = 0; i < tags.length; i++) {
    if (!DET.has(tags[i].pos)) continue;
    const next = tags[i + 1];
    if (!next || ['DT', 'PRP$', 'WDT'].includes(next.pos)) { v.push('double_determiner'); break; }
  }
  return v;
}

function gateSyntactical(text) {
  const sentences = tagSentences(text);
  const violations = [];
  let clean = 0;
  for (const s of sentences) {
    const vs = checkSentence(s.tags, s.text);
    if (vs.length === 0) clean++;
    for (const type of vs) violations.push({ type, sentence: s.text.slice(0, 80) });
  }
  if (!punctuationBalanced(text)) violations.push({ type: 'punctuation_unbalanced' });
  const passed = violations.length === 0 && sentences.length > 0;
  const score = sentences.length === 0 ? 0 : clean / sentences.length;
  return {
    passed,
    violations,
    score: parseFloat(score.toFixed(4)),
    details: { sentences: sentences.length, tokens: sentences.reduce((n, s) => n + s.tags.length, 0) },
  };
}

module.exports = { gateSyntactical, checkSentence, punctuationBalanced, isVerbForm };
