'use strict';
// BERT-compatible WordPiece encoder. Shared by M2 (gate_cohesion.js) and QC (qc_node.js).
// Follows HF BertNormalizer (clean_text, handle_chinese_chars, lowercase, strip accents) and
// BertPreTokenizer. Checked against @huggingface/tokenizers: docs/validation/M_V2_TOKENIZER_CHECK.json.

function isCJK(cp) {
  return (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF) || (cp >= 0x20000 && cp <= 0x2A6DF) ||
    (cp >= 0x2A700 && cp <= 0x2B73F) || (cp >= 0x2B740 && cp <= 0x2B81F) || (cp >= 0x2B820 && cp <= 0x2CEAF) ||
    (cp >= 0xF900 && cp <= 0xFAFF) || (cp >= 0x2F800 && cp <= 0x2FA1F);
}
function cleanText(s) {
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp === 0 || cp === 0xFFFD) continue;
    if (/\s/.test(ch)) { out += ' '; continue; }
    if (/\p{C}/u.test(ch)) continue;
    out += isCJK(cp) ? ` ${ch} ` : ch;
  }
  return out;
}
function isPunct(ch) {
  const cp = ch.codePointAt(0);
  return (cp >= 33 && cp <= 47) || (cp >= 58 && cp <= 64) || (cp >= 91 && cp <= 96) || (cp >= 123 && cp <= 126) || /\p{P}/u.test(ch);
}
function basic(s) {
  const text = cleanText(s).toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
  const toks = [];
  let cur = '';
  for (const ch of text) {
    if (/\s/.test(ch)) { if (cur) { toks.push(cur); cur = ''; } }
    else if (isPunct(ch)) { if (cur) { toks.push(cur); cur = ''; } toks.push(ch); }
    else cur += ch;
  }
  if (cur) toks.push(cur);
  return toks;
}
function wordpiece(w, vocab) {
  if (w.length > 100) return ['[UNK]'];
  const out = [];
  let st = 0;
  while (st < w.length) {
    let end = w.length, cur = null;
    while (st < end) {
      const sub = (st > 0 ? '##' : '') + w.slice(st, end);
      if (vocab[sub] !== undefined) { cur = sub; break; }
      end--;
    }
    if (cur === null) return ['[UNK]'];
    out.push(cur);
    st = end;
  }
  return out;
}
// Returns ids for [CLS] + pieces + [SEP], truncated so the total is at most maxLen.
function encodeBert(text, vocab, { maxLen = 256 } = {}) {
  let toks = ['[CLS]'];
  for (const w of basic(text)) toks.push(...wordpiece(w, vocab));
  toks = toks.slice(0, maxLen - 1);
  toks.push('[SEP]');
  return toks.map(t => (vocab[t] !== undefined ? vocab[t] : vocab['[UNK]']));
}
module.exports = { encodeBert, basic, wordpiece, cleanText };
