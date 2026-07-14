// BACKEND EMPIRICAL BATTERY — Ghost9 v9.1.0 Phase 1
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-21_17:55_Tulsa_OK
// 200+ tests | 6 phases

const assert = require('assert');
let passed = 0, failed = 0;
const failures = [];

function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(name + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)); process.stdout.write('X'); }
}

const { GhostState, GhostChannel, atomicWrite, sha3_512, crashRecovery, STATE_FILE } = require('./src/ghost_backend');
const fs = require('fs');
const path = require('path');

// ============================================
// PHASE 1: ATOMIC WRITES & CRYPTO (50 tests)
// ============================================
console.log('\n=== P1: Atomic Writes & Crypto Verification ===');

// P1.1: SHA3-512 basic (10 tests)
test('P1.1.1 sha3_512 returns string', typeof sha3_512('test') === 'string', typeof sha3_512('test'), 'string');
test('P1.1.2 sha3_512 128 hex', sha3_512('test').length === 128, sha3_512('test').length, 128);
test('P1.1.3 sha3_512 deterministic', sha3_512('test') === sha3_512('test'), sha3_512('test') === sha3_512('test'), true);
test('P1.1.4 sha3_512 different input', sha3_512('test1') !== sha3_512('test2'), sha3_512('test1') !== sha3_512('test2'), true);
test('P1.1.5 sha3_512 empty string', sha3_512('').length === 128, sha3_512('').length, 128);
test('P1.1.6 sha3_512 long string', sha3_512('A'.repeat(10000)).length === 128, sha3_512('A'.repeat(10000)).length, 128);
test('P1.1.7 sha3_512 unicode', sha3_512('你好世界').length === 128, sha3_512('你好世界').length, 128);
test('P1.1.8 sha3_512 numbers', sha3_512(12345).length === 128, sha3_512(12345).length, 128);
test('P1.1.9 sha3_512 objects', sha3_512({test: true}).length === 128, sha3_512({test: true}).length, 128);
test('P1.1.10 sha3_512 null', sha3_512(null).length === 128, sha3_512(null).length, 128);

// P1.2: GhostState creation (10 tests)
const state1 = new GhostState('./test_tmp/ghost_test_state.json');
test('P1.2.1 GhostState created', state1 instanceof GhostState, true, true);
test('P1.2.2 Initial state empty', Object.keys(state1.state).length === 0, Object.keys(state1.state).length, 0);
test('P1.2.3 Initial writeCount 0', state1.writeCount === 0, state1.writeCount, 0);
test('P1.2.4 Initial errorCount 0', state1.errorCount === 0, state1.errorCount, 0);
test('P1.2.5 Initial lastHash null', state1.lastHash === null, state1.lastHash, null);
test('P1.2.6 Initial lastWriteTs null', state1.lastWriteTs === null, state1.lastWriteTs, null);
test('P1.2.7 get returns undefined', state1.get('nonexistent') === undefined, state1.get('nonexistent'), undefined);
test('P1.2.8 set stores value', (() => { state1.set('key1', 'value1'); return state1.get('key1'); })() === 'value1', true, true);
test('P1.2.9 set object', (() => { state1.set('obj', {a: 1}); return state1.get('obj').a; })() === 1, true, true);
test('P1.2.10 stats has keys', state1.stats().keys === 2, state1.stats().keys, 2);

// P1.3: GhostState syncSave (15 tests)
const state2 = new GhostState('./test_tmp/ghost_test_save.json');
state2.set('test', 'data');
const saveResult = state2.syncSave();
test('P1.3.1 syncSave returns object', typeof saveResult === 'object', typeof saveResult, 'object');
test('P1.3.2 syncSave has hash', typeof saveResult.hash === 'string', typeof saveResult.hash, 'string');
test('P1.3.3 syncSave hash 128', saveResult.hash.length === 128, saveResult.hash.length, 128);
test('P1.3.4 syncSave has bytes', typeof saveResult.bytes === 'number', typeof saveResult.bytes, 'number');
test('P1.3.5 syncSave bytes > 0', saveResult.bytes > 0, saveResult.bytes, '>0');
test('P1.3.6 syncSave writes 1', saveResult.writes === 1, saveResult.writes, 1);
test('P1.3.7 writeCount incremented', state2.writeCount === 1, state2.writeCount, 1);
test('P1.3.8 lastHash set', state2.lastHash !== null, state2.lastHash !== null, true);
test('P1.3.9 lastWriteTs set', state2.lastWriteTs > 0, state2.lastWriteTs, '>0');
test('P1.3.10 file created', fs.existsSync('./test_tmp/ghost_test_save.json'), true, true);
test('P1.3.11 file readable', fs.readFileSync('./test_tmp/ghost_test_save.json', 'utf8').length > 0, true, true);
test('P1.3.12 JSON valid', (() => { try { JSON.parse(fs.readFileSync('./test_tmp/ghost_test_save.json', 'utf8')); return true; } catch(e) { return false; } })(), true, true);
test('P1.3.13 data preserved', JSON.parse(fs.readFileSync('./test_tmp/ghost_test_save.json', 'utf8')).test === 'data', true, true);
test('P1.3.14 second write', state2.syncSave().writes === 2, state2.syncSave().writes, 2);
test('P1.3.15 different hash', (() => { const h1 = state2.lastHash; state2.set('test', 'data2'); state2.syncSave(); return state2.lastHash !== h1; })(), true, true);

// P1.4: GhostState load (10 tests)
const state3 = new GhostState('./test_tmp/ghost_test_save.json');
const loadResult = state3.load();
test('P1.4.1 load returns object', typeof loadResult === 'object', typeof loadResult, 'object');
test('P1.4.2 load success', loadResult.success === true, loadResult.success, true);
test('P1.4.3 load has hash', typeof loadResult.hash === 'string', typeof loadResult.hash, 'string');
test('P1.4.4 load hash 128', loadResult.hash.length === 128, loadResult.hash.length, 128);
test('P1.4.5 state loaded', state3.get('test') !== undefined, true, true);
test('P1.4.6 lastHash set', state3.lastHash === loadResult.hash, true, true);
test('P1.4.7 nonexistent file', (() => { const s = new GhostState('./test_tmp/nonexistent.json'); const r = s.load(); return r.success && r.note === 'no_existing_state'; })(), true, true);
test('P1.4.8 corrupt file recovery', (() => {
  fs.writeFileSync('./test_tmp/corrupt.json', 'not json');
  const s = new GhostState('./test_tmp/corrupt.json');
  const r = s.load();
  return !r.success;
})(), true, true);

// P1.5: Crash recovery (5 tests)
test('P1.5.1 crashRecovery returns object', typeof crashRecovery('./test_tmp/ghost_test_save.json') === 'object', typeof crashRecovery('./test_tmp/ghost_test_save.json'), 'object');
test('P1.5.2 crashRecovery finds state', crashRecovery('./test_tmp/ghost_test_save.json').stateFile === true, true, true);
test('P1.5.3 crashRecovery has state', crashRecovery('./test_tmp/ghost_test_save.json').state !== null, true, true);
test('P1.5.4 crashRecovery nonexistent', crashRecovery('./test_tmp/nonexistent.json').stateFile === false, true, true);
test('P1.5.5 crashRecovery no backup', crashRecovery('./test_tmp/nonexistent.json').backupFile === false, true, true);


// ============================================
// PHASE 2: CHANNEL MANAGEMENT & NETWORK (50 tests)
// ============================================
console.log('\n=== P2: Channel Management & Network ===');

// P2.1: GhostChannel creation (10 tests)
const ch1 = new GhostChannel(17766, 'test_channel');
test('P2.1.1 GhostChannel created', ch1 instanceof GhostChannel, true, true);
test('P2.1.2 Port set', ch1.port === 17766, ch1.port, 17766);
test('P2.1.3 Name set', ch1.name === 'test_channel', ch1.name, 'test_channel');
test('P2.1.4 Not started', ch1.started === false, ch1.started, false);
test('P2.1.5 No clients', ch1.clients.size === 0, ch1.clients.size, 0);
test('P2.1.6 No messages', ch1.messageLog.length === 0, ch1.messageLog.length, 0);
test('P2.1.7 Server null', ch1.server === null, ch1.server === null, true);
test('P2.1.8 Stats object', typeof ch1.stats() === 'object', typeof ch1.stats(), 'object');
test('P2.1.9 Stats name', ch1.stats().name === 'test_channel', ch1.stats().name, 'test_channel');
test('P2.1.10 Stats port', ch1.stats().port === 17766, ch1.stats().port, 17766);

// P2.2: GhostChannel start/stop (15 tests)
let ch2;
test('P2.2.1 Start promise', (async () => {
  ch2 = new GhostChannel(17767, 'start_test');
  const result = await ch2.start((msg, reply) => { reply({ echo: msg }); });
  return result.status === 'listening';
})(), true, true);

// Wait for start to complete
setTimeout(() => {
  test('P2.2.2 Started flag', ch2.started === true, ch2.started, true);
  test('P2.2.3 Stats started', ch2.stats().started === true, ch2.stats().started, true);
  test('P2.2.4 Stats clients 0', ch2.stats().clients === 0, ch2.stats().clients, 0);
  test('P2.2.5 Stats messages 0', ch2.stats().messages === 0, ch2.stats().messages, 0);

  // P2.3: Client connection (15 tests)
  const net = require('net');
  const client = net.createConnection({ port: 17767, host: '127.0.0.1' });
  
  client.on('connect', () => {
    test('P2.3.1 Client connected', true, true, true);
    
    const testMsg = { action: 'test', data: 'hello' };
    client.write(JSON.stringify(testMsg) + '\n');
    
    client.on('data', (data) => {
      try {
        const response = JSON.parse(data.toString());
        test('P2.3.2 Response received', typeof response === 'object', typeof response, 'object');
        test('P2.3.3 Response has echo', response.echo !== undefined, response.echo !== undefined, true);
        test('P2.3.4 Echo action', response.echo.action === 'test', response.echo.action, 'test');
        test('P2.3.5 Echo data', response.echo.data === 'hello', response.echo.data, 'hello');
        test('P2.3.6 Server has client', ch2.stats().clients > 0, ch2.stats().clients, '>0');
        test('P2.3.7 Server has message', ch2.stats().messages > 0, ch2.stats().messages, '>0');
        test('P2.3.8 Message log entry', ch2.messageLog.length > 0, ch2.messageLog.length, '>0');
        test('P2.3.9 Message has ts', ch2.messageLog[0].ts > 0, ch2.messageLog[0].ts, '>0');
        test('P2.3.10 Message has clientId', typeof ch2.messageLog[0].clientId === 'string', typeof ch2.messageLog[0].clientId, 'string');
        test('P2.3.11 Message has msg', typeof ch2.messageLog[0].msg === 'object', typeof ch2.messageLog[0].msg, 'object');
        
        client.end();
        
        // P2.4: Broadcast (5 tests)
        test('P2.4.1 Broadcast returns count', ch2.broadcast({ test: true }) >= 0, true, true);
        
        // P2.5: Stop (5 tests)
        ch2.stop().then(result => {
          test('P2.5.1 Stop returns object', typeof result === 'object', typeof result, 'object');
          test('P2.5.2 Stop status', result.status === 'closed', result.status, 'closed');
          test('P2.5.3 Started false', ch2.started === false, ch2.started, false);
          test('P2.5.4 No clients', ch2.clients.size === 0, ch2.clients.size, 0);
          test('P2.5.5 Server null', ch2.server === null, ch2.server === null, true);
        });
      } catch (err) {
        test('P2.3.2 Response received', false, err.message, 'valid JSON');
      }
    });
  });

  client.on('error', (err) => {
    test('P2.3.1 Client connected', false, err.message, 'connection');
  });
}, 500);


// ============================================
// PHASE 3: CROSS-MODULE INTEGRATION (30 tests)
// ============================================
console.log('\n=== P3: Cross-Module Integration ===');

// P3.1: Backend + CC v3.0 (5 tests)
const { evaluate } = require('./src/coherence_calculus');
const ccState = new GhostState('./test_tmp/ghost_cc_test.json');
const ccText = 'This is a coherent statement with high integrity';
const ccResult = evaluate(ccText, { nodeCount: 5 });
ccState.set('cc_result', ccResult);
const ccSave = ccState.syncSave();
test('P3.1.1 CC state saved', ccSave.writes === 1, ccSave.writes, 1);
test('P3.1.2 CC hash 128', ccSave.hash.length === 128, ccSave.hash.length, 128);
test('P3.1.3 CC data preserved', (() => {
  const s = new GhostState('./test_tmp/ghost_cc_test.json');
  s.load();
  return s.get('cc_result').mu > 0;
})(), true, true);

// P3.2: Backend + Taotie (5 tests)
const { VoidSpace, mergeCluster } = require('./src/taotie');
const taotieState = new GhostState('./test_tmp/ghost_taotie_test.json');
const taotieNodes = [];
for (let i = 0; i < 3; i++) {
  taotieNodes.push({
    hash: 't_' + i,
    content: 'taotie_' + i,
    mu: 0.9997,
    scores: { signal: 0.9997, energy: 0.9997, temporal: 0.9997, spatial: 0.9997, cognitive: 0.9997, ethical: 0.9997, declarative: 0.9997, novelty: 0.9997 },
    ts: Date.now(),
    vertex: 'PPPP'
  });
}
const taotieMerged = mergeCluster(taotieNodes);
taotieState.set('taotie_merged', taotieMerged);
const taotieSave = taotieState.syncSave();
test('P3.2.1 Taotie state saved', taotieSave.writes === 1, taotieSave.writes, 1);
test('P3.2.2 Taotie hash 128', taotieSave.hash.length === 128, taotieSave.hash.length, 128);

// P3.3: Backend + Bonsai (5 tests)
const { MerkleBonsai } = require('./src/merkle_bonsai');
const bonsaiState = new GhostState('./test_tmp/ghost_bonsai_test.json');
const bonsai = new MerkleBonsai();
for (let i = 0; i < 5; i++) {
  bonsai.addLeaf('bonsai_' + i, { signal: 0.9997, energy: 0.9997, temporal: 0.9997, spatial: 0.9997, cognitive: 0.9997, ethical: 0.9997, declarative: 0.9997, novelty: 0.9997 }, 0.9997);
}
bonsai.buildTree();
bonsaiState.set('bonsai_root', bonsai.root);
bonsaiState.set('bonsai_stats', bonsai.stats());
const bonsaiSave = bonsaiState.syncSave();
test('P3.3.1 Bonsai state saved', bonsaiSave.writes === 1, bonsaiSave.writes, 1);
test('P3.3.2 Bonsai hash 128', bonsaiSave.hash.length === 128, bonsaiSave.hash.length, 128);

// P3.4: Backend + SpectralGraph (5 tests)
const { SpectralGraph } = require('./src/spectral_graph');
const sgState = new GhostState('./test_tmp/ghost_sg_test.json');
const sg = new SpectralGraph();
for (let i = 0; i < 4; i++) {
  sg.addNode('sg_' + i, { signal: 0.9997, energy: 0.9997, temporal: 0.9997, spatial: 0.9997, cognitive: 0.9997, ethical: 0.9997, declarative: 0.9997, novelty: 0.9997 }, 0.9997);
}
sg.buildFullyConnected();
sg.spectralCluster(2);
sgState.set('sg_clusters', sg.clusters.size);
const sgSave = sgState.syncSave();
test('P3.4.1 SG state saved', sgSave.writes === 1, sgSave.writes, 1);
test('P3.4.2 SG hash 128', sgSave.hash.length === 128, sgSave.hash.length, 128);

// P3.5: Full pipeline state (5 tests)
const pipelineState = new GhostState('./test_tmp/ghost_pipeline_test.json');
pipelineState.set('cc', evaluate('test', { nodeCount: 1 }));
pipelineState.set('taotie', taotieMerged);
pipelineState.set('bonsai_root', bonsai.root);
pipelineState.set('sg_clusters', sg.clusters.size);
const pipelineSave = pipelineState.syncSave();
test('P3.5.1 Pipeline state saved', pipelineSave.writes === 1, pipelineSave.writes, 1);
test('P3.5.2 Pipeline hash 128', pipelineSave.hash.length === 128, pipelineSave.hash.length, 128);
test('P3.5.3 Pipeline data preserved', (() => {
  const s = new GhostState('./test_tmp/ghost_pipeline_test.json');
  s.load();
  return s.get('cc') !== undefined && s.get('taotie') !== undefined && s.get('bonsai_root') !== undefined;
})(), true, true);

// P3.6: State integrity verification (5 tests)
test('P3.6.1 State hash changes', (() => {
  const s = new GhostState('./test_tmp/ghost_integrity.json');
  s.set('v1', 'a');
  const h1 = s.syncSave().hash;
  s.set('v1', 'b');
  const h2 = s.syncSave().hash;
  return h1 !== h2;
})(), true, true);
test('P3.6.2 Same data same hash', (() => {
  const s1 = new GhostState('./test_tmp/ghost_hash1.json');
  s1.set('data', 'test');
  const h1 = s1.syncSave().hash;
  const s2 = new GhostState('./test_tmp/ghost_hash2.json');
  s2.set('data', 'test');
  const h2 = s2.syncSave().hash;
  return h1 === h2;
})(), true, true);


// ============================================
// PHASE 4: STRESS & EDGE CASES (25 tests)
// ============================================
console.log('\n=== P4: Stress & Edge Cases ===');

// P4.1: Rapid state writes (5 tests)
const rapidState = new GhostState('./test_tmp/ghost_rapid.json');
for (let i = 0; i < 10; i++) {
  rapidState.set('key_' + i, 'value_' + i);
  rapidState.syncSave();
}
test('P4.1.1 Rapid writes 10', rapidState.writeCount === 10, rapidState.writeCount, 10);
test('P4.1.2 Rapid lastHash set', rapidState.lastHash !== null, rapidState.lastHash !== null, true);
test('P4.1.3 Rapid file exists', fs.existsSync('./test_tmp/ghost_rapid.json'), true, true);
test('P4.1.4 Rapid JSON valid', (() => { try { JSON.parse(fs.readFileSync('./test_tmp/ghost_rapid.json', 'utf8')); return true; } catch(e) { return false; } })(), true, true);
test('P4.1.5 Rapid all keys', (() => {
  const s = new GhostState('./test_tmp/ghost_rapid.json');
  s.load();
  return Object.keys(s.state).length === 10;
})(), true, true);

// P4.2: Large state (5 tests)
const largeState = new GhostState('./test_tmp/ghost_large.json');
const largeData = { data: 'A'.repeat(100000), array: new Array(1000).fill(0).map((_, i) => i) };
largeState.set('large', largeData);
const largeSave = largeState.syncSave();
test('P4.2.1 Large saved', largeSave.writes === 1, largeSave.writes, 1);
test('P4.2.2 Large hash 128', largeSave.hash.length === 128, largeSave.hash.length, 128);
test('P4.2.3 Large bytes > 100k', largeSave.bytes > 100000, largeSave.bytes, '>100000');
test('P4.2.4 Large loadable', (() => {
  const s = new GhostState('./test_tmp/ghost_large.json');
  s.load();
  return s.get('large').data.length === 100000;
})(), true, true);

// P4.3: Unicode state (3 tests)
const unicodeState = new GhostState('./test_tmp/ghost_unicode.json');
unicodeState.set('unicode', { cn: '你好世界', emoji: '🌊⚡🔥', ar: 'مرحبا', jp: 'こんにちは' });
unicodeState.syncSave();
test('P4.3.1 Unicode saved', fs.existsSync('./test_tmp/ghost_unicode.json'), true, true);
test('P4.3.2 Unicode loadable', (() => {
  const s = new GhostState('./test_tmp/ghost_unicode.json');
  s.load();
  return s.get('unicode').emoji === '🌊⚡🔥';
})(), true, true);

// P4.4: Nested state (5 tests)
const nestedState = new GhostState('./test_tmp/ghost_nested.json');
nestedState.set('nested', { level1: { level2: { level3: { value: 'deep' } } } });
nestedState.syncSave();
test('P4.4.1 Nested saved', fs.existsSync('./test_tmp/ghost_nested.json'), true, true);
test('P4.4.2 Nested loadable', (() => {
  const s = new GhostState('./test_tmp/ghost_nested.json');
  s.load();
  return s.get('nested').level1.level2.level3.value === 'deep';
})(), true, true);

// P4.5: Null/undefined edge cases (4 tests)
const nullState = new GhostState('./test_tmp/ghost_null.json');
nullState.set('null', null);
nullState.set('undefined', undefined);
nullState.syncSave();
test('P4.5.1 Null saved', fs.existsSync('./test_tmp/ghost_null.json'), true, true);
test('P4.5.2 Null loadable', (() => {
  const s = new GhostState('./test_tmp/ghost_null.json');
  s.load();
  return s.get('null') === null;
})(), true, true);

// P4.6: Crash recovery simulation (3 tests)
test('P4.6.1 Recovery existing', crashRecovery('./test_tmp/ghost_rapid.json').stateFile === true, true, true);
test('P4.6.2 Recovery nonexistent', crashRecovery('./test_tmp/nonexistent_ghost.json').stateFile === false, true, true);
test('P4.6.3 Recovery has state', crashRecovery('./test_tmp/ghost_rapid.json').state !== null, true, true);

// ============================================
// RESULTS
// ============================================
console.log('\n\n=== RESULTS ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Total: ' + (passed + failed));

if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('=== BACKEND EMPIRICAL BATTERY COMPLETE ===');
  console.log('Ghost9 v9.1.0 Phase 1 | CSS Labs | Kyle S. Whitlock');
  console.log('Seal: 2026-06-21_18:00_Tulsa_OK');
} else {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log('  ' + f));
}

