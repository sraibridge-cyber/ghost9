// Tests for the QC classifier stage and its client. Node >= 18, no dependencies.
// Usage: node tests/regression/clf_wiring.js
// Injected classifiers test the stage logic. A fake HTTP server tests the client.
// The live check runs only if the real service answers on config/clf.json's url.
'use strict';

const assert = require('assert');
const http = require('http');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'src');
const { runPrefilterAsync, DEFAULT_MODE } = require(path.join(SRC, 'prefilter'));
const { postScore, config: CLF } = require(path.join(SRC, 'clf_client'));

const BENIGN = 'The committee approved the budget after a long debate.';
const modeWith = QC => ({ ...DEFAULT_MODE, QC });
const stub = (result, calls = { n: 0 }) => ({
  classify: async () => { calls.n++; return result; },
  calls,
});

const pending = [];
function test(name, fn) { pending.push({ name, fn }); }

function fakeServer(scoreFor) {
  const hits = { n: 0 };
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      hits.n++;
      const { texts } = JSON.parse(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ scores: texts.map(scoreFor), model: 'fake' }));
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    server, hits, url: `http://127.0.0.1:${server.address().port}`,
  })));
}

test('advisory: flagged score is reported but does not block', async () => {
  const s = stub({ ok: true, scores: [0.9], model: 'x' });
  const r = await runPrefilterAsync(BENIGN, [], modeWith('advisory'), { classify: s.classify });
  assert.strictEqual(r.pass, true);
  assert.strictEqual(r.stages.QC.flagged, true);
  assert.strictEqual(r.stages.QC.reason, 'quarantine_classifier');
  assert.strictEqual(r.blockedBy, null);
});

test('block: flagged score blocks with blockedBy QC', async () => {
  const s = stub({ ok: true, scores: [0.9], model: 'x' });
  const r = await runPrefilterAsync(BENIGN, [], modeWith('block'), { classify: s.classify });
  assert.strictEqual(r.pass, false);
  assert.strictEqual(r.blockedBy, 'QC');
  assert.strictEqual(r.reason, 'quarantine_classifier');
});

test('block: score under threshold passes', async () => {
  const s = stub({ ok: true, scores: [0.0001], model: 'x' });
  const r = await runPrefilterAsync(BENIGN, [], modeWith('block'), { classify: s.classify });
  assert.strictEqual(r.pass, true);
  assert.strictEqual(r.stages.QC.flagged, false);
});

test('unavailable classifier: advisory passes and reports the error', async () => {
  const s = stub({ ok: false, error: 'ECONNREFUSED' });
  const r = await runPrefilterAsync(BENIGN, [], modeWith('advisory'), { classify: s.classify });
  assert.strictEqual(r.pass, true);
  assert.strictEqual(r.stages.QC.reason, 'classifier_unavailable');
  assert.strictEqual(r.stages.QC.error, 'ECONNREFUSED');
});

test('unavailable classifier: block fails closed', async () => {
  const s = stub({ ok: false, error: 'timeout' });
  const r = await runPrefilterAsync(BENIGN, [], modeWith('block'), { classify: s.classify });
  assert.strictEqual(r.pass, false);
  assert.strictEqual(r.blockedBy, 'QC');
  assert.strictEqual(r.reason, 'classifier_unavailable');
});

test('list gate short-circuits: classifier is not called', async () => {
  const s = stub({ ok: true, scores: [0.0], model: 'x' });
  const r = await runPrefilterAsync('kill yourself', [], modeWith('block'), { classify: s.classify });
  assert.strictEqual(r.pass, false);
  assert.strictEqual(r.blockedBy, 'Q');
  assert.strictEqual(s.calls.n, 0);
  assert.strictEqual(r.stages.QC, undefined);
});

test('QC off: classifier is not called', async () => {
  const s = stub({ ok: true, scores: [0.9], model: 'x' });
  const r = await runPrefilterAsync(BENIGN, [], modeWith('off'), { classify: s.classify });
  assert.strictEqual(s.calls.n, 0);
  assert.strictEqual(r.stages.QC, undefined);
});

test('client: fake server returns one score per text', async () => {
  const f = await fakeServer(() => 0.25);
  try {
    const r = await postScore(['one', 'two'], { url: f.url });
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.scores, [0.25, 0.25]);
  } finally { f.server.close(); }
});

test('client: refused connection returns ok false, does not throw', async () => {
  const r = await postScore(['x'], { url: 'http://127.0.0.1:1', timeoutMs: 500 });
  assert.strictEqual(r.ok, false);
  assert.ok(r.error);
});

test('client: wrong score count is rejected', async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ scores: [0.1], model: 'fake' }));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  try {
    const r = await postScore(['a', 'b'], { url: `http://127.0.0.1:${server.address().port}` });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'bad_response_shape');
  } finally { server.close(); }
});

test('live service: scores a sentence in [0, 1] (skipped if not running)', async () => {
  const probe = await postScore(['The committee approved the budget.'], { timeoutMs: 1500 });
  if (!probe.ok) { console.log(`        skip: live service not reachable (${probe.error})`); return; }
  assert.strictEqual(probe.scores.length, 1);
  assert.ok(probe.scores[0] >= 0 && probe.scores[0] <= 1);
  assert.strictEqual(probe.model, CLF.model);
});

(async () => {
  let passed = 0;
  let failed = 0;
  for (const t of pending) {
    try {
      await t.fn();
      passed++;
      console.log(`  ok    ${t.name}`);
    } catch (err) {
      failed++;
      console.log(`  FAIL  ${t.name}\n        ${err.message}`);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
