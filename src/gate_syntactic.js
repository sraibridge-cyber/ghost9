// =====================================================================
// S-GATE v3 — syntactic well-formedness from POS tags, no word lists.
// Checks per sentence: a finite verb exists (or the sentence is imperative),
// a subject precedes the first finite verb, no run of three or more verbs,
// no determiner directly after a determiner, balanced brackets and quotes.
// The tagger's trained lexicon ships inside wink-pos-tagger.
// Previous version (closed verb and subject lists) is in archive/superseded/.
// =====================================================================
'use strict';

const { tagSentences } = require('./cc_features');

const FINITE = new Set(['VBZ', 'VBD', 'VBP', 'MD']);
// JJ counts as a possible subject head: the tagger often labels a noun before a verb as JJ.
const SUBJECT = new Set(['NN', 'NNS', 'NNP', 'NNPS', 'PRP', 'CD', 'EX', 'WP', 'JJ']);
// A past participle directly after a noun is usually a simple past the tagger mislabelled.
const SUBJECT_HEAD = new Set(['NN', 'NNS', 'NNP', 'NNPS', 'PRP']);
const VERB = /^VB/;

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

function checkSentence(tags) {
  const v = [];
  if (tags.length < 2) { v.push('too_short'); return v; }
  const imperative = tags[0].pos === 'VB';
  const finiteAt = i => FINITE.has(tags[i].pos) || (tags[i].pos === 'VBN' && i > 0 && SUBJECT_HEAD.has(tags[i - 1].pos));
  let firstFinite = -1;
  for (let i = 0; i < tags.length; i++) { if (finiteAt(i)) { firstFinite = i; break; } }
  if (firstFinite < 0 && !imperative) v.push('missing_verb');
  if (firstFinite >= 0 && !imperative && !tags.slice(0, firstFinite).some(t => SUBJECT.has(t.pos))) {
    v.push('missing_subject');
  }
  let run = 0;
  for (const t of tags) {
    run = VERB.test(t.pos) ? run + 1 : 0;
    if (run >= 3) { v.push('verb_pile'); break; }
  }
  for (let i = 1; i < tags.length; i++) {
    if (tags[i - 1].pos === 'DT' && tags[i].pos === 'DT') { v.push('double_determiner'); break; }
  }
  return v;
}

function gateSyntactical(text) {
  const sentences = tagSentences(text);
  const violations = [];
  let clean = 0;
  for (const s of sentences) {
    const vs = checkSentence(s.tags);
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

module.exports = { gateSyntactical, checkSentence, punctuationBalanced };
