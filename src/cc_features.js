// =====================================================================
// CC FEATURES — measured properties of a text, with no hand-written word lists.
// Syntax comes from a POS tagger (wink-pos-tagger; its trained lexicon ships
// inside the package). Everything else is counted from the text itself.
// =====================================================================
'use strict';

let _tagger = null;
function tagger() {
  if (!_tagger) _tagger = require('wink-pos-tagger')();
  return _tagger;
}

const WORD = /[A-Za-z]+(?:'[A-Za-z]+)?/g;
const FINITE = new Set(['VBZ', 'VBD', 'VBP', 'MD']);
const SUBJECT = new Set(['NN', 'NNS', 'NNP', 'NNPS', 'PRP', 'CD', 'EX', 'WP']);
const NOUN = new Set(['NN', 'NNS', 'NNP', 'NNPS']);
const CONNECTIVE = new Set(['CC', 'IN']);

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\[])|\n+/)
    .map(s => s.trim())
    .filter(s => /[A-Za-z]/.test(s));
}

// Tag each sentence; returns [{ text, tags: [{word, pos}] }]
function tagSentences(text) {
  return splitSentences(text).map(s => {
    const toks = tagger().tagSentence(s).filter(t => /[A-Za-z]/.test(t.value));
    return { text: s, tags: toks.map(t => ({ word: t.value.toLowerCase(), pos: t.pos })) };
  });
}

// McCarthy's MTLD: mean run length before the type-token ratio drops below 0.72.
function mtldOneWay(words, threshold = 0.72) {
  if (words.length === 0) return 0;
  let factors = 0;
  let types = new Set();
  let count = 0;
  for (const w of words) {
    count++;
    types.add(w);
    if (types.size / count <= threshold) {
      factors++;
      types = new Set();
      count = 0;
    }
  }
  if (count > 0) {
    const ttr = types.size / count;
    factors += (1 - ttr) / (1 - threshold);
  }
  return factors === 0 ? words.length : words.length / factors;
}

function mtld(words) {
  if (words.length < 10) return words.length; // too short for a stable estimate
  const fwd = mtldOneWay(words);
  const bwd = mtldOneWay(words.slice().reverse());
  return (fwd + bwd) / 2;
}

function trigramRepeatRate(words) {
  if (words.length < 3) return 0;
  const grams = [];
  for (let i = 0; i + 2 < words.length; i++) grams.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
  const unique = new Set(grams).size;
  return 1 - unique / grams.length;
}

// Extract raw features. Returns { F, sentences }.
function extract(text) {
  const sentences = tagSentences(text);
  const allWords = [];
  let connectives = 0;
  let nouns = 0;
  let wordCount = 0;
  let finiteSentences = 0;
  let svoSentences = 0;
  let capitalStarts = 0;

  for (const s of sentences) {
    const tags = s.tags;
    if (tags.length === 0) continue;
    for (const t of tags) {
      allWords.push(t.word);
      wordCount++;
      if (CONNECTIVE.has(t.pos)) connectives++;
      if (NOUN.has(t.pos)) nouns++;
    }
    const firstFinite = tags.findIndex(t => FINITE.has(t.pos));
    const imperative = tags[0].pos === 'VB';
    if (firstFinite >= 0) finiteSentences++;
    if (firstFinite >= 0) {
      const subjectBefore = tags.slice(0, firstFinite).some(t => SUBJECT.has(t.pos));
      if (subjectBefore || imperative) svoSentences++;
    } else if (imperative) {
      svoSentences++;
    }
    if (/^[A-Z]/.test(s.text)) capitalStarts++;
  }

  const n = sentences.length || 1;
  const wc = wordCount || 1;
  const F = {
    mtld: mtld(allWords),
    repeat: trigramRepeatRate(allWords),
    finite: finiteSentences / n,
    svo: svoSentences / n,
    capital: capitalStarts / n,
    sentence_len: wordCount / n,
    connective: connectives / wc,
    nominal: nouns / wc,
  };
  return { F, sentences, wordCount };
}

// Tag-sequence transitions for each sentence, used to score tag surprisal.
function tagSequences(sentences) {
  return sentences.map(s => s.tags.map(t => t.pos));
}

module.exports = { extract, tagSequences, tagSentences, mtld, trigramRepeatRate, splitSentences };
