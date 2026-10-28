// Calibrates CC v4 on labeled dev data and writes config/cc_v4.json.
// Dev prose: tests/data/dev_prose.json. Dev incoherent: tests/data/dev_salad.json.
// Nothing here reads the holdout set.
// Usage: node scripts/calibrate_cc.js
'use strict';

const fs = require('fs');
const path = require('path');
const features = require('../src/cc_features');
const { tagSurprisal } = require('../src/cc_v4');

const ROOT = path.join(__dirname, '..');
const prose = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/data/dev_prose.json'), 'utf8'));
const salad = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/data/dev_salad.json'), 'utf8'));

// 1. Tag-transition table, learned from dev prose only.
const counts = {};
const totals = {};
const tagSet = new Set();
for (const text of prose) {
  const { sentences } = features.extract(text);
  for (const seq of features.tagSequences(sentences)) {
    const padded = ['<s>', ...seq, '</s>'];
    for (const t of seq) tagSet.add(t);
    for (let i = 1; i < padded.length; i++) {
      const prev = padded[i - 1];
      const next = padded[i];
      counts[prev] = counts[prev] || {};
      counts[prev][next] = (counts[prev][next] || 0) + 1;
      totals[prev] = (totals[prev] || 0) + 1;
    }
  }
}
const tagTable = { alpha: 0.5, tags: Array.from(tagSet).sort(), counts, totals };

// 2. Raw feature values for every calibration text.
function featuresOf(text) {
  const { F, sentences } = features.extract(text);
  F.surprisal = tagSurprisal(features.tagSequences(sentences), tagTable);
  return F;
}
const proseF = prose.map(featuresOf);
const saladF = salad.map(featuresOf);

// 3. Per-feature sorted prose values (the percentile reference).
const FEATURE_NAMES = ['mtld', 'repeat', 'finite', 'svo', 'capital', 'connective', 'nominal', 'surprisal'];
const featureSpecs = {};
for (const name of FEATURE_NAMES) {
  featureSpecs[name] = { sorted: proseF.map(F => F[name]).sort((a, b) => a - b) };
}

// 4. Domain mapping. Operator choice, documented in docs/review/measured-coherence.md.
const mapping = {
  D1: { feature: 'mtld', direction: 'hi' },
  D2: { feature: 'nominal', direction: 'hi' },
  D3: { feature: 'finite', direction: 'hi' },
  D4: { feature: 'capital', direction: 'hi' },
  D5: { feature: 'connective', direction: 'hi' },
  D6: { feature: 'svo', direction: 'hi' },
  D7: { feature: 'surprisal', direction: 'lo' },
  D8: { feature: 'repeat', direction: 'lo' },
};

const { CC_WEIGHTS } = require('../src/coherence_calculus');
const { percentile } = require('../src/cc_v4');

function scoreFeature(value, spec, direction) {
  const p = percentile(spec.sorted, value);
  const s = direction === 'hi' ? p : 1 - p + 1 / (spec.sorted.length + 1);
  return Math.min(0.9999, Math.max(0.0001, s));
}

function muOf(F) {
  let logSum = 0;
  for (const [d, map] of Object.entries(mapping)) {
    const s = scoreFeature(F[map.feature], featureSpecs[map.feature], map.direction);
    logSum += (CC_WEIGHTS[d] || 0) * Math.log(s);
  }
  return Math.exp(logSum);
}

const proseMu = proseF.map(muOf);
const saladMu = saladF.map(muOf);

// 5. AUC and the Youden-optimal threshold on dev data.
function auc(pos, neg) {
  let wins = 0;
  for (const p of pos) for (const n of neg) wins += p > n ? 1 : p === n ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}
function bestThreshold(pos, neg) {
  const candidates = Array.from(new Set([...pos, ...neg])).sort((a, b) => a - b);
  let best = { tau: candidates[0], j: -Infinity, tpr: 0, fpr: 0 };
  for (const tau of candidates) {
    const tpr = pos.filter(x => x >= tau).length / pos.length;
    const fpr = neg.filter(x => x >= tau).length / neg.length;
    const j = tpr - fpr;
    if (j > best.j) best = { tau, j, tpr, fpr };
  }
  return best;
}

const devAuc = auc(proseMu, saladMu);
const thr = bestThreshold(proseMu, saladMu);

const config = {
  version: 'v4',
  built_from: { dev_prose: prose.length, dev_incoherent: salad.length },
  tau: thr.tau,
  tau_method: 'Youden J maximised on dev prose vs dev incoherent',
  dev: { auc: devAuc, youden_j: thr.j, tpr: thr.tpr, fpr: thr.fpr },
  tagTable,
  features: featureSpecs,
  mapping,
};

fs.mkdirSync(path.join(ROOT, 'config'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'config/cc_v4.json'), JSON.stringify(config, null, 2));
console.log(`dev prose ${prose.length}, dev incoherent ${salad.length}`);
console.log(`dev AUC ${devAuc.toFixed(3)}`);
console.log(`tau ${thr.tau.toFixed(4)}  TPR ${thr.tpr.toFixed(3)}  FPR ${thr.fpr.toFixed(3)}  J ${thr.j.toFixed(3)}`);
console.log('wrote config/cc_v4.json');
