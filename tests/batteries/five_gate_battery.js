// FIVE-GATE KERNEL BATTERY (2026-10-28)
// Replaces the three-gate battery for the current design: L -> S -> M -> P -> Q, then QC.
// Run from the repo root: node tests/batteries/five_gate_battery.js
// The retired three-gate battery is archived under archive/superseded/2026-10-28/, not deleted.
'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const src = (m) => require(path.join(ROOT, 'src', m));

let passed = 0, failed = 0;
const failures = [];
function test(name, condition, actual, expected) {
  if (condition) { passed++; process.stdout.write('.'); }
  else { failed++; failures.push(`${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); process.stdout.write('X'); }
}

const CC = src('coherence_calculus');
const { runPrefilter, runPrefilterAsync, DEFAULT_MODE, ORDER } = src('prefilter');
const { fiveGateScan } = src('gate_router');
const CLEAN = 'The committee approved the budget after a long debate.';

console.log('\n=== P1: CC contract (evaluate) ===');
const ev = CC.evaluate('The quick brown fox jumps over the lazy dog');
test('P1.1 evaluate returns an object', typeof ev === 'object' && ev !== null, typeof ev, 'object');
test('P1.2 scores has 8 domains', Object.keys(ev.scores).length === 8, Object.keys(ev.scores).length, 8);
test('P1.3 scores are D1..D8', ['D1','D2','D3','D4','D5','D6','D7','D8'].every(d => typeof ev.scores[d] === 'number'), true, true);
test('P1.4 mu is a number in [0, 1]', typeof ev.mu === 'number' && ev.mu >= 0 && ev.mu <= 1, ev.mu, '[0,1]');
test('P1.5 pass is boolean', typeof ev.pass === 'boolean', typeof ev.pass, 'boolean');
test('P1.6 version matches CC_VERSION', ev.version === CC.CC_VERSION, ev.version, CC.CC_VERSION);
test('P1.7 N_DOMAINS is 8', CC.N_DOMAINS === 8, CC.N_DOMAINS, 8);
test('P1.8 TAU is in (0, 1)', CC.TAU > 0 && CC.TAU < 1, CC.TAU, '(0,1)');
test('P1.9 evaluate does not return gates (gates live in prefilter)', ev.gates === undefined, typeof ev.gates, 'undefined');

console.log('\n=== P2: five-gate pipeline (sync) ===');
const clean = runPrefilter(CLEAN);
test('P2.1 clean sentence passes', clean.pass === true, clean.pass, true);
test('P2.2 stages L, S, M, P, Q present', ['L','S','M','P','Q'].every(g => g in clean.stages), Object.keys(clean.stages), ['L','S','M','P','Q']);
test('P2.3 pipeline order is L, S, M, P, Q, QC', ORDER.join(',') === 'L,S,M,P,Q,QC', ORDER.join(','), 'L,S,M,P,Q,QC');
test('P2.4 M gate is off', DEFAULT_MODE.M === 'off' && clean.stages.M.mode === 'off', clean.stages.M.mode, 'off');
// Was 'S and Q block by default' (S block). Changed 2026-10-29: S advisory after measurement, see docs/validation/S_GATE_MEASUREMENT.json.
test('P2.5 Q blocks by default, S advisory', DEFAULT_MODE.S === 'advisory' && DEFAULT_MODE.Q === 'block', [DEFAULT_MODE.S, DEFAULT_MODE.Q], ['advisory','block']);
test('P2.6 harmful phrase blocked by Q', fiveGateScan('kill yourself').blockedBy === 'Q', fiveGateScan('kill yourself').blockedBy, 'Q');
// Was blockedBy 'S'. Changed 2026-10-29: S advisory, so a bare word is no longer blocked by S.
test('P2.7 bare word not blocked by S (advisory)', fiveGateScan('hello world').blockedBy !== 'S', fiveGateScan('hello world').blockedBy, 'not S');
test('P2.8 Q advisory does not block', runPrefilter('kill yourself', [], { ...DEFAULT_MODE, Q: 'advisory' }).pass === true, true, true);
test('P2.9 context argument accepted', typeof runPrefilter(CLEAN, ['earlier sentence.']).pass === 'boolean', 'boolean', 'boolean');
test('P2.10 elapsed_ms is a number', typeof clean.elapsed_ms === 'number', typeof clean.elapsed_ms, 'number');
test('P2.11 fiveGateScan matches runPrefilter', fiveGateScan(CLEAN).pass === clean.pass, fiveGateScan(CLEAN).pass, clean.pass);

console.log('\n=== P3: QC classifier stage (async, injected) ===');
(async () => {
  const flagged = await runPrefilterAsync(CLEAN, [], { ...DEFAULT_MODE, QC: 'advisory' }, { classify: async () => ({ ok: true, scores: [0.9], model: 'x' }) });
  test('P3.1 advisory QC flags but does not block', flagged.pass === true && flagged.stages.QC.flagged === true, flagged.stages.QC && flagged.stages.QC.flagged, true);
  const blocked = await runPrefilterAsync(CLEAN, [], { ...DEFAULT_MODE, QC: 'block' }, { classify: async () => ({ ok: true, scores: [0.9], model: 'x' }) });
  test('P3.2 block QC blocks with blockedBy QC', blocked.pass === false && blocked.blockedBy === 'QC', blocked.blockedBy, 'QC');
  const down = await runPrefilterAsync(CLEAN, [], { ...DEFAULT_MODE, QC: 'block' }, { classify: async () => ({ ok: false, error: 'ECONNREFUSED' }) });
  // Was 'block QC fails closed' (pass === false). Changed 2026-10-29 to fail open, see CHANGELOG.
test('P3.3 block QC fails open when classifier is down', down.pass === true && down.stages.QC.reason === 'classifier_unavailable', down.stages.QC && down.stages.QC.reason, 'classifier_unavailable');
  const off = await runPrefilterAsync(CLEAN, [], { ...DEFAULT_MODE, QC: 'off' }, { classify: async () => { throw new Error('should not run'); } });
  test('P3.4 QC off never calls the classifier', off.stages.QC === undefined, off.stages.QC, undefined);

  console.log('\n=== P4: module contracts ===');
  const cfg = src('clf_client').config;
  test('P4.1 clf config threshold is a number', typeof cfg.threshold === 'number', typeof cfg.threshold, 'number');
  // Was 'advisory'. Changed 2026-10-29: block mode approved for harm detection, see CHANGELOG.
test('P4.2 clf config mode is block', cfg.mode === 'block', cfg.mode, 'block');
  const S = src('cc_structure');
  test('P4.3 floor keeps mu positive for a zero score', S.muFloored({ a: 0, b: 0.9, c: 0.9 }, { a: 1/3, b: 1/3, c: 1/3 }) > 0, true, true);
  test('P4.4 sensitivity equals weight in the interior', Math.abs(S.logSensitivities({ a: 0.9, b: 0.8, c: 0.7 }, { a: 0.5, b: 0.3, c: 0.2 }).a.sensitivity - 0.5) < 1e-3, true, true);
  const loadable = ['coherence_calculus', 'gate_lexical', 'gate_syntactic', 'gate_semantic', 'gate_router', 'prefilter', 'five_laws', 'ghost_rip', 'merkle_bonsai', 'tesseract', 'clf_client', 'cc_structure'];
  for (const m of loadable) {
    let ok = true;
    try { src(m); } catch (e) { ok = false; }
    test(`P4.load ${m}`, ok, ok, true);
  }

  console.log(`\n\n${passed} passed, ${failed} failed`);
  if (failures.length) { console.log('Failures:'); for (const f of failures) console.log('  - ' + f); }
  process.exit(failed === 0 ? 0 : 1);
})();
