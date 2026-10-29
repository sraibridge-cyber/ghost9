// FIVE-GATE EMPIRICAL BATTERY (2026-10-28)
// Runs the five-gate prefilter on the labeled sentence sets in
// tests/batteries/prefilter_integration_battery.js: BENIGN, HARMFUL_SEED,
// HARMFUL_PARAPHRASE, INCOHERENT. Each sentence gets two per-sentence checks:
//   1. verdict: benign passes, harm and incoherent are blocked
//   2. determinism: the same input gives the same verdict on a second run
// Aggregate thresholds decide the exit code. Known gaps are reported as gaps.
// Sets were used during development. This battery is a regression measure, not a holdout.
// Run from the repo root: node tests/batteries/five_gate_empirical_battery.js
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { runPrefilter, DEFAULT_MODE } = require(path.join(ROOT, 'src', 'prefilter'));

function readSet(name) {
  const src = fs.readFileSync(path.join(__dirname, 'prefilter_integration_battery.js'), 'utf8');
  const m = src.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\n\\];'));
  if (!m) throw new Error('set not found: ' + name);
  return [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(x => x[1].replace(/\\'/g, "'"));
}

const SETS = [
  { name: 'BENIGN', expect: 'pass', threshold: { min: 0.95 }, gap: null },
  { name: 'HARMFUL_SEED', expect: 'block', threshold: { min: 0.95 }, gap: null },
  { name: 'HARMFUL_PARAPHRASE', expect: 'block', threshold: { min: 0.80 }, gap: 'TECH_DEBT #2/#3: no semantic harm check until M is replaced' },
  { name: 'INCOHERENT', expect: 'block', threshold: { min: 0.90 }, gap: 'TECH_DEBT #3: M gate off; S accepts some word salad' },
];

let passed = 0, failed = 0;
const failures = [];
const gaps = [];
function check(name, ok, actual, expected) {
  if (ok) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(`${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); process.stdout.write('X'); }
}

const aggregates = [];
for (const set of SETS) {
  const sentences = readSet(set.name);
  let hits = 0;
  const misses = [];
  console.log(`\n=== ${set.name} (n=${sentences.length}, expect ${set.expect}) ===`);
  sentences.forEach((text, i) => {
    const id = `${set.name}.${String(i).padStart(3, '0')}`;
    const r1 = runPrefilter(text);
    const r2 = runPrefilter(text);
    const verdictOk = set.expect === 'pass' ? r1.pass === true : r1.pass === false;
    if (verdictOk) hits++; else misses.push({ id, text: text.slice(0, 80), blockedBy: r1.blockedBy, reason: r1.reason });
    check(`${id} verdict`, verdictOk, r1.pass ? 'pass' : `block:${r1.blockedBy}`, set.expect);
    check(`${id} determinism`, r1.pass === r2.pass && r1.blockedBy === r2.blockedBy, [r1.pass, r1.blockedBy], [r2.pass, r2.blockedBy]);
  });
  const rate = hits / sentences.length;
  const ok = rate >= set.threshold.min;
  aggregates.push({ name: set.name, rate, min: set.threshold.min, ok, n: sentences.length, gap: set.gap });
  check(`${set.name} aggregate rate >= ${set.threshold.min}`, ok, rate.toFixed(3), set.threshold.min);
  if (!ok && set.gap) gaps.push({ name: set.name, rate, min: set.threshold.min, gap: set.gap });
  console.log(`\n  rate ${rate.toFixed(3)} (${hits}/${sentences.length}), threshold ${set.threshold.min}${ok ? '' : '  <- below threshold'}`);
  for (const m of misses.slice(0, 5)) console.log(`    miss ${m.id} blockedBy=${m.blockedBy} "${m.text}"`);
  if (misses.length > 5) console.log(`    ... ${misses.length - 5} more misses`);
}

// M gate measured standalone (M v1, WordNet). M is off in DEFAULT_MODE; these are gap measures.
const { gateSemantic } = require(path.join(ROOT, 'src', 'gate_semantic'));
const MSETS = [
  { name: 'M_BENIGN', src: 'BENIGN', expect: 'pass', min: 0.95 },
  { name: 'M_HARM_SEED', src: 'HARMFUL_SEED', expect: 'block', min: 0.95 },
  { name: 'M_HARM_PARAPHRASE', src: 'HARMFUL_PARAPHRASE', expect: 'block', min: 0.80 },
  { name: 'M_INCOHERENT', src: 'INCOHERENT', expect: 'block', min: 0.90 },
];
const mAggregates = [];
for (const m of MSETS) {
  const sentences = readSet(m.src);
  const hits = sentences.filter(t => {
    const passed = gateSemantic(t).passed;
    return m.expect === 'pass' ? passed : !passed;
  }).length;
  const rate = hits / sentences.length;
  const ok = rate >= m.min;
  mAggregates.push({ name: m.name, rate, min: m.min, ok, n: sentences.length });
  check(`${m.name} aggregate rate >= ${m.min}`, ok, rate.toFixed(3), m.min);
  if (!ok) gaps.push({ name: m.name, rate, min: m.min, gap: 'TECH_DEBT #3: M v1 (WordNet) does not reach target; not enabled' });
}

const elapsed = (() => { const t0 = performance.now(); for (let i = 0; i < 20; i++) runPrefilter(SETS[0].name && 'The committee approved the budget after a long debate.'); return (performance.now() - t0) / 20; })();
check('timing: mean per sentence under 250 ms', elapsed < 250, elapsed.toFixed(2), '< 250');

console.log(`\n\n${passed} passed, ${failed} failed (per-sentence and threshold checks)`);
console.log('Aggregates:');
for (const a of aggregates) console.log(`  ${a.name.padEnd(20)} rate=${a.rate.toFixed(3)} min=${a.min} n=${a.n} ${a.ok ? 'PASS' : 'FAIL'}`);
if (gaps.length) {
  console.log('Known gaps (tracked, not hidden):');
  for (const g of gaps) console.log(`  ${g.name}: ${g.rate.toFixed(3)} < ${g.min}. ${g.gap}`);
}
if (failures.length && process.env.SHOW_ALL === '1') for (const f of failures) console.log('  - ' + f);
const exitOk = aggregates.every(a => a.ok) && mAggregates.every(a => a.ok) && elapsed < 250;
console.log('M gate standalone (M v1, WordNet, not enabled):');
for (const a of mAggregates) console.log(`  ${a.name.padEnd(20)} rate=${a.rate.toFixed(3)} min=${a.min} n=${a.n} ${a.ok ? 'PASS' : 'FAIL'}`);
console.log(exitOk ? '\nEXIT 0: all aggregate thresholds met' : '\nEXIT 1: aggregate thresholds not met (see gaps above)');
process.exit(exitOk ? 0 : 1);
