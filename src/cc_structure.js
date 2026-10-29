// === CC structural checks: floor and log-sensitivity ===
// μ(S) = exp(Σ wᵢ ln sᵢ) with Σ wᵢ = 1. The log-sensitivity of μ to each dimension
// is exactly wᵢ: ∂ln μ / ∂ln sᵢ = wᵢ (report §2.2). So no dimension outweighs its
// weight in the interior. Dominance appears only as sᵢ → 0, where ln sᵢ → −∞.
// The floor bounds that, and this module measures it. It does not change coherence_calculus.js.
'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'cc_structure.json'), 'utf8'));

function checkWeights(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(total - 1) > 1e-9) throw new Error(`weights must sum to 1, got ${total}`);
}

function floorScores(scores, floor = CONFIG.floor) {
  const out = {};
  for (const k of Object.keys(scores)) out[k] = Math.max(scores[k], floor);
  return out;
}

// Geometric mean with each score clamped to the floor, so a zero score cannot
// drive μ to zero by itself.
function muFloored(scores, weights, floor = CONFIG.floor) {
  checkWeights(weights);
  const f = floorScores(scores, floor);
  let logSum = 0;
  for (const k of Object.keys(weights)) {
    if (!weights[k]) continue;
    logSum += weights[k] * Math.log(f[k]);
  }
  return Math.exp(logSum);
}

// Measured ∂ln μ / ∂ln sᵢ by finite difference on floored scores. A dimension
// sitting on the floor reports 0 and is marked floored.
function logSensitivities(scores, weights, { floor = CONFIG.floor, step = CONFIG.fd_step } = {}) {
  checkWeights(weights);
  const base = Math.log(muFloored(scores, weights, floor));
  const out = {};
  for (const k of Object.keys(weights)) {
    const onFloor = scores[k] <= floor;
    if (onFloor) { out[k] = { sensitivity: 0, floored: true }; continue; }
    const bumped = { ...scores, [k]: scores[k] * (1 + step) };
    const d = (Math.log(muFloored(bumped, weights, floor)) - base) / Math.log(1 + step);
    out[k] = { sensitivity: d, floored: false };
  }
  return out;
}

// Structural check on one populated formula at one point:
//  - every measured sensitivity matches its weight (within tol), when not floored
//  - no single dimension's share of log-influence exceeds max_share
function structuralCheck(scores, weights, { floor = CONFIG.floor, maxShare = CONFIG.max_share, tol = 1e-3 } = {}) {
  const sens = logSensitivities(scores, weights, { floor });
  const total = Object.values(sens).reduce((a, s) => a + Math.abs(s.sensitivity), 0) || 1;
  const shares = {};
  let maxObserved = 0;
  const mismatches = [];
  const floored = [];
  for (const k of Object.keys(weights)) {
    const s = sens[k];
    shares[k] = Math.abs(s.sensitivity) / total;
    maxObserved = Math.max(maxObserved, shares[k]);
    if (s.floored) { floored.push(k); continue; }
    if (Math.abs(s.sensitivity - weights[k]) > tol) mismatches.push({ dim: k, sensitivity: s.sensitivity, weight: weights[k] });
  }
  return {
    ok: mismatches.length === 0 && maxObserved <= maxShare && floored.length === 0,
    mu: muFloored(scores, weights, floor),
    maxShare: maxObserved,
    shares,
    floored,
    mismatches,
  };
}

module.exports = { muFloored, floorScores, logSensitivities, structuralCheck, CONFIG };
