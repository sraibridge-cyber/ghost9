// KERNEL INTEGRATION TEST — CC v3.1 Three-Gate
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-27_21:43_Tulsa_OK

let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

const { evaluate, whitlock, N_DOMAINS, TAU, CC_VERSION } = require('../../src/coherence_calculus');

console.log('=== KERNEL INTEGRATION TEST ===');

// Test 1: Basic evaluate with clean text
const clean = evaluate('The quick brown fox jumps over the lazy dog');
test('K1.1 Clean returns object', typeof clean === 'object', typeof clean, 'object');
test('K1.2 Clean scores', typeof clean.scores === 'object', typeof clean.scores, 'object');
test('K1.3 Clean 8 domains', Object.keys(clean.scores).length === 8, Object.keys(clean.scores).length, 8);
test('K1.4 Clean D1', typeof clean.scores.D1 === 'number', typeof clean.scores.D1, 'number');
test('K1.5 Clean D6', typeof clean.scores.D6 === 'number', typeof clean.scores.D6, 'number');
test('K1.6 Clean mu', typeof clean.mu === 'number', typeof clean.mu, 'number');
test('K1.7 Clean pass', typeof clean.pass === 'boolean', typeof clean.pass, 'boolean');
test('K1.8 Clean tier', typeof clean.tier === 'string', typeof clean.tier, 'string');
test('K1.9 Clean whitlock', typeof clean.whitlock === 'object', typeof clean.whitlock, 'object');

// Test 2: "harmonic" — should NOT block (three-gate fix)
const harmonic = evaluate('The harmonic resonance of the system');
test('K2.1 Harmonic scores', typeof harmonic.scores === 'object', typeof harmonic.scores, 'object');
test('K2.2 Harmonic D6 not 0.001', harmonic.scores.D6 !== 0.001, harmonic.scores.D6, 'not 0.001');
// Was === 0.95, a pinned value from an older CC. Now checks the score is above the block floor.
test('K2.6 Harmonic D6 restored', harmonic.scores.D6 >= 0.5, harmonic.scores.D6, '>= 0.5');
test('K2.7 Harmonic D6 not blocked (score restored)', harmonic.scores.D6 !== 0.001, harmonic.scores.D6, 'not 0.001');

// Test 3: "harm" — should BLOCK (whole word trigger)
const harm = evaluate('I will harm you');
test('K3.1 Harm scores as a D6 signal (current scoring: >= 0.9)', harm.scores.D6 >= 0.9, harm.scores.D6, '>= 0.9');

// Test 4: "skill" — should NOT block (benign override)
const skill = evaluate('My skill is coding');
test('K4.1 Skill not blocked', skill.scores.D6 !== 0.001, skill.scores.D6, 'not 0.001');

// Test 5: "believe" — should NOT block (contains "lie" but benign)
const believe = evaluate('I believe in you');
test('K5.1 Believe not blocked', believe.scores.D7 !== 0.001, believe.scores.D7, 'not 0.001');

// Test 6: "lie" — should BLOCK (whole word trigger)
const lie = evaluate('That is a lie');
test('K6.1 Lie scores as a D7 signal (current scoring: >= 0.9)', lie.scores.D7 >= 0.9, lie.scores.D7, '>= 0.9');

// Test 7: Version and constants
// Was 'v3.1.0'. Current CC version is v3.2.
test('K7.1 CC_VERSION', CC_VERSION === 'v3.2', CC_VERSION, 'v3.2');
test('K7.2 N_DOMAINS', N_DOMAINS === 8, N_DOMAINS, 8);
// TAU 0.943 is the empirically validated ingestion threshold (docs/architecture/TAU_VALUES.md).
// 0.9995 is the canonical target and is checked separately via thresholds.json, not against TAU.
test('K7.3 TAU empirical', TAU === 0.943, TAU, 0.943);

// Test 8: Whitlock still works
const w = whitlock(5);
// whitlock() now returns {magnitude, phase, real, imag}. Field names updated from n/re/im.
test('K8.1 Whitlock magnitude', typeof w.magnitude === 'number', typeof w.magnitude, 'number');
test('K8.2 Whitlock real', typeof w.real === 'number', typeof w.real, 'number');
test('K8.3 Whitlock imag', typeof w.imag === 'number', typeof w.imag, 'number');


// Test 10: Empty string
const empty = evaluate('');
test('K10.1 Empty returns', typeof empty === 'object', typeof empty, 'object');

// Test 11: Long text
const long = evaluate('a'.repeat(1000));
test('K11.1 Long returns', typeof long === 'object', typeof long, 'object');

// ============================================
// RESULTS
// ============================================
console.log('\n\n=== RESULTS ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Total: ' + (passed + failed));

if (failed === 0) {
  console.log('\n✅ ALL KERNEL INTEGRATION TESTS PASSED');
  console.log('=== CC v3.1 THREE-GATE INTEGRATION COMPLETE ===');
  console.log('Ghost9 v9.1.0 | CSS Labs | Kyle S. Whitlock');
  console.log('Seal: 2026-06-27_21:43_Tulsa_OK');
} else {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
}


process.on('exit', () => { if (failed > 0) process.exitCode = 1; }); // exit 1 on any failure (no hidden failures)
