/**
 * test_cc_ghost9_full.js — GHOST9 CC v3.2 TRUE Empirical Test Battery
 * CSS Labs | Kyle S. Whitlock
 * Seal: 2026-07-07_19:56_Tulsa_OK
 *
 * SCOPE: Comprehensive 200+ test battery for GHOST9 CC v3.2 PURE module.
 * ASSUMPTION: All test text has ALREADY passed the Three-Gate System.
 * Tests every boundary, every keyword, every edge case empirically.
 */

const { evaluate, computeDomainScore, weightedGeometricMean, whitlock, CC_WEIGHTS, TAU, N_DOMAINS, CC_VERSION, DOMAIN_KEYWORDS, D1_TIERS } = require('./src/coherence_calculus.js');

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

function testDomain(id, text, domain, expectedMin, expectedMax, desc) {
  const r = evaluate(text);
  const score = r.scores[domain];
  assert(id + '_' + domain, score >= expectedMin && score <= expectedMax,
    desc + ' | ' + domain + '=' + score.toFixed(4) + ' expected [' + expectedMin + ',' + expectedMax + ']');
}

console.log('GHOST9 CC v3.2 TRUE Empirical Test Battery');
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

test('MP-5',
  'The ethical framework demands that we respect autonomy, ensure consent, prevent harm, and uphold justice while pursuing truth through rigorous verification and empirical evidence.',
  true, 0.9600, undefined, 'D6 ethical + D7 declarative');

test('MP-6',
  'Spatial analysis reveals that location matters. Ground position, regional dynamics, and domain-specific field studies demonstrate that place and area significantly affect outcomes.',
  true, 0.9600, undefined, 'D4 spatial keywords');

test('MP-7',
  'Time matters. The temporal history of past events informs future decisions. Recent developments, current duration, and the age of existing systems all matter in this epoch.',
  true, 0.9600, undefined, 'D3 temporal keywords');

test('MP-8',
  'Cognitive processes require mental effort. Thought, reason, logic, and understanding form the foundation of intellect. Awareness and consciousness drive comprehension.',
  true, 0.9600, undefined, 'D5 cognitive keywords');

test('MP-9',
  'Energy drives momentum. Force, power, intensity, and vigor create dynamic strength. Vitality emerges from sustained drive and consistent effort.',
  true, 0.9600, undefined, 'D2 energy keywords');

test('MP-10',
  'Signal density matters. Information quality, data integrity, measurement accuracy, and metric reliability all depend on word count, length, and size of the input.',
  true, 0.9600, undefined, 'D1 signal keywords');


// ============================================
// SECTION 2: MUST BLOCK (Low-quality gate-cleared text)
// ============================================
console.log('');
console.log('Section 2: MUST BLOCK');

test('MB-1', 'a', false, undefined, 0.50, 'Single character');
test('MB-2', 'the', false, undefined, 0.50, 'Single word');
test('MB-3', 'hello world', false, undefined, 0.70, 'Two words');
test('MB-4', 'ok sure fine', false, undefined, 0.80, 'Three generic words');
test('MB-5', 'it is what it is', false, undefined, 0.85, 'Five generic words');

// ============================================
// SECTION 3: D1 TIER BOUNDARIES (Exhaustive word count testing)
// ============================================
console.log('');
console.log('Section 3: D1 TIER BOUNDARIES');

// Void tier (< 3 words)
test('D1-VOID-1', 'x', false, undefined, 0.50, '1 word (void)');
test('D1-VOID-2', 'x x', false, undefined, 0.50, '2 words (void boundary)');

// Fragment tier (3-6 words)
test('D1-FRAG-1', 'x x x', false, undefined, 0.80, '3 words (fragment)');
test('D1-FRAG-2', 'x x x x', false, undefined, 0.80, '4 words (fragment)');
test('D1-FRAG-3', 'x x x x x', false, undefined, 0.80, '5 words (fragment)');
test('D1-FRAG-4', 'x x x x x x', false, undefined, 0.80, '6 words (fragment boundary)');

// Short tier (7-12 words)
test('D1-SHORT-1', 'x '.repeat(7).trim(), false, undefined, 0.90, '7 words (short)');
test('D1-SHORT-2', 'x '.repeat(8).trim(), false, undefined, 0.90, '8 words (short)');
test('D1-SHORT-3', 'x '.repeat(10).trim(), false, undefined, 0.90, '10 words (short)');
test('D1-SHORT-4', 'x '.repeat(12).trim(), false, undefined, 0.95, '12 words (short boundary)');

// Medium tier (13-19 words)
test('D1-MED-1', 'x '.repeat(13).trim(), true, 0.90, undefined, '13 words (medium)');
test('D1-MED-2', 'x '.repeat(15).trim(), true, 0.90, undefined, '15 words (medium)');
test('D1-MED-3', 'x '.repeat(17).trim(), true, 0.90, undefined, '17 words (medium)');
test('D1-MED-4', 'x '.repeat(19).trim(), true, 0.90, undefined, '19 words (medium boundary)');

// Long tier (20-29 words)
test('D1-LONG-1', 'x '.repeat(20).trim(), true, 0.90, undefined, '20 words (long)');
test('D1-LONG-2', 'x '.repeat(25).trim(), true, 0.90, undefined, '25 words (long)');
test('D1-LONG-3', 'x '.repeat(29).trim(), true, 0.90, undefined, '29 words (long boundary)');

// Extended tier (30-49 words)
test('D1-EXT-1', 'x '.repeat(30).trim(), true, 0.90, undefined, '30 words (extended)');
test('D1-EXT-2', 'x '.repeat(40).trim(), true, 0.90, undefined, '40 words (extended)');
test('D1-EXT-3', 'x '.repeat(49).trim(), true, 0.90, undefined, '49 words (extended boundary)');

// Substantial tier (50-99 words)
test('D1-SUB-1', 'x '.repeat(50).trim(), true, 0.90, undefined, '50 words (substantial)');
test('D1-SUB-2', 'x '.repeat(75).trim(), true, 0.90, undefined, '75 words (substantial)');
test('D1-SUB-3', 'x '.repeat(99).trim(), true, 0.90, undefined, '99 words (substantial boundary)');

// Comprehensive tier (100-199 words)
test('D1-COMP-1', 'x '.repeat(100).trim(), true, 0.90, undefined, '100 words (comprehensive)');
test('D1-COMP-2', 'x '.repeat(150).trim(), true, 0.90, undefined, '150 words (comprehensive)');

// Extensive tier (200-499 words)
test('D1-EXTV-1', 'x '.repeat(200).trim(), true, 0.90, undefined, '200 words (extensive)');
test('D1-EXTV-2', 'x '.repeat(300).trim(), true, 0.90, undefined, '300 words (extensive)');

// Monograph tier (500-999 words)
test('D1-MONO-1', 'x '.repeat(500).trim(), true, 0.90, undefined, '500 words (monograph)');

// Treatise tier (1000+ words)
test('D1-TREAT-1', 'x '.repeat(1000).trim(), true, 0.90, undefined, '1000 words (treatise)');


// ============================================
// SECTION 4: DOMAIN KEYWORD COVERAGE (Every keyword tested)
// ============================================
console.log('');
console.log('Section 4: DOMAIN KEYWORD COVERAGE');

// D1 keywords: signal, information, data, measure, metric, density, word, count, length, size
test('DK-D1-1', 'The signal contains important information and data for measurement.', true, 0.90, undefined, 'D1: signal, information, data');
test('DK-D1-2', 'Metric density and word count determine the length and size of the output.', true, 0.90, undefined, 'D1: metric, density, word, count, length, size');

// D2 keywords: energy, force, power, momentum, drive, intensity, vigor, strength, vitality, dynamic
test('DK-D2-1', 'Energy and force create power and momentum that drive intensity.', true, 0.90, undefined, 'D2: energy, force, power, momentum, drive, intensity');
test('DK-D2-2', 'Vigor, strength, and vitality create dynamic systems with force.', true, 0.90, undefined, 'D2: vigor, strength, vitality, dynamic');

// D3 keywords: time, temporal, history, past, future, recent, now, then, when, duration, period, age, epoch
test('DK-D3-1', 'Time and temporal history connect the past and future.', true, 0.90, undefined, 'D3: time, temporal, history, past, future');
test('DK-D3-2', 'Recent events now and then determine when the duration and period of this age and epoch will end.', true, 0.90, undefined, 'D3: recent, now, then, when, duration, period, age, epoch');

// D4 keywords: space, spatial, ground, location, place, position, where, here, there, area, region, domain, field
test('DK-D4-1', 'Space and spatial ground define the location and place.', true, 0.90, undefined, 'D4: space, spatial, ground, location, place');
test('DK-D4-2', 'Position determines where here and there are located in this area, region, domain, and field.', true, 0.90, undefined, 'D4: position, where, here, there, area, region, domain, field');

// D5 keywords: cognitive, mind, thought, think, reason, logic, understand, comprehend, mental, intellect, awareness, consciousness
test('DK-D5-1', 'Cognitive processes in the mind involve thought and the ability to think.', true, 0.90, undefined, 'D5: cognitive, mind, thought, think');
test('DK-D5-2', 'Reason and logic help us understand and comprehend mental processes that require intellect, awareness, and consciousness.', true, 0.90, undefined, 'D5: reason, logic, understand, comprehend, mental, intellect, awareness, consciousness');

// D6 keywords: ethical, ethic, moral, morality, right, wrong, justice, fair, unfair, harm, help, good, bad, virtue, vice, duty, obligation, responsibility, integrity, honesty, trust, respect, dignity, autonomy, consent, beneficence, non-maleficence
test('DK-D6-1', 'Ethical and moral behavior requires knowing right from wrong and pursuing justice.', true, 0.90, undefined, 'D6: ethical, moral, right, wrong, justice');
test('DK-D6-2', 'Fair treatment prevents unfair harm and helps promote good while avoiding bad virtue and vice.', true, 0.90, undefined, 'D6: fair, unfair, harm, help, good, bad, virtue, vice');
test('DK-D6-3', 'Duty, obligation, and responsibility require integrity, honesty, and trust.', true, 0.90, undefined, 'D6: duty, obligation, responsibility, integrity, honesty, trust');
test('DK-D6-4', 'Respect, dignity, autonomy, consent, beneficence, and non-maleficence guide ethical decisions.', true, 0.90, undefined, 'D6: respect, dignity, autonomy, consent, beneficence, non-maleficence');

// D7 keywords: truth, true, fact, factual, real, reality, actual, correct, accurate, valid, verify, proof, evidence, certain, declare, statement, claim, assert, affirm, confirm, axiom, theorem, law, principle, invariant
test('DK-D7-1', 'Truth and true facts form the basis of factual reality.', true, 0.90, undefined, 'D7: truth, true, fact, factual, real');
test('DK-D7-2', 'Actual correct and accurate data must be valid and verified through proof and evidence.', true, 0.90, undefined, 'D7: actual, correct, accurate, valid, verify, proof, evidence');
test('DK-D7-3', 'We can be certain when we declare a statement, claim, assert, affirm, or confirm an axiom, theorem, law, principle, or invariant.', true, 0.90, undefined, 'D7: certain, declare, statement, claim, assert, affirm, confirm, axiom, theorem, law, principle, invariant');

// D8 keywords: new, novel, original, creative, innovation, innovative, unique, unusual, rare, fresh, different, distinct, diverse, variety, change, transform, evolve, discover, invent, breakthrough, frontier, edge, pioneer
test('DK-D8-1', 'New and novel original ideas are creative and drive innovation.', true, 0.90, undefined, 'D8: new, novel, original, creative, innovation');
test('DK-D8-2', 'Innovative and unique approaches are unusual, rare, and fresh.', true, 0.90, undefined, 'D8: innovative, unique, unusual, rare, fresh');
test('DK-D8-3', 'Different and distinct diverse ideas create variety and change that transform and evolve systems.', true, 0.90, undefined, 'D8: different, distinct, diverse, variety, change, transform, evolve');
test('DK-D8-4', 'We must discover, invent, and pioneer breakthroughs at the frontier and edge of knowledge.', true, 0.90, undefined, 'D8: discover, invent, breakthrough, frontier, edge, pioneer');

// ============================================
// SECTION 5: D8 REPETITION PENALTY (Lexical diversity testing)
// ============================================
console.log('');
console.log('Section 5: D8 REPETITION PENALTY');

// Zero diversity (all same word)
test('D8-REP-1', 'x', false, undefined, 0.90, '1 word, diversity=0');
test('D8-REP-2', 'x x', false, undefined, 0.90, '2 words same, diversity=0');
test('D8-REP-3', 'x x x x x x x x x x', false, undefined, 0.90, '10 words same, diversity=0');
test('D8-REP-4', 'x '.repeat(15).trim(), false, undefined, 0.90, '15 words same, diversity=0');
test('D8-REP-5', 'x '.repeat(25).trim(), false, undefined, 0.90, '25 words same, diversity=0');

// Low diversity (< 0.3)
test('D8-REP-6', 'x x x y x x x y x x', false, undefined, 0.95, '10 words, 2 unique, diversity=0.2');
test('D8-REP-7', 'the the the cat the the the cat the the', false, undefined, 0.95, '10 words, 2 unique, diversity=0.2');

// Moderate diversity (0.3-0.5)
test('D8-REP-8', 'the cat sat on the mat and looked at the bird', false, undefined, 0.95, '12 words, 9 unique, diversity=0.75');

// High diversity (> 0.8)
test('D8-REP-9', 'The quick brown fox jumps over the lazy dog near the old barn.', true, 0.90, undefined, '13 words, high diversity');

// ============================================
// SECTION 6: CROSS-DOMAIN INTERACTIONS
// ============================================
console.log('');
console.log('Section 6: CROSS-DOMAIN INTERACTIONS');

// Text hitting multiple domains simultaneously
test('CD-1', 'The energy of temporal dynamics creates spatial patterns that cognitive systems must ethically evaluate through declarative truth and novel insights.', true, 0.9600, undefined, 'All 8 domains hit');
test('CD-2', 'Signal power drives temporal momentum through spatial fields while cognitive ethics demand truthful innovation.', true, 0.9600, undefined, 'Dense keyword coverage, short text');
test('CD-3', 'If the system detects energy inconsistency in the temporal domain, then cognitive evaluation must verify the ethical implications through factual evidence and novel approaches.', true, 0.9600, undefined, 'D5 logic words + D7 verification');

// D1 + D7 heavy (information + truth)
test('CD-4', 'Data measurement and metric analysis verify that factual evidence and proof demonstrate the truth of this declarative statement with valid and accurate results.', true, 0.9600, undefined, 'D1 signal + D7 declarative');

// D2 + D6 heavy (energy + ethics)
test('CD-5', 'Dynamic force and vital energy must respect autonomy, ensure consent, and uphold justice while maintaining integrity and responsibility.', true, 0.9600, undefined, 'D2 energy + D6 ethical');

// ============================================
// SECTION 7: EDGE CASES AND BOUNDARY CONDITIONS
// ============================================
console.log('');
console.log('Section 7: EDGE CASES');

// Empty and near-empty
test('EC-EMPTY', '', false, undefined, 0.10, 'Empty string');
test('EC-SPACE', '   ', false, undefined, 0.10, 'Whitespace only');
test('EC-TAB', '\\t\\t\\t', false, undefined, 0.10, 'Tabs only');
test('EC-NEWLINE', '\\n\\n\\n', false, undefined, 0.10, 'Newlines only');

// Punctuation and special characters
test('EC-PUNCT1', '!!! ??? ...', false, undefined, 0.50, 'Punctuation only');
test('EC-PUNCT2', 'Hello, world! How are you?', false, undefined, 0.80, 'Normal punctuation');
test('EC-NUMBERS', '123 456 789 012 345', false, undefined, 0.80, 'Numbers only');
test('EC-MIXED', 'Hello123 world456 test789', false, undefined, 0.80, 'Mixed alphanumeric');

// Mixed case
test('EC-CASE1', 'SIGNAL INFORMATION DATA MEASURE', true, 0.90, undefined, 'All uppercase D1 keywords');
test('EC-CASE2', 'signal information data measure', true, 0.90, undefined, 'All lowercase D1 keywords');
test('EC-CASE3', 'SiGnAl InFoRmAtIoN dAtA mEaSuRe', true, 0.90, undefined, 'Mixed case D1 keywords');

// Long words
test('EC-LONG1', 'supercalifragilisticexpialidocious', false, undefined, 0.80, 'One very long word');
test('EC-LONG2', 'supercalifragilisticexpialidocious antidisestablishmentarianism', false, undefined, 0.80, 'Two very long words');

// Unicode and special characters
test('EC-UNICODE', 'Hello world café résumé naïve', false, undefined, 0.80, 'Unicode characters');


// ============================================
// SECTION 8: WHITLOCK COEFFICIENT (Comprehensive)
// ============================================
console.log('');
console.log('Section 8: WHITLOCK COEFFICIENT');

// Known values from the formula W(n) = (n + 4i) / 17
const w0 = whitlock(0);
assert('WC-1', Math.abs(w0.magnitude - 0.2353) < 0.001, 'W(0) magnitude ~0.2353');
assert('WC-2', Math.abs(w0.phase - 90.0) < 0.1, 'W(0) phase = 90°');

const w1 = whitlock(1);
assert('WC-3', Math.abs(w1.magnitude - 0.2941) < 0.001, 'W(1) magnitude ~0.2941');
assert('WC-4', Math.abs(w1.phase - 76.0) < 0.5, 'W(1) phase ~76°');

const w3 = whitlock(3);
assert('WC-5', Math.abs(w3.magnitude - 0.3578) < 0.001, 'W(3) magnitude ~0.3578');
assert('WC-6', Math.abs(w3.phase - 53.1) < 0.5, 'W(3) phase ~53.1°');

const w6 = whitlock(6);
assert('WC-7', Math.abs(w6.magnitude - 0.4243) < 0.001, 'W(6) magnitude ~0.4243');
assert('WC-8', Math.abs(w6.phase - 33.69) < 0.1, 'W(6) phase ~33.7°');

const w10 = whitlock(10);
assert('WC-9', Math.abs(w10.magnitude - 0.6339) < 0.001, 'W(10) magnitude ~0.6339');
assert('WC-10', Math.abs(w10.phase - 21.80) < 0.1, 'W(10) phase ~21.8°');

const w25 = whitlock(25);
assert('WC-11', Math.abs(w25.magnitude - 1.4893) < 0.001, 'W(25) magnitude ~1.4893');
assert('WC-12', Math.abs(w25.phase - 9.09) < 0.1, 'W(25) phase ~9.1°');

const w100 = whitlock(100);
assert('WC-13', Math.abs(w100.magnitude - 5.8829) < 0.001, 'W(100) magnitude ~5.8829');
assert('WC-14', Math.abs(w100.phase - 2.29) < 0.1, 'W(100) phase ~2.3°');

// Verify real and imag parts
assert('WC-15', Math.abs(w0.real - 0.0) < 0.001, 'W(0) real = 0');
assert('WC-16', Math.abs(w0.imag - 0.2353) < 0.001, 'W(0) imag = 4/17');
assert('WC-17', Math.abs(w6.real - 0.3529) < 0.001, 'W(6) real = 6/17');
assert('WC-18', Math.abs(w6.imag - 0.2353) < 0.001, 'W(6) imag = 4/17');

// ============================================
// SECTION 9: WEIGHTS VALIDATION
// ============================================
console.log('');
console.log('Section 9: WEIGHTS VALIDATION');

const weightValues = Object.values(CC_WEIGHTS);
const sum = weightValues.reduce((a,b) => a+b, 0);
assert('WT-1', Math.abs(sum - 1.0) < 0.001, 'Weights sum to 1.0: ' + sum);
assert('WT-2', CC_WEIGHTS.D1 === 0.20, 'D1 weight = 0.20');
assert('WT-3', CC_WEIGHTS.D7 === 0.20, 'D7 weight = 0.20');
assert('WT-4', CC_WEIGHTS.D5 === 0.15, 'D5 weight = 0.15');
assert('WT-5', CC_WEIGHTS.D8 === 0.10, 'D8 weight = 0.10');
assert('WT-6', CC_WEIGHTS.D2 === 0.10, 'D2 weight = 0.10');
assert('WT-7', CC_WEIGHTS.D3 === 0.10, 'D3 weight = 0.10');
assert('WT-8', CC_WEIGHTS.D4 === 0.05, 'D4 weight = 0.05');
assert('WT-9', CC_WEIGHTS.D6 === 0.10, 'D6 weight = 0.10');
assert('WT-10', N_DOMAINS === 8, 'N_DOMAINS = 8');
assert('WT-11', TAU === 0.9995, 'Canonical TAU = 0.9995');
assert('WT-12', CC_VERSION === 'v3.2', 'CC_VERSION = v3.2');

// ============================================
// SECTION 10: D5 LOGIC WORDS DETECTION
// ============================================
console.log('');
console.log('Section 10: D5 LOGIC WORDS');

test('D5-LOGIC-1', 'If the system fails, then we must restart.', true, 0.90, undefined, 'D5: if, then');
test('D5-LOGIC-2', 'Because the data is corrupt, therefore we cannot proceed.', true, 0.90, undefined, 'D5: because, therefore');
test('D5-LOGIC-3', 'However, although the results are positive, we must verify.', true, 0.90, undefined, 'D5: however, although');
test('D5-LOGIC-4', 'Since the evidence is clear, thus we conclude.', true, 0.90, undefined, 'D5: since, thus');
test('D5-LOGIC-5', 'Moreover, furthermore, nevertheless, the outcome remains uncertain.', true, 0.90, undefined, 'D5: moreover, furthermore, nevertheless');
test('D5-LOGIC-6', 'While progress is slow, whereas efficiency is high, despite the challenges.', true, 0.90, undefined, 'D5: while, whereas, despite');
test('D5-LOGIC-7', 'Unless we act now, provided that resources are available, in order to succeed.', true, 0.90, undefined, 'D5: unless, provided that, in order to');
test('D5-LOGIC-8', 'As a result, in conclusion, for example, for instance, in contrast.', true, 0.90, undefined, 'D5: as a result, in conclusion, for example, for instance, in contrast');

// ============================================
// SECTION 11: D6 ETHICAL BALANCE (Positive + Negative)
// ============================================
console.log('');
console.log('Section 11: D6 ETHICAL BALANCE');

test('D6-BAL-1', 'Good people do right things and help others while avoiding harm and bad outcomes.', true, 0.90, undefined, 'D6: positive + negative words');
test('D6-BAL-2', 'Justice requires fairness, not unfairness, and virtue over vice.', true, 0.90, undefined, 'D6: justice, fair, unfair, virtue, vice');
test('D6-BAL-3', 'Duty and obligation demand integrity and honesty while rejecting corruption.', true, 0.90, undefined, 'D6: duty, obligation, integrity, honesty, corrupt');

// ============================================
// SECTION 12: D7 VERIFICATION WORDS
// ============================================
console.log('');
console.log('Section 12: D7 VERIFICATION WORDS');

test('D7-VER-1', 'We must verify the proof through evidence and confirm the validation.', true, 0.90, undefined, 'D7: verify, proof, evidence, confirm, validation');
test('D7-VER-2', 'Demonstrate, show, test, check, audit, inspect, examine, assess, evaluate.', true, 0.90, undefined, 'D7: demonstrate, show, test, check, audit, inspect, examine, assess, evaluate');
test('D7-VER-3', 'Measure, quantify, calculate, compute, determine, establish.', true, 0.90, undefined, 'D7: measure, quantify, calculate, compute, determine, establish');
test('D7-VER-4', 'Prove, disprove, refute, support, contradict, consistent, inconsistent.', true, 0.90, undefined, 'D7: prove, disprove, refute, support, contradict, consistent, inconsistent');

// ============================================
// SECTION 13: μ BOUNDARY TESTS (Just above/below τ)
// ============================================
console.log('');
console.log('Section 13: MU BOUNDARY TESTS');

// These tests verify the exact boundary behavior around τ = 0.96
// We use texts that should score very close to the threshold

test('MU-BOUND-1', 'The system requires signal integrity and data measurement for accurate information processing and metric evaluation of word count and length size.', true, 0.95, undefined, 'High D1, moderate others, should pass');

test('MU-BOUND-2', 'Energy force power momentum drive intensity vigor strength vitality dynamic systems require temporal stability and spatial grounding.', true, 0.95, undefined, 'High D2+D3+D4, should pass');

// ============================================
// SECTION 14: MODULE INTERFACE TESTS
// ============================================
console.log('');
console.log('Section 14: MODULE INTERFACE');

// Test that all exports exist and are correct types
assert('INT-1', typeof evaluate === 'function', 'evaluate is a function');
assert('INT-2', typeof computeDomainScore === 'function', 'computeDomainScore is a function');
assert('INT-3', typeof weightedGeometricMean === 'function', 'weightedGeometricMean is a function');
assert('INT-4', typeof whitlock === 'function', 'whitlock is a function');
assert('INT-5', typeof CC_WEIGHTS === 'object', 'CC_WEIGHTS is an object');
assert('INT-6', typeof TAU === 'number', 'TAU is a number');
assert('INT-7', typeof N_DOMAINS === 'number', 'N_DOMAINS is a number');
assert('INT-8', typeof CC_VERSION === 'string', 'CC_VERSION is a string');
assert('INT-9', typeof DOMAIN_KEYWORDS === 'object', 'DOMAIN_KEYWORDS is an object');
assert('INT-10', typeof D1_TIERS === 'object', 'D1_TIERS is an object');

// Test evaluate() returns correct structure
const sampleResult = evaluate('test text');
assert('INT-11', typeof sampleResult === 'object', 'evaluate returns an object');
assert('INT-12', typeof sampleResult.scores === 'object', 'result has scores object');
assert('INT-13', typeof sampleResult.mu === 'number', 'result has mu number');
assert('INT-14', typeof sampleResult.pass === 'boolean', 'result has pass boolean');
assert('INT-15', typeof sampleResult.tier === 'string', 'result has tier string');
assert('INT-16', typeof sampleResult.whitlock === 'object', 'result has whitlock object');
assert('INT-17', typeof sampleResult.version === 'string', 'result has version string');

// ============================================
// SECTION 15: REALISTIC GHOST9 INPUTS
// ============================================
console.log('');
console.log('Section 15: REALISTIC GHOST9 INPUTS');

// Simulate actual inputs the kernel might receive
test('REAL-1', 'User query: What is the coherence score of this text?', false, undefined, 0.95, 'Short user query');
test('REAL-2', 'System status: All modules operational. Kernel running. Memory usage normal. No errors detected.', true, 0.90, undefined, 'System status report');
test('REAL-3', 'Error: Module failed to initialize. Check configuration and restart.', false, undefined, 0.95, 'Error message');
test('REAL-4', 'Log entry: 2026-07-07 14:32:15 - Coherence evaluation completed. Mu=0.9845. Pass=true. Tier=STM.', true, 0.90, undefined, 'Log entry');
test('REAL-5', 'The quantum resonance field demonstrates temporal stability while maintaining signal integrity across spatial domains, requiring cognitive evaluation of ethical implications through declarative truth verification and novel methodological approaches.', true, 0.9600, undefined, 'Complex technical text');

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
console.log('Seal: 2026-07-07_19:56_Tulsa_OK');
process.exit(failed > 0 ? 1 : 0);

