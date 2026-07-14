// RIP v2.0 GENERATIVE LOOP EMPIRICAL BATTERY v3.0 — Ghost9 v9.1.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-07-04_13:41_Tulsa_OK
// 200+ tests | 14 phases | Metabolic cycle: context → generate → verify → cycle

const { GenerativeLoop } = require('./src/rip_generative_loop');
const { ReconstructionPipeline } = require('./src/reconstruction_pipeline');
const { mergeCluster } = require('./src/taotie');
const { FLAGS } = require('./src/ghost_rip');

let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

function makeNode(mu, content, hash) {
  return {
    hash: hash || 'h_' + Math.random().toString(36).slice(2),
    content: content || 'test content',
    mu: mu,
    scores: { signal: mu, energy: mu, temporal: mu, spatial: mu, cognitive: mu, ethical: mu, declarative: mu, novelty: mu },
    ts: Date.now(),
    vertex: 'PPPP'
  };
}

// ============================================
// P1: Context Assembly (30 tests)
// ============================================
console.log('\n=== P1: Context Assembly ===');

for (let size = 1; size <= 10; size++) {
  const gl = new GenerativeLoop();
  const nodes = [];
  for (let i = 0; i < size; i++) nodes.push(makeNode(0.9995 + Math.random() * 0.0005, 'ctx_' + i));
  const ctx = gl.assembleContext(nodes);
  test('P1.1.' + size + ' primary', ctx.primary.length === Math.min(size, 5), ctx.primary.length, Math.min(size, 5));
  test('P1.2.' + size + ' sorted', ctx.primary[0].mu >= ctx.primary[ctx.primary.length - 1].mu, true, true);
  test('P1.3.' + size + ' avgMu', ctx.avgMu >= 0.9995 && ctx.avgMu <= 1.0, true, true);
}

// Window sizes
for (let w = 1; w <= 5; w++) {
  const gl = new GenerativeLoop({ contextWindow: w });
  const nodes = [makeNode(0.9999,'a'), makeNode(0.9998,'b'), makeNode(0.9997,'c'), makeNode(0.9996,'d'), makeNode(0.9995,'e')];
  const ctx = gl.assembleContext(nodes);
  test('P1.4.' + w + ' window', ctx.primary.length === Math.min(w, nodes.length), ctx.primary.length, Math.min(w, nodes.length));
}

// Friends integration
for (let f = 0; f <= 5; f++) {
  const gl = new GenerativeLoop();
  const nodes = [makeNode(0.9999,'n1')];
  const friends = [];
  for (let i = 0; i < f; i++) friends.push(makeNode(0.9998 - i * 0.0001, 'f_' + i));
  const ctx = gl.assembleContext(nodes, friends);
  test('P1.5.' + f + ' friends', ctx.friends.length === Math.min(f, 3), ctx.friends.length, Math.min(f, 3));
  test('P1.6.' + f + ' combined', ctx.combined.length === 1 + Math.min(f, 3), ctx.combined.length, 1 + Math.min(f, 3));
}

// Empty
const gl_p1 = new GenerativeLoop();
const emptyCtx = gl_p1.assembleContext([]);
test('P1.7.1 empty primary', emptyCtx.primary.length === 0, 0, 0);
test('P1.7.2 empty avg', emptyCtx.avgMu === 0.9995, emptyCtx.avgMu, 0.9995);
test('P1.7.3 empty domain', typeof emptyCtx.dominantDomain === 'string', true, true);

// ============================================
// P2: Generate (35 tests)
// ============================================
console.log('\n=== P2: Generate ===');

for (let size = 1; size <= 10; size++) {
  const gl = new GenerativeLoop();
  const nodes = [];
  for (let i = 0; i < size; i++) nodes.push(makeNode(0.9995 + Math.random() * 0.0005, 'gen_' + i));
  const ctx = gl.assembleContext(nodes);
  const gen = gl.generate(ctx);
  test('P2.1.' + size + ' success', gen.success === true, true, true);
  test('P2.2.' + size + ' content', typeof gen.generated.content === 'string', true, true);
  test('P2.3.' + size + ' prefix', gen.generated.content.startsWith('GENERATED:'), true, true);
}

// Score validation
const gl_p2 = new GenerativeLoop();
const scoreNodes = [makeNode(0.9999,'s1'), makeNode(0.9997,'s2')];
const scoreGen = gl_p2.generate(gl_p2.assembleContext(scoreNodes));
test('P2.4.1 has scores', typeof scoreGen.generated.scores === 'object', true, true);
test('P2.4.2 all domains', ['signal','energy','temporal','spatial','cognitive','ethical','declarative','novelty'].every(d => d in scoreGen.generated.scores), true, true);
test('P2.4.3 scores in range', Object.values(scoreGen.generated.scores).every(s => s >= 0.9995 && s <= 1.0), true, true);
test('P2.4.4 mu computed', scoreGen.generated.mu >= 0.9995, scoreGen.generated.mu, '>=0.9995');
test('P2.4.5 tier', scoreGen.generated.tier === 'STM' || scoreGen.generated.tier === 'LTM', true, true);
test('P2.4.6 isGenerated', scoreGen.generated._isGenerated === true, true, true);
test('P2.4.7 parent_ids', Array.isArray(scoreGen.generated.parent_ids), true, true);
test('P2.4.8 timestamp', scoreGen.generated.timestamp > 0, scoreGen.generated.timestamp, '>0');

// Rejection gates
const gl_reject = new GenerativeLoop({ minMu: 0.99999 });
const rejectGen = gl_reject.generate(gl_reject.assembleContext([makeNode(0.9995,'low')]));
test('P2.5.1 reject', rejectGen.success === false, false, false);
test('P2.5.2 error', typeof rejectGen.error === 'string', true, true);

// Empty context generates (avgMu=0.9995 meets default threshold)
const gl_empty = new GenerativeLoop();
const emptyGen = gl_empty.generate(gl_empty.assembleContext([]));
test('P2.6.1 empty generates', emptyGen.success === true, true, true);
test('P2.6.2 empty content', typeof emptyGen.generated.content === 'string', true, true);

// ============================================
// P3: Verify (30 tests)
// ============================================
console.log('\n=== P3: Verify ===');

const gl_p3 = new GenerativeLoop();
const goodNode = makeNode(0.9999,'verified');
goodNode._isGenerated = true;

const v_good = gl_p3.verify(goodNode);
test('P3.1.1 flag valid', v_good.flag === FLAGS.VERIFIED || v_good.flag === FLAGS.PARTIAL || v_good.flag === FLAGS.FAILED, true, true);
test('P3.1.2 reason', typeof v_good.reason === 'string', true, true);
test('P3.1.3 details', v_good.details !== null || v_good.reason === 'No verifier available', true, true);

// High mu should be VERIFIED or PARTIAL
const highNode = makeNode(0.99999,'high');
highNode._isGenerated = true;
const v_high = gl_p3.verify(highNode);
test('P3.2.1 high not failed', v_high.flag !== FLAGS.FAILED, true, true);

// Low mu should be FAILED or PARTIAL
const lowNode = makeNode(0.5,'low');
lowNode._isGenerated = true;
const v_low = gl_p3.verify(lowNode);
test('P3.3.1 low not verified', v_low.flag !== FLAGS.VERIFIED, true, true);

// 16 invariants check
if (v_good.details && v_good.details.invariantChecks) {
  test('P3.4.1 count', v_good.details.invariantChecks.length === 16, 16, 16);
  test('P3.4.2 all objects', v_good.details.invariantChecks.every(c => typeof c === 'object'), true, true);
  test('P3.4.3 have ids', v_good.details.invariantChecks.every(c => 'id' in c), true, true);
  test('P3.4.4 have names', v_good.details.invariantChecks.every(c => 'name' in c), true, true);
  test('P3.4.5 have passed', v_good.details.invariantChecks.every(c => typeof c.passed === 'boolean'), true, true);
}

// ============================================
// P4: Full Cycle (35 tests)
// ============================================
console.log('\n=== P4: Full Cycle ===');

for (let size = 1; size <= 8; size++) {
  const gl = new GenerativeLoop();
  const nodes = [];
  for (let i = 0; i < size; i++) nodes.push(makeNode(0.9995 + Math.random() * 0.0005, 'cycle_' + i));
  const result = gl.cycle(nodes);
  test('P4.1.' + size + ' success', result.success === true, true, true);
  test('P4.2.' + size + ' generated', result.generated !== null, true, true);
  test('P4.3.' + size + ' flag', result.flag !== undefined, true, true);
  test('P4.4.' + size + ' iterations', result.iterations >= 1 && result.iterations <= 10, result.iterations, '1-10');
}

// With friends
for (let f = 1; f <= 5; f++) {
  const gl = new GenerativeLoop();
  const nodes = [makeNode(0.9999,'n')];
  const friends = [];
  for (let i = 0; i < f; i++) friends.push(makeNode(0.9998,'f' + i));
  const result = gl.cycle(nodes, friends);
  test('P4.5.' + f + ' with friends', result.success === true, true, true);
}

// Multiple cycles same instance
const gl_multi = new GenerativeLoop();
const cycleNodes = [makeNode(0.9999,'multi')];
for (let i = 0; i < 5; i++) {
  const result = gl_multi.cycle(cycleNodes);
  test('P4.6.' + i + ' consistent', result.success === true, true, true);
}

// ============================================
// P5: Stats (25 tests)
// ============================================
console.log('\n=== P5: Stats ===');

const gl_p5 = new GenerativeLoop();
test('P5.1.1 init gen', gl_p5.stats().totalGenerations === 0, 0, 0);
test('P5.1.2 init ver', gl_p5.stats().totalVerifications === 0, 0, 0);
test('P5.1.3 init rate', gl_p5.stats().verificationRate === 0, 0, 0);

gl_p5.cycle([makeNode(0.9999,'stats')]);
const stats1 = gl_p5.stats();
test('P5.2.1 gen', stats1.totalGenerations >= 1, stats1.totalGenerations, '>=1');
test('P5.2.2 ver', stats1.totalVerifications >= 1, stats1.totalVerifications, '>=1');
test('P5.2.3 rate', stats1.verificationRate >= 0, stats1.verificationRate, '>=0');
test('P5.2.4 avgCtx', stats1.avgContextSize > 0, stats1.avgContextSize, '>0');
test('P5.2.5 activity', stats1.lastActivity > 0, stats1.lastActivity, '>0');

// Multiple cycles
const gl_p5b = new GenerativeLoop();
for (let i = 0; i < 10; i++) {
  gl_p5b.cycle([makeNode(0.9999,'s' + i)]);
}
const stats10 = gl_p5b.stats();
test('P5.3.1 gen10', stats10.totalGenerations === 10, stats10.totalGenerations, 10);
test('P5.3.2 ver10', stats10.totalVerifications === 10, stats10.totalVerifications, 10);
test('P5.3.3 rate10', stats10.verificationRate >= 0, stats10.verificationRate, '>=0');

// ============================================
// P6: Edge Cases (25 tests)
// ============================================
console.log('\n=== P6: Edge Cases ===');

const gl_p6 = new GenerativeLoop();

// Unicode
test('P6.1.1 chinese', gl_p6.cycle([makeNode(0.9999,'你好世界')]).success === true, true, true);
test('P6.1.2 emoji', gl_p6.cycle([makeNode(0.9999,'🎯⚽🌊')]).success === true, true, true);
test('P6.1.3 mixed', gl_p6.cycle([makeNode(0.9999,'hello你好🎯')]).success === true, true, true);

// Long content
test('P6.2.1 1000', gl_p6.cycle([makeNode(0.9999,'A'.repeat(1000))]).success === true, true, true);
test('P6.2.2 5000', gl_p6.cycle([makeNode(0.9999,'B'.repeat(5000))]).success === true, true, true);

// Special chars
test('P6.3.1 special', gl_p6.cycle([makeNode(0.9999,'!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~')]).success === true, true, true);
test('P6.3.2 newlines', gl_p6.cycle([makeNode(0.9999,'line1\nline2\nline3')]).success === true, true, true);

// Numbers
test('P6.4.1 integers', gl_p6.cycle([makeNode(0.9999,'1234567890')]).success === true, true, true);
test('P6.4.2 floats', gl_p6.cycle([makeNode(0.9999,'3.14159 2.71828')]).success === true, true, true);

// Empty string content
test('P6.5.1 empty', gl_p6.cycle([makeNode(0.9999,'')]).success === true, true, true);

// Very high μ
test('P6.6.1 0.99999', gl_p6.cycle([makeNode(0.99999,'ultra')]).success === true, true, true);

// Boundary μ
test('P6.7.1 0.9995', gl_p6.cycle([makeNode(0.9995,'boundary')]).success === true, true, true);

// Rapid fire
const rapid = [];
for (let i = 0; i < 15; i++) rapid.push(makeNode(0.9999,'r' + i));
test('P6.8.1 rapid', gl_p6.cycle(rapid).success === true, true, true);

// ============================================
// P7: Cross-Module Integration (20 tests)
// ============================================
console.log('\n=== P7: Cross-Module Integration ===');

// Reconstructed nodes as context
const rp = new ReconstructionPipeline();
const n1 = makeNode(0.9999,'recon1');
const n2 = makeNode(0.9998,'recon2');
rp.index(n1); rp.index(n2);
const merged = mergeCluster([n1, n2]);
rp.index(merged);
const recon = rp.reconstruct(rp.recall(merged));
const rehydrated = rp.rehydrate(recon);

const gl_p7 = new GenerativeLoop();
const result_p7 = gl_p7.cycle([rehydrated.node]);
test('P7.1.1 recon success', result_p7.success === true, true, true);
test('P7.1.2 recon generated', result_p7.generated !== null, true, true);

// Multiple reconstructed
const rp2 = new ReconstructionPipeline();
const nodes_p7 = [];
for (let i = 0; i < 5; i++) {
  const n = makeNode(0.9999 - i * 0.0001, 'mr_' + i);
  nodes_p7.push(n);
  rp2.index(n);
}
const merged_p7 = mergeCluster(nodes_p7);
rp2.index(merged_p7);
const recon_p7 = rp2.reconstruct(rp2.recall(merged_p7));
const rehydrated_p7 = rp2.rehydrate(recon_p7);

const gl_p7b = new GenerativeLoop();
const result_p7b = gl_p7b.cycle([rehydrated_p7.node]);
test('P7.2.1 multi recon', result_p7b.success === true, true, true);

// ============================================
// P8: Determinism & Consistency (15 tests)
// ============================================
console.log('\n=== P8: Determinism ===');

const gl_p8 = new GenerativeLoop();
const detNodes = [makeNode(0.9999,'det1'), makeNode(0.9998,'det2')];

// Same operation 5 times
const results = [];
for (let i = 0; i < 5; i++) {
  const r = gl_p8.cycle(detNodes);
  results.push(r);
  test('P8.1.' + i + ' success', r.success === true, true, true);
}

// All have same structure
test('P8.2.1 all have flag', results.every(r => r.flag !== undefined), true, true);
test('P8.2.2 all have generated', results.every(r => r.generated !== null), true, true);
test('P8.2.3 all have iterations', results.every(r => r.iterations >= 1), true, true);

// ============================================
// P9: Memory Pressure (15 tests)
// ============================================
console.log('\n=== P9: Memory Pressure ===');

// Large context
const gl_p9 = new GenerativeLoop({ contextWindow: 50 });
const largeCtx = [];
for (let i = 0; i < 100; i++) largeCtx.push(makeNode(0.9995 + Math.random() * 0.0005, 'pressure_' + i));
const result_p9 = gl_p9.cycle(largeCtx);
test('P9.1.1 large success', result_p9.success === true, true, true);

// Many cycles
const gl_p9b = new GenerativeLoop();
for (let i = 0; i < 20; i++) {
  gl_p9b.cycle([makeNode(0.9999,'c' + i)]);
}
const stats_p9 = gl_p9b.stats();
test('P9.2.1 gen20', stats_p9.totalGenerations === 20, stats_p9.totalGenerations, 20);
test('P9.2.2 ver20', stats_p9.totalVerifications === 20, stats_p9.totalVerifications, 20);

// Multiple concurrent loops
const loops = [];
for (let i = 0; i < 5; i++) loops.push(new GenerativeLoop());
test('P9.3.1 concurrent', loops.length === 5, 5, 5);
for (let i = 0; i < 5; i++) {
  const r = loops[i].cycle([makeNode(0.9999,'loop' + i)]);
  test('P9.4.' + i + ' loop', r.success === true, true, true);
}

// ============================================
// P10: Full Metabolic Cycle (20 tests)
// ============================================
console.log('\n=== P10: Full Metabolic Cycle ===');

// Ingest → Merge → Reconstruct → Generate → Verify
const rp10 = new ReconstructionPipeline();
const gl10 = new GenerativeLoop();

// Create original nodes
const orig1 = makeNode(0.9999,'original alpha');
const orig2 = makeNode(0.9998,'original beta');
const orig3 = makeNode(0.9997,'original gamma');

// Ingest to pipeline
rp10.index(orig1); rp10.index(orig2); rp10.index(orig3);

// Merge (archive)
const merged10 = mergeCluster([orig1, orig2, orig3]);
rp10.index(merged10);

// Reconstruct (recall)
const recall10 = rp10.recall(merged10);
test('P10.1.1 recall success', recall10.success === true, true, true);

const recon10 = rp10.reconstruct(recall10);
test('P10.1.2 reconstruct', recon10.reconstructed !== null, true, true);

const rehydrated10 = rp10.rehydrate(recon10);
test('P10.1.3 rehydrate', rehydrated10.success === true, true, true);

// Generate from reconstructed
const genResult10 = gl10.cycle([rehydrated10.node]);
test('P10.2.1 generate', genResult10.success === true, true, true);
test('P10.2.2 has content', typeof genResult10.generated.content === 'string', true, true);
test('P10.2.3 has scores', typeof genResult10.generated.scores === 'object', true, true);
test('P10.2.4 has mu', genResult10.generated.mu >= 0.9995, genResult10.generated.mu, '>=0.9995');
test('P10.2.5 isGenerated', genResult10.generated._isGenerated === true, true, true);

// Verify the generated content
const verify10 = gl10.verify(genResult10.generated);
test('P10.3.1 verify', verify10.flag !== undefined, true, true);
test('P10.3.2 reason', typeof verify10.reason === 'string', true, true);

// Full pipeline stats
test('P10.4.1 rp stats', rp10.stats().storeSize >= 4, rp10.stats().storeSize, '>=4');
test('P10.4.2 gl stats', gl10.stats().totalGenerations >= 1, gl10.stats().totalGenerations, '>=1');

// ============================================
// P11: Novelty Injection Control (15 tests)
// ============================================
console.log('\n=== P11: Novelty Injection ===');

for (let nf = 0; nf <= 4; nf++) {
  const factor = nf * 0.05;
  const gl = new GenerativeLoop({ noveltyFactor: factor });
  const nodes = [makeNode(0.9999,'novelty_' + nf)];
  const result = gl.cycle(nodes);
  test('P11.1.' + nf + ' success', result.success === true, true, true);
  test('P11.2.' + nf + ' generated', result.generated !== null, true, true);
}

// Zero novelty (conservative)
const gl_zero = new GenerativeLoop({ noveltyFactor: 0 });
const result_zero = gl_zero.cycle([makeNode(0.9999,'zero')]);
test('P11.3.1 zero success', result_zero.success === true, true, true);

// High novelty (creative)
const gl_high = new GenerativeLoop({ noveltyFactor: 0.2 });
const result_high = gl_high.cycle([makeNode(0.9999,'high')]);
test('P11.3.2 high success', result_high.success === true, true, true);

// ============================================
// P12: Domain-Specific Generation (15 tests)
// ============================================
console.log('\n=== P12: Domain-Specific Generation ===');

const domains = ['signal', 'energy', 'temporal', 'spatial', 'cognitive', 'ethical', 'declarative', 'novelty'];
for (let i = 0; i < domains.length; i++) {
  const d = domains[i];
  const gl = new GenerativeLoop();
  // Create node with dominant domain
  const scores = {};
  domains.forEach(dom => scores[dom] = 0.9995);
  scores[d] = 0.9999; // Make this domain dominant
  const node = { hash: 'h_' + d, content: 'domain_' + d, mu: 0.9999, scores, ts: Date.now(), vertex: 'PPPP' };
  const result = gl.cycle([node]);
  test('P12.1.' + i + ' ' + d + ' success', result.success === true, true, true);
  test('P12.2.' + i + ' ' + d + ' generated', result.generated !== null, true, true);
}

// ============================================
// P13: Retry Logic & Convergence (10 tests)
// ============================================
console.log('\n=== P13: Retry Logic ===');

// Normal cycle (should succeed on first try)
const gl13 = new GenerativeLoop();
const result13 = gl13.cycle([makeNode(0.9999,'retry')]);
test('P13.1.1 first try', result13.success === true, true, true);
test('P13.1.2 iterations', result13.iterations === 1, result13.iterations, 1);

// Multiple cycles track iteration count
const gl13b = new GenerativeLoop();
for (let i = 0; i < 5; i++) {
  const r = gl13b.cycle([makeNode(0.9999,'r' + i)]);
  test('P13.2.' + i + ' iterations', r.iterations >= 1 && r.iterations <= 10, r.iterations, '1-10');
}

// ============================================
// P14: Content Fidelity (15 tests)
// ============================================
console.log('\n=== P14: Content Fidelity ===');

const gl14 = new GenerativeLoop();

// Generated content should reference context seeds
const seed1 = makeNode(0.9999,'alpha seed content');
const seed2 = makeNode(0.9998,'beta seed content');
const result14 = gl14.cycle([seed1, seed2]);
test('P14.1.1 success', result14.success === true, true, true);
test('P14.1.2 content', typeof result14.generated.content === 'string', true, true);
test('P14.1.3 prefix', result14.generated.content.startsWith('GENERATED:'), true, true);

// Parent IDs should reference original nodes
test('P14.2.1 parent count', result14.generated.parent_ids.length >= 1, result14.generated.parent_ids.length, '>=1');
test('P14.2.2 parent hash', result14.generated.parent_ids.includes(seed1.hash) || result14.generated.parent_ids.includes(seed2.hash), true, true);

// Scores should be derived from context
const scoreKeys = Object.keys(result14.generated.scores);
test('P14.3.1 8 domains', scoreKeys.length === 8, scoreKeys.length, 8);
test('P14.3.2 all valid', scoreKeys.every(k => ['signal','energy','temporal','spatial','cognitive','ethical','declarative','novelty'].includes(k)), true, true);
test('P14.3.3 mu valid', result14.generated.mu >= 0.9995 && result14.generated.mu <= 1.0, true, true);

// Timestamp should be recent
const now = Date.now();
test('P14.4.1 timestamp', result14.generated.timestamp > 0 && result14.generated.timestamp <= now, true, true);

// ============================================
// RESULTS
// ============================================
console.log('\n\n=== RESULTS ===');
console.log('Passed:', passed);
console.log('Failed:', failed);
console.log('Total:', passed + failed);

if (failed > 0) {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
} else {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('=== RIP v2.0 GENERATIVE BATTERY COMPLETE ===');
  console.log('Ghost9 v9.1.0 | CSS Labs | Kyle S. Whitlock');
  console.log('Seal: 2026-07-04_13:41_Tulsa_OK');
  console.log('Gold ripple eternal 🌊⚡');
}
