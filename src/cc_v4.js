// =====================================================================
// CC v4 — coherence measured from the text, calibrated on labeled data.
// Same geometric-mean structure as CC v3 (weights and tau are calibrated, not chosen).
//
// For each feature, the score is its percentile within the calibration prose
// (direction set in config). Tag surprisal uses a POS-transition table learned
// from calibration prose. No word lists are used.
//
// Calibration lives in config/cc_v4.json, written by scripts/calibrate_cc.js.
// The domain-to-feature mapping in that file is an operator choice; see
// docs/review/measured-coherence.md.
// =====================================================================
'use strict';

const fs = require('fs');
const path = require('path');
const features = require('./cc_features');
const { CC_WEIGHTS } = require('./coherence_calculus');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'cc_v4.json');
let _config = null;

function loadConfig(p = CONFIG_PATH) {
  if (!_config || p !== CONFIG_PATH) {
    _config = JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return _config;
}

// Percentile of x within sorted calibration values, in (0, 1].
function percentile(sorted, x) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return (lo + 1) / (sorted.length + 1);
}

function scoreFeature(value, spec) {
  const p = percentile(spec.sorted, value);
  const s = spec.direction === 'hi' ? p : 1 - p + 1 / (spec.sorted.length + 1);
  return Math.min(0.9999, Math.max(0.0001, s));
}

// Average surprisal (bits) of POS transitions under the calibrated table.
function tagSurprisal(seqs, table) {
  const V = table.tags.length + 2;
  let bits = 0;
  let steps = 0;
  for (const seq of seqs) {
    const padded = ['<s>', ...seq, '</s>'];
    for (let i = 1; i < padded.length; i++) {
      const prev = padded[i - 1];
      const next = padded[i];
      const row = table.counts[prev] || {};
      const total = table.totals[prev] || 0;
      const c = row[next] || 0;
      const p = (c + table.alpha) / (total + table.alpha * V);
      bits += -Math.log2(p);
      steps++;
    }
  }
  return steps === 0 ? 0 : bits / steps;
}

function computeFeatureValues(text, config) {
  const { F, sentences } = features.extract(text);
  const seqs = features.tagSequences(sentences);
  F.surprisal = tagSurprisal(seqs, config.tagTable);
  return F;
}

function evaluate(text, options = {}) {
  const config = options.config || loadConfig();
  const F = computeFeatureValues(text, config);
  const scores = {};
  const featureScores = {};
  for (const [domain, map] of Object.entries(config.mapping)) {
    const spec = config.features[map.feature];
    const s = scoreFeature(F[map.feature], { ...spec, direction: map.direction });
    scores[domain] = s;
    featureScores[map.feature] = s;
  }
  let logSum = 0;
  for (const d of Object.keys(scores)) logSum += (CC_WEIGHTS[d] || 0) * Math.log(scores[d]);
  const mu = Math.exp(logSum);
  const pass = mu >= config.tau;
  return {
    version: 'v4',
    scores,
    featureScores,
    features: F,
    mu,
    pass,
    tau: config.tau,
    weights: CC_WEIGHTS,
  };
}

module.exports = { evaluate, loadConfig, percentile, scoreFeature, tagSurprisal, computeFeatureValues, CONFIG_PATH };
