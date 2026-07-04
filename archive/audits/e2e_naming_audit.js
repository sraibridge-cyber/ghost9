// GHOST v9.1.0 — E2E NAMING AUDIT
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-26_20:30_Tulsa_OK

const fs = require('fs');

let passed = 0, failed = 0;
const failures = [];
function check(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

console.log('=== GHOST v9.1.0 E2E NAMING AUDIT ===');
console.log('CWD: ' + process.cwd());

// coherence_calculus.js
console.log('\n--- coherence_calculus.js ---');
const cc = require('./src/coherence_calculus');
check('CC evaluate', typeof cc.evaluate === 'function', typeof cc.evaluate, 'function');
check('CC whitlock', typeof cc.whitlock === 'function', typeof cc.whitlock, 'function');
check('CC N_DOMAINS=8', cc.N_DOMAINS === 8, cc.N_DOMAINS, 8);
check('CC TAU', typeof cc.TAU === 'number', typeof cc.TAU, 'number');
check('CC CC_VERSION', cc.CC_VERSION.startsWith('v3'), cc.CC_VERSION, 'v3.x');
const ccr = cc.evaluate('test');
check('CC D1', typeof ccr.scores.D1 === 'number', typeof ccr.scores.D1, 'number');
check('CC D2', typeof ccr.scores.D2 === 'number', typeof ccr.scores.D2, 'number');
check('CC D3', typeof ccr.scores.D3 === 'number', typeof ccr.scores.D3, 'number');
check('CC D4', typeof ccr.scores.D4 === 'number', typeof ccr.scores.D4, 'number');
check('CC D5', typeof ccr.scores.D5 === 'number', typeof ccr.scores.D5, 'number');
check('CC D6', typeof ccr.scores.D6 === 'number', typeof ccr.scores.D6, 'number');
check('CC D7', typeof ccr.scores.D7 === 'number', typeof ccr.scores.D7, 'number');
check('CC D8', typeof ccr.scores.D8 === 'number', typeof ccr.scores.D8, 'number');
check('CC mu', typeof ccr.mu === 'number', typeof ccr.mu, 'number');
check('CC pass', typeof ccr.pass === 'boolean', typeof ccr.pass, 'boolean');
const w = cc.whitlock(5);
check('CC W n', typeof w.n === 'number', typeof w.n, 'number');
check('CC W re', typeof w.re === 'number', typeof w.re, 'number');
check('CC W im', typeof w.im === 'number', typeof w.im, 'number');
check('CC W mag', typeof w.magnitude === 'number', typeof w.magnitude, 'number');
check('CC W phase', typeof w.phase_deg === 'number', typeof w.phase_deg, 'number');

// tesseract.js
console.log('\n--- tesseract.js ---');
const tess = require('./src/tesseract');
check('TESS array', Array.isArray(tess.TESSERACT_VERTICES), true, true);
check('TESS 16', tess.TESSERACT_VERTICES.length === 16, tess.TESSERACT_VERTICES.length, 16);
check('TESS PPPP', tess.TESSERACT_VERTICES[0] === 'PPPP', tess.TESSERACT_VERTICES[0], 'PPPP');
check('TESS NNNN', tess.TESSERACT_VERTICES[15] === 'NNNN', tess.TESSERACT_VERTICES[15], 'NNNN');
check('TESS P/N', tess.TESSERACT_VERTICES.every(v => /^[PN]{4}$/.test(v)), true, true);
check('TESS AXIS_PAIRS', tess.AXIS_PAIRS.length === 4, tess.AXIS_PAIRS.length, 4);
check('TESS verify16', typeof tess.verify16Vertices === 'function', typeof tess.verify16Vertices, 'function');
check('TESS isValid', typeof tess.isValidVertex === 'function', typeof tess.isValidVertex, 'function');
check('TESS assign', typeof tess.assignVertex === 'function', typeof tess.assignVertex, 'function');
check('TESS v2i', typeof tess.vertexToIndex === 'function', typeof tess.vertexToIndex, 'function');

// five_laws.js
console.log('\n--- five_laws.js ---');
const fl = require('./src/five_laws');
check('FL ChaosLaw', typeof fl.ChaosLaw === 'function', typeof fl.ChaosLaw, 'function');
check('FL RandomnessLaw', typeof fl.RandomnessLaw === 'function', typeof fl.RandomnessLaw, 'function');
check('FL ObservationLaw', typeof fl.ObservationLaw === 'function', typeof fl.ObservationLaw, 'function');
check('FL CausalityLaw', typeof fl.CausalityLaw === 'function', typeof fl.CausalityLaw, 'function');
check('FL ChainLaw', typeof fl.ChainLaw === 'function', typeof fl.ChainLaw, 'function');
check('FL FiveLawsEngine', typeof fl.FiveLawsEngine === 'function', typeof fl.FiveLawsEngine, 'function');
check('FL FIVE_TAU', fl.FIVE_TAU === 0.9995, fl.FIVE_TAU, 0.9995);
check('FL inject', typeof new fl.ChaosLaw(1).inject === 'function', true, true);
check('FL observe', typeof new fl.ObservationLaw().observe === 'function', true, true);
check('FL cause', typeof new fl.CausalityLaw().cause === 'function', true, true);
check('FL verify', typeof new fl.CausalityLaw().verify === 'function', true, true);

// ghost_rip.js
console.log('\n--- ghost_rip.js ---');
const rip = require('./src/ghost_rip');
check('RIP 17Laws', typeof rip.SeventeenLawsVerifier === 'function', typeof rip.SeventeenLawsVerifier, 'function');
check('RIP Bonsai', typeof rip.BonsaiFidelity === 'function', typeof rip.BonsaiFidelity, 'function');
check('RIP Pipeline', typeof rip.RIPPipeline === 'function', typeof rip.RIPPipeline, 'function');
check('RIP LAWS', typeof rip.SEVENTEEN_LAWS === 'object', typeof rip.SEVENTEEN_LAWS, 'object');
check('RIP 16 inv', rip.SEVENTEEN_LAWS.INVARIANTS.length === 16, rip.SEVENTEEN_LAWS.INVARIANTS.length, 16);
check('RIP FLAGS', typeof rip.FLAGS === 'object', typeof rip.FLAGS, 'object');
const v = new rip.SeventeenLawsVerifier();
const inv = { signal:0.9997, energy:0.9997, temporal:0.9997, spatial:0.9997, cognitive:0.9997, ethical:0.9997, declarative:0.9997, novelty:0.9997 };
const vr = v.verifyAll(0.9997, inv);
check('RIP allPass', vr.allPassed === true, vr.allPassed, true);
check('RIP seal128', vr.seal.length === 128, vr.seal.length, 128);
const bf = new rip.BonsaiFidelity();
check('RIP addWP', typeof bf.addWithProvenance === 'function', typeof bf.addWithProvenance, 'function');
check('RIP recall', typeof bf.recall === 'function', typeof bf.recall, 'function');
const p = new rip.RIPPipeline(42);
check('RIP run', typeof p.run === 'function', typeof p.run, 'function');
const fr = p.run('e2e test');
check('RIP input', fr.input === 'e2e test', fr.input, 'e2e test');
check('RIP out seal', fr.output.seal.length === 128, fr.output.seal.length, 128);
check('RIP out cause', fr.output.cause.length === 128, fr.output.cause.length, 128);
check('RIP out link', fr.output.link.length === 128, fr.output.link.length, 128);

// merkle_bonsai.js
console.log('\n--- merkle_bonsai.js ---');
const mb = require('./src/merkle_bonsai');
check('MB BonsaiNode', typeof mb.BonsaiNode === 'function', typeof mb.BonsaiNode, 'function');
check('MB MerkleBonsai', typeof mb.MerkleBonsai === 'function', typeof mb.MerkleBonsai, 'function');
const b = new mb.MerkleBonsai();
check('MB addLeaf', typeof b.addLeaf === 'function', typeof b.addLeaf, 'function');
check('MB verify', typeof b.verify === 'function', typeof b.verify, 'function');
b.addLeaf('test', {source:'e2e'}); b.buildTree();
check('MB root', typeof b.buildTree === 'function', typeof b.buildTree, 'function');
check('MB verifyOK', b.verify().valid === true, b.verify(), true);

// Cross-module
console.log('\n--- Cross-Module ---');
const rip2 = new rip.RIPPipeline(77);
const r2 = rip2.run('xmod', {intensity:0.3});
check('XMOD cc scores', Object.keys(r2.stages.processed.cc.scores).length === 8, Object.keys(r2.stages.processed.cc.scores).length, 8);
check('XMOD bonsai', typeof r2.stages.trained.bonsaiStats === 'object', typeof r2.stages.trained.bonsaiStats, 'object');
check('XMOD verify', typeof r2.stages.verified.verification === 'object', typeof r2.stages.verified.verification, 'object');

// Source files
console.log('\n--- Source Files ---');
const src = fs.readdirSync('./src').filter(f => f.endsWith('.js'));
check('SRC cc.js', src.includes('coherence_calculus.js'), true, true);
check('SRC tess.js', src.includes('tesseract.js'), true, true);
check('SRC fl.js', src.includes('five_laws.js'), true, true);
check('SRC rip.js', src.includes('ghost_rip.js'), true, true);
check('SRC mb.js', src.includes('merkle_bonsai.js'), true, true);
const ccs = fs.readFileSync('./src/coherence_calculus.js','utf8');
check('SRC eval fn', ccs.includes('function evaluate'), true, true);
check('SRC whit fn', ccs.includes('function whitlock'), true, true);
const fls = fs.readFileSync('./src/five_laws.js','utf8');
check('SRC ChaosLaw', fls.includes('class ChaosLaw'), true, true);
check('SRC FiveLawsEngine', fls.includes('class FiveLawsEngine'), true, true);
const grs = fs.readFileSync('./src/ghost_rip.js','utf8');
check('SRC 17LawsV', grs.includes('class SeventeenLawsVerifier'), true, true);
check('SRC RIPPipeline', grs.includes('class RIPPipeline'), true, true);
const mbs = fs.readFileSync('./src/merkle_bonsai.js','utf8');
check('SRC BonsaiNode', mbs.includes('class BonsaiNode'), true, true);
check('SRC MerkleBonsai', mbs.includes('class MerkleBonsai'), true, true);
const tes = fs.readFileSync('./src/tesseract.js','utf8');
check('SRC TESS_V', tes.includes('TESSERACT_VERTICES'), true, true);
check('SRC AXIS_P', tes.includes('AXIS_PAIRS'), true, true);

// Results
console.log('\n\n=== RESULTS ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Total: ' + (passed + failed));
if (failed === 0) {
  console.log('\n✅ ALL E2E NAMING CHECKS PASSED');
  console.log('Seal: 2026-06-26_20:30_Tulsa_OK');
} else {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
  process.exit(1);
}
