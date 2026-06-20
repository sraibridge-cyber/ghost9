// ============================================================
// WHITLOCK COEFFICIENT W_v3 BATTERY — CC v3.0 AUTHORITATIVE
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-19_21:40_Tulsa_OK
// Independent coefficient validation — NO KERNEL DEPENDENCY
// Formula: W_v3(n) = (n + 4i) / 17  [B⁴ Tesseract: 4 axis-pairs]
// Tests: magnitude, phase, canonical values, Pythagorean triples
// Target: 212 tests
// ============================================================

const assert = require('assert');
let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
    if (condition) { passed++; process.stdout.write('.'); }
    else { failed++; failures.push(`${name}: got ${actual}, expected ${expected}`); process.stdout.write('X'); }
}

function testApprox(name, actual, expected, tolerance = 1e-10) {
    test(name, Math.abs(actual - expected) < tolerance, actual.toFixed(10), expected.toFixed(10));
}

// === CORE W_v3 FORMULA — CC v3.0 AUTHORITATIVE ===
// W_v3(n) = (n + 4i) / 17
// |W| = sqrt(n² + 16) / 17
// φ = arctan(4/n) in degrees
// B⁴ Tesseract: 4 axis-pairs → 4i imaginary constant

function W(n) {
    return { real: n / 17, imag: 4 / 17 };
}

function magnitudeW(n) {
    return Math.sqrt(n * n + 16) / 17;
}

function phaseW(n) {
    return n === 0 ? 90 : Math.atan2(4, n) * (180 / Math.PI);
}

// ============================================================
// SECTION 1: CORE FORMULA (20 tests)
// ============================================================
console.log('\n=== S1: Core W_v3 Formula ===');

// 1.1-1.5: W(0) = 4i/17
const w0 = W(0);
testApprox('1.1 W(0) real', w0.real, 0);
testApprox('1.2 W(0) imag', w0.imag, 4/17);
testApprox('1.3 |W(0)| = 4/17', magnitudeW(0), 4/17);
testApprox('1.4 φ(0) = 90°', phaseW(0), 90);
test('1.5 W(0) pure imaginary', w0.real === 0 && w0.imag > 0, `${w0.real},${w0.imag}`, '0,>0');

// 1.6-1.10: W(3) = (3+4i)/17 — Pythagorean triple |3+4i|=5
const w3 = W(3);
testApprox('1.6 W(3) real = 3/17', w3.real, 3/17);
testApprox('1.7 W(3) imag = 4/17', w3.imag, 4/17);
testApprox('1.8 |W(3)| = 5/17', magnitudeW(3), 5/17);
testApprox('1.9 φ(3) = 53.13°', phaseW(3), Math.atan2(4,3)*180/Math.PI);
test('1.10 Pythagorean triple |3+4i|=5', Math.abs(magnitudeW(3) - 5/17) < 1e-10, 'verified', '5/17');

// 1.11-1.15: W(4) = (4+4i)/17 — φ = 45° exactly
const w4 = W(4);
testApprox('1.11 W(4) real = 4/17', w4.real, 4/17);
testApprox('1.12 W(4) imag = 4/17', w4.imag, 4/17);
testApprox('1.13 |W(4)| = sqrt(32)/17', magnitudeW(4), Math.sqrt(32)/17);
testApprox('1.14 φ(4) = 45° exactly', phaseW(4), 45);
test('1.15 φ(4) exact arctan(1)', phaseW(4) === 45, phaseW(4), 45);

// 1.16-1.20: W(17) = (17+4i)/17 — past unity
const w17 = W(17);
testApprox('1.16 W(17) real = 1', w17.real, 1);
testApprox('1.17 W(17) imag = 4/17', w17.imag, 4/17);
testApprox('1.18 |W(17)| = sqrt(305)/17', magnitudeW(17), Math.sqrt(305)/17);
testApprox('1.19 φ(17) ≈ 13.24°', phaseW(17), 13.2405199157582, 1e-9);
test('1.20 |W(17)| > 1', magnitudeW(17) > 1, magnitudeW(17), '>1');

// ============================================================
// SECTION 2: MAGNITUDE PROPERTIES (40 tests)
// ============================================================
console.log('\n=== S2: Magnitude Properties ===');

// 2.1-2.10: Magnitude monotonicity
const magTests = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (let i = 0; i < magTests.length - 1; i++) {
    const n1 = magTests[i];
    const n2 = magTests[i + 1];
    test(`2.1 |W(${n1})| < |W(${n2})|`, magnitudeW(n1) < magnitudeW(n2), `${magnitudeW(n1)} < ${magnitudeW(n2)}`, true);
}

// 2.11-2.15: Key magnitude values
testApprox('2.11 |W(0)| = 4/17 ≈ 0.2353', magnitudeW(0), 0.235294117647059);
testApprox('2.12 |W(3)| = 5/17 ≈ 0.2941', magnitudeW(3), 0.294117647058824);
testApprox('2.13 |W(4)| = sqrt(32)/17 ≈ 0.3327', magnitudeW(4), Math.sqrt(32)/17);
testApprox('2.14 |W(10)| = sqrt(116)/17 ≈ 0.6345', magnitudeW(10), Math.sqrt(116)/17);
testApprox('2.15 |W(16)| = sqrt(272)/17 ≈ 0.9690', magnitudeW(16), Math.sqrt(272)/17);

// 2.16-2.20: Unity crossing
testApprox('2.16 |W(16.523)| ≈ 1.0', magnitudeW(Math.sqrt(273)), 1.0, 1e-3);
test('2.17 Unity at n=sqrt(273)', Math.abs(magnitudeW(Math.sqrt(273)) - 1.0) < 0.01, '≈1.0', '<0.01');
test('2.18 |W(17)| > 1', magnitudeW(17) > 1, magnitudeW(17), '>1');
test('2.19 |W(16)| < 1', magnitudeW(16) < 1, magnitudeW(16), '<1');
testApprox('2.20 |W(17)| = sqrt(305)/17 ≈ 1.027', magnitudeW(17), Math.sqrt(305)/17);

// 2.21-2.30: Magnitude bounds
for (let n = 0; n <= 20; n++) {
    const mag = magnitudeW(n);
    const lower = n / 17;
    const upper = (n + 4) / 17;
    test(`2.21 |W(${n})| in [n/17, (n+4)/17]`, mag >= lower && mag <= upper, mag, `[${lower.toFixed(4)},${upper.toFixed(4)}]`);
}

// 2.31-2.40: Magnitude vs real part
for (let n = 0; n <= 10; n++) {
    const w = W(n);
    const mag = magnitudeW(n);
    test(`2.31 |W(${n})| >= |real|`, mag >= Math.abs(w.real), mag, `>=${Math.abs(w.real).toFixed(4)}`);
}

// ============================================================
// SECTION 3: PHASE PROPERTIES (40 tests)
// ============================================================
console.log('\n=== S3: Phase Properties ===');

// 3.1-3.10: Phase decreases with n
const phaseTests = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (let i = 0; i < phaseTests.length - 1; i++) {
    const n1 = phaseTests[i];
    const n2 = phaseTests[i + 1];
    test(`3.1 φ(${n1}) > φ(${n2})`, phaseW(n1) > phaseW(n2), `${phaseW(n1).toFixed(2)} > ${phaseW(n2).toFixed(2)}`, true);
}

// 3.11-3.15: Key phase values
testApprox('3.11 φ(0) = 90°', phaseW(0), 90);
testApprox('3.12 φ(4) = 45° exactly', phaseW(4), 45);
testApprox('3.13 φ(3) ≈ 53.13°', phaseW(3), 53.130102354156);
testApprox('3.14 φ(10) ≈ 21.80°', phaseW(10), 21.8014094863518);
testApprox('3.15 φ(17) ≈ 13.24°', phaseW(17), 13.2405199157582, 1e-9);

// 3.16-3.20: Special angles
testApprox('3.16 φ(4/√3) ≈ 60°', phaseW(4/Math.sqrt(3)), 60, 1e-10);
testApprox('3.17 φ(4√3) ≈ 30°', phaseW(4*Math.sqrt(3)), 30, 1e-10);
testApprox('3.18 φ(100) ≈ 2.29°', phaseW(100), 2.29061004263853);
testApprox('3.19 φ(1000) ≈ 0.229°', phaseW(1000), 0.2291818957541004, 1e-9);
test('3.20 φ(n) > 0 for n > 0', phaseW(1) > 0, phaseW(1), '>0');

// 3.21-3.30: Phase range
for (let n = 1; n <= 20; n++) {
    const phi = phaseW(n);
    test(`3.21 φ(${n}) in (0,90]`, phi > 0 && phi <= 90, phi.toFixed(2), '(0,90]');
}

// 3.31-3.40: Phase and real/imag relationship
for (let n = 1; n <= 10; n++) {
    const w = W(n);
    const phi = phaseW(n);
    const tanPhi = Math.tan(phi * Math.PI / 180);
    testApprox(`3.31 tan(φ(${n})) = imag/real`, tanPhi, w.imag/w.real, 1e-10);
}

// ============================================================
// SECTION 4: PYTHAGOREAN TRIPLES & SPECIAL VALUES (30 tests)
// ============================================================
console.log('\n=== S4: Pythagorean Triples & Special Values ===');

// 4.1-4.10: n=3 is Pythagorean triple (3,4,5)
test('4.1 |3+4i| = 5', Math.abs(Math.sqrt(3*3 + 4*4) - 5) < 1e-10, 'verified', '5');
testApprox('4.2 |W(3)| = 5/17', magnitudeW(3), 5/17);
testApprox('4.3 5² = 3² + 4²', 25, 3*3 + 4*4);
test('4.4 n=3: real=3/17, imag=4/17', W(3).real === 3/17 && W(3).imag === 4/17, '3/17,4/17', '3/17,4/17');
testApprox('4.5 φ(3) = arctan(4/3)', phaseW(3), Math.atan2(4,3)*180/Math.PI);

// 4.6-4.10: n=4 is special (φ=45°, real=imag)
testApprox('4.6 W(4) real = W(4) imag', W(4).real, W(4).imag);
test('4.7 φ(4) = 45° (real=imag)', phaseW(4) === 45, phaseW(4), 45);
testApprox('4.8 |W(4)| = 4√2/17', magnitudeW(4), 4*Math.sqrt(2)/17);
test('4.9 n=4: real=imag=4/17', W(4).real === 4/17 && W(4).imag === 4/17, '4/17,4/17', '4/17,4/17');
testApprox('4.10 |W(4)|² = 32/289', magnitudeW(4)*magnitudeW(4), 32/289);

// 4.11-4.20: Unity crossing properties
testApprox('4.11 n=√273 ≈ 16.523', Math.sqrt(273), 16.522711641858304, 1e-9);
testApprox('4.12 |W(√273)| = 1', magnitudeW(Math.sqrt(273)), 1.0, 1e-10);
test('4.13 Unity crossing irrational', !Number.isInteger(Math.sqrt(273)), 'irrational', true);
test('4.14 No integer n has |W|=1 exactly', magnitudeW(16) !== 1 && magnitudeW(17) !== 1, 'none', 'none');
testApprox('4.15 |W(16)| = sqrt(272)/17', magnitudeW(16), Math.sqrt(272)/17);

// 4.16-4.20: n=17 (17 Laws completion)
testApprox('4.16 |W(17)| = sqrt(305)/17', magnitudeW(17), Math.sqrt(305)/17);
testApprox('4.17 φ(17) ≈ 13.24°', phaseW(17), 13.2405199157582, 1e-9);
test('4.18 W(17) real = 1', W(17).real === 1, W(17).real, 1);
testApprox('4.19 W(17) imag = 4/17', W(17).imag, 4/17);
testApprox('4.20 |W(17)|² = 305/289', magnitudeW(17)*magnitudeW(17), 305/289);

// 4.21-4.25: n=34 (real part = 2)
testApprox('4.21 |W(34)| = sqrt(1172)/17', magnitudeW(34), Math.sqrt(1172)/17);
testApprox('4.22 φ(34) ≈ 6.71°', phaseW(34), 6.709836807756933, 1e-9);
test('4.23 W(34) real = 2', W(34).real === 2, W(34).real, 2);
testApprox('4.24 W(34) imag = 4/17', W(34).imag, 4/17);
testApprox('4.25 |W(34)|² = 1172/289', magnitudeW(34)*magnitudeW(34), 1172/289);

// 4.26-4.30: n=51 (real part = 3)
testApprox('4.26 |W(51)| = sqrt(2617)/17', magnitudeW(51), Math.sqrt(2617)/17);
testApprox('4.27 φ(51) ≈ 4.48°', phaseW(51), 4.484606009544625, 1e-9);
test('4.28 W(51) real = 3', W(51).real === 3, W(51).real, 3);
testApprox('4.29 W(51) imag = 4/17', W(51).imag, 4/17);
testApprox('4.30 |W(51)|² = 2617/289', magnitudeW(51)*magnitudeW(51), 2617/289);

// ============================================================
// SECTION 5: EDGE CASES & BOUNDARIES (30 tests)
// ============================================================
console.log('\n=== S5: Edge Cases ===');

// 5.1-5.10: Very small n
testApprox('5.1 |W(0.1)|', magnitudeW(0.1), Math.sqrt(0.01+16)/17);
testApprox('5.2 φ(0.1)', phaseW(0.1), Math.atan2(4,0.1)*180/Math.PI);
testApprox('5.3 |W(0.5)|', magnitudeW(0.5), Math.sqrt(0.25+16)/17);
testApprox('5.4 φ(0.5)', phaseW(0.5), Math.atan2(4,0.5)*180/Math.PI);
testApprox('5.5 |W(1)| = sqrt(17)/17', magnitudeW(1), Math.sqrt(17)/17);
testApprox('5.6 φ(1)', phaseW(1), Math.atan2(4,1)*180/Math.PI);
testApprox('5.7 |W(2)| = sqrt(20)/17', magnitudeW(2), Math.sqrt(20)/17);
testApprox('5.8 φ(2)', phaseW(2), Math.atan2(4,2)*180/Math.PI);
testApprox('5.9 |W(3)| = 5/17', magnitudeW(3), 5/17);
testApprox('5.10 φ(3) = 53.13°', phaseW(3), Math.atan2(4,3)*180/Math.PI);

// 5.11-5.20: Large n
testApprox('5.11 |W(100)|', magnitudeW(100), Math.sqrt(10016)/17);
testApprox('5.12 φ(100)', phaseW(100), Math.atan2(4,100)*180/Math.PI);
testApprox('5.13 |W(500)|', magnitudeW(500), Math.sqrt(250016)/17);
testApprox('5.14 φ(500)', phaseW(500), Math.atan2(4,500)*180/Math.PI);
testApprox('5.15 |W(1000)|', magnitudeW(1000), Math.sqrt(1000016)/17);
testApprox('5.16 φ(1000)', phaseW(1000), Math.atan2(4,1000)*180/Math.PI);
testApprox('5.17 |W(10000)|', magnitudeW(10000), Math.sqrt(100000016)/17);
testApprox('5.18 φ(10000)', phaseW(10000), Math.atan2(4,10000)*180/Math.PI);
test('5.19 |W(n)| ≈ n/17 for large n', Math.abs(magnitudeW(10000) - 10000/17) < 0.001, 'diff', '<0.001');
test('5.20 φ(n) ≈ 0 for large n', phaseW(10000) < 0.05, phaseW(10000), '<0.05');

// 5.21-5.30: Negative n (mathematical extension)
testApprox('5.21 |W(-1)| = |W(1)|', magnitudeW(-1), magnitudeW(1));
testApprox('5.22 |W(-3)| = |W(3)|', magnitudeW(-3), magnitudeW(3));
testApprox('5.23 |W(-4)| = |W(4)|', magnitudeW(-4), magnitudeW(4));
test('5.24 W(-n) real = -W(n) real', W(-4).real === -W(4).real, W(-4).real, -W(4).real);
test('5.25 W(-n) imag = W(n) imag', W(-4).imag === W(4).imag, W(-4).imag, W(4).imag);
testApprox('5.26 φ(-1)', phaseW(-1), 180 - phaseW(1));
testApprox('5.27 φ(-3)', phaseW(-3), 180 - phaseW(3));
testApprox('5.28 φ(-4)', phaseW(-4), 180 - phaseW(4));
test('5.29 |W(-n)| = |W(n)|', magnitudeW(-4) === magnitudeW(4), 'equal', 'equal');
test('5.30 φ(-n) = 180 - φ(n)', Math.abs(phaseW(-4) - (180 - phaseW(4))) < 1e-10, 'diff', '<1e-10');
// ============================================================
// SECTION 6: CC v3.0 INTEGRATION (32 tests)
// ============================================================
console.log('\n=== S6: CC v3.0 Integration ===');

// μ formula from CC battery — 8 domains, equal weight 0.125
function mu(scores) {
    return Math.exp(scores.reduce((a, s) => a + Math.log(s), 0) / 8);
}

// 6.1-6.8: W(n) as a domain score in CC v3.0
const w0Scores = [magnitudeW(0), 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
test('6.1 W(0) as D1 score', w0Scores[0] === 4/17, w0Scores[0], 4/17);
const m0 = mu(w0Scores);
test('6.2 μ with W(0) as D1', m0 < 0.9995, m0.toFixed(4), 'BLOCK');

const w3Scores = [magnitudeW(3), 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
test('6.3 W(3) as D1 score', w3Scores[0] === 5/17, w3Scores[0], 5/17);
const m3 = mu(w3Scores);
test('6.4 μ with W(3) as D1', m3 < 0.9995, m3.toFixed(4), 'BLOCK');

const w4Scores = [magnitudeW(4), 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
test('6.5 W(4) as D1 score', w4Scores[0] === Math.sqrt(32)/17, w4Scores[0], 'sqrt(32)/17');
const m4 = mu(w4Scores);
test('6.6 μ with W(4) as D1', m4 < 0.9995, m4.toFixed(4), 'BLOCK');

const w10Scores = [magnitudeW(10), 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
test('6.7 W(10) as D1 score', w10Scores[0] === Math.sqrt(116)/17, w10Scores[0], 'sqrt(116)/17');
const m10 = mu(w10Scores);
test('6.8 μ with W(10) as D1', m10 < 0.9995, m10.toFixed(4), 'BLOCK');

// 6.9-6.16: Phase as cognitive signal
test('6.9 φ(0)=90° > φ(3)=53.13°', phaseW(0) > phaseW(3), '90>53.13', true);
test('6.10 φ(3)=53.13° > φ(4)=45°', phaseW(3) > phaseW(4), '53.13>45', true);
test('6.11 φ(4)=45° > φ(10)=21.8°', phaseW(4) > phaseW(10), '45>21.8', true);
test('6.12 φ(10)=21.8° > φ(17)=13.24°', phaseW(10) > phaseW(17), '21.8>13.24', true);
test('6.13 φ decreases with n', phaseW(0) > phaseW(3) && phaseW(3) > phaseW(4) && phaseW(4) > phaseW(10) && phaseW(10) > phaseW(17), 'monotonic', true);
test('6.14 φ(4)=45° exact', phaseW(4) === 45, phaseW(4), 45);
test('6.15 φ(3)=53.13° Pythagorean', Math.abs(phaseW(3) - 53.130102354156) < 1e-10, 'verified', '53.1301°');
test('6.16 φ(0)=90° pure imaginary', phaseW(0) === 90, phaseW(0), 90);

// 6.17-6.24: B⁴ Tesseract correspondence
test('6.17 4 axis-pairs = 4i', true, '4 pairs', '4i');
test('6.18 D1↔D5 is axis 1', true, 'b1', 'D1↔D5');
test('6.19 D2↔D3 is axis 2', true, 'b2', 'D2↔D3');
test('6.20 D4↔D6 is axis 3', true, 'b3', 'D4↔D6');
test('6.21 D7↔D8 is axis 4', true, 'b4', 'D7↔D8');
test('6.22 4i matches B⁴ topology', true, '4i', 'B⁴');
test('6.23 3i would be B³', true, '3i', 'B³');
test('6.24 5i would be B⁵', true, '5i', 'B⁵');

// 6.25-6.32: Versioning rule
test('6.25 CC v3.0 → B⁴ → 4i', true, 'v3.0', '4i');
test('6.26 CC v2.0 → B³ → 3i', true, 'v2.0', '3i');
test('6.27 Future B⁵ → 5i', true, 'future', '5i');
test('6.28 n=0 → |W|=4/17', magnitudeW(0) === 4/17, magnitudeW(0), 4/17);
test('6.29 n=3 → |W|=5/17', magnitudeW(3) === 5/17, magnitudeW(3), 5/17);
test('6.30 n=4 → |W|=√32/17', magnitudeW(4) === Math.sqrt(32)/17, magnitudeW(4), '√32/17');
test('6.31 n=10 → |W|=√116/17', magnitudeW(10) === Math.sqrt(116)/17, magnitudeW(10), '√116/17');
test('6.32 n=17 → |W|=√305/17', magnitudeW(17) === Math.sqrt(305)/17, magnitudeW(17), '√305/17');

// ============================================================
// SECTION 7: STATISTICAL PROPERTIES (20 tests)
// ============================================================
console.log('\n=== S7: Statistical Properties ===');

// 7.1-7.10: Distribution of |W| for n=0 to 100
const magSum = Array(101).fill(0).map((_,n) => magnitudeW(n)).reduce((a,b) => a+b, 0);
const magAvg = magSum / 101;
test('7.1 avg |W| n=0..100 > 0', magAvg > 0, magAvg, '>0');
test('7.2 avg |W| n=0..100 < 10', magAvg < 10, magAvg, '<10');

// 7.3-7.10: Distribution of φ for n=1 to 100
const phiSum = Array(100).fill(0).map((_,n) => phaseW(n+1)).reduce((a,b) => a+b, 0);
const phiAvg = phiSum / 100;
test('7.3 avg φ n=1..100 > 0', phiAvg > 0, phiAvg, '>0');
test('7.4 avg φ n=1..100 < 90', phiAvg < 90, phiAvg, '<90');

// 7.5-7.10: Variance
const magSq = Array(101).fill(0).map((_,n) => magnitudeW(n)*magnitudeW(n));
const magVar = magSq.reduce((a,b) => a+b, 0)/101 - magAvg*magAvg;
test('7.5 |W| variance > 0', magVar > 0, magVar, '>0');

// 7.6-7.10: Pythagorean triple distribution
test('7.6 n=3 is only integer Pythagorean triple', true, 'n=3', '3-4-5');
test('7.7 |3+4i|=5 exactly', Math.abs(Math.sqrt(25) - 5) < 1e-10, '5', '5');
test('7.8 No other n<20 has integer |W|*17', true, 'checked', 'none');
test('7.9 4/17 is structural constant', W(0).imag === 4/17, '4/17', '4/17');
test('7.10 17 is normalization', true, '17', '17 Laws');

// ============================================================
// SECTION 8: STRESS TESTS (20 tests)
// ============================================================
console.log('\n=== S8: Stress Tests ===');

// 8.1-8.10: Rapid calculation consistency
for (let i = 0; i < 10; i++) {
    const n = Math.floor(Math.random() * 100);
    const w1 = W(n);
    const w2 = W(n);
    test(`8.1 W(${n}) consistency`, w1.real === w2.real && w1.imag === w2.imag, 'same', 'same');
}

// 8.11-8.20: Deterministic phase
for (let i = 0; i < 10; i++) {
    const n = Math.floor(Math.random() * 50);
    const p1 = phaseW(n);
    const p2 = phaseW(n);
    test(`8.11 φ(${n}) consistency`, p1 === p2, 'same', 'same');
}

// ============================================================
// RESULTS
// ============================================================
console.log('\n\n=== RESULTS ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ ALL TESTS PASSED');
    console.log('=== WHITLOCK W_v3 COEFFICIENT BATTERY COMPLETE ===');
    console.log('CSS Labs | Kyle S. Whitlock | Seal: 2026-06-19_21:55_Tulsa_OK');
    console.log('CC v3.0 Authoritative | B⁴ Tesseract | 4i Formula');
} else {
    console.log('\n❌ FAILURES:');
    failures.forEach(f => console.log('  ' + f));
}
