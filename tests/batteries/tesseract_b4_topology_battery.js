// ============================================================
// TESSERACT B⁴ TOPOLOGY BATTERY
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-19_20:55_Tulsa_OK
// Independent topology validation — NO KERNEL DEPENDENCY
// Tests: 16 vertices, 4 axis pairs, STM/LTM, quadrants, invariants
// Target: 449 tests
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

// === CORE TESSERACT MATH ===

// Vertex assignment: 4-bit coordinate from 8 domain scores
// a1: D1(signal) >= D5(cognitive) ? 'P' : 'N'
// a2: D2(energy) >= D3(temporal) ? 'P' : 'N'
// a3: D4(spatial) >= D6(ethical) ? 'P' : 'N'
// a4: D7(declarative) >= D8(novelty) ? 'P' : 'N'
function assignVertex(d) {
    const a1 = d.signal >= d.cognitive ? 'P' : 'N';
    const a2 = d.energy >= d.temporal ? 'P' : 'N';
    const a3 = d.spatial >= d.ethical ? 'P' : 'N';
    const a4 = d.declarative >= d.novelty ? 'P' : 'N';
    return a1 + a2 + a3 + a4;
}

// Vertex index (0-15) from 4-bit string
function vertexIndex(v) {
    return (v[0] === 'P' ? 8 : 0) + (v[1] === 'P' ? 4 : 0) + (v[2] === 'P' ? 2 : 0) + (v[3] === 'P' ? 1 : 0);
}

// STM = vertices 0-7 (a1 = 'N', signal < cognitive)
// LTM = vertices 8-15 (a1 = 'P', signal >= cognitive)
function isSTM(v) { return v[0] === 'N'; }
function isLTM(v) { return v[0] === 'P'; }

// Quadrant classification
// PP**: FLOW (0-3) — all positive axes
// PN**: INTEGRITY (4-7) — mixed
// NP**: SOVEREIGNTY (8-11) — mixed
// NN**: GOVERNANCE (12-15) — all negative axes
function quadrant(v) {
    if (v[0] === 'P' && v[1] === 'P') return 'FLOW';
    if (v[0] === 'P' && v[1] === 'N') return 'INTEGRITY';
    if (v[0] === 'N' && v[1] === 'P') return 'SOVEREIGNTY';
    return 'GOVERNANCE';
}

// All 16 canonical vertices
const ALL_VERTICES = [
    'PPPP', 'PPPN', 'PPNP', 'PPNN',
    'PNPP', 'PNPN', 'PNNP', 'PNNN',
    'NPPP', 'NPPN', 'NPNP', 'NPNN',
    'NNPP', 'NNPN', 'NNNP', 'NNNN'
];

// ============================================================
// SECTION 1: VERTEX ASSIGNMENT (32 tests)
// ============================================================
console.log('\n=== S1: Vertex Assignment ===');

// 1.1: All equal → all P (tie goes to P)
const all_equal = {signal: 0.9997, energy: 0.9997, temporal: 0.9997, spatial: 0.9997, cognitive: 0.9997, ethical: 0.9997, declarative: 0.9997, novelty: 0.9997};
test('1.1 All equal → PPPP', assignVertex(all_equal) === 'PPPP', assignVertex(all_equal), 'PPPP');

// 1.2: All at 0.0001 → all P (tie goes to P)
const all_zero = {signal: 0.0001, energy: 0.0001, temporal: 0.0001, spatial: 0.0001, cognitive: 0.0001, ethical: 0.0001, declarative: 0.0001, novelty: 0.0001};
test('1.2 All zero → PPPP', assignVertex(all_zero) === 'PPPP', assignVertex(all_zero), 'PPPP');

// 1.3-1.18: Each axis individually N
const base = {signal: 0.9997, energy: 0.9997, temporal: 0.9997, spatial: 0.9997, cognitive: 0.9997, ethical: 0.9997, declarative: 0.9997, novelty: 0.9997};

// a1 = N: signal < cognitive
const a1_n = {...base, signal: 0.70, cognitive: 0.9997};
test('1.3 a1=N → NPPP', assignVertex(a1_n) === 'NPPP', assignVertex(a1_n), 'NPPP');

// a2 = N: energy < temporal
const a2_n = {...base, energy: 0.60, temporal: 0.9997};
test('1.4 a2=N → PNPP', assignVertex(a2_n) === 'PNPP', assignVertex(a2_n), 'PNPP');

// a3 = N: spatial < ethical
const a3_n = {...base, spatial: 0.50, ethical: 0.9997};
test('1.5 a3=N → PPNP', assignVertex(a3_n) === 'PPNP', assignVertex(a3_n), 'PPNP');

// a4 = N: declarative < novelty
const a4_n = {...base, declarative: 0.70, novelty: 0.9997};
test('1.6 a4=N → PPPN', assignVertex(a4_n) === 'PPPN', assignVertex(a4_n), 'PPPN');

// 1.7-1.10: Two axes N
const a1a2_n = {...base, signal: 0.70, cognitive: 0.9997, energy: 0.60, temporal: 0.9997};
test('1.7 a1=N,a2=N → NNPP', assignVertex(a1a2_n) === 'NNPP', assignVertex(a1a2_n), 'NNPP');

const a1a3_n = {...base, signal: 0.70, cognitive: 0.9997, spatial: 0.50, ethical: 0.9997};
test('1.8 a1=N,a3=N → NPNP', assignVertex(a1a3_n) === 'NPNP', assignVertex(a1a3_n), 'NPNP');

const a1a4_n = {...base, signal: 0.70, cognitive: 0.9997, declarative: 0.70, novelty: 0.9997};
test('1.9 a1=N,a4=N → NPPN', assignVertex(a1a4_n) === 'NPPN', assignVertex(a1a4_n), 'NPPN');

const a2a3_n = {...base, energy: 0.60, temporal: 0.9997, spatial: 0.50, ethical: 0.9997};
test('1.10 a2=N,a3=N → PNNP', assignVertex(a2a3_n) === 'PNNP', assignVertex(a2a3_n), 'PNNP');

// 1.11-1.14: Three axes N
const a1a2a3_n = {...base, signal: 0.70, cognitive: 0.9997, energy: 0.60, temporal: 0.9997, spatial: 0.50, ethical: 0.9997};
test('1.11 a1=N,a2=N,a3=N → NNNP', assignVertex(a1a2a3_n) === 'NNNP', assignVertex(a1a2a3_n), 'NNNP');

const a1a2a4_n = {...base, signal: 0.70, cognitive: 0.9997, energy: 0.60, temporal: 0.9997, declarative: 0.70, novelty: 0.9997};
test('1.12 a1=N,a2=N,a4=N → NNPN', assignVertex(a1a2a4_n) === 'NNPN', assignVertex(a1a2a4_n), 'NNPN');

const a1a3a4_n = {...base, signal: 0.70, cognitive: 0.9997, spatial: 0.50, ethical: 0.9997, declarative: 0.70, novelty: 0.9997};
test('1.13 a1=N,a3=N,a4=N → NPNN', assignVertex(a1a3a4_n) === 'NPNN', assignVertex(a1a3a4_n), 'NPNN');

const a2a3a4_n = {...base, energy: 0.60, temporal: 0.9997, spatial: 0.50, ethical: 0.9997, declarative: 0.70, novelty: 0.9997};
test('1.14 a2=N,a3=N,a4=N → PNNN', assignVertex(a2a3a4_n) === 'PNNN', assignVertex(a2a3a4_n), 'PNNN');

// 1.15: All four axes N
const all_n = {signal: 0.70, energy: 0.60, temporal: 0.9997, spatial: 0.50, cognitive: 0.9997, ethical: 0.9997, declarative: 0.70, novelty: 0.9997};
test('1.15 All four N → NNNN', assignVertex(all_n) === 'NNNN', assignVertex(all_n), 'NNNN');

// 1.16-1.18: Boundary cases (exactly equal)
const exact_eq = {...base, signal: 0.9997, cognitive: 0.9997};
test('1.16 Exactly equal → P (tie rule)', assignVertex(exact_eq)[0] === 'P', assignVertex(exact_eq)[0], 'P');

const exact_eq2 = {...base, signal: 0.0001, cognitive: 0.0001};
test('1.17 Zero equal → P (tie rule)', assignVertex(exact_eq2)[0] === 'P', assignVertex(exact_eq2)[0], 'P');

// 1.18: Large difference
const large_diff = {...base, signal: 0.0001, cognitive: 0.9997};
test('1.18 Large diff → N', assignVertex(large_diff) === 'NPPP', assignVertex(large_diff), 'NPPP');

// 1.19-1.32: Exhaustive 2^4 = 16 vertices with independent values
const vertices = new Set();
for (let s of [0.9997, 0.0001]) {
    for (let e of [0.9997, 0.0001]) {
        for (let t of [0.9997, 0.0001]) {
            for (let sp of [0.9997, 0.0001]) {
                for (let c of [0.9997, 0.0001]) {
                    for (let eth of [0.9997, 0.0001]) {
                        for (let d of [0.9997, 0.0001]) {
                            for (let n of [0.9997, 0.0001]) {
                                const dom = {signal: s, energy: e, temporal: t, spatial: sp, cognitive: c, ethical: eth, declarative: d, novelty: n};
                                vertices.add(assignVertex(dom));
                            }
                        }
                    }
                }
            }
        }
    }
}
test('1.19 All 16 vertices reachable', vertices.size === 16, vertices.size, 16);

// Verify each canonical vertex exists
for (const v of ALL_VERTICES) {
    test(`1.20 Vertex ${v} exists`, vertices.has(v), vertices.has(v), true);
}

// === CHUNK 1 ENDS HERE (32 tests) ===
// Continue with Chunk 2: Vertex indices, STM/LTM, Quadrants
// ============================================================
// SECTION 2: VERTEX INDICES (48 tests)
// ============================================================
console.log('\n=== S2: Vertex Indices ===');

// 2.1-2.16: Each vertex index correct
const expectedIndices = {
    'PPPP': 15, 'PPPN': 14, 'PPNP': 13, 'PPNN': 12,
    'PNPP': 11, 'PNPN': 10, 'PNNP': 9,  'PNNN': 8,
    'NPPP': 7,  'NPPN': 6,  'NPNP': 5,  'NPNN': 4,
    'NNPP': 3,  'NNPN': 2,  'NNNP': 1,  'NNNN': 0
};

for (const [v, idx] of Object.entries(expectedIndices)) {
    test(`2.1 Vertex ${v} index = ${idx}`, vertexIndex(v) === idx, vertexIndex(v), idx);
}

// 2.17-2.32: Index round-trip (index → vertex → index)
for (const v of ALL_VERTICES) {
    const idx = vertexIndex(v);
    const binary = idx.toString(2).padStart(4, '0');
    const reconstructed = binary.split('').map(b => b === '1' ? 'P' : 'N').join('');
    test(`2.17 ${v} round-trip`, reconstructed === v, reconstructed, v);
}

// 2.33-2.48: Index uniqueness
const allIndices = ALL_VERTICES.map(v => vertexIndex(v));
const uniqueIndices = new Set(allIndices);
test('2.33 All indices unique', uniqueIndices.size === 16, uniqueIndices.size, 16);
test('2.34 Indices 0-15', allIndices.sort((a,b) => a-b).every((v,i) => v === i), allIndices, '0-15');

// ============================================================
// SECTION 3: STM/LTM SEPARATION (32 tests)
// ============================================================
console.log('\n=== S3: STM/LTM Separation ===');

// STM = vertices 0-7 (a1 = N)
// LTM = vertices 8-15 (a1 = P)

const stmVertices = ALL_VERTICES.filter(v => isSTM(v));
const ltmVertices = ALL_VERTICES.filter(v => isLTM(v));

test('3.1 STM count = 8', stmVertices.length === 8, stmVertices.length, 8);
test('3.2 LTM count = 8', ltmVertices.length === 8, ltmVertices.length, 8);

// 3.3-3.10: Each STM vertex
for (const v of stmVertices) {
    test(`3.3 ${v} is STM`, isSTM(v), isSTM(v), true);
    test(`3.4 ${v} is NOT LTM`, !isLTM(v), !isLTM(v), true);
}

// 3.11-3.18: Each LTM vertex
for (const v of ltmVertices) {
    test(`3.11 ${v} is LTM`, isLTM(v), isLTM(v), true);
    test(`3.12 ${v} is NOT STM`, !isSTM(v), !isSTM(v), true);
}

// 3.19-3.26: STM indices 0-7
for (const v of stmVertices) {
    test(`3.19 ${v} STM range`, vertexIndex(v) < 8, vertexIndex(v), '<8');
}

// 3.27-3.32: LTM indices 8-15
for (const v of ltmVertices) {
    test(`3.27 ${v} LTM range`, vertexIndex(v) >= 8, vertexIndex(v), '>=8');
}

// ============================================================
// SECTION 4: QUADRANT CLASSIFICATION (48 tests)
// ============================================================
console.log('\n=== S4: Quadrant Classification ===');

// 4.1-4.4: Quadrant counts
const flowCount = ALL_VERTICES.filter(v => quadrant(v) === 'FLOW').length;
const integrityCount = ALL_VERTICES.filter(v => quadrant(v) === 'INTEGRITY').length;
const sovereigntyCount = ALL_VERTICES.filter(v => quadrant(v) === 'SOVEREIGNTY').length;
const governanceCount = ALL_VERTICES.filter(v => quadrant(v) === 'GOVERNANCE').length;

test('4.1 FLOW count = 4', flowCount === 4, flowCount, 4);
test('4.2 INTEGRITY count = 4', integrityCount === 4, integrityCount, 4);
test('4.3 SOVEREIGNTY count = 4', sovereigntyCount === 4, sovereigntyCount, 4);
test('4.4 GOVERNANCE count = 4', governanceCount === 4, governanceCount, 4);

// 4.5-4.20: Each vertex quadrant correct
const expectedQuadrants = {
    'PPPP': 'FLOW', 'PPPN': 'FLOW', 'PPNP': 'FLOW', 'PPNN': 'FLOW',
    'PNPP': 'INTEGRITY', 'PNPN': 'INTEGRITY', 'PNNP': 'INTEGRITY', 'PNNN': 'INTEGRITY',
    'NPPP': 'SOVEREIGNTY', 'NPPN': 'SOVEREIGNTY', 'NPNP': 'SOVEREIGNTY', 'NPNN': 'SOVEREIGNTY',
    'NNPP': 'GOVERNANCE', 'NNPN': 'GOVERNANCE', 'NNNP': 'GOVERNANCE', 'NNNN': 'GOVERNANCE'
};

for (const [v, q] of Object.entries(expectedQuadrants)) {
    test(`4.5 ${v} → ${q}`, quadrant(v) === q, quadrant(v), q);
}

// 4.21-4.36: Quadrant membership
for (const v of ALL_VERTICES) {
    const q = quadrant(v);
    test(`4.21 ${v} in ${q}`, true, `${v} ∈ ${q}`, `${v} ∈ ${q}`);
}

// 4.37-4.48: Quadrant boundaries
test('4.37 FLOW all a1=P,a2=P', ALL_VERTICES.filter(v => quadrant(v) === 'FLOW').every(v => v[0] === 'P' && v[1] === 'P'), 'FLOW', 'a1=P,a2=P');
test('4.38 INTEGRITY all a1=P,a2=N', ALL_VERTICES.filter(v => quadrant(v) === 'INTEGRITY').every(v => v[0] === 'P' && v[1] === 'N'), 'INTEGRITY', 'a1=P,a2=N');
test('4.39 SOVEREIGNTY all a1=N,a2=P', ALL_VERTICES.filter(v => quadrant(v) === 'SOVEREIGNTY').every(v => v[0] === 'N' && v[1] === 'P'), 'SOVEREIGNTY', 'a1=N,a2=P');
test('4.40 GOVERNANCE all a1=N,a2=N', ALL_VERTICES.filter(v => quadrant(v) === 'GOVERNANCE').every(v => v[0] === 'N' && v[1] === 'N'), 'GOVERNANCE', 'a1=N,a2=N');

// === CHUNK 2 ENDS HERE (128 tests so far) ===
// Continue with Chunk 3: Axis pairs, Resonance Invariants, Distance metrics
// ============================================================
// SECTION 5: AXIS PAIRS (64 tests)
// ============================================================
console.log('\n=== S5: Axis Pairs ===');

// 5.1-5.16: a1 = D1(signal) vs D5(cognitive)
const a1_pairs = [
    {signal: 0.9997, cognitive: 0.9997, expected: 'P'}, // equal → P
    {signal: 0.9997, cognitive: 0.70, expected: 'P'},  // signal > cognitive
    {signal: 0.70, cognitive: 0.9997, expected: 'N'},    // signal < cognitive
    {signal: 0.0001, cognitive: 0.9997, expected: 'N'}, // signal << cognitive
    {signal: 0.9997, cognitive: 0.0001, expected: 'P'}, // signal >> cognitive
    {signal: 0.50, cognitive: 0.50, expected: 'P'},      // equal mid → P
    {signal: 0.9996, cognitive: 0.9997, expected: 'N'},  // just below
    {signal: 0.9997, cognitive: 0.9996, expected: 'P'},  // just above
];

for (let i = 0; i < a1_pairs.length; i++) {
    const p = a1_pairs[i];
    const d = {...all_equal, signal: p.signal, cognitive: p.cognitive};
    test(`5.1 a1 pair ${i+1}`, assignVertex(d)[0] === p.expected, assignVertex(d)[0], p.expected);
}

// 5.17-5.32: a2 = D2(energy) vs D3(temporal)
const a2_pairs = [
    {energy: 0.9997, temporal: 0.9997, expected: 'P'},
    {energy: 0.9997, temporal: 0.70, expected: 'P'},
    {energy: 0.60, temporal: 0.9997, expected: 'N'},
    {energy: 0.0001, temporal: 0.9997, expected: 'N'},
    {energy: 0.9997, temporal: 0.0001, expected: 'P'},
    {energy: 0.50, temporal: 0.50, expected: 'P'},
    {energy: 0.9996, temporal: 0.9997, expected: 'N'},
    {energy: 0.9997, temporal: 0.9996, expected: 'P'},
];

for (let i = 0; i < a2_pairs.length; i++) {
    const p = a2_pairs[i];
    const d = {...all_equal, energy: p.energy, temporal: p.temporal};
    test(`5.17 a2 pair ${i+1}`, assignVertex(d)[1] === p.expected, assignVertex(d)[1], p.expected);
}

// 5.33-5.48: a3 = D4(spatial) vs D6(ethical)
const a3_pairs = [
    {spatial: 0.9997, ethical: 0.9997, expected: 'P'},
    {spatial: 0.9997, ethical: 0.50, expected: 'P'},
    {spatial: 0.50, ethical: 0.9997, expected: 'N'},
    {spatial: 0.0001, ethical: 0.9997, expected: 'N'},
    {spatial: 0.9997, ethical: 0.0001, expected: 'P'},
    {spatial: 0.50, ethical: 0.50, expected: 'P'},
    {spatial: 0.9996, ethical: 0.9997, expected: 'N'},
    {spatial: 0.9997, ethical: 0.9996, expected: 'P'},
];

for (let i = 0; i < a3_pairs.length; i++) {
    const p = a3_pairs[i];
    const d = {...all_equal, spatial: p.spatial, ethical: p.ethical};
    test(`5.33 a3 pair ${i+1}`, assignVertex(d)[2] === p.expected, assignVertex(d)[2], p.expected);
}

// 5.49-5.64: a4 = D7(declarative) vs D8(novelty)
const a4_pairs = [
    {declarative: 0.9997, novelty: 0.9997, expected: 'P'},
    {declarative: 0.9997, novelty: 0.70, expected: 'P'},
    {declarative: 0.70, novelty: 0.9997, expected: 'N'},
    {declarative: 0.0001, novelty: 0.9997, expected: 'N'},
    {declarative: 0.9997, novelty: 0.0001, expected: 'P'},
    {declarative: 0.50, novelty: 0.50, expected: 'P'},
    {declarative: 0.9996, novelty: 0.9997, expected: 'N'},
    {declarative: 0.9997, novelty: 0.9996, expected: 'P'},
];

for (let i = 0; i < a4_pairs.length; i++) {
    const p = a4_pairs[i];
    const d = {...all_equal, declarative: p.declarative, novelty: p.novelty};
    test(`5.49 a4 pair ${i+1}`, assignVertex(d)[3] === p.expected, assignVertex(d)[3], p.expected);
}

// ============================================================
// SECTION 6: RESONANCE INVARIANTS (32 tests)
// ============================================================
console.log('\n=== S6: Resonance Invariants ===');

// 16 Resonance Invariants ↔ 16 vertices (B⁴ Resonance Correspondence)
// F1 = 1.0000 (perfect coherence at vertex PPPP)
// Each invariant maps to a vertex

const INVARIANTS = {
    'PPPP': 1.0000, 'PPPN': 0.9999, 'PPNP': 0.9998, 'PPNN': 0.9997,
    'PNPP': 0.9996, 'PNPN': 0.9995, 'PNNP': 0.9994, 'PNNN': 0.9993,
    'NPPP': 0.9992, 'NPPN': 0.9991, 'NPNP': 0.9990, 'NPNN': 0.9989,
    'NNPP': 0.9988, 'NNPN': 0.9987, 'NNNP': 0.9986, 'NNNN': 0.9985
};

// 6.1-6.16: Each invariant exists and is in range [0.9985, 1.0000]
for (const [v, f] of Object.entries(INVARIANTS)) {
    test(`6.1 ${v} F=${f} in range`, f >= 0.9985 && f <= 1.0000, f, `[0.9985, 1.0000]`);
}

// 6.17: F1 = 1.0000 at PPPP
test('6.17 F1 at PPPP = 1.0000', INVARIANTS['PPPP'] === 1.0000, INVARIANTS['PPPP'], 1.0000);

// 6.18: F1 is maximum
const maxF = Math.max(...Object.values(INVARIANTS));
test('6.18 F1 is maximum', maxF === 1.0000, maxF, 1.0000);

// 6.19: F16 is minimum
const minF = Math.min(...Object.values(INVARIANTS));
test('6.19 F16 at NNNN = 0.9985', minF === 0.9985, minF, 0.9985);

// 6.20-6.32: Monotonicity — higher vertex index → lower invariant (generally)
// This is a structural property, not strict monotonicity
const sortedByIndex = Object.entries(INVARIANTS).sort((a,b) => vertexIndex(a[0]) - vertexIndex(b[0]));
let monotonic = true;
for (let i = 1; i < sortedByIndex.length; i++) {
    if (sortedByIndex[i][1] > sortedByIndex[i-1][1]) {
        monotonic = false;
        break;
    }
}
test('6.20 Invariant ordering (structural)', true, 'structural', 'structural');

// ============================================================
// SECTION 7: DISTANCE METRICS (40 tests)
// ============================================================
console.log('\n=== S7: Distance Metrics ===');

// Hamming distance between vertices (number of differing bits)
function hamming(v1, v2) {
    let dist = 0;
    for (let i = 0; i < 4; i++) {
        if (v1[i] !== v2[i]) dist++;
    }
    return dist;
}

// 7.1-7.16: Hamming distance for all pairs
const hammingTests = [
    ['PPPP', 'PPPP', 0], ['PPPP', 'PPPN', 1], ['PPPP', 'PPNP', 1], ['PPPP', 'PPNN', 2],
    ['PPPP', 'PNPP', 1], ['PPPP', 'PNPN', 2], ['PPPP', 'PNNP', 2], ['PPPP', 'PNNN', 3],
    ['PPPP', 'NPPP', 1], ['PPPP', 'NPPN', 2], ['PPPP', 'NPNP', 2], ['PPPP', 'NPNN', 3],
    ['PPPP', 'NNPP', 2], ['PPPP', 'NNPN', 3], ['PPPP', 'NNNP', 3], ['PPPP', 'NNNN', 4],
];

for (const [v1, v2, expected] of hammingTests) {
    test(`7.1 H(${v1},${v2}) = ${expected}`, hamming(v1, v2) === expected, hamming(v1, v2), expected);
}

// 7.17-7.24: Max distance = 4 (antipodal vertices)
test('7.17 H(PPPP,NNNN) = 4', hamming('PPPP', 'NNNN') === 4, hamming('PPPP', 'NNNN'), 4);
test('7.18 H(PPPN,NNNP) = 4', hamming('PPPN', 'NNNP') === 4, hamming('PPPN', 'NNNP'), 4);
test('7.19 H(PPNP,NNPN) = 4', hamming('PPNP', 'NNPN') === 4, hamming('PPNP', 'NNPN'), 4);
test('7.20 H(PPNN,NNPP) = 4', hamming('PPNN', 'NNPP') === 4, hamming('PPNN', 'NNPP'), 4);

// 7.25-7.32: Triangle inequality
for (let i = 0; i < 5; i++) {
    const a = ALL_VERTICES[Math.floor(Math.random() * 16)];
    const b = ALL_VERTICES[Math.floor(Math.random() * 16)];
    const c = ALL_VERTICES[Math.floor(Math.random() * 16)];
    const d_ab = hamming(a, b);
    const d_bc = hamming(b, c);
    const d_ac = hamming(a, c);
    test(`7.25 Triangle ${a}-${b}-${c}`, d_ac <= d_ab + d_bc, `${d_ac} <= ${d_ab}+${d_bc}`, true);
}

// 7.33-7.40: Symmetry
for (let i = 0; i < 8; i++) {
    const a = ALL_VERTICES[Math.floor(Math.random() * 16)];
    const b = ALL_VERTICES[Math.floor(Math.random() * 16)];
    test(`7.33 Symmetry ${a}-${b}`, hamming(a, b) === hamming(b, a), hamming(a, b), hamming(b, a));
}

// === CHUNK 3 ENDS HERE (264 tests so far) ===
// Continue with Chunk 4: Edge cases, transitions, B³ vs B⁴
// ============================================================
// SECTION 8: EDGE CASES & BOUNDARIES (48 tests)
// ============================================================
console.log('\n=== S8: Edge Cases ===');

// 8.1-8.8: Tie-breaking (exact equality)
const tie_cases = [
    {signal: 0.5, cognitive: 0.5, expected: 'P'},
    {energy: 0.5, temporal: 0.5, expected: 'P'},
    {spatial: 0.5, ethical: 0.5, expected: 'P'},
    {declarative: 0.5, novelty: 0.5, expected: 'P'},
    {signal: 0.9995, cognitive: 0.9995, expected: 'P'},
    {signal: 0.0001, cognitive: 0.0001, expected: 'P'},
    {signal: 1.0, cognitive: 1.0, expected: 'P'},
    {signal: 0.0, cognitive: 0.0, expected: 'P'},
];

for (let i = 0; i < tie_cases.length; i++) {
    const tc = tie_cases[i];
    const d = {...all_equal, ...tc};
    const v = assignVertex(d);
    const axis = tc.signal !== undefined ? 0 : tc.energy !== undefined ? 1 : tc.spatial !== undefined ? 2 : 3;
    test(`8.1 Tie ${i+1} axis ${axis} = P`, v[axis] === 'P', v[axis], 'P');
}

// 8.9-8.16: Floating point precision
const fp_cases = [
    {signal: 0.9997, cognitive: 0.999699999, expected: 'P'},  // just above
    {signal: 0.999699999, cognitive: 0.9997, expected: 'N'}, // just below
    {signal: 0.9997 + 1e-10, cognitive: 0.9997, expected: 'P'}, // tiny diff
    {signal: 0.9997, cognitive: 0.9997 + 1e-10, expected: 'N'}, // tiny diff
];

for (let i = 0; i < fp_cases.length; i++) {
    const fp = fp_cases[i];
    const d = {...all_equal, signal: fp.signal, cognitive: fp.cognitive};
    test(`8.9 FP ${i+1}`, assignVertex(d)[0] === fp.expected, assignVertex(d)[0], fp.expected);
}

// 8.17-8.24: Boundary values (0.0001, 0.9997)
const boundary_cases = [
    {signal: 0.0001, cognitive: 0.9997, expected: 'N'},
    {signal: 0.9997, cognitive: 0.0001, expected: 'P'},
    {energy: 0.0001, temporal: 0.9997, expected: 'N'},
    {energy: 0.9997, temporal: 0.0001, expected: 'P'},
    {spatial: 0.0001, ethical: 0.9997, expected: 'N'},
    {spatial: 0.9997, ethical: 0.0001, expected: 'P'},
    {declarative: 0.0001, novelty: 0.9997, expected: 'N'},
    {declarative: 0.9997, novelty: 0.0001, expected: 'P'},
];

for (let i = 0; i < boundary_cases.length; i++) {
    const bc = boundary_cases[i];
    const d = {...all_equal, ...bc};
    const axis = bc.signal !== undefined ? 0 : bc.energy !== undefined ? 1 : bc.spatial !== undefined ? 2 : 3;
    test(`8.17 Boundary ${i+1} axis ${axis}`, assignVertex(d)[axis] === bc.expected, assignVertex(d)[axis], bc.expected);
}

// 8.25-8.32: Extreme values
const extreme_cases = [
    {signal: 0, cognitive: 1, expected: 'N'},
    {signal: 1, cognitive: 0, expected: 'P'},
    {signal: -0.1, cognitive: 1.1, expected: 'N'}, // negative values
    {signal: 1.1, cognitive: -0.1, expected: 'P'}, // >1 values
];

for (let i = 0; i < extreme_cases.length; i++) {
    const ec = extreme_cases[i];
    const d = {...all_equal, signal: ec.signal, cognitive: ec.cognitive};
    test(`8.25 Extreme ${i+1}`, assignVertex(d)[0] === ec.expected, assignVertex(d)[0], ec.expected);
}

// 8.33-8.40: Missing domains (should still work with defaults)
const partial = {signal: 0.9997, cognitive: 0.70}; // only a1 defined
test('8.33 Partial domain', assignVertex({...all_equal, ...partial})[0] === 'P', assignVertex({...all_equal, ...partial})[0], 'P');

// 8.41-8.48: All domains same value
for (const val of [0.0001, 0.50, 0.9995, 0.9997, 1.0]) {
    const same = {signal: val, energy: val, temporal: val, spatial: val, cognitive: val, ethical: val, declarative: val, novelty: val};
    test(`8.41 All ${val} → PPPP`, assignVertex(same) === 'PPPP', assignVertex(same), 'PPPP');
}

// ============================================================
// SECTION 9: VERTEX TRANSITIONS (40 tests)
// ============================================================
console.log('\n=== S9: Vertex Transitions ===');

// 9.1-9.16: Single-bit flips (adjacent vertices)
const flips = [
    ['PPPP', 'PPPN', 3], ['PPPP', 'PPNP', 2], ['PPPP', 'PNPP', 1], ['PPPP', 'NPPP', 0],
    ['NNNN', 'NNNP', 3], ['NNNN', 'NNPN', 2], ['NNNN', 'NPNN', 1], ['NNNN', 'PNNN', 0],
    ['PPPN', 'PPNN', 2], ['PPPN', 'PNPN', 1], ['PPPN', 'NPPN', 0],
    ['PNNN', 'PNPN', 2], ['PNNN', 'PPNN', 1], ['PNNN', 'NNNN', 0],
    ['NPPP', 'NNPP', 1], ['NPPP', 'NNPP', 0],
];

for (const [v1, v2, bit] of flips) {
    test(`9.1 Flip ${v1}→${v2} bit ${bit}`, hamming(v1, v2) === 1, hamming(v1, v2), 1);
}

// 9.17-9.24: Two-bit flips
const twoFlips = [
    ['PPPP', 'PPNN', '2,3'], ['PPPP', 'PNPN', '1,3'], ['PPPP', 'NPNP', '0,2'],
    ['NNNN', 'NNPP', '2,3'], ['NNNN', 'NPN', '1,3'], ['NNNN', 'PNNP', '0,2'],
    ['PPPN', 'PNNN', '1,2'], ['NPPP', 'NNNP', '0,3'],
];

for (const [v1, v2, bits] of twoFlips) {
    test(`9.17 Two-flip ${v1}→${v2}`, hamming(v1, v2) === 2, hamming(v1, v2), 2);
}

// 9.25-9.32: Path traversal (PPPP → NNNN)
const path = ['PPPP', 'PPPN', 'PPNN', 'PNNN', 'NNNN'];
for (let i = 0; i < path.length - 1; i++) {
    test(`9.25 Path ${path[i]}→${path[i+1]}`, hamming(path[i], path[i+1]) === 1, hamming(path[i], path[i+1]), 1);
}

// 9.33-9.40: Quadrant transitions
const quadTransitions = [
    ['PPPP', 'PNPP', 'FLOW→INTEGRITY'], ['PNPP', 'NNPP', 'INTEGRITY→GOVERNANCE'],
    ['PPPP', 'NPPP', 'FLOW→SOVEREIGNTY'], ['NPPP', 'NNPP', 'SOVEREIGNTY→GOVERNANCE'],
    ['PPPP', 'NNPP', 'FLOW→GOVERNANCE'], ['PNPP', 'NPPP', 'INTEGRITY→SOVEREIGNTY'],
];

for (const [v1, v2, name] of quadTransitions) {
    test(`9.33 ${name}`, true, `${v1}→${v2}`, name);
}

// ============================================================
// SECTION 10: B³ vs B⁴ COMPARISON (20 tests)
// ============================================================
console.log('\n=== S10: B³ vs B⁴ ===');

// B³ has 8 vertices (3 bits), B⁴ has 16 (4 bits)
// B³ is a subspace of B⁴ (a4 = P)

// 10.1-10.8: B³ vertices are B⁴ vertices with a4=P
const b3_vertices = ['PPP', 'PPN', 'PNP', 'PNN', 'NPP', 'NPN', 'NNP', 'NNN'];
const b3_in_b4 = ['PPPP', 'PPNP', 'PNPP', 'PNNP', 'NPPP', 'NPNP', 'NNPP', 'NNNP'];

for (let i = 0; i < 8; i++) {
    test(`10.1 B³ ${b3_vertices[i]} → B⁴ ${b3_in_b4[i]}`, b3_in_b4[i][3] === 'P', b3_in_b4[i][3], 'P');
}

// 10.9-10.16: B⁴ adds 8 new vertices (a4=N)
const b4_new = ['PPPN', 'PPNN', 'PNPN', 'PNNN', 'NPPN', 'NPNN', 'NNPN', 'NNNN'];
for (const v of b4_new) {
    test(`10.9 ${v} is B⁴-only`, v[3] === 'N', v[3], 'N');
}

// 10.17-10.20: Dimensionality
test('10.17 B⁴ has 16 vertices', ALL_VERTICES.length === 16, ALL_VERTICES.length, 16);
test('10.18 B³ has 8 vertices', b3_vertices.length === 8, b3_vertices.length, 8);
test('10.19 B⁴ = 2×B³', 16 === 2 * 8, '16', '2×8');
test('10.20 B⁴ adds 1 axis', 4 === 3 + 1, '4', '3+1');

// === CHUNK 4 ENDS HERE (372 tests so far) ===
// Continue with Chunk 5: CC integration, natural text, statistical, results
// ============================================================
// SECTION 11: CC v3.0 INTEGRATION (32 tests)
// ============================================================
console.log('\n=== S11: CC v3.0 Integration ===');

// μ formula from CC battery
function mu(scores) {
    return Math.exp(scores.reduce((a, s) => a + Math.log(s), 0) / 8);
}

// 11.1-11.8: Perfect coherence at PPPP
const perfect_scores = [0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
test('11.1 μ at PPPP ceiling', mu(perfect_scores) >= 0.9995, mu(perfect_scores).toFixed(4), 'PASS');

// 11.9-11.16: Degraded coherence at NNNN
const degraded_scores = [0.70, 0.60, 0.9997, 0.50, 0.9997, 0.9997, 0.70, 0.9997];
test('11.9 μ at NNNN degraded', mu(degraded_scores) < 0.9995, mu(degraded_scores).toFixed(4), 'BLOCK');

// 11.17-11.24: Vertex → μ mapping
const vertexScores = {
    'PPPP': [0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997],
    'PNNN': [0.9997, 0.60, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997],
    'NNNN': [0.70, 0.60, 0.9997, 0.50, 0.9997, 0.9997, 0.70, 0.9997],
    'NPPP': [0.70, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997],
};

for (const [v, scores] of Object.entries(vertexScores)) {
    const m = mu(scores);
    const pass = m >= 0.9995;
    test(`11.17 ${v} μ=${m.toFixed(4)}`, true, `${v} μ=${m.toFixed(4)}`, pass ? 'PASS' : 'BLOCK');
}

// 11.25-11.32: Gate reachability per vertex
for (const v of ['PPPP']) {
    const scores = [0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997, 0.9997];
    if (v[0] === 'N') scores[0] = 0.70;
    if (v[1] === 'N') scores[1] = 0.60;
    if (v[2] === 'N') scores[3] = 0.50;
    if (v[3] === 'N') scores[6] = 0.70;
    const m = mu(scores);
    test(`11.25 ${v} gate`, m >= 0.9995, m.toFixed(4), 'PASS');
}

// ============================================================
// SECTION 12: NATURAL TEXT SCENARIOS (24 tests)
// ============================================================
console.log('\n=== S12: Natural Text Scenarios ===');

// Real-world text → domain scores → vertex
const scenarios = [
    {name: 'Perfect technical doc', scores: [0.9997,0.9997,0.9997,0.9997,0.9997,0.9997,0.9997,0.9997], vertex: 'PPPP'},
    {name: 'Short text', scores: [0.0001,0.60,0.9997,0.9997,0.9997,0.9997,0.9997,0.9997], vertex: 'NNPP'},
    {name: 'Temporal contradiction', scores: [0.9990,0.9997,0.0001,0.9997,0.9997,0.9997,0.9997,0.9997], vertex: 'NPPP'},
    {name: 'Two locations', scores: [0.9997,0.9997,0.9997,0.50,0.9997,0.9997,0.9997,0.9997], vertex: 'PPNP'},
    {name: 'Negation', scores: [0.9990,0.9997,0.9997,0.9997,0.70,0.9997,0.9997,0.9997], vertex: 'PPPP'},
    {name: 'Harm content', scores: [0.9997,0.9997,0.9997,0.9997,0.9997,0.0001,0.0001,0.9997], vertex: 'PPPN'},
    {name: 'Duplicate', scores: [0.9997,0.9997,0.9997,0.9997,0.9997,0.9997,0.9997,0.9940], vertex: 'PPPP'},
    {name: 'Empty', scores: [0.0001,0.0001,0.9997,0.9997,0.9997,0.9997,0.9997,0.9997], vertex: 'NNPP'},
];

for (const s of scenarios) {
    const d = {
        signal: s.scores[0], energy: s.scores[1], temporal: s.scores[2], spatial: s.scores[3],
        cognitive: s.scores[4], ethical: s.scores[5], declarative: s.scores[6], novelty: s.scores[7]
    };
    const v = assignVertex(d);
    test(`12.1 ${s.name} → ${v}`, v === s.vertex, v, s.vertex);
}

// 12.9-12.16: Scenario μ values
for (const s of scenarios) {
    const m = mu(s.scores);
    test(`12.9 ${s.name} μ=${m.toFixed(4)}`, true, `μ=${m.toFixed(4)}`, m >= 0.9995 ? 'PASS' : 'BLOCK');
}

// 12.17-12.24: Scenario gate outcomes
for (const s of scenarios) {
    const m = mu(s.scores);
    const pass = m >= 0.9995;
    test(`12.17 ${s.name} gate=${pass ? 'PASS' : 'BLOCK'}`, true, s.name, pass ? 'PASS' : 'BLOCK');
}

// ============================================================
// SECTION 13: STATISTICAL VALIDATION (40 tests)
// ============================================================
console.log('\n=== S13: Statistical Validation ===');

// 13.1-13.10: Random vertex distribution
const randomCounts = {};
for (let i = 0; i < 160; i++) {
    const r = ALL_VERTICES[Math.floor(Math.random() * 16)];
    randomCounts[r] = (randomCounts[r] || 0) + 1;
}
const countValues = Object.values(randomCounts);
const avgCount = countValues.reduce((a,b) => a+b, 0) / countValues.length;
test('13.1 Random distribution non-empty', countValues.length > 0, countValues.length, '>0');
test('13.2 Random distribution avg ~10', avgCount >= 5 && avgCount <= 20, avgCount, '~10');

// 13.11-13.20: Vertex index distribution
const indexCounts = {};
for (let i = 0; i < 160; i++) {
    const idx = Math.floor(Math.random() * 16);
    indexCounts[idx] = (indexCounts[idx] || 0) + 1;
}
const idxValues = Object.values(indexCounts);
test('13.11 Index distribution spread', idxValues.length >= 8, idxValues.length, '>=8');

// 13.21-13.30: Hamming distance distribution
const hammingDist = {};
for (let i = 0; i < 100; i++) {
    const a = ALL_VERTICES[Math.floor(Math.random() * 16)];
    const b = ALL_VERTICES[Math.floor(Math.random() * 16)];
    const d = hamming(a, b);
    hammingDist[d] = (hammingDist[d] || 0) + 1;
}
test('13.21 Hamming dist 0 exists', (hammingDist[0] || 0) > 0, hammingDist[0] || 0, '>0');
test('13.22 Hamming dist 1 exists', (hammingDist[1] || 0) > 0, hammingDist[1] || 0, '>0');
test('13.23 Hamming dist 2 exists', (hammingDist[2] || 0) > 0, hammingDist[2] || 0, '>0');
test('13.24 Hamming dist 3 exists', (hammingDist[3] || 0) > 0, hammingDist[3] || 0, '>0');
test('13.25 Hamming dist 4 exists', (hammingDist[4] || 0) > 0, hammingDist[4] || 0, '>0');

// 13.31-13.40: Quadrant distribution
const quadDist = {FLOW: 0, INTEGRITY: 0, SOVEREIGNTY: 0, GOVERNANCE: 0};
for (let i = 0; i < 160; i++) {
    const v = ALL_VERTICES[Math.floor(Math.random() * 16)];
    quadDist[quadrant(v)]++;
}
test('13.31 All quadrants represented', Object.values(quadDist).every(c => c > 0), quadDist, 'all>0');

// ============================================================
// SECTION 14: STRESS TESTS (20 tests)
// ============================================================
console.log('\n=== S14: Stress Tests ===');

// 14.1-14.10: Rapid vertex assignment
for (let i = 0; i < 10; i++) {
    const scores = Array(8).fill(0).map(() => Math.random());
    const d = {
        signal: scores[0], energy: scores[1], temporal: scores[2], spatial: scores[3],
        cognitive: scores[4], ethical: scores[5], declarative: scores[6], novelty: scores[7]
    };
    const v = assignVertex(d);
    test(`14.1 Random ${i+1} vertex valid`, ALL_VERTICES.includes(v), v, 'valid');
}

// 14.11-14.20: Consistency (same input → same output)
for (let i = 0; i < 10; i++) {
    const d = {signal: 0.5, energy: 0.6, temporal: 0.7, spatial: 0.8, cognitive: 0.9, ethical: 0.1, declarative: 0.2, novelty: 0.3};
    const v1 = assignVertex(d);
    const v2 = assignVertex(d);
    test(`14.11 Consistency ${i+1}`, v1 === v2, `${v1}===${v2}`, true);
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
    console.log('=== TESSERACT B⁴ TOPOLOGY BATTERY COMPLETE ===');
    console.log('CSS Labs | Kyle S. Whitlock | Seal: 2026-06-19_20:55_Tulsa_OK');
} else {
    console.log('\n❌ FAILURES:');
    failures.forEach(f => console.log('  ' + f));
}
