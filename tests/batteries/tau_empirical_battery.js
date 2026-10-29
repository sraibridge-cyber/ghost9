// TAU EMPIRICAL BATTERY. Chooses the CC pass threshold (TAU) from labelled data, not by hand.
//
// Positives: coherent prose. Negatives: word salad.
// Calibration uses dev only (dev_prose vs dev_salad). The holdout is scored once, at the chosen threshold.
// Holdout negatives are the holdout prose with each sentence's words shuffled (seeded, SEED below).
// Labels are noisy: a shuffled sentence can occasionally read as coherent.
//
// Targets were fixed before the first run:
//   AUC on dev >= 0.80, AUC on holdout >= 0.80, holdout balanced accuracy >= 0.80.
// A miss is a finding: the CC score does not separate the classes well enough for any threshold to work.
// It is not a reason to move the target.

const path = require('path');
const cc = require('../../src/coherence_calculus');

const DATA = path.join(__dirname, '..', 'data');
const dev_prose = require(path.join(DATA, 'dev_prose.json'));
const dev_salad = require(path.join(DATA, 'dev_salad.json'));
const holdout_prose = require(path.join(DATA, 'holdout_prose.json'));

const SEED = 20261029;
const AUC_TARGET = 0.80;
const BALACC_TARGET = 0.80;

let passed = 0, failed = 0;
const failures = [];
function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function wordShuffle(sentence, rng) {
  const w = sentence.split(/\s+/);
  for (let i = w.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [w[i], w[j]] = [w[j], w[i]]; }
  return w.join(' ');
}

const rng = mulberry32(SEED);
const holdout_salad = holdout_prose.map(s => wordShuffle(s, rng));

const mus = texts => texts.map(t => cc.evaluate(t).mu);
const P_dev = mus(dev_prose), N_dev = mus(dev_salad);
const P_ho = mus(holdout_prose), N_ho = mus(holdout_salad);

function auc(pos, neg) {
  let w = 0;
  for (const p of pos) for (const n of neg) w += p > n ? 1 : (p === n ? 0.5 : 0);
  return w / (pos.length * neg.length);
}
function rates(P, N, t) {
  const tpr = P.filter(x => x >= t).length / P.length;   // prose accepted
  const tnr = N.filter(x => x < t).length / N.length;    // salad rejected
  return { tpr, tnr, balAcc: (tpr + tnr) / 2 };
}
function bootstrapAucCI(pos, neg, iters = 1000) {
  const r = mulberry32(SEED + 1), vals = [];
  for (let i = 0; i < iters; i++) {
    const p = Array.from({ length: pos.length }, () => pos[Math.floor(r() * pos.length)]);
    const n = Array.from({ length: neg.length }, () => neg[Math.floor(r() * neg.length)]);
    vals.push(auc(p, n));
  }
  vals.sort((a, b) => a - b);
  return [vals[Math.floor(0.025 * iters)], vals[Math.floor(0.975 * iters)]];
}

// Calibrate on dev only: Youden's J = TPR + TNR - 1, over every observed dev score.
const candidates = [...new Set([...P_dev, ...N_dev])].sort((a, b) => a - b);
let best = { t: null, J: -Infinity };
for (const t of candidates) {
  const r = rates(P_dev, N_dev, t);
  const J = r.tpr + r.tnr - 1;
  if (J > best.J) best = { t, J };
}
const TAU_EMP = best.t;

const aucDev = auc(P_dev, N_dev);
const aucHo = auc(P_ho, N_ho);
const ciHo = bootstrapAucCI(P_ho, N_ho);
const devAtEmp = rates(P_dev, N_dev, TAU_EMP);
const hoAtEmp = rates(P_ho, N_ho, TAU_EMP);
const devAtCode = rates(P_dev, N_dev, cc.TAU);
const hoAtCode = rates(P_ho, N_ho, cc.TAU);

const fmt = x => (typeof x === 'number' ? x.toFixed(4) : String(x));
console.log('\n=== TAU EMPIRICAL BATTERY ===');
console.log(`n dev prose=${P_dev.length} dev salad=${N_dev.length} holdout prose=${P_ho.length} holdout salad=${N_ho.length}`);
console.log(`mu range (dev prose): ${fmt(Math.min(...P_dev))} .. ${fmt(Math.max(...P_dev))}`);
console.log(`mu range (dev salad): ${fmt(Math.min(...N_dev))} .. ${fmt(Math.max(...N_dev))}`);
console.log(`AUC dev=${fmt(aucDev)}  AUC holdout=${fmt(aucHo)}  holdout 95% CI=[${fmt(ciHo[0])}, ${fmt(ciHo[1])}]`);
console.log(`TAU_EMP (dev, Youden J=${fmt(best.J)}) = ${fmt(TAU_EMP)}`);
console.log(`  dev:     tpr=${fmt(devAtEmp.tpr)} tnr=${fmt(devAtEmp.tnr)} balAcc=${fmt(devAtEmp.balAcc)}`);
console.log(`  holdout: tpr=${fmt(hoAtEmp.tpr)} tnr=${fmt(hoAtEmp.tnr)} balAcc=${fmt(hoAtEmp.balAcc)}`);
console.log(`TAU in code = ${fmt(cc.TAU)}`);
console.log(`  dev:     tpr=${fmt(devAtCode.tpr)} tnr=${fmt(devAtCode.tnr)} balAcc=${fmt(devAtCode.balAcc)}`);
console.log(`  holdout: tpr=${fmt(hoAtCode.tpr)} tnr=${fmt(hoAtCode.tnr)} balAcc=${fmt(hoAtCode.balAcc)}`);

test('data sanity: 91 dev prose, 31 dev salad, 42 holdout', P_dev.length === 91 && N_dev.length === 31 && P_ho.length === 42, [P_dev.length, N_dev.length, P_ho.length], [91, 31, 42]);
test('holdout salad is the same size as holdout prose', N_ho.length === P_ho.length, N_ho.length, P_ho.length);
test(`dev AUC >= ${AUC_TARGET}`, aucDev >= AUC_TARGET, aucDev, AUC_TARGET);
test(`holdout AUC >= ${AUC_TARGET}`, aucHo >= AUC_TARGET, aucHo, AUC_TARGET);
test(`holdout balanced accuracy at TAU_EMP >= ${BALACC_TARGET}`, hoAtEmp.balAcc >= BALACC_TARGET, hoAtEmp.balAcc, BALACC_TARGET);
test('dev Youden J > 0 (the score carries any signal at all)', best.J > 0, best.J, '> 0');

console.log(`\n\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);
if (failures.length) { console.log('\n❌ FAILURES:'); failures.forEach(f => console.log('  ' + f)); }
else console.log('\n✅ ALL TESTS PASSED');
process.on('exit', () => { if (failed > 0) process.exitCode = 1; });
