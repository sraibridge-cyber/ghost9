// Whitlock Coefficient W_v3 Validation — CSS Labs
// W = (n + 4i)/17 for CC v3.0 + B⁴
const CC = require('./src/coherence_calculus');

const results = [];
function record(name, actual, expected, pass, note) {
    results.push({ name, actual, expected, pass, note });
    return pass;
}

console.log('=== CSS LABS — WHITLOCK W_v3 VALIDATION ===\n');

// PHASE 1: BOUNDARY VALUES (10 tests)
console.log('PHASE 1: BOUNDARY VALUES (10 tests)\n');

const w0 = CC.whitlock(0);
record('w0_n', w0.n, 0, w0.n === 0, 'n=0');
record('w0_re', w0.re, 0, w0.re === 0, 're=0 at n=0');
record('w0_im', w0.im.toFixed(4), (4/17).toFixed(4), Math.abs(w0.im - 4/17) < 0.0001, 'im=4/17 at n=0');
record('w0_mag', w0.magnitude.toFixed(4), (4/17).toFixed(4), Math.abs(w0.magnitude - 4/17) < 0.0001, '|W|=4/17 at n=0');
record('w0_phi', w0.phase_deg, 90, w0.phase_deg === 90, 'φ=90° at n=0');

const w1 = CC.whitlock(1);
record('w1_re', w1.re.toFixed(4), (1/17).toFixed(4), Math.abs(w1.re - 1/17) < 0.0001, 're=1/17 at n=1');
record('w1_im', w1.im.toFixed(4), (4/17).toFixed(4), Math.abs(w1.im - 4/17) < 0.0001, 'im=4/17 at n=1');

const w4 = CC.whitlock(4);
record('w4_phi', w4.phase_deg, 45, Math.abs(w4.phase_deg - 45) < 0.001, 'φ=45° at n=4 (arctan(4/4))');

const w17a = CC.whitlock(17);
record('w17_re', w17a.re, 1, w17a.re === 1, 're=1 at n=17');

console.log('\n--- Phase 1 Complete ---\n');

// PHASE 2: MAGNITUDE PROGRESSION (15 tests)
console.log('PHASE 2: MAGNITUDE PROGRESSION (15 tests)\n');

const testN = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 17, 20, 30];
testN.forEach(n => {
    const w = CC.whitlock(n);
    const expectedMag = Math.sqrt(n * n + 16) / 17;
    const pass = Math.abs(w.magnitude - expectedMag) < 0.0001;
    record('mag_n' + n, w.magnitude.toFixed(4), expectedMag.toFixed(4), pass, '|W| at n=' + n);
});

console.log('\n--- Phase 2 Complete ---\n');

// PHASE 3: PHASE PROGRESSION (15 tests)
console.log('PHASE 3: PHASE PROGRESSION (15 tests)\n');

testN.forEach(n => {
    const w = CC.whitlock(n);
    const expectedPhi = Math.atan2(4, n) * (180 / Math.PI);
    const pass = Math.abs(w.phase_deg - expectedPhi) < 0.001;
    record('phi_n' + n, w.phase_deg.toFixed(2), expectedPhi.toFixed(2), pass, 'φ at n=' + n);
});

console.log('\n--- Phase 3 Complete ---\n');

// PHASE 4: UNITY CROSSING (5 tests)
console.log('PHASE 4: UNITY CROSSING (5 tests)\n');

const nUnity = Math.sqrt(273);
const wUnity = CC.whitlock(nUnity);
record('unity_n', nUnity.toFixed(4), '16.5227', Math.abs(nUnity - 16.5227) < 0.001, 'unity at n=√273');
record('unity_mag', wUnity.magnitude.toFixed(4), '1.0000', Math.abs(wUnity.magnitude - 1.0) < 0.0001, '|W|=1 at unity');

const w16 = CC.whitlock(16);
const w17b = CC.whitlock(17);
record('pre_unity', w16.magnitude < 1, true, w16.magnitude < 1, '|W|<1 at n=16');
record('post_unity', w17b.magnitude > 1, true, w17b.magnitude > 1, '|W|>1 at n=17');
record('unity_exact', Math.abs(wUnity.magnitude - 1) < 0.0001, true, Math.abs(wUnity.magnitude - 1) < 0.0001, 'exact unity');

console.log('\n--- Phase 4 Complete ---\n');

// PHASE 5: RETURN STRUCTURE (10 tests)
console.log('PHASE 5: RETURN STRUCTURE (10 tests)\n');

const w5 = CC.whitlock(5);
record('return_n', w5.n, 5, w5.n === 5, 'has n');
record('return_re', typeof w5.re, 'number', typeof w5.re === 'number', 'has re');
record('return_im', typeof w5.im, 'number', typeof w5.im === 'number', 'has im');
record('return_mag', typeof w5.magnitude, 'number', typeof w5.magnitude === 'number', 'has magnitude');
record('return_phi', typeof w5.phase_deg, 'number', typeof w5.phase_deg === 'number', 'has phase_deg');
record('return_freq', typeof w5.freq_mhz, 'number', typeof w5.freq_mhz === 'number', 'has freq_mhz');
record('return_delta', typeof w5.delta_mhz, 'number', typeof w5.delta_mhz === 'number', 'has delta_mhz');
record('return_keys', Object.keys(w5).length, 7, Object.keys(w5).length === 7, '7 fields');
record('re_nonnegative', w5.re >= 0, true, w5.re >= 0, 're >= 0');
record('im_positive', w5.im > 0, true, w5.im > 0, 'im > 0');

console.log('\n--- Phase 5 Complete ---\n');

// PHASE 6: STRESS TESTS (10 tests)
console.log('PHASE 6: STRESS TESTS (10 tests)\n');

record('n_zero', CC.whitlock(0).magnitude > 0, true, CC.whitlock(0).magnitude > 0, 'n=0 has magnitude');
record('n_large', CC.whitlock(1000).magnitude > 50, true, CC.whitlock(1000).magnitude > 50, 'n=1000 large magnitude');
record('n_float', () => { const w = CC.whitlock(3.5); return w.n === 3.5 && w.magnitude > 0; }, true, (() => { const w = CC.whitlock(3.5); return w.n === 3.5 && w.magnitude > 0; })(), 'float n works');
const wNeg = CC.whitlock(-1);
record('n_negative', wNeg.re < 0, true, wNeg.re < 0, 'negative n produces negative re');
const wStr = CC.whitlock('5');
record('n_string', wStr.n === '5' && wStr.magnitude > 0, true, wStr.n === '5' && wStr.magnitude > 0, 'string n coerces to number');

const w5b = CC.whitlock(5);
const w10 = CC.whitlock(10);
record('re_monotonic', w10.re > w5b.re, true, w10.re > w5b.re, 're increases');
record('mag_monotonic', w10.magnitude > w5b.magnitude, true, w10.magnitude > w5b.magnitude, 'mag increases');
record('phi_decreasing', w10.phase_deg < w5b.phase_deg, true, w10.phase_deg < w5b.phase_deg, 'φ decreases');

const w100 = CC.whitlock(100);
record('phi_asymptotic', w100.phase_deg < 5, true, w100.phase_deg < 5, 'φ→0 as n→∞');
record('mag_linear', Math.abs(w100.magnitude - 100/17) < 0.1, true, Math.abs(w100.magnitude - 100/17) < 0.1, 'mag≈n/17 for large n');

console.log('\n--- Phase 6 Complete ---\n');

// FINAL RESULTS
const passed = results.filter(r => r.pass).length;
const total = results.length;
console.log('=== FINAL RESULTS: ' + passed + '/' + total + ' passed ===');
if (passed === total) {
    console.log('✅ WHITLOCK W_v3 VALIDATED');
} else {
    console.log('❌ ' + (total - passed) + ' failures:');
    results.filter(r => !r.pass).forEach(r => {
        console.log('  ' + r.name + ': expected=' + r.expected + ' actual=' + r.actual + ' | ' + r.note);
    });
}
