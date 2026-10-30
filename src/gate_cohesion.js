'use strict';
// M v2 reference: semantic cohesion across sentences (cross-topic multi-sentence splices only).
// Advisory and unwired. Contract: docs/architecture/M_V2_SCORE_CONTRACT.md. Fails open.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'm_v2.json'), 'utf8'));
const STOP = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, CFG.units.stopwords_file), 'utf8')).stopwords);

function configHash(cfg) {
  const { config_hash, ...rest } = cfg;
  return crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex');
}
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const sentSplit = t => t.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
const content = s => (s.toLowerCase().match(/[a-z]+/g) || []).filter(w => w.length >= CFG.units.min_word_len && !STOP.has(w));
function unitsOf(text) {
  return sentSplit(text).filter(s => new Set(content(s)).size >= CFG.units.min_content_words);
}

function basic(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[\p{P}\p{S}]|[^\s\p{P}\p{S}]+/gu) || [];
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
function encode(text, vocab) {
  let toks = ['[CLS]'];
  for (const w of basic(text)) toks.push(...wordpiece(w, vocab));
  toks = toks.slice(0, CFG.tokens.max_len - 1);
  toks.push('[SEP]');
  return toks.map(t => (vocab[t] !== undefined ? vocab[t] : vocab['[UNK]']));
}

const runtimes = new Map();
async function getRuntime(modelDir) {
  const md = path.join(ROOT, modelDir || CFG.model.dir);
  if (runtimes.has(md)) {
    const r = runtimes.get(md);
    if (r instanceof Error) throw r;
    return r;
  }
  try {
    if (configHash(CFG) !== CFG.config_hash) throw new Error('config hash mismatch');
    if (sha256File(path.join(md, CFG.model.file)) !== CFG.model.sha256) throw new Error('model sha256 mismatch');
    if (sha256File(path.join(md, CFG.model.tokenizer_file)) !== CFG.model.tokenizer_sha256) throw new Error('tokenizer sha256 mismatch');
    const ort = require('onnxruntime-node');
    const session = await ort.InferenceSession.create(path.join(md, CFG.model.file));
    const vocab = JSON.parse(fs.readFileSync(path.join(md, CFG.model.tokenizer_file), 'utf8')).model.vocab;
    const r = { ort, session, vocab };
    runtimes.set(md, r);
    return r;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    runtimes.set(md, err);
    throw err;
  }
}

async function embed(rt, text) {
  const ids = encode(text, rt.vocab);
  const n = ids.length;
  const out = await rt.session.run({
    input_ids: new rt.ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, n]),
    attention_mask: new rt.ort.Tensor('int64', BigInt64Array.from(ids.map(() => 1n)), [1, n]),
    token_type_ids: new rt.ort.Tensor('int64', BigInt64Array.from(ids.map(() => 0n)), [1, n]),
  });
  const hid = out[rt.session.outputNames[0]].data;
  const dim = hid.length / n;
  const v = new Float64Array(dim);
  for (let i = 0; i < n; i++) for (let d = 0; d < dim; d++) v[d] += hid[i * dim + d];
  let nm = 0;
  for (let d = 0; d < dim; d++) { v[d] /= n; nm += v[d] * v[d]; }
  nm = Math.sqrt(nm) || 1;
  for (let d = 0; d < dim; d++) v[d] /= nm;
  return v;
}

async function scoreUnits(rt, units) {
  const E = [];
  for (const u of units) E.push(await embed(rt, u));
  let total = 0;
  for (let i = 0; i < E.length; i++) {
    const c = new Float64Array(E[i].length);
    for (let j = 0; j < E.length; j++) if (j !== i) for (let d = 0; d < c.length; d++) c[d] += E[j][d];
    let nn = 0;
    for (let d = 0; d < c.length; d++) nn += c[d] * c[d];
    nn = Math.sqrt(nn) || 1;
    let dot = 0;
    for (let d = 0; d < c.length; d++) dot += E[i][d] * c[d] / nn;
    total += dot;
  }
  return total / E.length;
}

async function gateCohesion(text, opts = {}) {
  const base = { gate: 'M2', mode: CFG.mode, config_hash: CFG.config_hash, threshold: CFG.threshold, blocks: false };
  const us = unitsOf(text);
  if (us.length < 2) return { ...base, verdict: 'abstain', units: us.length, reason: 'fewer than 2 units' };
  let rt;
  try {
    rt = await getRuntime(opts.modelDir);
  } catch (e) {
    return { ...base, verdict: 'unmeasured', units: us.length, reason: String(e.message || e) };
  }
  const score = await scoreUnits(rt, us);
  return { ...base, verdict: score < CFG.threshold ? 'flag' : 'pass', score, units: us.length, reason: 'scored' };
}

module.exports = { gateCohesion, unitsOf, configHash, CFG };
