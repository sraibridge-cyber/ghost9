/**
 * test_cc_ghost9.js — GHOST9 CC v3.2 Empirical Test Battery
 * CSS Labs | Kyle S. Whitlock
 * Seal: 2026-07-06_21:15_Tulsa_OK
 * 
 * SCOPE: Tests CC PURE module for GHOST9 kernel.
 * ASSUMPTION: All test text has ALREADY passed the Three-Gate System.
 * CC does NOT test for gibberish, safety, or word-level triggers.
 * CC tests COHERENCE of gate-cleared text only.
 */

const { evaluate, CC_WEIGHTS, TAU } = require('./src/coherence_calculus.js');

const GHOST9_TAU = 0.9600;

let passed = 0;
let failed = 0;
const failures = [];

function assert(id, condition, msg) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(id + ': ' + msg); process.stdout.write('F'); }
}

function test(id, text, expectedPass, minMu, maxMu, desc) {
  const r = evaluate(text);
  const mu = r.mu;
  const pass = mu >= GHOST9_TAU;
  
  assert(id + '_PASS', pass === expectedPass, 
    desc + ' | expected pass=' + expectedPass + ' got pass=' + pass + ' (mu=' + mu.toFixed(4) + ')');
  
  if (minMu !== undefined) {
    assert(id + '_MIN', mu >= minMu, 
      desc + ' | mu=' + mu.toFixed(4) + ' < min=' + minMu);
  }
  if (maxMu !== undefined) {
    assert(id + '_MAX', mu <= maxMu, 
      desc + ' | mu=' + mu.toFixed(4) + ' > max=' + maxMu);
  }
}

console.log('GHOST9 CC v3.2 Test Battery');
console.log('TAU=' + TAU + ' (canonical) | GHOST9_TAU=' + GHOST9_TAU + ' (empirical)');
console.log('ASSUMPTION: All text has passed Three-Gate System');
console.log('');

// ============================================
// SECTION 1: MUST PASS (High-quality gate-cleared text)
// ============================================
console.log('Section 1: MUST PASS');

test('MP-1', 
  'Signal integrity, energy conservation, temporal stability, spatial grounding, cognitive alignment, ethical neutrality, declarative truth, and novelty detection must all resonate in harmony for the system to achieve resonance.',
  true, 0.9600, undefined, 'Full domain coverage, 25 words');

test('MP-2',
  'The verification of factual evidence through rigorous empirical testing demonstrates that declarative truth statements maintain cognitive coherence when subjected to logical analysis and systematic proof validation methods.',
  true, 0.9600, undefined, 'D7-heavy verification text');

test('MP-3',
  'Innovation drives progress. New discoveries transform understanding. Creative breakthroughs pioneer frontiers. Original research evolves knowledge. Unique insights change perspectives. Diverse approaches discover truth.',
  true, 0.9600, undefined, 'D8 novelty + D7 truth, 6 sentences');

test('MP-4',
  'If the system detects temporal inconsistency, then it must verify the factual evidence before asserting declarative truth. However, when cognitive alignment confirms logical coherence, the energy conservation principle maintains signal integrity throughout the process.',
  true, 0.9600, undefined, 'Complex logic, D5 cognitive + D7 declarative');

// ============================================
// SECTION 2: MUST BLOCK (Gate-cleared but low coherence)
// ============================================
console.log('');
console.log('Section 2: MUST BLOCK');

test('MB-1', 'a', false, undefined, 0.50, 'Single character');
test('MB-2', 'the', false, undefined, 0.50, 'Single word');
test('MB-3', 'hello world', false, undefined, 0.70, 'Two words');

// ============================================
// SECTION 3: EDGE CASES (Gate-cleared boundary texts)
// ============================================
console.log('');
console.log('Section 3: EDGE CASES');

test('EC-1', 'x '.repeat(2).trim(), false, undefined, 0.50, 'Exactly 2 words (void tier)');
test('EC-2', 'x '.repeat(3).trim(), false, undefined, 0.95, 'Exactly 3 words (fragment tier)');
test('EC-3', 'x '.repeat(6).trim(), false, undefined, 0.95, 'Exactly 6 words (fragment boundary)');
test('EC-4', 'x '.repeat(7).trim(), false, 0.90, undefined, 'Exactly 7 words (short tier)');
test('EC-5', 'x '.repeat(12).trim(), false, 0.90, undefined, 'Exactly 12 words (short boundary)');
test('EC-6', 'x '.repeat(13).trim(), false, 0.90, undefined, 'Exactly 13 words (medium tier)');
test('EC-7', 'x '.repeat(20).trim(), false, 0.90, undefined, 'Exactly 20 words (long tier)');

// ============================================
// SECTION 4: DOMAIN KEYWORDS (Gate-cleared keyword texts)
// ============================================
console.log('');
console.log('Section 4: DOMAIN KEYWORDS');

test('DK-1', 'The energy force and power momentum drive intensity vigor strength vitality dynamic systems.', true, 0.90, undefined, 'D2 energy keywords');
test('DK-2', 'Time temporal history past future recent now then when duration period age epoch matters.', true, 0.90, undefined, 'D3 temporal keywords');
test('DK-3', 'Space spatial ground location place position where here there area region domain field exists.', true, 0.90, undefined, 'D4 spatial keywords');
test('DK-4', 'Cognitive mind thought think reason logic understand comprehend mental intellect awareness consciousness.', true, 0.90, undefined, 'D5 cognitive keywords');
test('DK-5', 'Ethical ethic moral morality right wrong justice fair unfair harm help good bad virtue vice duty obligation responsibility integrity honesty trust respect dignity autonomy consent beneficence nonmaleficence.', true, 0.90, undefined, 'D6 ethical keywords');
test('DK-6', 'Truth true fact factual real reality actual correct accurate valid verify proof evidence certain declare statement claim assert affirm confirm axiom theorem law principle invariant.', true, 0.90, undefined, 'D7 declarative keywords');
test('DK-7', 'New novel original creative innovation innovative unique unusual rare fresh different distinct diverse variety change transform evolve discover invent breakthrough frontier edge pioneer.', true, 0.90, undefined, 'D8 novelty keywords');

// ============================================
// SECTION 5: HARMONY SPECIFIC (Gate-cleared harmony texts)
// ============================================
console.log('');
console.log('Section 5: HARMONY SPECIFIC');

test('HS-1', 'harmony', false, undefined, 0.90, 'Single word "harmony"');
test('HS-2', 'harmonic resonance', false, undefined, 0.90, 'Two words with harmonic');
test('HS-3', 'The harmony of the spheres represents a harmonious relationship between harmonic frequencies.', false, 0.90, undefined, 'Multiple harmony variants, 12 words');
test('HS-5', 'The harmonic oscillator demonstrates harmonic motion in harmonic systems with harmonic waves.', false, 0.90, undefined, 'harmonic repeated, 11 words');

// ============================================
// SECTION 6: WHITLOCK COEFFICIENT
// ============================================
console.log('');
console.log('Section 6: WHITLOCK COEFFICIENT');

const { whitlock } = require('./src/coherence_calculus.js');
const w0 = whitlock(0);
assert('WC-1', Math.abs(w0.magnitude - 0.2353) < 0.001, 'W(0) magnitude ~0.2353');
assert('WC-2', Math.abs(w0.phase - 90.0) < 0.1, 'W(0) phase = 90°');

const w6 = whitlock(6);
assert('WC-3', Math.abs(w6.magnitude - 0.4243) < 0.001, 'W(6) magnitude ~0.4243');
assert('WC-4', Math.abs(w6.phase - 33.69) < 0.1, 'W(6) phase ~33.7°');

const w10 = whitlock(10);
assert('WC-5', Math.abs(w10.magnitude - 0.6339) < 0.001, 'W(10) magnitude ~0.6339');
assert('WC-6', Math.abs(w10.phase - 21.80) < 0.1, 'W(10) phase ~21.8°');

// ============================================
// SECTION 7: WEIGHTS VALIDATION
// ============================================
console.log('');
console.log('Section 7: WEIGHTS');

const weightValues = Object.values(CC_WEIGHTS);
const sum = weightValues.reduce((a,b) => a+b, 0);
assert('WT-1', Math.abs(sum - 1.0) < 0.001, 'Weights sum to 1.0: ' + sum);
assert('WT-2', CC_WEIGHTS.D1 === 0.20, 'D1 weight = 0.20');
assert('WT-3', CC_WEIGHTS.D7 === 0.20, 'D7 weight = 0.20');
assert('WT-4', CC_WEIGHTS.D5 === 0.15, 'D5 weight = 0.15');
assert('WT-5', CC_WEIGHTS.D8 === 0.10, 'D8 weight = 0.10');

// ============================================
// RESULTS
// ============================================
console.log('');
console.log('');
console.log('========================================');
console.log('RESULTS: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');
if (failures.length > 0) {
  console.log('');
  console.log('FAILURES:');
  failures.forEach(f => console.log('  ' + f));
}
console.log('');
console.log('NOTE: GHOST9_TAU=' + GHOST9_TAU + ' is empirically determined.');
console.log('Three-Gate System handles safety/gibberish before CC evaluation.');
process.exit(failed > 0 ? 1 : 0);
