// ================================================================
// GHOST KERNEL  —  Port 7767  —  GHOST v9.0.1
// Bifurcated backend handler: Recall/Query side
// Polls shared state every 2 s; never writes directly.
// ================================================================
'use strict';

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const CC     = require('./coherence_calculus');
const T      = require('./tesseract');
const { classifyTier }  = require('./taotie');

const PORT       = 7767;
const DATA_DIR   = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const LOG_FILE   = path.join(DATA_DIR, 'ghost_kernel.log');
const POLL_MS    = 2_000;

function proxyFace(facePath) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port: 7766, path: facePath }, res => {
      let buf = '';
      res.on('data', d => { buf += d; });
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch { resolve({ raw: buf }); }
      });
    }).on('error', err => reject(err));
  });
}

let _state = { nodes: [], merkle_root: null, n: 0 };

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE))
      _state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {}
  return _state;
}

function log(msg) {
  const line = `[${new Date().toISOString()}] KERNEL ${msg}\n`;
  process.stdout.write(line);
  try { fs.appendFileSync(LOG_FILE, line); } catch {}
}

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type':                'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => buf += c);
    req.on('end',  () => { try { resolve(JSON.parse(buf || '{}')); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function verifyChain(nodes) {
  if (nodes.length === 0) return { status: 'EMPTY', root: null };
  let layer = nodes.map(n => n.hash);
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const pair = layer[i] + (layer[i + 1] || layer[i]);
      next.push(crypto.createHash('sha3-512').update(pair).digest('hex'));
    }
    layer = next;
  }
  const computed = layer[0];
  const stored   = _state.merkle_root;
  const status   = !stored ? 'EMPTY' : computed === stored ? 'PASS' : 'TAMPER';
  return { status, computed, stored };
}

const routes = {

  'GET /recall': async (req, res) => {
    const url    = new URL(req.url, `http://localhost:${PORT}`);
    const q      = (url.searchParams.get('q') || '').toLowerCase();
    const vertex = url.searchParams.get('vertex');
    const tier   = url.searchParams.get('tier');
    const limit  = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

    let nodes = _state.nodes;
    if (q)      nodes = nodes.filter(n => n.content.toLowerCase().includes(q));
    if (vertex) nodes = nodes.filter(n => n.vertex === vertex);
    if (tier)   nodes = nodes.filter(n => (n.tier || 'STM') === tier);

    const results = nodes.slice(-limit).reverse().map(n => ({
      hash:        n.hash.slice(0, 24) + '…',
      content:     n.content.slice(0, 200),
      mu:          n.mu,
      tier:        n.tier || 'STM',
      vertex:      n.vertex,
      merge_count: n.merge_count || 1,
      ts:          n.ts
    }));
    return json(res, { q, vertex, tier, count: results.length, results });
  },

  'GET /verify': async (req, res) => {
    const result = verifyChain(_state.nodes);
    return json(res, { ...result, n: _state.nodes.length, checked_at: Date.now() });
  },

  'GET /nav': async (req, res) => {
    const url    = new URL(req.url, `http://localhost:${PORT}`);
    const vertex = (url.searchParams.get('vertex') || '').toUpperCase();
    const valid  = T.VERTICES.includes(vertex);
    const nodes  = valid ? _state.nodes.filter(n => n.vertex === vertex) : _state.nodes;
    const dist   = T.vertexDistribution(_state.nodes);
    const edges  = T.tesseractEdges();
    const neigh  = valid ? T.vertexNeighbors(vertex) : [];

    return json(res, {
      current_vertex:   valid ? vertex : null,
      vertex_count:     valid ? nodes.length : null,
      neighbors:        neigh,
      distribution:     dist,
      total_nodes:      _state.nodes.length,
      tesseract_edges:  edges.length,
      dominant_vertex:  T.dominantVertex(_state.nodes)
    });
  },

  'GET /ghostlet': async (req, res) => {
    const n   = _state.n;
    const wc  = CC.whitlock(n);
    const stm = _state.nodes.filter(n => (n.tier || 'STM') === 'STM').length;
    const ltm = _state.nodes.filter(n => (n.tier || 'STM') === 'LTM').length;

    let advice = '';
    if (n === 0)       advice = 'GHOST kernel is empty. Begin devouring with POST /devour.';
    else if (n < 4)    advice = `Early kernel (n=${n}). Feed high-coherence entries to seed the Tesseract.`;
    else if (wc.magnitude < 1.0) advice = `Pre-unity phase. ${Math.ceil(16.52 - n)} entries to unity crossing at n≈17.`;
    else if (Math.abs(wc.phase_deg - 45) < 5) advice = `Phase ≈ 45°: equal-component balance. Kernel is harmonically centered.`;
    else advice = `n=${n}, |W|=${wc.magnitude.toFixed(5)}, φ=${wc.phase_deg.toFixed(2)}°. Carrier: ${wc.freq_mhz.toFixed(3)} MHz.`;

    return json(res, {
      n, advice, whitlock: wc, stm_count: stm, ltm_count: ltm,
      merkle_root: _state.merkle_root ? _state.merkle_root.slice(0, 32) + '…' : null
    });
  },

  'POST /cmd': async (req, res) => {
    const body = await readBody(req);
    const cmd  = (body.cmd || '').trim().toLowerCase();
    const args = body.args || {};

    const handlers = {
      'status':   () => ({ face_port: 7766, kernel_port: 7767, n: _state.n, merkle: _state.merkle_root, version: '9.0.1' }),
      'verify':   () => verifyChain(_state.nodes),
      'wc':       () => CC.whitlock(_state.n),
      'dist':     () => T.vertexDistribution(_state.nodes),
      'dominant': () => ({ vertex: T.dominantVertex(_state.nodes) }),
      'count':    () => ({ n: _state.n }),
      'void':     () => proxyFace('/void')
    };

    const handler = handlers[cmd];
    if (!handler) return json(res, { error: `Unknown command: ${cmd}`, available: Object.keys(handlers) }, 400);
    return json(res, { cmd, result: await handler() });
  },

  'GET /bench': async (req, res) => {
    const state  = _state;
    const t0     = performance.now();
    for (const n of state.nodes.slice(-50)) {
      CC.whitlock(n.ts || 0);
      T.routeVertex(n.scores || {});
    }
    const dt = performance.now() - t0;
    const verify = verifyChain(state.nodes);
    return json(res, {
      n: state.n, verify: verify.status, sample_ops: Math.min(50, state.nodes.length),
      elapsed_ms: parseFloat(dt.toFixed(3)), whitlock_n: CC.whitlock(state.n)
    });
  }
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*',
                         'Access-Control-Allow-Methods': 'GET,POST',
                         'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  const key     = `${req.method} ${req.url.split('?')[0]}`;
  const handler = routes[key];
  if (handler) {
    try { await handler(req, res); }
    catch (e) {
      log(`ERROR ${key}: ${e.message}`);
      json(res, { error: e.message }, 500);
    }
  } else {
    json(res, { error: 'Not found', routes: Object.keys(routes) }, 404);
  }
});

setInterval(loadState, POLL_MS);
loadState();

server.listen(PORT, '127.0.0.1', () => {
  log(`GHOST KERNEL v9.0.1 listening on http://127.0.0.1:${PORT}`);
  log(`Recall, verify, nav, ghostlet, cmd — state poll: every ${POLL_MS}ms`);
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} in use. Stop existing handler: pkill -f ghost_kernel`);
    process.exit(1);
  }
  throw e;
});
