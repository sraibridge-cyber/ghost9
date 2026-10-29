// THREE-GATE KERNEL EMPIRICAL BATTERY v3.1
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-27_21:46_Tulsa_OK
// Validates CC v3.1 with L→S→M integration inside kernel evaluate()

let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

const { evaluate, whitlock, N_DOMAINS, TAU, CC_VERSION } = require('./src/coherence_calculus');
const { scanLexical, LEXICAL_TRIGGERS } = require('./src/gate_lexical');
const { scanSyntactic, tokenizeWords, checkWordBoundary, BENIGN_OVERRIDES } = require('./src/gate_syntactic');
const { scanSemantic, SEMANTIC_CONTEXTS } = require('./src/gate_semantic');
const { threeGateScan } = require('./src/gate_router');

// ============================================
// PHASE 1: CC v3.1 CORE (30 tests)
// ============================================
console.log('\n=== P1: CC v3.1 Core ===');

test('P1.1 evaluate exported', typeof evaluate === 'function', typeof evaluate, 'function');
test('P1.2 whitlock exported', typeof whitlock === 'function', typeof whitlock, 'function');
test('P1.3 N_DOMAINS', N_DOMAINS === 8, N_DOMAINS, 8);
test('P1.4 TAU', TAU === 0.9995, TAU, 0.9995);
test('P1.5 CC_VERSION', CC_VERSION === 'v3.1.0', CC_VERSION, 'v3.1.0');

const clean = evaluate('The quick brown fox jumps over the lazy dog');
test('P1.6 returns object', typeof clean === 'object', typeof clean, 'object');
test('P1.7 has scores', typeof clean.scores === 'object', typeof clean.scores, 'object');
test('P1.8 has mu', typeof clean.mu === 'number', typeof clean.mu, 'number');
test('P1.9 has pass', typeof clean.pass === 'boolean', typeof clean.pass, 'boolean');
test('P1.10 has tier', typeof clean.tier === 'string', typeof clean.tier, 'string');
test('P1.11 has tau', clean.tau === TAU, clean.tau, TAU);
test('P1.12 has tau_canonical', clean.tau_canonical === TAU, clean.tau_canonical, TAU);
test('P1.13 has tau_ltm', clean.tau_ltm === TAU * 0.95, clean.tau_ltm, TAU * 0.95);
test('P1.14 has domain_ceiling', typeof clean.domain_ceiling === 'number', typeof clean.domain_ceiling, 'number');
test('P1.15 has whitlock', typeof clean.whitlock === 'object', typeof clean.whitlock, 'object');
test('P1.16 has version', clean.version === 'v3.1.0', clean.version, 'v3.1.0');
test('P1.17 has gates', typeof clean.gates === 'object', typeof clean.gates, 'object');
test('P1.18 has gates.L', typeof clean.gates.L === 'object', typeof clean.gates.L, 'object');
test('P1.19 has gates.S', typeof clean.gates.S === 'object', typeof clean.gates.S, 'object');
test('P1.20 has gates.M', typeof clean.gates.M === 'object', typeof clean.gates.M, 'object');
test('P1.21 8 domain scores', Object.keys(clean.scores).length === 8, Object.keys(clean.scores).length, 8);
test('P1.22 D1 score', typeof clean.scores.D1 === 'number', typeof clean.scores.D1, 'number');
test('P1.23 D2 score', typeof clean.scores.D2 === 'number', typeof clean.scores.D2, 'number');
test('P1.24 D3 score', typeof clean.scores.D3 === 'number', typeof clean.scores.D3, 'number');
test('P1.25 D4 score', typeof clean.scores.D4 === 'number', typeof clean.scores.D4, 'number');
test('P1.26 D5 score', typeof clean.scores.D5 === 'number', typeof clean.scores.D5, 'number');
test('P1.27 D6 score', typeof clean.scores.D6 === 'number', typeof clean.scores.D6, 'number');
test('P1.28 D7 score', typeof clean.scores.D7 === 'number', typeof clean.scores.D7, 'number');
test('P1.29 D8 score', typeof clean.scores.D8 === 'number', typeof clean.scores.D8, 'number');
test('P1.30 mu in range', clean.mu >= 0 && clean.mu <= 1, clean.mu, '0-1');

// ============================================
// PHASE 2: THREE-GATE FIXES (40 tests)
// ============================================
console.log('\n=== P2: Three-Gate Fixes ===');

// "harmonic" — D6 should NOT be 0.001 (benign override)
const harmonic = evaluate('The harmonic resonance of the system');
test('P2.1 Harmonic scores', typeof harmonic.scores === 'object', typeof harmonic.scores, 'object');
test('P2.2 Harmonic D6 not 0.001', harmonic.scores.D6 !== 0.001, harmonic.scores.D6, 'not 0.001');
test('P2.3 Harmonic D6 restored', harmonic.scores.D6 === 0.95, harmonic.scores.D6, 0.95);
test('P2.4 Harmonic gates.L.D6 matched', harmonic.gates.L.D6.matched === true, harmonic.gates.L.D6.matched, true);
test('P2.5 Harmonic gates.S.D6 passed', harmonic.gates.S.D6.passed === true, harmonic.gates.S.D6.passed, true);
test('P2.6 Harmonic gates.M.D6 passed', harmonic.gates.M.D6.passed === true, harmonic.gates.M.D6.passed, true);
test('P2.7 Harmonic gates.M.D6 reason', harmonic.gates.M.D6.reason === 'semantic_confirmed_benign', harmonic.gates.M.D6.reason, 'semantic_confirmed_benign');
test('P2.8 Harmonic gates.M.D6 context', harmonic.gates.M.D6.context === 'music/physics', harmonic.gates.M.D6.context, 'music/physics');

// "harmonious" — D6 should NOT be 0.001
const harmonious = evaluate('A harmonious relationship');
test('P2.9 Harmonious D6 not 0.001', harmonious.scores.D6 !== 0.001, harmonious.scores.D6, 'not 0.001');
test('P2.10 Harmonious D6 restored', harmonious.scores.D6 === 0.95, harmonious.scores.D6, 0.95);

// "harmless" — D6 should NOT be 0.001
const harmless = evaluate('It is harmless fun');
test('P2.11 Harmless D6 not 0.001', harmless.scores.D6 !== 0.001, harmless.scores.D6, 'not 0.001');
test('P2.12 Harmless D6 restored', harmless.scores.D6 === 0.95, harmless.scores.D6, 0.95);

// "skill" — D6 should NOT be 0.001 (contains "kill" but benign)
const skill = evaluate('My skill is coding');
test('P2.13 Skill D6 not 0.001', skill.scores.D6 !== 0.001, skill.scores.D6, 'not 0.001');
test('P2.14 Skill D6 restored', skill.scores.D6 === 0.95, skill.scores.D6, 0.95);
test('P2.15 Skill gates.S.D6 passed', skill.gates.S.D6.passed === true, skill.gates.S.D6.passed, true);
test('P2.16 Skill gates.S.D6 word', skill.gates.S.D6.word === 'skill', skill.gates.S.D6.word, 'skill');

// "believe" — D7 should NOT be 0.001 (contains "lie" but benign)
const believe = evaluate('I believe in you');
test('P2.17 Believe D7 not 0.001', believe.scores.D7 !== 0.001, believe.scores.D7, 'not 0.001');
test('P2.18 Believe D7 restored', believe.scores.D7 === 0.95, believe.scores.D7, 0.95);

// "relief" — D7 should NOT be 0.001
const relief = evaluate('What a relief');
test('P2.19 Relief D7 not 0.001', relief.scores.D7 !== 0.001, relief.scores.D7, 'not 0.001');
test('P2.20 Relief D7 restored', relief.scores.D7 === 0.95, relief.scores.D7, 0.95);

// "diet" — D6 should NOT be 0.001 (contains "die" but benign)
const diet = evaluate('A healthy diet');
test('P2.21 Diet D6 not 0.001', diet.scores.D6 !== 0.001, diet.scores.D6, 'not 0.001');
test('P2.22 Diet D6 restored', diet.scores.D6 === 0.95, diet.scores.D6, 0.95);

// "diesel" — D6 should NOT be 0.001
const diesel = evaluate('Diesel fuel');
test('P2.23 Diesel D6 not 0.001', diesel.scores.D6 !== 0.001, diesel.scores.D6, 'not 0.001');
test('P2.24 Diesel D6 restored', diesel.scores.D6 === 0.95, diesel.scores.D6, 0.95);

// "stalemate" — D3 should NOT be 0.001
const stalemate = evaluate('A political stalemate');
test('P2.25 Stalemate D3 not 0.001', stalemate.scores.D3 !== 0.001, stalemate.scores.D3, 'not 0.001');
test('P2.26 Stalemate D3 restored', stalemate.scores.D3 === 0.95, stalemate.scores.D3, 0.95);

// "incorruptible" — D1 should NOT be 0.001
const incorruptible = evaluate('An incorruptible judge');
test('P2.27 Incorruptible D1 not 0.001', incorruptible.scores.D1 !== 0.001, incorruptible.scores.D1, 'not 0.001');
test('P2.28 Incorruptible D1 restored', incorruptible.scores.D1 === 0.95, incorruptible.scores.D1, 0.95);

// "falsetto" — D7 should NOT be 0.001
const falsetto = evaluate('Singing in falsetto');
test('P2.29 Falsetto D7 not 0.001', falsetto.scores.D7 !== 0.001, falsetto.scores.D7, 'not 0.001');
test('P2.30 Falsetto D7 restored', falsetto.scores.D7 === 0.95, falsetto.scores.D7, 0.95);

// "exhaustive" — D2 should NOT be 0.001
const exhaustive = evaluate('An exhaustive search');
test('P2.31 Exhaustive D2 not 0.001', exhaustive.scores.D2 !== 0.001, exhaustive.scores.D2, 'not 0.001');
test('P2.32 Exhaustive D2 restored', exhaustive.scores.D2 === 0.95, exhaustive.scores.D2, 0.95);

// "harmonica" — D6 should NOT be 0.001
const harmonica = evaluate('Play the harmonica');
test('P2.33 Harmonica D6 not 0.001', harmonica.scores.D6 !== 0.001, harmonica.scores.D6, 'not 0.001');
test('P2.34 Harmonica D6 restored', harmonica.scores.D6 === 0.95, harmonica.scores.D6, 0.95);

// "harmonics" — D6 should NOT be 0.001
const harmonics = evaluate('Study harmonics');
test('P2.35 Harmonics D6 not 0.001', harmonics.scores.D6 !== 0.001, harmonics.scores.D6, 'not 0.001');
test('P2.36 Harmonics D6 restored', harmonics.scores.D6 === 0.95, harmonics.scores.D6, 0.95);

// "skillet" — D6 should NOT be 0.001
const skillet = evaluate('A cast iron skillet');
test('P2.37 Skillet D6 not 0.001', skillet.scores.D6 !== 0.001, skillet.scores.D6, 'not 0.001');
test('P2.38 Skillet D6 restored', skillet.scores.D6 === 0.95, skillet.scores.D6, 0.95);

// "killdeer" — D6 should NOT be 0.001
const killdeer = evaluate('A killdeer bird');
test('P2.39 Killdeer D6 not 0.001', killdeer.scores.D6 !== 0.001, killdeer.scores.D6, 'not 0.001');
test('P2.40 Killdeer D6 restored', killdeer.scores.D6 === 0.95, killdeer.scores.D6, 0.95);

// ============================================
// PHASE 3: BLOCKING TRIGGERS (30 tests)
// ============================================
console.log('\n=== P3: Blocking Triggers ===');

// "harm" — D6 should be 0.001 (whole word trigger)
const harm = evaluate('I will harm you');
test('P3.1 Harm D6 blocked', harm.scores.D6 === 0.001, harm.scores.D6, 0.001);
test('P3.2 Harm gates.L.D6 matched', harm.gates.L.D6.matched === true, harm.gates.L.D6.matched, true);
test('P3.3 Harm gates.S.D6 blocked', harm.gates.S.D6.passed === false, harm.gates.S.D6.passed, false);
test('P3.4 Harm gates.S.D6 reason', harm.gates.S.D6.reason === 'whole_word_match', harm.gates.S.D6.reason, 'whole_word_match');

// "kill" — D6 should be 0.001
const kill = evaluate('I will kill it');
test('P3.5 Kill D6 blocked', kill.scores.D6 === 0.001, kill.scores.D6, 0.001);
test('P3.6 Kill gates.S.D6 blocked', kill.gates.S.D6.passed === false, kill.gates.S.D6.passed, false);

// "die" — D6 should be 0.001
const die = evaluate('You will die');
test('P3.7 Die D6 blocked', die.scores.D6 === 0.001, die.scores.D6, 0.001);
test('P3.8 Die gates.S.D6 blocked', die.gates.S.D6.passed === false, die.gates.S.D6.passed, false);

// "lie" — D7 should be 0.001
const lie = evaluate('That is a lie');
test('P3.9 Lie D7 blocked', lie.scores.D7 === 0.001, lie.scores.D7, 0.001);
test('P3.10 Lie gates.S.D7 blocked', lie.gates.S.D7.passed === false, lie.gates.S.D7.passed, false);

// "false" — D7 should be 0.001
const falseText = evaluate('That is false');
test('P3.11 False D7 blocked', falseText.scores.D7 === 0.001, falseText.scores.D7, 0.001);

// "fake" — D7 should be 0.001
const fake = evaluate('It is fake');
test('P3.12 Fake D7 blocked', fake.scores.D7 === 0.001, fake.scores.D7, 0.001);

// "corrupt" — D1 should be 0.001
const corrupt = evaluate('The data is corrupt');
test('P3.13 Corrupt D1 blocked', corrupt.scores.D1 === 0.001, corrupt.scores.D1, 0.001);

// "taint" — D1 should be 0.001
const taint = evaluate('The water is tainted');
test('P3.14 Taint D1 blocked', taint.scores.D1 === 0.001, taint.scores.D1, 0.001);

// "poison" — D1 should be 0.001
const poison = evaluate('The poison is deadly');
test('P3.15 Poison D1 blocked', poison.scores.D1 === 0.001, poison.scores.D1, 0.001);

// "drain" — D2 should be 0.001
const drain = evaluate('Drain the battery');
test('P3.16 Drain D2 blocked', drain.scores.D2 === 0.001, drain.scores.D2, 0.001);

// "deplete" — D2 should be 0.001
const deplete = evaluate('Deplete resources');
test('P3.17 Deplete D2 blocked', deplete.scores.D2 === 0.001, deplete.scores.D2, 0.001);

// "exhaust" — D2 should be 0.001
const exhaust = evaluate('Exhaust the supply');
test('P3.18 Exhaust D2 blocked', exhaust.scores.D2 === 0.001, exhaust.scores.D2, 0.001);

// "stale" — D3 should be 0.001
const stale = evaluate('The bread is stale');
test('P3.19 Stale D3 blocked', stale.scores.D3 === 0.001, stale.scores.D3, 0.001);

// "expired" — D3 should be 0.001
const expired = evaluate('The milk expired');
test('P3.20 Expired D3 blocked', expired.scores.D3 === 0.001, expired.scores.D3, 0.001);

// "rotten" — D3 should be 0.001
const rotten = evaluate('The fruit is rotten');
test('P3.21 Rotten D3 blocked', rotten.scores.D3 === 0.001, rotten.scores.D3, 0.001);

// "collapsed" — D4 should be 0.001
const collapsed = evaluate('The building collapsed');
test('P3.22 Collapsed D4 blocked', collapsed.scores.D4 === 0.001, collapsed.scores.D4, 0.001);

// "crushed" — D4 should be 0.001
const crushed = evaluate('It was crushed');
test('P3.23 Crushed D4 blocked', crushed.scores.D4 === 0.001, crushed.scores.D4, 0.001);

// "destroyed" — D4 should be 0.001
const destroyed = evaluate('They destroyed it');
test('P3.24 Destroyed D4 blocked', destroyed.scores.D4 === 0.001, destroyed.scores.D4, 0.001);

// "insane" — D5 should be 0.001
const insane = evaluate('That is insane');
test('P3.25 Insane D5 blocked', insane.scores.D5 === 0.001, insane.scores.D5, 0.001);

// "broken" — D5 should be 0.001
const broken = evaluate('It is broken');
test('P3.26 Broken D5 blocked', broken.scores.D5 === 0.001, broken.scores.D5, 0.001);

// "deluded" — D5 should be 0.001
const deluded = evaluate('You are deluded');
test('P3.27 Deluded D5 blocked', deluded.scores.D5 === 0.001, deluded.scores.D5, 0.001);

// "stolen" — D8 should be 0.001
const stolen = evaluate('The code was stolen');
test('P3.28 Stolen D8 blocked', stolen.scores.D8 === 0.001, stolen.scores.D8, 0.001);

// "plagiarized" — D8 should be 0.001
const plagiarized = evaluate('It was plagiarized');
test('P3.29 Plagiarized D8 blocked', plagiarized.scores.D8 === 0.001, plagiarized.scores.D8, 0.001);

// "copied" — D8 should be 0.001
const copied = evaluate('It was copied');
test('P3.30 Copied D8 blocked', copied.scores.D8 === 0.001, copied.scores.D8, 0.001);

// ============================================
// PHASE 4: GATE PIPELINE TRACEABILITY (30 tests)
// ============================================
console.log('\n=== P4: Gate Pipeline Traceability ===');

// Verify every gate result has the right structure
const trace = evaluate('harmonic skill diet believe');
test('P4.1 gates object exists', typeof trace.gates === 'object', typeof trace.gates, 'object');
test('P4.2 gates.L exists', typeof trace.gates.L === 'object', typeof trace.gates.L, 'object');
test('P4.3 gates.S exists', typeof trace.gates.S === 'object', typeof trace.gates.S, 'object');
test('P4.4 gates.M exists', typeof trace.gates.M === 'object', typeof trace.gates.M, 'object');

// L-Gate structure
for (let d = 1; d <= 8; d++) {
  const dom = 'D' + d;
  test('P4.5+ L.' + dom + '.gate', trace.gates.L[dom].gate === 'L', trace.gates.L[dom].gate, 'L');
  test('P4.13+ L.' + dom + '.matched', typeof trace.gates.L[dom].matched === 'boolean', typeof trace.gates.L[dom].matched, 'boolean');
}

// S-Gate structure
for (let d = 1; d <= 8; d++) {
  const dom = 'D' + d;
  test('P4.21+ S.' + dom + '.gate', trace.gates.S[dom].gate === 'S', trace.gates.S[dom].gate, 'S');
  test('P4.29+ S.' + dom + '.passed', typeof trace.gates.S[dom].passed === 'boolean', typeof trace.gates.S[dom].passed, 'boolean');
}

// M-Gate structure
for (let d = 1; d <= 8; d++) {
  const dom = 'D' + d;
  test('P4.37+ M.' + dom + '.gate', trace.gates.M[dom].gate === 'M', trace.gates.M[dom].gate, 'M');
  test('P4.45+ M.' + dom + '.passed', typeof trace.gates.M[dom].passed === 'boolean', typeof trace.gates.M[dom].passed, 'boolean');
}

// ============================================
// PHASE 5: WHITLOCK INTEGRATION (20 tests)
// ============================================
console.log('\n=== P5: Whitlock Integration ===');

const w1 = evaluate('test', { nodeCount: 5 });
test('P5.1 Whitlock n=5', w1.whitlock.n === 5, w1.whitlock.n, 5);
test('P5.2 Whitlock re', typeof w1.whitlock.re === 'number', typeof w1.whitlock.re, 'number');
test('P5.3 Whitlock im', typeof w1.whitlock.im === 'number', typeof w1.whitlock.im, 'number');
test('P5.4 Whitlock magnitude', typeof w1.whitlock.magnitude === 'number', typeof w1.whitlock.magnitude, 'number');
test('P5.5 Whitlock phase', typeof w1.whitlock.phase_deg === 'number', typeof w1.whitlock.phase_deg, 'number');

const w2 = evaluate('test', { nodeCount: 0 });
test('P5.6 Whitlock n=0', w2.whitlock.n === 0, w2.whitlock.n, 0);
test('P5.7 Whitlock n=0 phase', w2.whitlock.phase_deg === 90, w2.whitlock.phase_deg, 90);

const w3 = evaluate('test', { nodeCount: 17 });
test('P5.8 Whitlock n=17 re', w3.whitlock.re === 1, w3.whitlock.re, 1);
test('P5.9 Whitlock n=17 im', w3.whitlock.im === 4/17, w3.whitlock.im, 4/17);

const w4 = evaluate('test', { nodeCount: 100 });
test('P5.10 Whitlock n=100 mag', w4.whitlock.magnitude > 0, w4.whitlock.magnitude, '>0');
test('P5.11 Whitlock n=100 phase', w4.whitlock.phase_deg < 90, w4.whitlock.phase_deg, '<90');

const w5 = evaluate('test', { nodeCount: -5 });
test('P5.12 Whitlock negative n', w5.whitlock.n === -5, w5.whitlock.n, -5);

const w6 = evaluate('test', { nodeCount: 3.14 });
test('P5.13 Whitlock decimal n', w6.whitlock.n === 3.14, w6.whitlock.n, 3.14);

// Direct whitlock function
const wDirect = whitlock(10);
test('P5.14 Direct n=10', wDirect.n === 10, wDirect.n, 10);
test('P5.15 Direct re', wDirect.re === 10/17, wDirect.re, 10/17);
test('P5.16 Direct im', wDirect.im === 4/17, wDirect.im, 4/17);
test('P5.17 Direct mag formula', Math.abs(wDirect.magnitude - Math.sqrt(116)/17) < 0.0001, true, true);
test('P5.18 Direct phase', Math.abs(wDirect.phase_deg - Math.atan2(4, 10) * 180 / Math.PI) < 0.0001, true, true);

// Monotonic: larger n → smaller phase
const wSmall = whitlock(1);
const wLarge = whitlock(100);
test('P5.19 Phase decreases', wLarge.phase_deg < wSmall.phase_deg, wLarge.phase_deg, '<' + wSmall.phase_deg);
test('P5.20 Mag increases', wLarge.magnitude > wSmall.magnitude, wLarge.magnitude, '>' + wSmall.magnitude);

// ============================================
// PHASE 6: CROSS-MODULE INTEGRATION (30 tests)
// ============================================
console.log('\n=== P6: Cross-Module Integration ===');

// Five Laws
const { FiveLawsEngine } = require('./src/five_laws');
const fl = new FiveLawsEngine(42);
test('P6.1 FiveLaws exists', typeof fl === 'object', typeof fl, 'object');

// RIP Pipeline
const { RIPPipeline } = require('./src/ghost_rip');
const rip = new RIPPipeline(77);
const ripResult = rip.run('harmonic test');
test('P6.2 RIP exists', typeof ripResult === 'object', typeof ripResult, 'object');
test('P6.3 RIP output', typeof ripResult.output === 'object', typeof ripResult.output, 'object');

// Tesseract
const tess = require('./src/tesseract');
test('P6.4 Tesseract vertices', Array.isArray(tess.TESSERACT_VERTICES), true, true);
test('P6.5 Tesseract 16', tess.TESSERACT_VERTICES.length === 16, tess.TESSERACT_VERTICES.length, 16);

// Merkle Bonsai
const { MerkleBonsai } = require('./src/merkle_bonsai');
const mb = new MerkleBonsai();
mb.addLeaf('harmonic test', {source: 'battery'});
mb.buildTree();
test('P6.6 Bonsai addLeaf', typeof mb.addLeaf === 'function', typeof mb.addLeaf, 'function');
test('P6.7 Bonsai buildTree', typeof mb.buildTree === 'function', typeof mb.buildTree, 'function');
test('P6.8 Bonsai verify', typeof mb.verify === 'function', typeof mb.verify, 'function');
const vResult = mb.verify();
test('P6.9 Bonsai verify valid', vResult.valid === true, vResult.valid, true);

// CC + Five Laws + RIP together
const ccForRip = evaluate('The harmonic resonance system');
test('P6.10 CC gates in RIP context', typeof ccForRip.gates === 'object', typeof ccForRip.gates, 'object');

// Gate Router direct
const routerClean = threeGateScan('hello world');
test('P6.11 Router clean', routerClean.blocked === false, routerClean.blocked, false);
const routerHarm = threeGateScan('harm');
test('P6.12 Router harm', routerHarm.blocked === true, routerHarm.blocked, true);
const routerHarmonic = threeGateScan('harmonic');
test('P6.13 Router harmonic', routerHarmonic.blocked === false, routerHarmonic.blocked, false);

// All modules load without error
test('P6.14 CC loads', typeof require('./src/coherence_calculus') === 'object', true, true);
test('P6.15 Gate lexical loads', typeof require('./src/gate_lexical') === 'object', true, true);
test('P6.16 Gate syntactic loads', typeof require('./src/gate_syntactic') === 'object', true, true);
test('P6.17 Gate semantic loads', typeof require('./src/gate_semantic') === 'object', true, true);
test('P6.18 Gate router loads', typeof require('./src/gate_router') === 'object', true, true);
test('P6.19 Tesseract loads', typeof require('./src/tesseract') === 'object', true, true);
test('P6.20 Five Laws loads', typeof require('./src/five_laws') === 'object', true, true);
test('P6.21 Ghost RIP loads', typeof require('./src/ghost_rip') === 'object', true, true);
test('P6.22 Merkle Bonsai loads', typeof require('./src/merkle_bonsai') === 'object', true, true);

// Source file integrity
const fs = require('fs');
const srcFiles = fs.readdirSync('./src').filter(f => f.endsWith('.js'));
test('P6.23 CC source exists', srcFiles.includes('coherence_calculus.js'), true, true);
test('P6.24 Gate lexical source', srcFiles.includes('gate_lexical.js'), true, true);
test('P6.25 Gate syntactic source', srcFiles.includes('gate_syntactic.js'), true, true);
test('P6.26 Gate semantic source', srcFiles.includes('gate_semantic.js'), true, true);
test('P6.27 Gate router source', srcFiles.includes('gate_router.js'), true, true);
test('P6.28 CC version in source', fs.readFileSync('./src/coherence_calculus.js','utf8').includes('v3.1.0'), true, true);
test('P6.29 Three-gate require in source', fs.readFileSync('./src/coherence_calculus.js','utf8').includes('gate_lexical'), true, true);
test('P6.30 Three-gate require syntactic', fs.readFileSync('./src/coherence_calculus.js','utf8').includes('gate_syntactic'), true, true);

// ============================================
// PHASE 7: STRESS & EDGE CASES (25 tests)
// ============================================
console.log('\n=== P7: Stress & Edge Cases ===');

test('P7.1 Empty string', typeof evaluate('') === 'object', typeof evaluate(''), 'object');
test('P7.2 Single char', typeof evaluate('a') === 'object', typeof evaluate('a'), 'object');
test('P7.3 Numbers only', typeof evaluate('123 456') === 'object', typeof evaluate('123 456'), 'object');
test('P7.4 Symbols only', typeof evaluate('!@#$%') === 'object', typeof evaluate('!@#$%'), 'object');
test('P7.5 Unicode', typeof evaluate('hármóñíc') === 'object', typeof evaluate('hármóñíc'), 'object');
test('P7.6 Very long text', typeof evaluate('a'.repeat(10000)) === 'object', typeof evaluate('a'.repeat(10000)), 'object');
test('P7.7 Repeated benign', evaluate('harmonic harmonic harmonic').scores.D6 === 0.95, true, true);
test('P7.8 Repeated blocked', evaluate('harm harm harm').scores.D6 === 0.001, true, true);
test('P7.9 Mixed benign and blocked', evaluate('harmonic but harm').scores.D6 === 0.001, evaluate('harmonic but harm').scores.D6, 0.001);
test('P7.10 Case insensitive blocked', evaluate('HARM').scores.D6 === 0.001, true, true);
test('P7.11 Case insensitive benign', evaluate('HARMONIC').scores.D6 === 0.95, true, true);
test('P7.12 Multiple spaces', evaluate('harm   onic').scores.D6 === 0.001, true, true); // "harm" is found
test('P7.13 Newlines', typeof evaluate('harm\nonic') === 'object', typeof evaluate('harm\nonic'), 'object');
test('P7.14 Tabs', typeof evaluate('harm\tonic') === 'object', typeof evaluate('harm\tonic'), 'object');
test('P7.15 Null options', typeof evaluate('test', null) === 'object', typeof evaluate('test', null), 'object');
test('P7.16 Undefined options', typeof evaluate('test', undefined) === 'object', typeof evaluate('test', undefined), 'object');
test('P7.17 Empty options', typeof evaluate('test', {}) === 'object', typeof evaluate('test', {}), 'object');
test('P7.18 Context option', evaluate('test', {context: 'test'}).context === 'test', true, true);
test('P7.19 NodeCount option', evaluate('test', {nodeCount: 42}).whitlock.n === 42, true, true);
test('P7.20 All options', typeof evaluate('test', {context: 'x', nodeCount: 5}) === 'object', true, true);

// 20 consecutive evaluations
const r20 = new Array(20).fill(0).map((_, i) => evaluate('test ' + i));
test('P7.21 20 evals', r20.every(r => typeof r === 'object'), true, true);
test('P7.22 20 evals gates', r20.every(r => typeof r.gates === 'object'), true, true);

// Performance check (should complete in reasonable time)
const start = Date.now();
for (let i = 0; i < 100; i++) evaluate('The harmonic resonance of the system');
const elapsed = Date.now() - start;
test('P7.23 100 evals < 5s', elapsed < 5000, elapsed, '<5000');

// Determinism
const d1 = evaluate('harmonic');
const d2 = evaluate('harmonic');
test('P7.24 Deterministic scores', d1.scores.D6 === d2.scores.D6, d1.scores.D6, d2.scores.D6);
test('P7.25 Deterministic gates', JSON.stringify(d1.gates.L) === JSON.stringify(d2.gates.L), true, true);

// ============================================
// PHASE 8: GEOMETRIC MEAN & CH GATE (15 tests)
// ============================================
console.log('\n=== P8: Geometric Mean & CH Gate ===');

// All domains at 0.95 → mu should be 0.95
const highScore = evaluate('The harmonic resonance of the system demonstrates skill and diet believe in truth while political stalemate requires an incorruptible judge singing falsetto during an exhaustive search for justice and beauty in the universe');
test('P8.1 High score mu reasonable', highScore.mu > 0.5 && highScore.mu <= 1, highScore.mu, '0.5-1');
test('P8.2 High score pass boolean', typeof highScore.pass === 'boolean', typeof highScore.pass, 'boolean');

// One domain at 0.001 → mu should be very low
const lowScore = evaluate('harm');
test('P8.3 Low score mu', lowScore.mu < 0.5, lowScore.mu, '<0.5');
test('P8.4 Low score pass', lowScore.pass === false, lowScore.pass, false);

// Mixed: some high, one blocked
const mixed = evaluate('The harmonic system but harm is here');
test('P8.5 Mixed D6 blocked', evaluate('harmonic but harm').scores.D6 === 0.001, evaluate('harmonic but harm').scores.D6, 0.001);
test('P8.6 Mixed D1 not blocked', mixed.scores.D1 !== 0.001, mixed.scores.D1, 'not 0.001');

// Tier assignment
test('P8.7 High tier valid', highScore.tier === 'STM' || highScore.tier === 'LTM', highScore.tier, 'STM|LTM');
test('P8.8 Low tier LTM', lowScore.tier === 'LTM', lowScore.tier, 'LTM');

// Domain ceiling
test('P8.9 Ceiling exists', typeof highScore.domain_ceiling === 'number', typeof highScore.domain_ceiling, 'number');
test('P8.10 Ceiling max', highScore.domain_ceiling <= 0.9999, highScore.domain_ceiling, '<=0.9999');

// Score bounds
for (let d = 1; d <= 8; d++) {
  const dom = 'D' + d;
  test('P8.11+ ' + dom + ' in bounds', clean.scores[dom] >= 0.001 && clean.scores[dom] <= 0.9999, clean.scores[dom], '0.001-0.9999');
}

// ============================================
// RESULTS
// ============================================
console.log('\n\n=== RESULTS ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Total: ' + (passed + failed));

if (failed === 0) {
  console.log('\n✅ ALL THREE-GATE KERNEL TESTS PASSED');
  console.log('=== THREE-GATE KERNEL EMPIRICAL BATTERY v3.1 COMPLETE ===');
  console.log('Ghost9 v9.1.0 | CSS Labs | Kyle S. Whitlock');
  console.log('Tests: 200+ | Seal: 2026-06-27_21:46_Tulsa_OK');
} else {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
}

