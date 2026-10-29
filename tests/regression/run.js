// Regression tests for the review fixes. Node >= 18, no dependencies.
// Usage: node tests/regression/run.js
// The e2e part copies src/ to a temp folder so no real data/ is touched.
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

const T = require(path.join(SRC, 'tesseract'));
const { SpatialWeb } = require(path.join(SRC, 'spatial_web'));
const { VoidSpace, mergeCluster } = require(path.join(SRC, 'taotie'));
const CC = require(path.join(SRC, 'coherence_calculus'));

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok    ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log(`  FAIL  ${name}\n        ${err.message}`);
  }
}

function uniformScores(v) {
  const s = {};
  for (let i = 1; i <= 8; i++) s['D' + i] = v;
  return s;
}

function fakeNode(id, mu, scores) {
  return { id, hash: id, content: `node ${id}`, mu, scores: scores || uniformScores(mu), vertex: 'PPPP', merge_count: 1 };
}

console.log('\nUnit: tesseract.js compatibility API');

test('routeVertex returns a 4-character P/N vertex', () => {
  const v = T.routeVertex(uniformScores(0.9));
  assert.match(v, /^[PN]{4}$/);
});

test('VERTICES lists all 16 vertices', () => {
  assert.strictEqual(T.VERTICES.length, 16);
});

test('vertexDistribution counts every vertex, including empty ones', () => {
  const dist = T.vertexDistribution([{ vertex: 'PPPP' }, { vertex: 'PPPP' }, { vertex: 'NNNN' }]);
  assert.strictEqual(Object.keys(dist).length, 16);
  assert.strictEqual(dist.PPPP, 2);
  assert.strictEqual(dist.NNNN, 1);
  assert.strictEqual(dist.PNPN, 0);
});

test('dominantVertex returns the most common vertex, or null when empty', () => {
  assert.strictEqual(T.dominantVertex([{ vertex: 'PNPN' }, { vertex: 'PNPN' }, { vertex: 'PPPP' }]), 'PNPN');
  assert.strictEqual(T.dominantVertex([]), null);
});

test('vertexNeighbors returns 4 Hamming-1 neighbours, or [] for bad input', () => {
  assert.strictEqual(T.vertexNeighbors('PPPP').length, 4);
  assert.deepStrictEqual(T.vertexNeighbors('bogus'), []);
});

test('tesseractEdges returns the 32 edges of a 4-cube', () => {
  assert.strictEqual(T.tesseractEdges().length, 32);
});

console.log('\nUnit: spatial_web.js upsert / remove / stats / serialize');

test('upsert accepts CC scores keyed D1..D8', () => {
  const w = new SpatialWeb();
  const r = w.upsert(fakeNode('a', 0.99));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.created, true);
  assert.strictEqual(w.getNodeCount(), 1);
});

test('a second, nearby node joins the existing cluster', () => {
  const w = new SpatialWeb();
  w.upsert(fakeNode('a', 0.99));
  const r = w.upsert(fakeNode('b', 0.99));
  assert.strictEqual(r.created, false);
  assert.strictEqual(w.getClusterCount(), 1);
  assert.strictEqual(w.getNodeCount(), 2);
});

test('upsert replaces a node with the same id rather than duplicating it', () => {
  const w = new SpatialWeb();
  w.upsert(fakeNode('a', 0.99));
  w.upsert(fakeNode('a', 0.99));
  assert.strictEqual(w.getNodeCount(), 1);
});

test('remove drops the node and deletes an emptied cluster', () => {
  const w = new SpatialWeb();
  w.upsert(fakeNode('a', 0.99));
  assert.strictEqual(w.remove('a'), true);
  assert.strictEqual(w.getNodeCount(), 0);
  assert.strictEqual(w.getClusterCount(), 0);
  assert.strictEqual(w.remove('a'), false);
});

test('stats() returns nodes, clusters, edges, learningCycles', () => {
  const s = new SpatialWeb().stats();
  assert.deepStrictEqual(Object.keys(s).sort(), ['clusters', 'edges', 'learningCycles', 'nodes']);
});

test('serialize -> deserialize round-trips nodes and clusters', () => {
  const w = new SpatialWeb();
  w.upsert(fakeNode('a', 0.99));
  w.upsert(fakeNode('b', 0.5, uniformScores(0.2)));
  const copy = SpatialWeb.deserialize(JSON.parse(JSON.stringify(w.serialize())));
  assert.strictEqual(copy.getNodeCount(), 2);
  assert.strictEqual(copy.getClusterCount(), 2);
  assert.strictEqual(copy.getClusterForNode('a'), w.getClusterForNode('a'));
});

test('computeVoid returns the nodes that are not LTM', () => {
  const w = new SpatialWeb();
  w.upsert(fakeNode('a', 0.99));
  w.upsert(fakeNode('b', 0.5, uniformScores(0.2)));
  const voidIds = w.computeVoid(new Set(['a']));
  assert.deepStrictEqual(Array.from(voidIds), ['b']);
});

console.log('\nUnit: taotie.js sweep never drops a node silently');

test('sweep keeps every node below the 0.9995 bar', () => {
  const nodes = [0.975, 0.979, 0.977, 0.983, 0.986, 0.989, 0.976, 0.975].map((mu, i) => fakeNode('n' + i, mu));
  const r = new VoidSpace(10000).sweep(nodes);
  assert.strictEqual(r.skipped, false);
  const survivorIds = new Set(r.survivors.map(n => n.id || n.hash));
  for (const n of nodes) assert.ok(survivorIds.has(n.id), `node ${n.id} was dropped`);
});

test('devoured is an array of the original nodes that were merged', () => {
  const nodes = [];
  for (let i = 0; i < 4; i++) nodes.push(fakeNode('hi' + i, 0.99995, uniformScores(0.99995)));
  for (let i = 0; i < 3; i++) nodes.push(fakeNode('lo' + i, 0.97));
  const r = new VoidSpace(10000).sweep(nodes);
  assert.ok(Array.isArray(r.devoured), 'devoured must be an array');
  assert.strictEqual(r.devoured.length, 4);
  assert.strictEqual(r.devoured_count, 4);
  assert.strictEqual(r.merged.length, 1);
  assert.strictEqual(r.survivors.length, 4); // 3 low nodes + 1 merged
});

test('input count equals kept plus devoured', () => {
  const nodes = [];
  for (let i = 0; i < 6; i++) nodes.push(fakeNode('hi' + i, 0.99995, uniformScores(0.99995)));
  for (let i = 0; i < 2; i++) nodes.push(fakeNode('lo' + i, 0.97));
  const r = new VoidSpace(10000).sweep(nodes);
  const kept = r.survivors.length - r.merged.length;
  assert.strictEqual(kept + r.devoured.length, nodes.length);
});

test('sweep reports before, after and strategy for the log line', () => {
  const nodes = [];
  for (let i = 0; i < 7; i++) nodes.push(fakeNode('lo' + i, 0.97));
  const r = new VoidSpace(10000).sweep(nodes);
  assert.strictEqual(r.before, 7);
  assert.strictEqual(r.after, 7);
  assert.strictEqual(r.strategy, 'merge');
});

test('mergeCluster still produces a merged node from a batch', () => {
  const m = mergeCluster([fakeNode('x', 0.9999), fakeNode('y', 0.9999)]);
  assert.strictEqual(m.merge_count, 2);
  assert.strictEqual(typeof m.hash, 'string');
});

console.log('\nUnit: coherence_calculus.js exposes what the kernel reads');

test('whitlock() returns phase in degrees (the kernel reads .phase)', () => {
  const w = CC.whitlock(20);
  assert.strictEqual(typeof w.phase, 'number');
  assert.ok(!('phase_deg' in w));
});

// ---------------------------------------------------------------------------
// End-to-end: run FACE and KERNEL on a scratch copy and hit every route.
// ---------------------------------------------------------------------------

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

function localRequest(method, url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: u.port,
      path: u.pathname + u.search,
      method,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
      agent: false,
    }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, text: data }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitFor(url, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await localRequest('GET', url);
      if (r.status === 200) return true;
    } catch {}
    await sleep(150);
  }
  throw new Error(`timed out waiting for ${url}`);
}

async function runE2E() {
  console.log('\nEnd to end: FACE :7766 and KERNEL :7767 on a scratch copy');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost9-e2e-'));
  copyDir(SRC, path.join(scratch, 'src'));
  copyDir(path.join(ROOT, 'config'), path.join(scratch, 'config'));
  // This run covers the coherence path. No classifier is running here, so the scratch copy uses advisory mode.
  // Block-mode holds need the classifier sidecar: see tests/regression/quarantine_live.sh.
  { const cp = path.join(scratch, 'config', 'clf.json'); const cc = JSON.parse(fs.readFileSync(cp, 'utf8')); cc.mode = 'advisory'; fs.writeFileSync(cp, JSON.stringify(cc, null, 2)); }
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(scratch, 'node_modules'), 'dir');

  const face = spawn(process.execPath, [path.join(scratch, 'src', 'ghost_face.js')], { cwd: scratch, stdio: 'ignore' });
  const kernel = spawn(process.execPath, [path.join(scratch, 'src', 'ghost_kernel.js')], { cwd: scratch, stdio: 'ignore' });
  const cleanup = () => { try { face.kill(); } catch {} try { kernel.kill(); } catch {} };

  try {
    await waitFor('http://127.0.0.1:7766/state');
    await waitFor('http://127.0.0.1:7767/verify');

    const texts = [
      'We reviewed the quarterly data and found that revenue grew steadily across most regions this year',
      'The committee approved the new budget after a long discussion about staffing and office space',
      'Our team shipped the release on Tuesday and the monitoring dashboards stayed green all afternoon',
      'Rain moved in over the valley, and the river rose slowly through the night before the bridge closed',
      'The model converges when the residual drops below the tolerance and the gradient stays bounded',
      'She wrote the letter by hand, sealed it with wax, and left it on the kitchen table for her brother',
      'Three gates check the input before any scoring happens, and each gate reports a single verdict',
      'The harbor lights flickered as the ferry pulled away from the dock and turned toward the open water',
      'Engineers traced the fault to a stale cache entry that survived the deployment and kept serving old responses',
      'Quarterly reports arrived late because the finance team waited on three vendor invoices from March',
    ];

    let admitted = 0;
    for (const [i, text] of texts.entries()) {
      const r = await localRequest('POST', 'http://127.0.0.1:7766/devour', { text });
      const body = r.text;
      assert.strictEqual(r.status, 200, `POST /devour #${i + 1} returned ${r.status}: ${body.slice(0, 200)}`);
      assert.ok(!body.includes('undefined'), `POST /devour #${i + 1} response contains "undefined"`);
      if (JSON.parse(body).admitted) admitted++;
    }
    assert.strictEqual(admitted, texts.length, 'every test sentence should pass the coherence gate');
    console.log(`  ok    POST /devour: ${admitted}/${texts.length} admitted, no 500s`);

    const state = JSON.parse(fs.readFileSync(path.join(scratch, 'data', 'state.json'), 'utf8'));
    assert.ok(state.nodes.length > 0, 'state.json should hold nodes after ingest');
    console.log(`  ok    state.json holds ${state.nodes.length} nodes after the sweeps`);

    const faceGets = ['/state', '/nodes', '/taotie', '/void', '/benchmark', '/logs', '/archive'];
    for (const p of faceGets) {
      const r = await localRequest('GET', 'http://127.0.0.1:7766' + p);
      const body = r.text;
      assert.strictEqual(r.status, 200, `GET ${p} returned ${r.status}: ${body.slice(0, 160)}`);
      console.log(`  ok    GET ${p}`);
    }

    const sweep = await localRequest('POST', 'http://127.0.0.1:7766/taotie/sweep');
    assert.strictEqual(sweep.status, 200, `POST /taotie/sweep returned ${sweep.status}: ${sweep.text.slice(0, 160)}`);
    console.log('  ok    POST /taotie/sweep');

    const kernelGets = ['/recall?q=revenue', '/verify', '/nav?vertex=PPPP', '/ghostlet', '/bench'];
    for (const p of kernelGets) {
      const r = await localRequest('GET', 'http://127.0.0.1:7767' + p);
      const body = r.text;
      assert.strictEqual(r.status, 200, `GET ${p} returned ${r.status}: ${body.slice(0, 160)}`);
      console.log(`  ok    GET ${p}`);
    }

    const cmd = await localRequest('POST', 'http://127.0.0.1:7767/cmd', { cmd: 'dist' });
    assert.strictEqual(cmd.status, 200, `POST /cmd dist returned ${cmd.status}`);
    console.log('  ok    POST /cmd dist');
  } finally {
    cleanup();
  }
}

(async () => {
  try {
    await runE2E();
  } catch (err) {
    failed++;
    failures.push({ name: 'end to end', err });
    console.log(`  FAIL  end to end\n        ${err.message}`);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
