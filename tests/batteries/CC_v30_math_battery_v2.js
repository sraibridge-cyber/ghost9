// ============================================================
// CC v3.0 PURE MATH VALIDATION BATTERY — v1.1 (FIXED)
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-19_19:35_Tulsa_OK
// Tests: Coherence Calculus v3.0 formulas from 05_CC_v3.0.pdf
// NO KERNEL DEPENDENCY — validates math directly
// ============================================================

const assert = require('assert');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
    if (condition) {
        passed++;
        process.stdout.write('.');
    } else {
        failed++;
        failures.push(`${name}: got ${actual}, expected ${expected}`);
        process.stdout.write('X');
    }
}

function testApprox(name, actual, expected, tolerance = 1e-10) {
    const diff = Math.abs(actual - expected);
    test(name, diff < tolerance, actual.toFixed(10), expected.toFixed(10));
}

// === SECTION 1: CORE MATH FORMULA ===
console.log('\n=== SECTION 1: Core μ Formula ===');

function mu(scores) {
    const sum = scores.reduce((acc, s) => acc + Math.log(s), 0);
    return Math.exp(sum / 8);
}

// Test 1.1: Perfect scores at ceiling
const perfect8 = [0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
testApprox('1.1 μ at ceiling (8 domains)', mu(perfect8), 0.9997);

// Test 1.2: All 1.0
testApprox('1.2 μ all 1.0', mu([1,1,1,1,1,1,1,1]), 1.0);

// FIX 1.3: One domain at 0.0001, seven at 0.9997 → μ = exp((ln(0.0001) + 7*ln(0.9997))/8)
// ln(0.0001) = -9.2103, ln(0.9997) = -0.00030004
// sum = -9.2103 + 7*(-0.00030004) = -9.2124
// mu = exp(-9.2124/8) = exp(-1.1515) = 0.316
// So the actual μ is ~0.316, not < 0.1. The hard-block is still effective (μ < τ), but not THAT small.
// Correct test: verify μ < 0.9995 (blocks at τ) and μ < 0.5 (significantly degraded)
const hardBlock = [0.0001, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
const hardBlockMu = mu(hardBlock);
test('1.3 μ hard-block (one 0.0001) < τ', hardBlockMu < 0.9995, hardBlockMu, '< 0.9995');
test('1.3b μ hard-block significantly degraded', hardBlockMu < 0.5, hardBlockMu, '< 0.5');

// Test 1.4: D1=0.9940 (13-19 words), others at ceiling
const d1_weak = [0.9940, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
testApprox('1.4 μ D1=0.9940 (13-19 words)', mu(d1_weak), 0.99899, 1e-5);

// Test 1.5: D1=0.9990 (20-49 words), others at ceiling
const d1_pass = [0.9990, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
testApprox('1.5 μ D1=0.9990 (20-49 words)', mu(d1_pass), 0.99961, 1e-5);

// Test 1.6: Gate reachability
test('1.6 μ_max > τ (0.9995)', mu(perfect8) > 0.9995, mu(perfect8), '> 0.9995');

// Test 1.7: Minimum per-domain passing score
const s_min = Math.pow(0.9995, 8);
testApprox('1.7 s_j^min = τ^8', s_min, 0.9960, 1e-4);

// === SECTION 2: D1 SIGNAL SCORER ===
console.log('\n=== SECTION 2: D1 Signal Scorer ===');

function scoreD1(wordCount) {
    if (wordCount < 3) return 0.0001;
    if (wordCount <= 7) return 0.70;
    if (wordCount <= 12) return 0.90;
    if (wordCount <= 19) return 0.9940;
    if (wordCount <= 49) return 0.9990;
    return 0.9997;
}

test('2.1 D1 <3 words', scoreD1(2) === 0.0001, scoreD1(2), 0.0001);
test('2.2 D1 3-7 words', scoreD1(5) === 0.70, scoreD1(5), 0.70);
test('2.3 D1 8-12 words', scoreD1(10) === 0.90, scoreD1(10), 0.90);
test('2.4 D1 13-19 words', scoreD1(15) === 0.9940, scoreD1(15), 0.9940);
test('2.5 D1 20-49 words', scoreD1(30) === 0.9990, scoreD1(30), 0.9990);
test('2.6 D1 ≥50 words', scoreD1(50) === 0.9997, scoreD1(50), 0.9997);
test('2.7 D1 boundary 19→20', scoreD1(19) === 0.9940 && scoreD1(20) === 0.9990, `${scoreD1(19)}→${scoreD1(20)}`, '0.9940→0.9990');

// === SECTION 3: D2 ENERGY SCORER ===
console.log('\n=== SECTION 3: D2 Energy Scorer ===');

function scoreD2(charCount) {
    if (charCount < 5) return 0.0001;
    if (charCount < 15) return 0.60;
    if (charCount > 50000) return 0.60;
    if (charCount > 10000) return 0.9940;
    return 0.9997;
}

test('3.1 D2 <5 chars', scoreD2(3) === 0.0001, scoreD2(3), 0.0001);
test('3.2 D2 5-14 chars', scoreD2(10) === 0.60, scoreD2(10), 0.60);
test('3.3 D2 15-10000 chars', scoreD2(100) === 0.9997, scoreD2(100), 0.9997);
test('3.4 D2 10001-50000 chars', scoreD2(20000) === 0.9940, scoreD2(20000), 0.9940);
test('3.5 D2 >50000 chars', scoreD2(60000) === 0.60, scoreD2(60000), 0.60);

// === SECTION 4: D3 TEMPORAL SCORER ===
console.log('\n=== SECTION 4: D3 Temporal Scorer ===');

function scoreD3(text) {
    const ONLINE = ['online', 'running', 'active', 'started', 'live', 'up'];
    const OFFLINE = ['offline', 'stopped', 'inactive', 'down', 'halted', 'dead', 'terminated'];
    const lower = text.toLowerCase();
    const hasOnline = ONLINE.some(t => lower.includes(t));
    const hasOffline = OFFLINE.some(t => lower.includes(t));
    if (hasOnline && hasOffline) return 0.0001;
    return 0.9997;
}

test('4.1 D3 no keywords', scoreD3('hello world') === 0.9997, scoreD3('hello world'), 0.9997);
test('4.2 D3 online only', scoreD3('system is online') === 0.9997, scoreD3('system is online'), 0.9997);
test('4.3 D3 offline only', scoreD3('server is down') === 0.9997, scoreD3('server is down'), 0.9997);
test('4.4 D3 contradiction', scoreD3('system is online and offline') === 0.0001, scoreD3('system is online and offline'), 0.0001);
test('4.5 D3 synonym contradiction', scoreD3('service is active but halted') === 0.0001, scoreD3('service is active but halted'), 0.0001);

// === SECTION 5: D4 SPATIAL SCORER ===
console.log('\n=== SECTION 5: D4 Spatial Scorer ===');

const LOCATION_KEYWORDS = ['tulsa', 'oklahoma', 'new york', 'london', 'paris', 'tokyo', 'beijing', 'mumbai', 'cairo', 'sydney'];

function scoreD4(text) {
    const lower = text.toLowerCase();
    let hits = 0;
    for (const loc of LOCATION_KEYWORDS) {
        if (lower.includes(loc)) hits++;
    }
    if (hits >= 2) return 0.50;
    return 0.9997;
}

test('5.1 D4 no locations', scoreD4('hello world') === 0.9997, scoreD4('hello world'), 0.9997);
test('5.2 D4 one location', scoreD4('meeting in Tulsa') === 0.9997, scoreD4('meeting in Tulsa'), 0.9997);
test('5.3 D4 two locations', scoreD4('flight from Tulsa to Oklahoma') === 0.50, scoreD4('flight from Tulsa to Oklahoma'), 0.50);
test('5.4 D4 three locations', scoreD4('tulsa new york london') === 0.50, scoreD4('tulsa new york london'), 0.50);

// === SECTION 6: D5 COGNITIVE SCORER ===
console.log('\n=== SECTION 6: D5 Cognitive Scorer ===');

// FIX 6.4: The regex \bdo\b matches "do" in "do not" because \b is word boundary
// "do not" → "do" is followed by space, so \bdo\b matches it
// We need to match standalone "do" not preceded by "not"
function scoreD5(text) {
    const lower = text.toLowerCase();
    // Match "do not" + standalone "do" (not part of "do not")
    if (/\bdo not\b/.test(lower)) {
        // Check if there's a standalone "do" elsewhere (not in "do not")
        const withoutDoNot = lower.replace(/\bdo not\b/g, '');
        if (/\bdo\b/.test(withoutDoNot)) return 0.70;
    }
    // Also check "do not" + "don't"
    if (/\bdo not\b/.test(lower) && /\bdon't\b/.test(lower)) return 0.70;
    return 0.9997;
}

test('6.1 D5 no negation', scoreD5('execute the command') === 0.9997, scoreD5('execute the command'), 0.9997);
test('6.2 D5 do not + standalone do', scoreD5('do not do that') === 0.70, scoreD5('do not do that'), 0.70);
test('6.3 D5 do not + don\'t', scoreD5('do not don\'t worry') === 0.70, scoreD5('do not don\'t worry'), 0.70);
// FIX 6.4: "do not worry" has "do not" but no standalone "do" → should be 0.9997
test('6.4 D5 only do not (no standalone do)', scoreD5('do not worry') === 0.9997, scoreD5('do not worry'), 0.9997);

// === SECTION 7: D6 ETHICAL SCORER ===
console.log('\n=== SECTION 7: D6 Ethical Scorer ===');

const HARM_PATTERNS = ['kill', 'harm', 'destroy', 'attack', 'bomb', 'weapon', 'torture', 'murder', 'assault', 'poison', 'hate', 'abuse', 'threaten', 'violence', 'terror', 'exploit', 'manipulate', 'deceive', 'fraud', 'corrupt'];

function scoreD6(text) {
    const lower = text.toLowerCase();
    for (const pattern of HARM_PATTERNS) {
        if (lower.includes(pattern)) return 0.0001;
    }
    return 0.9997;
}

test('7.1 D6 no harm', scoreD6('hello world') === 0.9997, scoreD6('hello world'), 0.9997);
test('7.2 D6 harm keyword', scoreD6('how to kill') === 0.0001, scoreD6('how to kill'), 0.0001);
test('7.3 D6 another harm', scoreD6('bomb the building') === 0.0001, scoreD6('bomb the building'), 0.0001);
test('7.4 D6 case insensitive', scoreD6('KILL') === 0.0001, scoreD6('KILL'), 0.0001);

// === SECTION 8: D7 DECLARATIVE INTEGRITY ===
console.log('\n=== SECTION 8: D7 Declarative Integrity ===');

const IMPERATIVES = ['execute', 'force', 'override', 'run as', 'disable', 'bypass', 'circumvent', 'sudo', 'escalate'];

function scoreD7(text) {
    const lower = text.toLowerCase();
    for (const pattern of HARM_PATTERNS) {
        if (lower.includes(pattern)) return 0.0001;
    }
    for (const imp of IMPERATIVES) {
        if (lower.includes(imp)) return 0.9997;
    }
    return 0.9997;
}

test('8.1 D7 neutral', scoreD7('hello world') === 0.9997, scoreD7('hello world'), 0.9997);
test('8.2 D7 harm (shared blocklist)', scoreD7('kill process') === 0.0001, scoreD7('kill process'), 0.0001);
test('8.3 D7 imperative', scoreD7('execute the script') === 0.9997, scoreD7('execute the script'), 0.9997);
test('8.4 D7 override', scoreD7('override the setting') === 0.9997, scoreD7('override the setting'), 0.9997);
test('8.5 D7 bypass', scoreD7('bypass the filter') === 0.9997, scoreD7('bypass the filter'), 0.9997);

// === SECTION 9: D8 STRUCTURAL NOVELTY ===
console.log('\n=== SECTION 9: D8 Structural Novelty ===');

// FIX 9.1: Need 5+ words for non-zero. "hello world testing today" = 4 words → 0.0001
// Use "hello world testing today please" = 5 words
function scoreD8(text, storedNodes) {
    const words = new Set(text.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    if (words.size < 5) return 0.0001;
    
    let maxJaccard = 0;
    const window = storedNodes.slice(-50);
    for (const node of window) {
        const nodeWords = new Set(node.toLowerCase().split(/\W+/).filter(w => w.length > 2));
        const intersection = [...words].filter(w => nodeWords.has(w)).length;
        const union = new Set([...words, ...nodeWords]).size;
        const j = intersection / union;
        if (j > maxJaccard) maxJaccard = j;
        if (maxJaccard > 0.90) break;
    }
    
    if (maxJaccard > 0.90) return 0.0001;
    if (maxJaccard > 0.75) return 0.9940;
    if (maxJaccard > 0.40) return 0.9990;
    return 0.9997;
}

// FIX 9.1: Use 5+ word text
test('9.1 D8 empty memory (5+ words)', scoreD8('hello world testing today please', []) === 0.9997, scoreD8('hello world testing today please', []), 0.9997);
test('9.2 D8 <5 words', scoreD8('hi there', []) === 0.0001, scoreD8('hi there', []), 0.0001);

// FIX 9.3-9.5: Use texts with proper word counts and controlled overlap
// Near-duplicate: same text → Jaccard = 1.0
test('9.3 D8 near-duplicate', scoreD8('hello world testing today please', ['hello world testing today please']) === 0.0001, scoreD8('hello world testing today please', ['hello world testing today please']), 0.0001);

// High overlap: 4/5 words shared → Jaccard = 4/6 = 0.667 (moderate, not high)
// Need to craft text where Jaccard is in right range
// Text A: "hello world testing today please" (5 words)
// Text B: "hello world testing today now" (4 shared, 1 new, total 6) → Jaccard = 4/6 = 0.667 → 0.40-0.75 → 0.9990
// For high overlap (0.75-0.90): need 5 shared out of 6 total → Jaccard = 5/6 = 0.833
// Text B: "hello world testing today please" (5 shared, 0 new) → Jaccard = 1.0 → hard block
// Text B: "hello world testing today please extra" → 5 shared, 1 new, total 6 → Jaccard = 5/6 = 0.833 → 0.75-0.90 → 0.9940
test('9.4 D8 high overlap (Jaccard ~0.83)', scoreD8('hello world testing today please extra', ['hello world testing today please']) === 0.9940, scoreD8('hello world testing today please extra', ['hello world testing today please']), 0.9940);

// Moderate overlap: 3 shared out of 6 total → Jaccard = 3/6 = 0.50
// Text B: "hello world testing new different" → 3 shared, 2 new, total 5 → Jaccard = 3/5 = 0.60 → 0.40-0.75 → 0.9990
test('9.5 D8 moderate overlap (Jaccard ~0.60)', scoreD8('hello world testing new different', ['hello world testing today please']) === 0.9990, scoreD8('hello world testing new different', ['hello world testing today please']), 0.9990);

// === SECTION 10: GATE VERIFICATION ===
console.log('\n=== SECTION 10: Gate Verification ===');

// 10.1: 20-49 words at D1=0.9990, all others ceiling → μ ≈ 0.9996 > τ
const gate_pass = [0.9990, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
test('10.1 Gate PASS (D1=0.9990)', mu(gate_pass) > 0.9995, mu(gate_pass), '> 0.9995');

// 10.2: 13-19 words at D1=0.9940, all others ceiling → μ ≈ 0.9990 < τ
const gate_block = [0.9940, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
test('10.2 Gate BLOCK (D1=0.9940)', mu(gate_block) < 0.9995, mu(gate_block), '< 0.9995');

// FIX 10.3: Hard-block any domain → μ < τ (not < 0.1, which was wrong)
const gate_hard = [0.0001, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
test('10.3 Gate HARD-BLOCK (D1=0.0001) < τ', mu(gate_hard) < 0.9995, mu(gate_hard), '< 0.9995');

// 10.4: D8 near-duplicate → μ ≈ 0.9990 < τ
const gate_dup = [0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9940];
test('10.4 Gate BLOCK (D8=0.9940)', mu(gate_dup) < 0.9995, mu(gate_dup), '< 0.9995');

// === SECTION 11: EDGE CASES ===
console.log('\n=== SECTION 11: Edge Cases ===');

// 11.1: All domains at minimum passing (0.9960)
const all_min = [0.9960, 0.9960, 0.9960, 0.9960, 0.9960, 0.9960, 0.9960, 0.9960];
testApprox('11.1 All at s_min', mu(all_min), 0.9960, 1e-4);

// FIX 11.2: Seven at ceiling, one at s_min → μ = exp((7*ln(0.9997) + ln(0.9960))/8)
// = exp((7*(-0.00030004) + (-0.004008))/8)
// = exp((-0.0021003 - 0.004008)/8)
// = exp(-0.006108/8) = exp(-0.0007635) = 0.999236
// This is < 0.9995, so it should BLOCK, not pass
const seven_ceil_one_min = [0.9960, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
const sevenMu = mu(seven_ceil_one_min);
test('11.2 Seven ceiling, one s_min → BLOCK', sevenMu < 0.9995, sevenMu, '< 0.9995');

// 11.3: Seven at ceiling, one at 0.9959 (just below s_min)
const seven_ceil_low = [0.9959, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
test('11.3 Seven ceiling, one 0.9959 (BLOCK)', mu(seven_ceil_low) < 0.9995, mu(seven_ceil_low), '< 0.9995');

// 11.4: Empty text → D1=0.0001, D2=0.0001
const empty_text = [0.0001, 0.0001, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
test('11.4 Empty text (D1+D2 hard-block)', mu(empty_text) < 0.9995, mu(empty_text), '< 0.9995');

// === SECTION 12: TESSERACT VERTEX ASSIGNMENT ===
console.log('\n=== SECTION 12: Tesseract Vertex Assignment ===');

function assignVertex(d) {
    const a1 = d.signal >= d.cognitive ? 'P' : 'N';
    const a2 = d.energy >= d.temporal ? 'P' : 'N';
    const a3 = d.spatial >= d.ethical ? 'P' : 'N';
    const a4 = d.declarative >= d.novelty ? 'P' : 'N';
    return a1 + a2 + a3 + a4;
}

// 12.1: All equal → all P (tie goes to P)
const all_equal = {signal: 0.9997, energy: 0.9997, temporal: 0.9997, spatial: 0.9997, cognitive: 0.9997, ethical: 0.9997, declarative: 0.9997, novelty: 0.9997};
test('12.1 All equal → PPPP', assignVertex(all_equal) === 'PPPP', assignVertex(all_equal), 'PPPP');

// FIX 12.2: signal=0.9997, cognitive=0.70 → a1='P'. energy=0.60, temporal=0.9997 → a2='N'. spatial=0.9997, ethical=0.9997 → a3='P'. declarative=0.9997, novelty=0.9997 → a4='P'. Result: PNPP
const mixed1 = {signal: 0.9997, energy: 0.60, temporal: 0.9997, spatial: 0.9997, cognitive: 0.70, ethical: 0.9997, declarative: 0.9997, novelty: 0.9997};
test('12.2 Mixed → PNPP', assignVertex(mixed1) === 'PNPP', assignVertex(mixed1), 'PNPP');

// 12.3: Harm instruction (D6=0.0001, D7=0.0001)
const harm = {signal: 1.0, energy: 0.8, temporal: 1.0, spatial: 0.10, cognitive: 1.0, ethical: 0.0001, declarative: 0.0001, novelty: 1.0};
test('12.3 Harm → PNPN', assignVertex(harm) === 'PNPN', assignVertex(harm), 'PNPN');

// 12.4: Geographic ALLOW (all high)
const geo = {signal: 1.0, energy: 0.7, temporal: 1.0, spatial: 1.0, cognitive: 1.0, ethical: 1.0, declarative: 1.0, novelty: 1.0};
test('12.4 Geographic ALLOW → PNPP', assignVertex(geo) === 'PNPP', assignVertex(geo), 'PNPP');

// FIX 12.5-12.6: Generate all 16 vertices with independent domain values
// We need to vary each domain independently, not tie them together
const vertices = new Set();
for (let s1 of [0.9997, 0.0001]) {      // signal
    for (let e2 of [0.9997, 0.0001]) {   // energy
        for (let t3 of [0.9997, 0.0001]) { // temporal
            for (let sp4 of [0.9997, 0.0001]) { // spatial
                for (let c5 of [0.9997, 0.0001]) { // cognitive
                    for (let e6 of [0.9997, 0.0001]) { // ethical
                        for (let d7 of [0.9997, 0.0001]) { // declarative
                            for (let n8 of [0.9997, 0.0001]) { // novelty
                                const d = {
                                    signal: s1, energy: e2, temporal: t3, spatial: sp4,
                                    cognitive: c5, ethical: e6, declarative: d7, novelty: n8
                                };
                                vertices.add(assignVertex(d));
                            }
                        }
                    }
                }
            }
        }
    }
}
test('12.5 All 16 vertices reachable', vertices.size === 16, vertices.size, 16);

// === RESULTS ===
console.log('\n\n=== RESULTS ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ ALL TESTS PASSED');
} else {
    console.log('\n❌ FAILURES:');
    failures.forEach(f => console.log('  ' + f));
}
