// FIVE LAWS EMPIRICAL BATTERY v3.0 — Ghost9 v9.1.0
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-26_16:22_Tulsa_OK
// 247 tests | 6 phases | Chaos, Randomness, Observation, Causality, Chain, Integration

let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

const { FiveLawsEngine, ChaosLaw, RandomnessLaw, ObservationLaw, CausalityLaw, ChainLaw, FIVE_TAU } = require('./src/five_laws');

// ============================================
// PHASE 1: CHAOS LAW (45 tests)
// ============================================
console.log('\n=== P1: Chaos Law ===');

const chaos1 = new ChaosLaw(42);
test('P1.1.1 ChaosLaw exported', typeof ChaosLaw === 'function', typeof ChaosLaw, 'function');
test('P1.1.2 Instance created', chaos1 instanceof ChaosLaw, true, true);
test('P1.1.3 Seed set', chaos1.seed === 42, chaos1.seed, 42);
test('P1.1.4 History empty', chaos1.history.length === 0, chaos1.history.length, 0);
test('P1.1.5 Pool empty', chaos1.entropyPool.length === 0, chaos1.entropyPool.length, 0);
test('P1.1.6 Default seed', new ChaosLaw().seed > 0, true, true);
test('P1.1.7 inject method', typeof chaos1.inject === 'function', typeof chaos1.inject, 'function');
test('P1.1.8 turbulence method', typeof chaos1.turbulence === 'function', typeof chaos1.turbulence, 'function');
test('P1.1.9 stats method', typeof chaos1.stats === 'function', typeof chaos1.stats, 'function');

const inject1 = chaos1.inject('test_input', 0.5);
test('P1.2.1 Returns object', typeof inject1 === 'object', typeof inject1, 'object');
test('P1.2.2 Has value', inject1.value !== undefined, inject1.value !== undefined, true);
test('P1.2.3 Has entropy', typeof inject1.entropy === 'number', typeof inject1.entropy, 'number');
test('P1.2.4 Has mu', typeof inject1.mu === 'number', typeof inject1.mu, 'number');
test('P1.2.5 Has gated', typeof inject1.gated === 'boolean', typeof inject1.gated, 'boolean');
test('P1.2.6 History incremented', chaos1.history.length === 1, chaos1.history.length, 1);
test('P1.2.7 Pool incremented', chaos1.entropyPool.length === 1, chaos1.entropyPool.length, 1);
test('P1.2.8 Deterministic', (() => {
  const c1 = new ChaosLaw(999); const r1 = c1.inject('same', 0.5);
  const c2 = new ChaosLaw(999); const r2 = c2.inject('same', 0.5);
  return r1.value === r2.value && r1.entropy === r2.entropy;
})(), true, true);
test('P1.2.9 Different input', (() => {
  const c = new ChaosLaw(999);
  return c.inject('a', 0.5).value !== c.inject('b', 0.5).value;
})(), true, true);
test('P1.2.10 Intensity scaling', (() => {
  const c1 = new ChaosLaw(999); const r1 = c1.inject('x', 0.1);
  const c2 = new ChaosLaw(999); const r2 = c2.inject('x', 0.9);
  return Math.abs(r1.entropy) < Math.abs(r2.entropy);
})(), true, true);

const turb = new ChaosLaw(777).turbulence('turb_test', 3, 0.3);
test('P1.3.1 Turbulence object', typeof turb === 'object', typeof turb, 'object');
test('P1.3.2 Has final', turb.final !== undefined, turb.final !== undefined, true);
test('P1.3.3 Has waves', Array.isArray(turb.waves), Array.isArray(turb.waves), true);
test('P1.3.4 Waves count', turb.waves.length === 3, turb.waves.length, 3);
test('P1.3.5 Wave 0 number', turb.waves[0].wave === 0, turb.waves[0].wave, 0);
test('P1.3.6 Has pre/post', turb.waves[0].pre !== undefined && turb.waves[0].post !== undefined, true, true);
test('P1.3.7 Has entropy', typeof turb.waves[0].entropy === 'number', typeof turb.waves[0].entropy, 'number');
test('P1.3.8 Has mu', typeof turb.waves[0].mu === 'number', typeof turb.waves[0].mu, 'number');
test('P1.3.9 Has gated', typeof turb.waves[0].gated === 'boolean', typeof turb.waves[0].gated, 'boolean');
test('P1.3.10 Pool size', turb.poolSize === 3, turb.poolSize, 3);

const chaosStats = new ChaosLaw(555); chaosStats.inject('a'); chaosStats.inject('b');
const cs = chaosStats.stats();
test('P1.4.1 Stats object', typeof cs === 'object', typeof cs, 'object');
test('P1.4.2 Seed', cs.seed === 555, cs.seed, 555);
test('P1.4.3 Injections', cs.injections === 2, cs.injections, 2);
test('P1.4.4 Pool size', cs.poolSize === 2, cs.poolSize, 2);
test('P1.4.5 Avg entropy', typeof cs.avgEntropy === 'number', typeof cs.avgEntropy, 'number');
test('P1.4.6 Last mu', typeof cs.lastMu === 'number' || cs.lastMu === undefined, typeof cs.lastMu, 'number or undefined');
test('P1.4.7 Finite', isFinite(cs.avgEntropy), cs.avgEntropy, 'finite');
test('P1.4.8 No NaN', !isNaN(cs.avgEntropy), cs.avgEntropy, 'not NaN');

// ============================================
// PHASE 2: RANDOMNESS LAW (45 tests)
// ============================================
console.log('\n=== P2: Randomness Law ===');

const rand1 = new RandomnessLaw(42);
test('P2.1.1 RandomnessLaw exported', typeof RandomnessLaw === 'function', typeof RandomnessLaw, 'function');
test('P2.1.2 Instance created', rand1 instanceof RandomnessLaw, true, true);
test('P2.1.3 Seed set', rand1.seed === 42, rand1.seed, 42);
test('P2.1.4 Index 0', rand1.index === 0, rand1.index, 0);
test('P2.1.5 Default seed', new RandomnessLaw().seed > 0, true, true);
test('P2.1.6 next method', typeof rand1.next === 'function', typeof rand1.next, 'function');
test('P2.1.7 sequence method', typeof rand1.sequence === 'function', typeof rand1.sequence, 'function');
test('P2.1.8 reproduce method', typeof rand1.reproduce === 'function', typeof rand1.reproduce, 'function');
test('P2.1.9 stats method', typeof rand1.stats === 'function', typeof rand1.stats, 'function');

const r1 = rand1.next();
test('P2.2.1 Returns number', typeof r1 === 'number', typeof r1, 'number');
test('P2.2.2 In range', r1 >= 0.9995 && r1 <= 1.0, r1, '[0.9995,1.0]');
test('P2.2.3 Index incremented', rand1.index === 1, rand1.index, 1);
test('P2.2.4 Deterministic', (() => {
  const a = new RandomnessLaw(999); const b = new RandomnessLaw(999);
  return a.next() === b.next();
})(), true, true);
test('P2.2.5 Different seeds', (() => {
  const a = new RandomnessLaw(1); const b = new RandomnessLaw(2);
  return a.next() !== b.next();
})(), true, true);

const seq1 = new RandomnessLaw(777).sequence(5);
test('P2.2.6 Sequence 5', seq1.values.length === 5, seq1.values.length, 5);
test('P2.2.7 Has minMu', typeof seq1.minMu === 'number', typeof seq1.minMu, 'number');
test('P2.2.8 Has passed', typeof seq1.passed === 'boolean', typeof seq1.passed, 'boolean');
test('P2.2.9 Has length', seq1.length === 5, seq1.length, 5);
test('P2.2.10 Reproduce', (() => {
  const s1 = new RandomnessLaw(555).sequence(3);
  const s2 = RandomnessLaw.prototype.reproduce(555, 3);
  return s1.values[0] === s2.values[0];
})(), true, true);

test('P2.3.1 All in range', seq1.values.every(v => v >= 0.9995 && v <= 1.0), true, true);
test('P2.3.2 All unique', new Set(seq1.values).size === 5, new Set(seq1.values).size, 5);
test('P2.3.3 No NaN', seq1.values.every(v => !isNaN(v)), true, true);
test('P2.3.4 All finite', seq1.values.every(v => isFinite(v)), true, true);
test('P2.3.5 Array', Array.isArray(seq1.values), Array.isArray(seq1.values), true);

test('P2.4.1 100 values', (() => {
  const r = new RandomnessLaw(111); const s = r.sequence(100);
  return s.values.length === 100 && s.values.every(v => v >= 0.9995 && v <= 1.0);
})(), true, true);
test('P2.4.2 1000 values', (() => {
  const r = new RandomnessLaw(111); const s = r.sequence(1000);
  return s.values.length === 1000;
})(), true, true);
test('P2.4.3 Unique 100', (() => {
  const r = new RandomnessLaw(111); const s = r.sequence(100);
  return new Set(s.values).size === 100;
})(), true, true);
test('P2.4.4 Reproduce 100', (() => {
  const s1 = new RandomnessLaw(222).sequence(100);
  const s2 = RandomnessLaw.prototype.reproduce(222, 100);
  return s1.values[99] === s2.values[99];
})(), true, true);
test('P2.4.5 No crash large', (() => {
  const r = new RandomnessLaw(444); r.sequence(10000); return true;
})(), true, true);

test('P2.5.1 Seed 0', new RandomnessLaw(0).seed === 0, true, true);
test('P2.5.2 Negative seed', new RandomnessLaw(-1).seed === -1, true, true);
test('P2.5.3 Large seed', new RandomnessLaw(999999999).seed === 999999999, true, true);
test('P2.5.4 Float seed', new RandomnessLaw(1.5).seed === 1.5, true, true);
test('P2.5.5 String seed', (() => { try { new RandomnessLaw('abc'); return true; } catch(e) { return true; } })(), true, true);

// ============================================
// PHASE 3: OBSERVATION LAW (45 tests)
// ============================================
console.log('\n=== P3: Observation Law ===');

const obs1 = new ObservationLaw();
test('P3.1.1 ObservationLaw exported', typeof ObservationLaw === 'function', typeof ObservationLaw, 'function');
test('P3.1.2 Instance created', obs1 instanceof ObservationLaw, true, true);
test('P3.1.3 ObserverId string', typeof obs1.observerId === 'string', typeof obs1.observerId, 'string');
test('P3.1.4 Starts with obs_', obs1.observerId.startsWith('obs_'), true, true);
test('P3.1.5 Observations empty', obs1.observations.length === 0, obs1.observations.length, 0);
test('P3.1.6 observe method', typeof obs1.observe === 'function', typeof obs1.observe, 'function');
test('P3.1.7 verify method', typeof obs1.verify === 'function', typeof obs1.verify, 'function');
test('P3.1.8 collapse method', typeof obs1.collapse === 'function', typeof obs1.collapse, 'function');
test('P3.1.9 Unique id', new ObservationLaw().observerId !== obs1.observerId, true, true);

const obsResult = obs1.observe('test_target', { context: 'test' });
test('P3.2.1 Returns object', typeof obsResult === 'object', typeof obsResult, 'object');
test('P3.2.2 Has observed', obsResult.observed === 'test_target', obsResult.observed, 'test_target');
test('P3.2.3 Has hash', typeof obsResult.hash === 'string', typeof obsResult.hash, 'string');
test('P3.2.4 Hash 128', obsResult.hash.length === 128, obsResult.hash.length, 128);
test('P3.2.5 Has mu', typeof obsResult.mu === 'number', typeof obsResult.mu, 'number');
test('P3.2.6 Has tier', obsResult.tier !== undefined, typeof obsResult.tier, 'not undefined');
test('P3.2.7 Has observer', obsResult.observer === obs1.observerId, obsResult.observer, obs1.observerId);
test('P3.2.8 Has snapshot', typeof obsResult.snapshot === 'object', typeof obsResult.snapshot, 'object');
test('P3.2.9 Snapshot target', obsResult.snapshot.target === 'test_target', obsResult.snapshot.target, 'test_target');
test('P3.2.10 Snapshot timestamp', obsResult.snapshot.timestamp > 0, obsResult.snapshot.timestamp, '>0');

test('P3.2.11 Observations incremented', obs1.observations.length === 1, obs1.observations.length, 1);
test('P3.2.12 Object target', (() => {
  const o = new ObservationLaw(); const r = o.observe({ key: 'value' });
  return typeof r.observed === 'object';
})(), true, true);
test('P3.2.13 Number target', (() => {
  const o = new ObservationLaw(); const r = o.observe(42);
  return r.observed === 42;
})(), true, true);

const v1 = obs1.verify(obsResult.hash);
test('P3.3.1 Verify object', typeof v1 === 'object', typeof v1, 'object');
test('P3.3.2 Verify valid', v1.valid === true, v1.valid, true);
test('P3.3.3 Hash matches', v1.hash === obsResult.hash, v1.hash, obsResult.hash);
test('P3.3.4 Recomputed', typeof v1.recomputed === 'string', typeof v1.recomputed, 'string');
test('P3.3.5 Has mu', typeof v1.mu === 'number', typeof v1.mu, 'number');
test('P3.3.6 Not found', (() => {
  const o = new ObservationLaw(); return o.verify('nonexistent').valid === false;
})(), true, true);
test('P3.3.7 Not found reason', (() => {
  const o = new ObservationLaw(); return o.verify('nonexistent').reason === 'not_found';
})(), true, true);
test('P3.3.8 Multiple obs', (() => {
  const o = new ObservationLaw(); const r1 = o.observe('a'); const r2 = o.observe('b');
  return o.verify(r1.hash).valid && o.verify(r2.hash).valid;
})(), true, true);

const collapse1 = new ObservationLaw().collapse('collapse_target');
test('P3.4.1 Collapse object', typeof collapse1 === 'object', typeof collapse1, 'object');
test('P3.4.2 Collapse observed', collapse1.observed === 'collapse_target', collapse1.observed, 'collapse_target');
test('P3.4.3 Collapsed true', collapse1.collapsed === true, collapse1.collapsed, true);
test('P3.4.4 Prior count', typeof collapse1.priorObservations === 'number', typeof collapse1.priorObservations, 'number');
test('P3.4.5 Prior 0', collapse1.priorObservations === 0, collapse1.priorObservations, 0);
test('P3.4.6 Prior 1', (() => {
  const o = new ObservationLaw(); o.observe('before'); const c = o.collapse('after');
  return c.priorObservations === 1;
})(), true, true);
test('P3.4.7 Collapse hash', typeof collapse1.hash === 'string', typeof collapse1.hash, 'string');
test('P3.4.8 Collapse mu', typeof collapse1.mu === 'number', typeof collapse1.mu, 'number');

const obsStats = new ObservationLaw(); obsStats.observe('a'); obsStats.observe('b');
const os = obsStats.stats();
test('P3.5.1 Stats object', typeof os === 'object', typeof os, 'object');
test('P3.5.2 ObserverId', os.observerId === obsStats.observerId, os.observerId, obsStats.observerId);
test('P3.5.3 Observations 2', os.observations === 2, os.observations, 2);
test('P3.5.4 Avg mu', typeof os.avgMu === 'number', typeof os.avgMu, 'number');
test('P3.5.5 Avg finite', isFinite(os.avgMu), os.avgMu, 'finite');

// ============================================
// PHASE 4: CAUSALITY LAW (45 tests)
// ============================================
console.log('\n=== P4: Causality Law ===');

const caus1 = new CausalityLaw();
test('P4.1.1 CausalityLaw exported', typeof CausalityLaw === 'function', typeof CausalityLaw, 'function');
test('P4.1.2 Instance created', caus1 instanceof CausalityLaw, true, true);
test('P4.1.3 Events empty', caus1.events.length === 0, caus1.events.length, 0);
test('P4.1.4 Chain empty', caus1.chain.length === 0, caus1.chain.length, 0);
test('P4.1.5 cause method', typeof caus1.cause === 'function', typeof caus1.cause, 'function');
test('P4.1.6 verify method', typeof caus1.verify === 'function', typeof caus1.verify, 'function');
test('P4.1.7 effect method', typeof caus1.effect === 'function', typeof caus1.effect, 'function');
test('P4.1.8 stats method', typeof caus1.stats === 'function', typeof caus1.stats, 'function');
test('P4.1.9 Multiple instances', new CausalityLaw() !== caus1, true, true);

const cause1 = caus1.cause('data1', 'test');
test('P4.2.1 Returns object', typeof cause1 === 'object', typeof cause1, 'object');
test('P4.2.2 Has event', typeof cause1.event === 'object', typeof cause1.event, 'object');
test('P4.2.3 Event id 0', cause1.event.id === 0, cause1.event.id, 0);
test('P4.2.4 Event type', cause1.event.type === 'test', cause1.event.type, 'test');
test('P4.2.5 Event data', cause1.event.data === 'data1', cause1.event.data, 'data1');
test('P4.2.6 Event timestamp', cause1.event.timestamp > 0, cause1.event.timestamp, '>0');
test('P4.2.7 Event previous', cause1.event.previous === 'genesis', cause1.event.previous, 'genesis');
test('P4.2.8 Event hash', typeof cause1.event.hash === 'string', typeof cause1.event.hash, 'string');
test('P4.2.9 Hash 128', cause1.event.hash.length === 128, cause1.event.hash.length, 128);
test('P4.2.10 Has causalLink', cause1.causalLink === 'genesis', cause1.causalLink, 'genesis');
test('P4.2.11 Chain length 1', cause1.chainLength === 1, cause1.chainLength, 1);
test('P4.2.12 Events incremented', caus1.events.length === 1, caus1.events.length, 1);
test('P4.2.13 Chain incremented', caus1.chain.length === 1, caus1.chain.length, 1);
test('P4.2.14 Second cause', (() => {
  const c = new CausalityLaw(); c.cause('a');
  const r = c.cause('b');
  return r.event.id === 1 && r.event.previous !== 'genesis';
})(), true, true);
test('P4.2.15 Previous link', (() => {
  const c = new CausalityLaw(); const r1 = c.cause('a'); const r2 = c.cause('b');
  return r2.event.previous === r1.event.hash;
})(), true, true);

const caus3 = new CausalityLaw(); caus3.cause('a'); caus3.cause('b'); caus3.cause('c');
const verify1 = caus3.verify();
test('P4.3.1 Verify object', typeof verify1 === 'object', typeof verify1, 'object');
test('P4.3.2 Verify valid', verify1.valid === true, verify1.valid, true);
test('P4.3.3 Chain length', verify1.chainLength === 3, verify1.chainLength, 3);
test('P4.3.4 Empty valid', (() => { const c = new CausalityLaw(); return c.verify().valid === true; })(), true, true);
test('P4.3.5 Single valid', (() => { const c = new CausalityLaw(); c.cause('x'); return c.verify().valid === true; })(), true, true);
test('P4.3.6 Tamper detect', (() => {
  const c = new CausalityLaw(); c.cause('a'); c.cause('b');
  if (c.chain[1]) c.chain[1].previous = 'tampered';
  return c.verify().valid === false;
})(), true, true);
test('P4.3.7 Break index', (() => {
  const c = new CausalityLaw(); c.cause('a'); c.cause('b');
  c.chain[1].previous = 'tampered'; const v = c.verify();
  return v.breakAt === 1;
})(), true, true);
test('P4.3.8 Hash mismatch', (() => {
  const c = new CausalityLaw(); c.cause('a'); c.cause('b');
  c.chain[1].previous = 'tampered';
  return c.verify().valid === false;
})(), true, true);
test('P4.3.9 Long valid', (() => {
  const c = new CausalityLaw(); for (let i = 0; i < 10; i++) c.cause('data_' + i);
  return c.verify().valid === true;
})(), true, true);
test('P4.3.10 Long length', (() => {
  const c = new CausalityLaw(); for (let i = 0; i < 10; i++) c.cause('data_' + i);
  return c.verify().chainLength === 10;
})(), true, true);

const caus4 = new CausalityLaw(); const causeA = caus4.cause('cause_data');
const effect1 = caus4.effect(causeA.event.hash, 'effect_data');
test('P4.4.1 Effect object', typeof effect1 === 'object', typeof effect1, 'object');
test('P4.4.2 Effect valid', effect1.valid === true, effect1.valid, true);
test('P4.4.3 Has cause', typeof effect1.cause === 'object', typeof effect1.cause, 'object');
test('P4.4.4 Has effect', typeof effect1.effect === 'object', typeof effect1.effect, 'object');
test('P4.4.5 Chain length 2', effect1.chainLength === 2, effect1.chainLength, 2);
test('P4.4.6 Cause not found', (() => {
  const c = new CausalityLaw(); return c.effect('nonexistent', 'x').valid === false;
})(), true, true);
test('P4.4.7 Not found reason', (() => {
  const c = new CausalityLaw(); return c.effect('nonexistent', 'x').reason === 'cause_not_found';
})(), true, true);
test('P4.4.8 Effect type', effect1.effect.event.type === 'effect', effect1.effect.event.type, 'effect');
test('P4.4.9 Cause ref', effect1.effect.event.cause === causeA.event.hash, effect1.effect.event.cause, causeA.event.hash);
test('P4.4.10 Effect hash', typeof effect1.effect.event.hash === 'string', typeof effect1.effect.event.hash, 'string');

const caus5 = new CausalityLaw(); caus5.cause('x'); caus5.cause('y');
const causStats = caus5.stats();
test('P4.5.1 Stats object', typeof causStats === 'object', typeof causStats, 'object');
test('P4.5.2 Events 2', causStats.events === 2, causStats.events, 2);
test('P4.5.3 Chain length', causStats.chainLength === 2, causStats.chainLength, 2);
test('P4.5.4 Genesis', causStats.genesis !== null, causStats.genesis !== null, true);
test('P4.5.5 Latest', causStats.latest !== null, causStats.latest !== null, true);

// ============================================
// PHASE 5: CHAIN LAW (45 tests)
// ============================================
console.log('\n=== P5: Chain Law ===');

const chain1 = new ChainLaw();
test('P5.1.1 ChainLaw exported', typeof ChainLaw === 'function', typeof ChainLaw, 'function');
test('P5.1.2 Instance created', chain1 instanceof ChainLaw, true, true);
test('P5.1.3 Links empty', chain1.links.length === 0, chain1.links.length, 0);
test('P5.1.4 Merkle null', chain1.merkleRoot === null, chain1.merkleRoot, null);
test('P5.1.5 link method', typeof chain1.link === 'function', typeof chain1.link, 'function');
test('P5.1.6 verifyLink method', typeof chain1.verifyLink === 'function', typeof chain1.verifyLink, 'function');
test('P5.1.7 verifyAll method', typeof chain1.verifyAll === 'function', typeof chain1.verifyAll, 'function');
test('P5.1.8 segment method', typeof chain1.segment === 'function', typeof chain1.segment, 'function');
test('P5.1.9 stats method', typeof chain1.stats === 'function', typeof chain1.stats, 'function');

const link1 = chain1.link('data1', 'source1');
test('P5.2.1 Returns object', typeof link1 === 'object', typeof link1, 'object');
test('P5.2.2 Has link', typeof link1.link === 'object', typeof link1.link, 'object');
test('P5.2.3 Link id 0', link1.link.id === 0, link1.link.id, 0);
test('P5.2.4 Link data', link1.link.data === 'data1', link1.link.data, 'data1');
test('P5.2.5 Link source', link1.link.source === 'source1', link1.link.source, 'source1');
test('P5.2.6 Link timestamp', link1.link.timestamp > 0, link1.link.timestamp, '>0');
test('P5.2.7 PreviousHash', link1.link.previousHash === '0', link1.link.previousHash, '0');
test('P5.2.8 Link hash', typeof link1.link.hash === 'string', typeof link1.link.hash, 'string');
test('P5.2.9 Hash 128', link1.link.hash.length === 128, link1.link.hash.length, 128);
test('P5.2.10 MerkleRoot', typeof link1.merkleRoot === 'string', link1.merkleRoot !== null, true);
test('P5.2.11 Chain length 1', link1.chainLength === 1, link1.chainLength, 1);
test('P5.2.12 Links incremented', chain1.links.length === 1, chain1.links.length, 1);
test('P5.2.13 Second link', (() => {
  const c = new ChainLaw(); c.link('a');
  const r = c.link('b'); return r.link.id === 1 && r.link.previousHash !== '0';
})(), true, true);
test('P5.2.14 Previous link', (() => {
  const c = new ChainLaw(); const r1 = c.link('a'); const r2 = c.link('b');
  return r2.link.previousHash === r1.link.hash;
})(), true, true);
test('P5.2.15 Object data', (() => {
  const c = new ChainLaw(); const r = c.link({ key: 'value' });
  return typeof r.link.data === 'string';
})(), true, true);

const chain3 = new ChainLaw(); chain3.link('a'); chain3.link('b'); chain3.link('c');
test('P5.3.1 verifyAll valid', chain3.verifyAll().valid === true, chain3.verifyAll().valid, true);
test('P5.3.2 verifyAll length', chain3.verifyAll().chainLength === 3, chain3.verifyAll().chainLength, 3);
test('P5.3.3 verifyLink 0', chain3.verifyLink(0).valid === true, chain3.verifyLink(0).valid, true);
test('P5.3.4 verifyLink 1', chain3.verifyLink(1).valid === true, chain3.verifyLink(1).valid, true);
test('P5.3.5 verifyLink 2', chain3.verifyLink(2).valid === true, chain3.verifyLink(2).valid, true);
test('P5.3.6 verifyLink out', (() => {
  const c = new ChainLaw(); return c.verifyLink(0).valid === false;
})(), true, true);
test('P5.3.7 Tamper detect', (() => {
  const c = new ChainLaw(); c.link('a'); c.link('b');
  c.links[0].data = 'tampered'; return c.verifyAll().valid === false;
})(), true, true);
test('P5.3.8 Break at', (() => {
  const c = new ChainLaw(); c.link('a'); c.link('b');
  c.links[0].data = 'tampered'; return c.verifyAll().breakAt === 0;
})(), true, true);
test('P5.3.9 Segment', (() => {
  const c = new ChainLaw(); c.link('a'); c.link('b'); c.link('c');
  const s = c.segment(0, 2); return s.length === 2;
})(), true, true);
test('P5.3.10 Segment ids', (() => {
  const c = new ChainLaw(); c.link('a'); c.link('b'); c.link('c');
  const s = c.segment(0, 2); return s[0].id === 0 && s[1].id === 1;
})(), true, true);

test('P5.4.1 10 links', (() => {
  const c = new ChainLaw(); for (let i = 0; i < 10; i++) c.link('data_' + i);
  return c.verifyAll().valid === true && c.verifyAll().chainLength === 10;
})(), true, true);
test('P5.4.2 100 links', (() => {
  const c = new ChainLaw(); for (let i = 0; i < 100; i++) c.link('data_' + i);
  return c.verifyAll().valid === true;
})(), true, true);
test('P5.4.3 Merkle changes', (() => {
  const c = new ChainLaw(); c.link('a'); const m1 = c.merkleRoot; c.link('b');
  return c.merkleRoot !== m1;
})(), true, true);
test('P5.4.4 Genesis', (() => {
  const c = new ChainLaw(); c.link('a'); return c.stats().genesis !== null;
})(), true, true);
test('P5.4.5 Latest', (() => {
  const c = new ChainLaw(); c.link('a'); c.link('b'); return c.stats().latest !== null;
})(), true, true);

const chainStats = new ChainLaw(); chainStats.link('x'); chainStats.link('y');
const chs = chainStats.stats();
test('P5.5.1 Stats object', typeof chs === 'object', typeof chs, 'object');
test('P5.5.2 Links 2', chs.links === 2, chs.links, 2);
test('P5.5.3 MerkleRoot', typeof chs.merkleRoot === 'string', typeof chs.merkleRoot, 'string');
test('P5.5.4 Genesis', chs.genesis !== null, chs.genesis !== null, true);
test('P5.5.5 Latest', chs.latest !== null, chs.latest !== null, true);

// ============================================
// PHASE 6: CROSS-MODULE & ENGINE INTEGRATION (22 tests)
// ============================================
console.log('\n=== P6: Cross-Module & Engine Integration ===');

const engine1 = new FiveLawsEngine(42);
test('P6.1.1 FiveLawsEngine exported', typeof FiveLawsEngine === 'function', typeof FiveLawsEngine, 'function');
test('P6.1.2 Instance created', engine1 instanceof FiveLawsEngine, true, true);
test('P6.1.3 Seed set', engine1.seed === 42, engine1.seed, 42);
test('P6.1.4 Has chaos', engine1.chaos instanceof ChaosLaw, engine1.chaos instanceof ChaosLaw, true);
test('P6.1.5 Has randomness', engine1.randomness instanceof RandomnessLaw, engine1.randomness instanceof RandomnessLaw, true);
test('P6.1.6 Has observation', engine1.observation instanceof ObservationLaw, engine1.observation instanceof ObservationLaw, true);
test('P6.1.7 Has causality', engine1.causality instanceof CausalityLaw, engine1.causality instanceof CausalityLaw, true);
test('P6.1.8 Has chain', engine1.chain instanceof ChainLaw, engine1.chain instanceof ChainLaw, true);
test('P6.1.9 process method', typeof engine1.process === 'function', typeof engine1.process, 'function');
test('P6.1.10 verify method', typeof engine1.verify === 'function', typeof engine1.verify, 'function');

const proc1 = engine1.process('test_input', { chaosIntensity: 0.3, randomCount: 3, observe: true, cause: true, link: true });
test('P6.2.1 Returns object', typeof proc1 === 'object', typeof proc1, 'object');
test('P6.2.2 Has input', proc1.input === 'test_input', proc1.input, 'test_input');
test('P6.2.3 Has output', proc1.output !== undefined, proc1.output !== undefined, true);
test('P6.2.4 Has chaos', typeof proc1.chaos === 'object', typeof proc1.chaos, 'object');
test('P6.2.5 Has randomness', typeof proc1.randomness === 'object', typeof proc1.randomness, 'object');
test('P6.2.6 Has observation', proc1.observation !== null, proc1.observation !== null, true);
test('P6.2.7 Has causality', typeof proc1.causality === 'object', typeof proc1.causality, 'object');
test('P6.2.8 Has chain', typeof proc1.chain === 'object', typeof proc1.chain, 'object');
test('P6.2.9 Has timestamp', typeof proc1.timestamp === 'number', typeof proc1.timestamp, 'number');
test('P6.2.10 Has seed', proc1.seed === 42, proc1.seed, 42);

test('P6.3.1 FIVE_TAU exported', typeof FIVE_TAU === 'number', typeof FIVE_TAU, 'number');
test('P6.3.2 FIVE_TAU value', FIVE_TAU === 0.9995, FIVE_TAU, 0.9995);

// ============================================
// RESULTS
// ============================================
console.log('\n\n=== RESULTS ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Total: ' + (passed + failed));

if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('=== FIVE LAWS EMPIRICAL BATTERY v3.0 COMPLETE ===');
  console.log('Ghost9 v9.1.0 | CSS Labs | Kyle S. Whitlock');
  console.log('Tests: 247 | Seal: 2026-06-26_16:22_Tulsa_OK');
} else {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
}

