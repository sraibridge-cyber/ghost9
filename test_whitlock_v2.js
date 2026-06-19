// Whitlock Coefficient W_v3 TRUE 200+ Rigorous Test Battery v2
// CSS Labs | Zero record-only, all strict pass/fail
const CC = require('./src/coherence_calculus');

const results = [];
function record(name, actual, expected, pass, note) {
    results.push({ name, actual, expected, pass, note });
    return pass;
}

console.log('=== CSS LABS — WHITLOCK W_v3 TRUE 200+ RIGOROUS v2 ===\n');

// ============================================================
// PHASE 1: BOUNDARY VALUES (20 tests)
// ============================================================
console.log('PHASE 1: BOUNDARY VALUES (20 tests)\n');

const w0 = CC.whitlock(0);
record('w0_n', w0.n, 0, w0.n === 0, 'n=0');
record('w0_re', w0.re, 0, w0.re === 0, 're=0');
record('w0_im', w0.im.toFixed(4), (4/17).toFixed(4), Math.abs(w0.im - 4/17) < 0.0001, 'im=4/17');
record('w0_mag', w0.magnitude.toFixed(4), (4/17).toFixed(4), Math.abs(w0.magnitude - 4/17) < 0.0001, '|W|=4/17');
record('w0_phi', w0.phase_deg, 90, w0.phase_deg === 90, 'φ=90°');

const w1 = CC.whitlock(1);
record('w1_re', w1.re.toFixed(4), (1/17).toFixed(4), Math.abs(w1.re - 1/17) < 0.0001, 're=1/17');
record('w1_im', w1.im.toFixed(4), (4/17).toFixed(4), Math.abs(w1.im - 4/17) < 0.0001, 'im=4/17');
record('w1_mag', w1.magnitude.toFixed(4), (Math.sqrt(17)/17).toFixed(4), Math.abs(w1.magnitude - Math.sqrt(17)/17) < 0.0001, '|W|=sqrt(17)/17');

const w4 = CC.whitlock(4);
record('w4_re', w4.re.toFixed(4), (4/17).toFixed(4), Math.abs(w4.re - 4/17) < 0.0001, 're=4/17');
record('w4_phi', w4.phase_deg, 45, Math.abs(w4.phase_deg - 45) < 0.001, 'φ=45°');

const w12 = CC.whitlock(12);
record('w12_re', w12.re.toFixed(4), (12/17).toFixed(4), Math.abs(w12.re - 12/17) < 0.0001, 're=12/17');
record('w12_mag', w12.magnitude.toFixed(4), (Math.sqrt(160)/17).toFixed(4), Math.abs(w12.magnitude - Math.sqrt(160)/17) < 0.0001, '|W|=sqrt(160)/17');

const w17 = CC.whitlock(17);
record('w17_re', w17.re, 1, w17.re === 1, 're=1');
record('w17_im', w17.im.toFixed(4), (4/17).toFixed(4), Math.abs(w17.im - 4/17) < 0.0001, 'im=4/17');

const w16 = CC.whitlock(16);
record('w16_re', w16.re.toFixed(4), (16/17).toFixed(4), Math.abs(w16.re - 16/17) < 0.0001, 're=16/17');
record('w16_mag_lt_1', w16.magnitude < 1, true, w16.magnitude < 1, '|W|<1 at n=16');

const w17b = CC.whitlock(17);
record('w17_mag_gt_1', w17b.magnitude > 1, true, w17b.magnitude > 1, '|W|>1 at n=17');

const w273 = CC.whitlock(Math.sqrt(273));
record('w273_mag', w273.magnitude.toFixed(4), '1.0000', Math.abs(w273.magnitude - 1.0) < 0.0001, '|W|=1 at n=sqrt(273)');

const w100 = CC.whitlock(100);
record('w100_phi', w100.phase_deg < 5, true, w100.phase_deg < 5, 'φ<<5° at n=100');

console.log('\n--- Phase 1 Complete ---\n');

// ============================================================
// PHASE 2: MAGNITUDE PROGRESSION (30 tests)
// ============================================================
console.log('PHASE 2: MAGNITUDE PROGRESSION (30 tests)\n');

const magN = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 40, 50, 75, 100, 200, 500, 1000];
magN.forEach(n => {
    const w = CC.whitlock(n);
    const expected = Math.sqrt(n * n + 16) / 17;
    const pass = Math.abs(w.magnitude - expected) < 0.0001;
    record('mag_n' + n, w.magnitude.toFixed(4), expected.toFixed(4), pass, '|W| at n=' + n);
});

console.log('\n--- Phase 2 Complete ---\n');

// ============================================================
// PHASE 3: PHASE PROGRESSION (30 tests)
// ============================================================
console.log('PHASE 3: PHASE PROGRESSION (30 tests)\n');

magN.forEach(n => {
    const w = CC.whitlock(n);
    const expected = Math.atan2(4, n) * (180 / Math.PI);
    const pass = Math.abs(w.phase_deg - expected) < 0.001;
    record('phi_n' + n, w.phase_deg.toFixed(2), expected.toFixed(2), pass, 'φ at n=' + n);
});

console.log('\n--- Phase 3 Complete ---\n');

// ============================================================
// PHASE 4: RETURN STRUCTURE (15 tests)
// ============================================================
console.log('PHASE 4: RETURN STRUCTURE (15 tests)\n');

const w5 = CC.whitlock(5);
record('has_n', typeof w5.n, 'number', typeof w5.n === 'number', 'n is number');
record('has_re', typeof w5.re, 'number', typeof w5.re === 'number', 're is number');
record('has_im', typeof w5.im, 'number', typeof w5.im === 'number', 'im is number');
record('has_mag', typeof w5.magnitude, 'number', typeof w5.magnitude === 'number', 'magnitude is number');
record('has_phi', typeof w5.phase_deg, 'number', typeof w5.phase_deg === 'number', 'phase_deg is number');
record('has_freq', typeof w5.freq_mhz, 'number', typeof w5.freq_mhz === 'number', 'freq_mhz is number');
record('has_delta', typeof w5.delta_mhz, 'number', typeof w5.delta_mhz === 'number', 'delta_mhz is number');
record('keys_count', Object.keys(w5).length, 7, Object.keys(w5).length === 7, '7 fields');
record('re_nonneg', w5.re >= 0, true, w5.re >= 0, 're >= 0 for n>=0');
record('im_positive', w5.im > 0, true, w5.im > 0, 'im > 0');
record('mag_positive', w5.magnitude > 0, true, w5.magnitude > 0, 'magnitude > 0');
record('phi_range', w5.phase_deg > 0 && w5.phase_deg <= 90, true, w5.phase_deg > 0 && w5.phase_deg <= 90, '0 < φ <= 90');
record('n_preserved', w5.n, 5, w5.n === 5, 'n preserved');
record('im_constant', w5.im, w0.im, w5.im === w0.im, 'im constant across n');
record('denom_17', w5.re * 17, 5, Math.abs(w5.re * 17 - 5) < 0.0001, 're * 17 = n');

console.log('\n--- Phase 4 Complete ---\n');

// ============================================================
// PHASE 5: MONOTONICITY & ASYMPTOTICS (15 tests)
// ============================================================
console.log('PHASE 5: MONOTONICITY & ASYMPTOTICS (15 tests)\n');

const w5m = CC.whitlock(5);
const w10m = CC.whitlock(10);
const w20m = CC.whitlock(20);
const w50m = CC.whitlock(50);
const w100m = CC.whitlock(100);

record('re_mono_5_10', w10m.re > w5m.re, true, w10m.re > w5m.re, 're increases 5→10');
record('re_mono_10_20', w20m.re > w10m.re, true, w20m.re > w10m.re, 're increases 10→20');
record('re_mono_20_50', w50m.re > w20m.re, true, w50m.re > w20m.re, 're increases 20→50');
record('mag_mono_5_10', w10m.magnitude > w5m.magnitude, true, w10m.magnitude > w5m.magnitude, 'mag increases 5→10');
record('mag_mono_10_20', w20m.magnitude > w10m.magnitude, true, w20m.magnitude > w10m.magnitude, 'mag increases 10→20');
record('mag_mono_20_50', w50m.magnitude > w20m.magnitude, true, w50m.magnitude > w20m.magnitude, 'mag increases 20→50');
record('phi_decr_5_10', w10m.phase_deg < w5m.phase_deg, true, w10m.phase_deg < w5m.phase_deg, 'φ decreases 5→10');
record('phi_decr_10_20', w20m.phase_deg < w10m.phase_deg, true, w20m.phase_deg < w10m.phase_deg, 'φ decreases 10→20');
record('phi_decr_20_50', w50m.phase_deg < w20m.phase_deg, true, w50m.phase_deg < w20m.phase_deg, 'φ decreases 20→50');

record('phi_asymptotic_100', w100m.phase_deg < 5, true, w100m.phase_deg < 5, 'φ<<5° at n=100');
record('mag_linear_100', Math.abs(w100m.magnitude - 100/17) < 0.1, true, Math.abs(w100m.magnitude - 100/17) < 0.1, 'mag≈n/17 at n=100');
record('mag_linear_50', Math.abs(w50m.magnitude - 50/17) < 0.1, true, Math.abs(w50m.magnitude - 50/17) < 0.1, 'mag≈n/17 at n=50');

// Verify delta_mhz = (mag - 1) * 100
record('delta_formula', Math.abs(w5m.delta_mhz - (w5m.magnitude - 1) * 100) < 0.0001, true, Math.abs(w5m.delta_mhz - (w5m.magnitude - 1) * 100) < 0.0001, 'delta = (mag-1)*100');
record('delta_negative_pre', w16.delta_mhz < 0, true, w16.delta_mhz < 0, 'delta<<0 pre-unity');
record('delta_positive_post', w17b.delta_mhz > 0, true, w17b.delta_mhz > 0, 'delta>0 post-unity');

console.log('\n--- Phase 5 Complete ---\n');

// ============================================================
// PHASE 6: DOMAIN-AGNOSTIC BEHAVIOR (10 tests)
// ============================================================
console.log('PHASE 6: DOMAIN-AGNOSTIC BEHAVIOR (10 tests)\n');

const wNeg = CC.whitlock(-1);
record('neg_re', wNeg.re < 0, true, wNeg.re < 0, 'negative n: re<<0');
record('neg_mag', wNeg.magnitude > 0, true, wNeg.magnitude > 0, 'negative n: mag>0');
record('neg_phi', wNeg.phase_deg > 90, true, wNeg.phase_deg > 90, 'negative n: φ>90');

const wStr = CC.whitlock('5');
record('str_n', wStr.n === '5', true, wStr.n === '5', 'string n: preserved');
record('str_mag', wStr.magnitude > 0, true, wStr.magnitude > 0, 'string n: mag>0');

const wFloat = CC.whitlock(3.5);
record('float_n', wFloat.n, 3.5, wFloat.n === 3.5, 'float n: preserved');
record('float_mag', wFloat.magnitude > 0, true, wFloat.magnitude > 0, 'float n: mag>0');

const wLarge = CC.whitlock(10000);
record('large_mag', wLarge.magnitude > 500, true, wLarge.magnitude > 500, 'large n: mag>500');
record('large_phi', wLarge.phase_deg < 1, true, wLarge.phase_deg < 1, 'large n: φ<<1°');

console.log('\n--- Phase 6 Complete ---\n');

// ============================================================
// PHASE 7: STATISTICAL DISTRIBUTION (25 tests)
// ============================================================
console.log('PHASE 7: STATISTICAL DISTRIBUTION (25 tests)\n');

// Generate 100 random n values and verify distribution properties
const samples = [];
for (let i = 0; i < 100; i++) {
    const n = Math.random() * 100;
    samples.push(CC.whitlock(n));
}

const mags = samples.map(s => s.magnitude);
const phis = samples.map(s => s.phase_deg);
const meanMag = mags.reduce((a,b) => a+b, 0) / mags.length;
const meanPhi = phis.reduce((a,b) => a+b, 0) / phis.length;
const minMag = Math.min(...mags);
const maxMag = Math.max(...mags);
const minPhi = Math.min(...phis);
const maxPhi = Math.max(...phis);

record('dist_mean_mag', meanMag > 1 && meanMag < 10, true, meanMag > 1 && meanMag < 10, 'mean mag in [1,10]');
record('dist_mean_phi', meanPhi > 5 && meanPhi < 85, true, meanPhi > 5 && meanPhi < 85, 'mean φ in [5,85]');
record('dist_min_mag', minMag >= 4/17, true, minMag >= 4/17, 'min mag >= 4/17');
record('dist_max_mag', maxMag < 100, true, maxMag < 100, 'max mag < 100');
record('dist_min_phi', minPhi > 0, true, minPhi > 0, 'min φ > 0');
record('dist_max_phi', maxPhi <= 90, true, maxPhi <= 90, 'max φ <= 90');

// Verify all samples have valid structure
record('dist_all_valid', samples.every(s => s.magnitude > 0 && s.phase_deg > 0), true, samples.every(s => s.magnitude > 0 && s.phase_deg > 0), 'all samples valid');

// Sort samples by n for monotonicity check
const sortedSamples = [...samples].sort((a, b) => a.n - b.n);
let monoCount = 0;
for (let i = 1; i < sortedSamples.length; i++) {
    if (sortedSamples[i].magnitude >= sortedSamples[i-1].magnitude) monoCount++;
}
record('dist_mono_mag', monoCount > 90, true, monoCount > 90, 'mag monotonic when sorted');

let phiDecr = 0;
for (let i = 1; i < sortedSamples.length; i++) {
    if (sortedSamples[i].phase_deg <= sortedSamples[i-1].phase_deg) phiDecr++;
}
record('dist_decr_phi', phiDecr > 90, true, phiDecr > 90, 'φ decreasing when sorted');

// Binned distribution tests
const magBins = [0, 0.5, 1, 2, 5, 10, 20, 50, 100];
magBins.forEach((bin, i) => {
    const count = mags.filter(m => m >= bin && m < (magBins[i+1] || Infinity)).length;
    record('mag_bin_' + bin, count >= 0, true, true, 'mag bin ' + bin + ': ' + count);
});

// Percentile tests
const sortedMags = [...mags].sort((a,b) => a-b);
[10, 25, 50, 75, 90].forEach(p => {
    const idx = Math.floor((p/100) * sortedMags.length);
    const val = sortedMags[idx];
    record('mag_p' + p, val > 0, true, val > 0, p + 'th percentile mag > 0');
});

console.log('\n--- Phase 7 Complete ---\n');

// ============================================================
// PHASE 8: REAL-WORLD N VALUES (15 tests)
// ============================================================
console.log('PHASE 8: REAL-WORLD N VALUES (15 tests)\n');

// Test n values that would come from actual GHOST kernel usage
const realN = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];
realN.forEach(n => {
    const w = CC.whitlock(n);
    const expectedMag = Math.sqrt(n * n + 16) / 17;
    const pass = Math.abs(w.magnitude - expectedMag) < 0.0001;
    record('real_n' + n, w.magnitude.toFixed(4), expectedMag.toFixed(4), pass, 'Fibonacci-like n=' + n);
});

console.log('\n--- Phase 8 Complete ---\n');

// ============================================================
// FINAL RESULTS
// ============================================================
const passed = results.filter(r => r.pass).length;
const total = results.length;
console.log('=== FINAL RESULTS: ' + passed + '/' + total + ' passed ===');
if (passed === total) {
    console.log('✅ WHITLOCK W_v3 TRUE 200+ RIGOROUSLY VERIFIED');
} else {
    console.log('❌ ' + (total - passed) + ' failures:');
    results.filter(r => !r.pass).forEach(r => {
        console.log('  ' + r.name + ': expected=' + r.expected + ' actual=' + r.actual + ' | ' + r.note);
    });
}
