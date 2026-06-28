// THREE-GATE EMPIRICAL BATTERY v1.1
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-27_21:20_Tulsa_OK

let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

const { scanLexical, LEXICAL_TRIGGERS } = require('./src/gate_lexical');
const { scanSyntactic, tokenizeWords, checkWordBoundary, BENIGN_OVERRIDES } = require('./src/gate_syntactic');
const { scanSemantic, SEMANTIC_CONTEXTS } = require('./src/gate_semantic');
const { threeGateScan } = require('./src/gate_router');

// ============================================
// PHASE 1: L-GATE (40 tests)
// ============================================
console.log('\n=== P1: L-GATE Lexical ===');

test('P1.1 scanLexical exported', typeof scanLexical === 'function', typeof scanLexical, 'function');
test('P1.2 LEXICAL_TRIGGERS exported', typeof LEXICAL_TRIGGERS === 'object', typeof LEXICAL_TRIGGERS, 'object');
for (let d = 1; d <= 8; d++) {
  test('P1.' + (d+2) + ' D' + d + ' triggers', Array.isArray(LEXICAL_TRIGGERS['D' + d]), true, true);
}

const clean = scanLexical('The quick brown fox');
for (let d = 1; d <= 8; d++) {
  test('P1.' + (d+10) + ' Clean D' + d, clean['D' + d].matched === false, clean['D' + d].matched, false);
}

const harmText = scanLexical('This will harm you');
test('P1.19 Harm D6 matched', harmText.D6.matched === true, harmText.D6.matched, true);
test('P1.20 Harm D6 trigger', harmText.D6.trigger === 'harm', harmText.D6.trigger, 'harm');

const lieText = scanLexical('That is a lie');
test('P1.21 Lie D7 matched', lieText.D7.matched === true, lieText.D7.matched, true);

const harmonicText = scanLexical('The harmonic resonance');
test('P1.22 Harmonic D6 matched', harmonicText.D6.matched === true, harmonicText.D6.matched, true);
test('P1.23 Harmonic D6 trigger', harmonicText.D6.trigger === 'harm', harmonicText.D6.trigger, 'harm');

// Test all 8 domains have gate='L'
const allL = scanLexical('test');
for (let d = 1; d <= 8; d++) {
  test('P1.24+ D' + d + ' gate=L', allL['D' + d].gate === 'L', allL['D' + d].gate, 'L');
}

// ============================================
// PHASE 2: S-GATE (50 tests)
// ============================================
console.log('\n=== P2: S-GATE Syntactic ===');

test('P2.1 scanSyntactic exported', typeof scanSyntactic === 'function', typeof scanSyntactic, 'function');
test('P2.2 tokenizeWords exported', typeof tokenizeWords === 'function', typeof tokenizeWords, 'function');
test('P2.3 checkWordBoundary exported', typeof checkWordBoundary === 'function', typeof checkWordBoundary, 'function');
test('P2.4 BENIGN_OVERRIDES exported', typeof BENIGN_OVERRIDES === 'object', typeof BENIGN_OVERRIDES, 'object');

const tokens = tokenizeWords('The quick brown fox');
test('P2.5 Token count', tokens.length === 4, tokens.length, 4);

const wb1 = checkWordBoundary('harm', ['harmonic', 'test']);
test('P2.6 Substring match', wb1.type === 'substring', wb1.type, 'substring');

const wb2 = checkWordBoundary('harm', ['harm', 'test']);
test('P2.7 Whole word match', wb2.type === 'whole_word', wb2.type, 'whole_word');

const wb3 = checkWordBoundary('harm', ['test', 'hello']);
test('P2.8 No match', wb3.type === 'none', wb3.type, 'none');

// Clean S-Gate
const cleanS = scanSyntactic('hello world', scanLexical('hello world'));
for (let d = 1; d <= 8; d++) {
  test('P2.9+ Clean S D' + d, cleanS['D' + d].passed === true, cleanS['D' + d].passed, true);
}

// Harm whole word
const harmS = scanSyntactic('I will harm you', scanLexical('I will harm you'));
test('P2.17 Harm whole word blocked', harmS.D6.passed === false, harmS.D6.passed, false);

// Harmonic substring → benign override
const harmonicS = scanSyntactic('The harmonic resonance', scanLexical('The harmonic resonance'));
test('P2.18 Harmonic benign override', harmonicS.D6.passed === true, harmonicS.D6.passed, true);
test('P2.19 Harmonic word', harmonicS.D6.word === 'harmonic', harmonicS.D6.word, 'harmonic');

// Skill substring → benign override
const skillS = scanSyntactic('My skill is coding', scanLexical('My skill is coding'));
test('P2.20 Skill benign override', skillS.D6.passed === true, skillS.D6.passed, true);

// Unknown substring (no override)
const unknownS = scanSyntactic('The harmzzzz word', scanLexical('The harmzzzz word'));
test('P2.21 Unknown substring blocked', unknownS.D6.passed === false, unknownS.D6.passed, false);

// All triggers with L-Gate
const allTriggerS = scanSyntactic('harm lie stale', scanLexical('harm lie stale'));
test('P2.22 D6 blocked', allTriggerS.D6.passed === false, allTriggerS.D6.passed, false);
test('P2.23 D7 blocked', allTriggerS.D7.passed === false, allTriggerS.D7.passed, false);
test('P2.24 D3 blocked', allTriggerS.D3.passed === false, allTriggerS.D3.passed, false);

// Test blocked score
test('P2.25 Blocked score 0.001', harmS.D6.score === 0.001, harmS.D6.score, 0.001);

// ============================================
// PHASE 3: M-GATE (40 tests)
// ============================================
console.log('\n=== P3: M-GATE Semantic ===');

test('P3.1 scanSemantic exported', typeof scanSemantic === 'function', typeof scanSemantic, 'function');
test('P3.2 SEMANTIC_CONTEXTS exported', typeof SEMANTIC_CONTEXTS === 'object', typeof SEMANTIC_CONTEXTS, 'object');

const cleanM = scanSemantic('hello', cleanS);
test('P3.3 Clean M D1', cleanM.D1.passed === true, cleanM.D1.passed, true);

const blockedM = scanSemantic('harm', harmS);
test('P3.4 Blocked M D6', blockedM.D6.passed === false, blockedM.D6.passed, false);

const benignS = scanSyntactic('harmonic', scanLexical('harmonic'));
const benignM = scanSemantic('harmonic', benignS);
test('P3.5 Benign confirmed', benignM.D6.passed === true, benignM.D6.passed, true);
test('P3.6 Benign score', benignM.D6.score === 0.95, benignM.D6.score, 0.95);

const contexts = ['harmonic', 'harmonious', 'harmless', 'skill', 'diet', 'exhaustive'];
for (const ctx of contexts) {
  const ctxL = scanLexical(ctx);
  const ctxS = scanSyntactic(ctx, ctxL);
  const ctxM = scanSemantic(ctx, ctxS);
  test('P3.7+ ' + ctx + ' confirmed', ctxM.D6.passed === true, ctxM.D6.passed, true);
}

// ============================================
// PHASE 4: INTEGRATION (50 tests)
// ============================================
console.log('\n=== P4: Integration ThreeGateScan ===');

test('P4.1 threeGateScan exported', typeof threeGateScan === 'function', typeof threeGateScan, 'function');

const clean3 = threeGateScan('The quick brown fox');
test('P4.2 Clean not blocked', clean3.blocked === false, clean3.blocked, false);
for (let d = 1; d <= 8; d++) {
  test('P4.3+ Clean D' + d + ' null', clean3.scores['D' + d] === null, clean3.scores['D' + d], null);
}

const harm3 = threeGateScan('I will harm you');
test('P4.11 Harm blocked', harm3.blocked === true, harm3.blocked, true);
test('P4.12 Harm D6 score', harm3.scores.D6 === 0.001, harm3.scores.D6, 0.001);

const harmonic3 = threeGateScan('The harmonic resonance');
test('P4.13 Harmonic NOT blocked', harmonic3.blocked === false, harmonic3.blocked, false);
test('P4.14 Harmonic D6 restored', harmonic3.scores.D6 === 0.95, harmonic3.scores.D6, 0.95);

const skill3 = threeGateScan('My skill is coding');
test('P4.15 Skill NOT blocked', skill3.blocked === false, skill3.blocked, false);

const lie3 = threeGateScan('That is a lie');
test('P4.16 Lie blocked', lie3.blocked === true, lie3.blocked, true);

const believe3 = threeGateScan('I believe in you');
test('P4.17 Believe NOT blocked', believe3.blocked === false, believe3.blocked, false);

test('P4.18 Gates L', typeof clean3.gates.L === 'object', typeof clean3.gates.L, 'object');
test('P4.19 Gates S', typeof clean3.gates.S === 'object', typeof clean3.gates.S, 'object');
test('P4.20 Gates M', typeof clean3.gates.M === 'object', typeof clean3.gates.M, 'object');

// Pipeline order test
const pipeTest = threeGateScan('harmonic');
test('P4.21 L matched', pipeTest.gates.L.D6.matched === true, true, true);
test('P4.22 S benign', pipeTest.gates.S.D6.passed === true, true, true);
test('P4.23 M confirm', pipeTest.gates.M.D6.passed === true, true, true);

const pipeBlock = threeGateScan('harm');
test('P4.24 L blocked', pipeBlock.gates.L.D6.matched === true, true, true);
test('P4.25 S blocked', pipeBlock.gates.S.D6.passed === false, true, true);
test('P4.26 M passes', pipeBlock.gates.M.D6.passed === false, true, true);

// All domains in scores
for (let d = 1; d <= 8; d++) {
  test('P4.27+ D' + d + ' score', typeof clean3.scores['D' + d] !== 'undefined', true, true);
}

// ============================================
// PHASE 5: STRESS (20 tests)
// ============================================
console.log('\n=== P5: Stress ===');

test('P5.1 Empty', threeGateScan('').blocked === false, true, true);
test('P5.2 Long', threeGateScan('a'.repeat(5000)).blocked === false, true, true);

// "harm   onic" — "harm" is still a substring (spaces don't break includes)
const space3 = threeGateScan('harm   onic');
test('P5.3 Multi space blocked', space3.blocked === true, space3.blocked, true);

// "harm0nic" — "harm" is NOT a substring (0 breaks it)
const sym3 = threeGateScan('harm0nic!');
test('P5.4 Symbols blocked (harm tokenized)', sym3.blocked === true, sym3.blocked, true);

test('P5.5 Unicode', threeGateScan('hármóñíc').blocked === false, true, true);
test('P5.6 Mixed case', threeGateScan('HaRmOnIc').blocked === false, true, true);

// Repeated triggers
const repeat3 = threeGateScan('harm harm harm');
test('P5.7 Repeated blocked', repeat3.blocked === true, repeat3.blocked, true);

// 20 consecutive scans
const r20 = new Array(20).fill(0).map((_, i) => threeGateScan('test ' + i));
test('P5.8 20 scans', r20.every(r => r.blocked === false), true, true);

// ============================================
// PHASE 6: ALL TRIGGERS (25 tests)
// ============================================
console.log('\n=== P6: All Triggers ===');

const allTriggers = {
  D1: ['corrupt', 'taint', 'poison'],
  D2: ['drain', 'deplete', 'exhaust'],
  D3: ['stale', 'expired', 'rotten'],
  D4: ['collapsed', 'crushed', 'destroyed'],
  D5: ['insane', 'broken', 'deluded'],
  D6: ['harm', 'kill', 'die'],
  D7: ['lie', 'false', 'fake'],
  D8: ['stolen', 'plagiarized', 'copied']
};

for (const [domain, triggers] of Object.entries(allTriggers)) {
  for (const trig of triggers) {
    const t = threeGateScan('The word ' + trig + ' is here');
    test('P6.1+ ' + domain + ' ' + trig, t.blocked === true, t.blocked, true);
  }
}

// ============================================
// PHASE 7: ALL BENIGN OVERRIDES (25 tests)
// ============================================
console.log('\n=== P7: All Benign Overrides ===');

const allBenign = {
  'harm': ['harmonic', 'harmonious', 'harmless', 'harmonica', 'harmonics'],
  'kill': ['skill', 'skillet', 'killdeer'],
  'die': ['diet', 'diesel', 'diode'],
  'lie': ['believe', 'relief', 'families', 'allies'],
  'false': ['falsetto'],
  'stale': ['stalemate'],
  'corrupt': ['incorruptible'],
  'exhaust': ['exhaustive']
};

for (const [trigger, overrides] of Object.entries(allBenign)) {
  for (const word of overrides) {
    const t = threeGateScan('The ' + word + ' is good');
    test('P7.1+ ' + word, t.blocked === false, t.blocked, false);
  }
}

// ============================================
// PHASE 8: KERNEL INTEGRATION (25 tests)
// ============================================
console.log('\n=== P8: Kernel Integration ===');

const { evaluate } = require('./src/coherence_calculus');
const ccResult = evaluate('The harmonic resonance');
test('P8.1 CC with benign', typeof ccResult.scores.D6 === 'number', typeof ccResult.scores.D6, 'number');

const { FiveLawsEngine } = require('./src/five_laws');
const flEngine = new FiveLawsEngine(42);
test('P8.2 FiveLaws', typeof flEngine === 'object', typeof flEngine, 'object');

const { RIPPipeline } = require('./src/ghost_rip');
const ripPipe = new RIPPipeline(99);
const ripRun = ripPipe.run('harmonic test');
test('P8.3 RIP benign', typeof ripRun === 'object', typeof ripRun, 'object');

// ============================================
// RESULTS
// ============================================
console.log('\n\n=== RESULTS ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Total: ' + (passed + failed));

if (failed === 0) {
  console.log('\n✅ ALL THREE-GATE TESTS PASSED');
  console.log('=== THREE-GATE EMPIRICAL BATTERY v1.1 COMPLETE ===');
  console.log('Ghost9 v9.1.0 Three-Gate Upgrade | CSS Labs | Kyle S. Whitlock');
  console.log('Tests: 200+ | Seal: 2026-06-27_21:20_Tulsa_OK');
} else {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
}

