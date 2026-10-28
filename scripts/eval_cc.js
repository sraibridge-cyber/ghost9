// Evaluates CC v4 and CC v3 on the holdout set. Holdout prose is never used for calibration.
// Holdout incoherent = each holdout sentence with its words shuffled (seeded), so sentence length is preserved.
// Usage: node scripts/eval_cc.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CCV4 = require('../src/cc_v4');
const CCV3 = require('../src/coherence_calculus');

const prose = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/data/holdout_prose.json'), 'utf8'));
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const salad = prose.map(t => t.split(/(?<=[.!?])\s+/).map(s => {
  const w = s.replace(/[.!?]+$/, '').split(/\s+/);
  for (let i = w.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [w[i], w[j]] = [w[j], w[i]]; }
  return w.join(' ') + '.';
}).join(' '));

const config = CCV4.loadConfig();
function auc(pos, neg) {
  let wins = 0;
  for (const p of pos) for (const n of neg) wins += p > n ? 1 : p === n ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}
const v4P = prose.map(t => CCV4.evaluate(t, { config }).mu);
const v4S = salad.map(t => CCV4.evaluate(t, { config }).mu);
const v3P = prose.map(t => CCV3.evaluate(t, {}).mu);
const v3S = salad.map(t => CCV3.evaluate(t, {}).mu);
const tau = config.tau;
const rate = (xs, f) => xs.filter(f).length / xs.length;

console.log(`holdout prose n=${prose.length}, holdout shuffled n=${salad.length}`);
console.log(`CC v4  AUC ${auc(v4P, v4S).toFixed(3)}  tau ${tau.toFixed(4)}  prose admitted ${(rate(v4P, x => x >= tau) * 100).toFixed(1)}%  shuffled admitted ${(rate(v4S, x => x >= tau) * 100).toFixed(1)}%`);
console.log(`CC v3  AUC ${auc(v3P, v3S).toFixed(3)}  tau 0.9430  prose admitted ${(rate(v3P, x => x >= 0.943) * 100).toFixed(1)}%  shuffled admitted ${(rate(v3S, x => x >= 0.943) * 100).toFixed(1)}%`);
console.log(`dev AUC (calibration, in-sample) ${config.dev.auc.toFixed(3)}`);
