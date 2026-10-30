'use strict';
// QC (local classifier, toxic-bert) on the Node runtime. Same model, tokenizer and scoring as
// services/clf/clf_service.py: max length 128, pad to 128, sigmoid, highest label, 6 decimals.
// Model parts and tokenizer are checked against SHA3-512 pins in models/toxic-bert/manifest.json.
// Fail-open is the caller's job; this module throws on load failure and the caller records it.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { encodeBert } = require('./wordpiece');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'models', 'toxic-bert');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
const CLF = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'clf.json'), 'utf8'));
const MAX_LEN = 128;
const sha3 = b => crypto.createHash('sha3-512').update(b).digest('hex');

function loadModelBytes() {
  const entry = MANIFEST.files.find(f => f.name === 'model_quantized.onnx');
  const parts = entry.chunks.map(c => {
    const b = fs.readFileSync(path.join(DIR, c.name));
    if (b.length !== c.size || sha3(b) !== c.sha3_512) throw new Error(`qc chunk ${c.name} failed its pin`);
    return b;
  });
  const all = Buffer.concat(parts);
  if (all.length !== entry.size || sha3(all) !== entry.sha3_512) throw new Error('qc model failed its pin after assembly');
  return all;
}
function loadVocab() {
  const entry = MANIFEST.files.find(f => f.name === 'tokenizer.json');
  const b = fs.readFileSync(path.join(DIR, 'tokenizer.json'));
  if (sha3(b) !== entry.sha3_512) throw new Error('qc tokenizer failed its pin');
  return JSON.parse(b.toString('utf8')).model.vocab;
}

let rt = null;
let loadErr = null;
async function getQc() {
  if (rt) return rt;
  if (loadErr) throw loadErr;
  try {
    const ort = require('onnxruntime-node');
    const session = await ort.InferenceSession.create(loadModelBytes(), { executionProviders: ['cpu'] });
    rt = { ort, session, vocab: loadVocab(), inputs: new Set(session.inputNames) };
    return rt;
  } catch (e) {
    loadErr = e instanceof Error ? e : new Error(String(e));
    throw loadErr;
  }
}

async function scoreOne(q, text) {
  const ids = encodeBert(text, q.vocab, { maxLen: MAX_LEN });
  const n = MAX_LEN;
  const idArr = new Array(n).fill(0), maskArr = new Array(n).fill(0), typeArr = new Array(n).fill(0);
  for (let i = 0; i < ids.length; i++) { idArr[i] = ids[i]; maskArr[i] = 1; }
  const feeds = {};
  if (q.inputs.has('input_ids')) feeds.input_ids = new q.ort.Tensor('int64', BigInt64Array.from(idArr.map(BigInt)), [1, n]);
  if (q.inputs.has('attention_mask')) feeds.attention_mask = new q.ort.Tensor('int64', BigInt64Array.from(maskArr.map(BigInt)), [1, n]);
  if (q.inputs.has('token_type_ids')) feeds.token_type_ids = new q.ort.Tensor('int64', BigInt64Array.from(typeArr.map(BigInt)), [1, n]);
  const out = await q.session.run(feeds);
  const logits = out[q.session.outputNames[0]].data;
  let best = -Infinity;
  for (const x of logits) { const p = 1 / (1 + Math.exp(-x)); if (p > best) best = p; }
  return Math.round(best * 1e6) / 1e6;
}

async function scoreQc(texts) {
  const q = await getQc();
  const out = [];
  for (const t of texts) out.push(await scoreOne(q, t));
  return out;
}

module.exports = { scoreQc, getQc, MODEL_ID: MANIFEST.model_id, THRESHOLD: CLF.threshold };
