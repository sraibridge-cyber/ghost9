// TAOTIE BATTERY — Ghost9 v9.0.9
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-20_17:24_Tulsa_OK
// 79 tests | 12 sections

const assert = require('assert');
let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + actual + ', expected ' + expected); process.stdout.write('X'); }
}

const { VoidSpace, classifyTier, mergeCluster } = require('./src/taotie');

// S1: classifyTier (11 tests)
console.log('\n=== S1: classifyTier ===');
test('1.1 LTM high', classifyTier(0.9999) === 'LTM', classifyTier(0.9999), 'LTM');
test('1.2 LTM boundary', classifyTier(0.9998) === 'LTM', classifyTier(0.9998), 'LTM');
test('1.3 STM high', classifyTier(0.9997) === 'STM', classifyTier(0.9997), 'STM');
test('1.4 STM at tau', classifyTier(0.9995) === 'STM', classifyTier(0.9995), 'STM');
test('1.5 STM low', classifyTier(0.9996) === 'STM', classifyTier(0.9996), 'STM');
test('1.6 Null below tau', classifyTier(0.9994) === null, classifyTier(0.9994), 'null');
test('1.7 Null bootstrap', classifyTier(0.9960) === null, classifyTier(0.9960), 'null');
test('1.8 Null low', classifyTier(0.50) === null, classifyTier(0.50), 'null');
test('1.9 Null zero', classifyTier(0.0) === null, classifyTier(0.0), 'null');
test('1.10 Tier deterministic', classifyTier(0.9997) === classifyTier(0.9997), 'deterministic', true);
test('1.11 Tier monotonic', classifyTier(0.9999) === 'LTM' && classifyTier(0.9997) === 'STM', 'monotonic', true);

// S2: mergeCluster (18 tests)
console.log('\n=== S2: mergeCluster ===');
function makeNode(mu, content, hash) {
  return {
    hash: hash || 'h_' + Math.random().toString(36).slice(2),
    content: content || 'test',
    mu: mu,
    scores: { D1: mu, D2: mu, D3: mu, D4: mu, D5: mu, D6: mu, D7: mu, D8: mu },
    ts: Date.now(),
    vertex: 'PPPP'
  };
}

const n1 = makeNode(0.9997, 'node one');
const merged1 = mergeCluster([n1]);
test('2.1 Single node merge', merged1.merkle_root !== undefined, 'merkle_root', 'defined');
test('2.2 Single node hash', merged1.hash !== undefined, 'hash', 'defined');
test('2.3 Single node mu preserved', Math.abs(merged1.mu - 0.9997) < 1e-10, merged1.mu, '0.9997');
test('2.4 Single node tier', classifyTier(merged1.mu) === 'STM', classifyTier(merged1.mu), 'STM');
test('2.5 Single node content preserved', merged1.content === 'node one', merged1.content, 'node one');

const n2a = makeNode(0.9997, 'node A');
const n2b = makeNode(0.9997, 'node B');
const merged2 = mergeCluster([n2a, n2b]);
test('2.6 Multi node merge', merged2.merkle_root !== undefined, 'merkle_root', 'defined');
test('2.7 Multi node hash', merged2.hash !== undefined, 'hash', 'defined');
test('2.8 Multi node mu', merged2.mu > 0, merged2.mu, '>0');
test('2.9 Multi node tier', merged2.tier !== null, merged2.tier, 'not null');
test('2.10 Multi node parent count', merged2.parent_ids && merged2.parent_ids.length === 2, merged2.parent_ids ? merged2.parent_ids.length : 'undefined', 2);
test('2.11 Multi node content', merged2.content && merged2.content.includes('TAOTIE'), merged2.content, 'has TAOTIE');
test('2.12 Multi node merge_count', merged2.merge_count === 2, merged2.merge_count, 2);
test('2.13 Multi node isMerge', merged2._isMerge === true, merged2._isMerge, true);
test('2.14 Empty cluster throws', (() => { try { mergeCluster([]); return false; } catch(e) { return true; } })(), 'throws', true);

const n3a = makeNode(0.9999, 'LTM node');
const n3b = makeNode(0.9997, 'STM node');
const merged3 = mergeCluster([n3a, n3b]);
test('2.15 Mixed tier merge', merged3.mu > 0, merged3.mu, '>0');
test('2.16 Merkle root length', merged3.merkle_root.length === 128, merged3.merkle_root.length, 128);
test('2.17 Hash length', merged3.hash.length === 128, merged3.hash.length, 128);
test('2.18 Scores present', Object.keys(merged3.scores).length === 8, 'keys', 8);

// S3: VoidSpace Constructor (8 tests)
console.log('\n=== S3: VoidSpace Constructor ===');
const vs1 = new VoidSpace();
test('3.1 Default maxNodes', vs1.maxNodes === 10000, vs1.maxNodes, 10000);
test('3.2 Default triggerAt', vs1.triggerAt === 7, vs1.triggerAt, 7);
test('3.3 Default target', vs1.targetCount === 6000, vs1.targetCount, 6000);
test('3.4 No sweep yet', vs1.lastSweepTs === null, vs1.lastSweepTs, null);
test('3.5 Sweep count 0', vs1.sweepCount === 0, vs1.sweepCount, 0);
test('3.6 Total devoured 0', vs1.totalDevoured === 0, vs1.totalDevoured, 0);

const vs2 = new VoidSpace(100);
test('3.7 Custom maxNodes', vs2.maxNodes === 100, vs2.maxNodes, 100);
test('3.8 Custom target', vs2.targetCount === 60, vs2.targetCount, 60);

// S4: needsSweep (5 tests)
console.log('\n=== S4: needsSweep ===');
test('4.1 Needs sweep at 7', vs1.needsSweep(7) === true, vs1.needsSweep(7), true);
test('4.2 Needs sweep above', vs1.needsSweep(10) === true, vs1.needsSweep(10), true);
test('4.3 No sweep at 6', vs1.needsSweep(6) === false, vs1.needsSweep(6), false);
test('4.4 No sweep at 0', vs1.needsSweep(0) === false, vs1.needsSweep(0), false);
test('4.5 No sweep at 1', vs1.needsSweep(1) === false, vs1.needsSweep(1), false);

// S5: sweep — STM/LTM Protection (10 tests)
console.log('\n=== S5: sweep — STM/LTM Protection ===');
function makeLTM(content) { return makeNode(0.9999, content); }
function makeSTM(content) { return makeNode(0.9997, content); }

const vs3 = new VoidSpace();
const ltmNodes = [makeLTM('ltm1'), makeLTM('ltm2')];
const stmNodes = [makeSTM('stm1'), makeSTM('stm2'), makeSTM('stm3'), makeSTM('stm4'), makeSTM('stm5')];
const allNodes5 = [...ltmNodes, ...stmNodes];

const result5 = vs3.sweep(allNodes5);
test('5.1 LTM protected', result5.survivors.filter(n => n.mu >= 0.9998).length === 2, 'ltm_count', 2);
test('5.2 STM merged or kept', result5.survivors.length >= 2, 'survivors', '>=2');
test('5.3 Devoured count', result5.devoured_count >= 0, 'devoured', '>=0');
test('5.4 Not skipped', result5.skipped === false, result5.skipped, false);
test('5.5 Sweep count incremented', vs3.sweepCount === 1, vs3.sweepCount, 1);
test('5.6 Last sweep timestamp', vs3.lastSweepTs !== null, 'timestamp', 'not null');
test('5.7 Sweep log entry', vs3.sweepLog.length === 1, vs3.sweepLog.length, 1);
test('5.8 Log has before', vs3.sweepLog[0].before === 7, vs3.sweepLog[0].before, 7);
test('5.9 Log has ltmProtected', vs3.sweepLog[0].ltmProtected === 2, vs3.sweepLog[0].ltmProtected, 2);
test('5.10 Strategy recorded', vs3.sweepLog[0].strategy === 'spectral_only', vs3.sweepLog[0].strategy, 'spectral_only');

// S6: sweep — All LTM (skip) (4 tests)
console.log('\n=== S6: sweep — All LTM (skip) ===');
const vs4 = new VoidSpace();
const allLTM = [makeLTM('ltm1'), makeLTM('ltm2'), makeLTM('ltm3')];
const result6 = vs4.sweep(allLTM);
test('6.1 All LTM skipped', result6.skipped === true, result6.skipped, true);
test('6.2 All LTM survivors', result6.survivors.length === 3, result6.survivors.length, 3);
test('6.3 No devoured', result6.devoured_count === 0, result6.devoured_count, 0);
test('6.4 No sweep count', vs4.sweepCount === 0, vs4.sweepCount, 0);

// S7: sweep — Single STM (skip) (2 tests)
console.log('\n=== S7: sweep — Single STM (skip) ===');
const vs5 = new VoidSpace();
const singleSTM = [makeSTM('only')];
const result7 = vs5.sweep(singleSTM);
test('7.1 Single STM skipped', result7.skipped === true, result7.skipped, true);
test('7.2 Single STM preserved', result7.survivors.length === 1, result7.survivors.length, 1);

// S8: sweep — Large STM set (5 tests)
console.log('\n=== S8: sweep — Large STM set ===');
const vs6 = new VoidSpace();
const largeSTM = [];
for (let i = 0; i < 10; i++) largeSTM.push(makeSTM('stm' + i));
const result8 = vs6.sweep(largeSTM);
test('8.1 Large STM not skipped', result8.skipped === false, result8.skipped, false);
test('8.2 Devoured > 0', result8.devoured_count > 0, result8.devoured_count, '>0');
test('8.3 Merged produced', result8.merged.length > 0, result8.merged.length, '>0');
test('8.4 Survivors include merged', result8.survivors.some(n => n._isMerge), 'has merged', true);
test('8.5 Total devoured tracked', vs6.totalDevoured > 0, vs6.totalDevoured, '>0');

// S9: voidStats (7 tests)
console.log('\n=== S9: voidStats ===');
const vs7 = new VoidSpace();
const statsNodes = [makeLTM('ltm'), makeSTM('stm1'), makeSTM('stm2')];
const stats = vs7.voidStats(statsNodes);
test('9.1 STM count', stats.stm_count === 2, stats.stm_count, 2);
test('9.2 LTM count', stats.ltm_count === 1, stats.ltm_count, 1);
test('9.3 Total', stats.total === 3, stats.total, 3);
test('9.4 Capacity pct', parseFloat(stats.capacity_pct) >= 0, stats.capacity_pct, '>=0');
test('9.5 Trigger at', stats.trigger_at === 7, stats.trigger_at, 7);
test('9.6 Near trigger false', stats.near_trigger === false, stats.near_trigger, false);

const nearTriggerNodes = [];
for (let i = 0; i < 7; i++) nearTriggerNodes.push(makeSTM('n' + i));
const stats2 = vs7.voidStats(nearTriggerNodes);
test('9.7 Near trigger true', stats2.near_trigger === true, stats2.near_trigger, true);

// S10: Merkle Provenance (4 tests)
console.log('\n=== S10: Merkle Provenance ===');
const vs8 = new VoidSpace();
const provNodes = [makeSTM('a'), makeSTM('b'), makeSTM('c'), makeSTM('d'), makeSTM('e'), makeSTM('f'), makeSTM('g')];
const result10 = vs8.sweep(provNodes);
const mergedNodes = result10.survivors.filter(n => n._isMerge);
test('10.1 Merkle root on merged', mergedNodes.every(n => n.merkle_root && n.merkle_root.length === 128), 'merkle', '128 chars');
test('10.2 Parent ids on merged', mergedNodes.every(n => n.parent_ids && n.parent_ids.length > 0), 'parents', '>0');
test('10.3 Hash on merged', mergedNodes.every(n => n.hash && n.hash.length === 128), 'hash', '128 chars');
test('10.4 Content preserved', mergedNodes.every(n => n.content && n.content.includes('TAOTIE')), 'content', 'has TAOTIE');

// S11: OP3 Mode (2 tests)
console.log('\n=== S11: OP3 Mode ===');
test('11.1 OP3 trigger is 7', vs1.triggerAt === 7, vs1.triggerAt, 7);
test('11.2 OP3 target 60%', vs1.targetCount === 6000, vs1.targetCount, 6000);

// S12: Stress (3 tests)
console.log('\n=== S12: Stress ===');
const vs9 = new VoidSpace();
const stressNodes = [];
for (let i = 0; i < 20; i++) {
  const mu = i % 3 === 0 ? 0.9999 : 0.9997;
  stressNodes.push(makeNode(mu, 'stress' + i));
}
const result12 = vs9.sweep(stressNodes);
test('12.1 Stress not skipped', result12.skipped === false, result12.skipped, false);
test('12.2 Stress survivors > 0', result12.survivors.length > 0, result12.survivors.length, '>0');
test('12.3 Stress log length', vs9.sweepLog.length === 1, vs9.sweepLog.length, 1);

// RESULTS
console.log('\n\n=== RESULTS ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Total: ' + (passed + failed));
if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('=== TAOTIE BATTERY COMPLETE ===');
  console.log('Ghost9 | CSS Labs | Kyle S. Whitlock | Seal: 2026-06-20_17:24_Tulsa_OK');
} else {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
}
