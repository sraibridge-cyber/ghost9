// gate_lexical.js v2.2 — Pure Lexical Gate
// CSS Labs | Kyle S. Whitlock
// Scope: "Is every word a valid English word?"
// Seal: 2026-07-11_12:15_Tulsa_OK

const fs = require('fs');
const path = require('path');

const CORE = [
  'the','be','to','of','and','a','in','that','have','i',
  'it','for','not','on','with','he','as','you','do','at',
  'this','but','his','by','from','they','we','say','her','she',
  'or','an','will','my','one','all','would','there','their','what',
  'so','up','out','if','about','who','get','which','go','me',
  'when','make','can','like','time','no','just','him','know','take',
  'people','into','year','your','good','some','could','them','see','other',
  'than','then','now','look','only','come','its','over','think','also',
  'back','after','use','two','how','our','work','first','well','way',
  'even','new','want','because','any','these','give','day','most','us'
];

const wordSet = new Set(CORE);

// Load extended wordlist from JSON if available
const extPath = path.join(__dirname, 'gate_lexical_words.json');
try {
  if (fs.existsSync(extPath)) {
    const extra = JSON.parse(fs.readFileSync(extPath, 'utf8'));
    extra.forEach(w => wordSet.add(w));
  }
} catch (e) { /* core only */ }

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z]+/g) || []);
}

function scanLexical(text) {
  const words = tokenize(text);
  if (words.length === 0) {
    return { pass: false, gate: 'lexical', reason: 'no_words_found', checked: 0, unknown: [] };
  }
  const unknown = words.filter(w => !wordSet.has(w));
  return {
    pass: unknown.length === 0,
    gate: 'lexical',
    reason: unknown.length === 0 ? 'all_words_valid' : 'unknown_words_found',
    checked: words.length,
    unknown: unknown
  };
}

module.exports = { scanLexical, tokenize, wordCount: wordSet.size };
