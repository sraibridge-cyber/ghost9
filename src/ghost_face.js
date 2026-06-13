// ================================================================
// GHOST FACE  —  Port 7766  —  GHOST v9.0.9
// Bifurcated backend handler: Ingest side
//
// Three-layer devouring pipeline:
//   Layer 1 — CC Gate:    evaluate μ, reject if μ < τ = 0.9995
//   Layer 2 — Separation: classify STM (μ < 0.9998) / LTM (μ ≥ 0.9998)
//   Layer 3 — Taotie:     joint spectral+spatial merge at n=7 (OP3-informed)
//
// Fixes applied 2026-06-13:
//   [FIX-ATOMIC] atomicWrite defined 3x (2 nested in ensureDataDir, 1 module scope) — deduplicated to 1
// ================================================================
'use strict';

const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const CC      = require('./coherence_calculus');
const T       = require('./tesseract');
const { classifyTier, VoidSpace } = require('./taotie');
const { SpatialWeb }              = require('./spatial_web');

const PORT         = 7766;
const DATA_DIR     = path.join(__dirname, '..', 'data');
const STATE_FILE   = path.join(DATA_DIR, 'state.json');
const ARCHIVE_FILE = path.join(DATA_DIR, 'archive.json');
const WEB_FILE     = path.join(DATA_DIR, 'spatial_web.json');
const MAX_NODES    = 10_000;
const SQLITE_WARN  = 8_000;
const LOG_FILE     = path.join(DATA_DIR, 'ghost_face.log');
const WEB_SAVE_INTERVAL = 50;

const void_space = new VoidSpace(MAX_NODES);
let web          = loadSpatialWeb();
let ingestSince  = 0;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function atomicWrite(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
}

function loadState() {
  ensureDataDir();
  if (!fs.existsSync(STATE_FILE)) return { nodes: [], merkle_root: null, n: 0 };
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { nodes: [], merkle_root: null, n: 0 }; }
}

function saveState(state) {
  ensureDataDir();
  atomicWrite(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadSpatialWeb() {
  ensureDataDir();
  if (fs.existsSync(WEB_FILE)) {
    try {
      const snap = JSON.parse(fs.readFileSync(WEB_FILE, 'utf8'));
      const w    = SpatialWeb.deserialize(snap);
      console.log(`[FACE] SpatialWeb loaded — ${w.stats().nodes} nodes, ${w.stats().learningCycles} learning cycles`);
      return w;
    } catch (e) {
      console.log(`[FACE] SpatialWeb load failed (${e.message}), starting fresh`);
    }
  }
  return new SpatialWeb();
}

function saveSpatialWeb() {
  try {
    atomicWrite(WEB_FILE, JSON.stringify(web.serialize(), null, 2));
  } catch (e) {
    log(`WARN: could not save spatial web: ${e.message}`);
  }
}

function archiveNodes(nodes) {
  if (!nodes || nodes.length === 0) return;
  ensureDataDir();
  let existing = [];
  if (fs.existsSync(ARCHIVE_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8')); } catch {}
  }
  const ts = Date.now();
  const records = nodes.map(n => ({ ...n, archived_at: ts }));
  atomicWrite(ARCHIVE_FILE, JSON.stringify([...existing, ...records], null, 2));
}

function computeMerkle(nodes) {
  if (nodes.length === 0) return null;
  let layer = nodes.map(n => n.hash);
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const pair = layer[i] + (layer[i + 1] || layer[i]);
      next.push(crypto.createHash('sha3-512').update(pair).digest('hex'));
    }
    layer = next;
  }
  return layer[0];
}

function seal(content, ts) {
  return crypto.createHash('sha3-512').update(`${content}|${ts}`).digest('hex');
}

function log(msg) {
  const line = `[${new Date().toISOString()}] FACE ${msg}\n`;
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

function runCCGate(text, state, opts = {}) {
  const recent = state.nodes.slice(-10);
  return CC.evaluate(text, {
    ts:        opts.ts || Date.now(),
    context:   state.nodes.slice(-5).map(n => n.content),
    recent,
    nodeCount: state.n
  });
}

function runSeparation(ccResult, text, ts) {
  const tier   = classifyTier(ccResult.mu);
  const vertex = T.routeVertex(ccResult.scores);
  const hash   = seal(text, ts);
  const node   = {
    id: hash, hash, content: text, mu: ccResult.mu, tier,
    scores: ccResult.scores, vertex, merge_count: 1,
    parent_ids: null, merkle_root: null, ts
  };
  return { tier, vertex, hash, node };
}

function updateSpatialWeb(node) {
  const result = web.upsert(node);
  ingestSince++;
  if (ingestSince >= WEB_SAVE_INTERVAL) {
    saveSpatialWeb();
    ingestSince = 0;
  }
  return result;
}

function runTaotie(state) {
  if (!void_space.needsSweep(state.nodes.length)) return null;

  log(`Taotie sweep triggered — nodes: ${state.nodes.length}/${MAX_NODES}`);
  const t0 = performance.now();

  const ltmIds = new Set(
    state.nodes.filter(n => (n.tier || classifyTier(n.mu)) === 'LTM').map(n => n.id || n.hash)
  );
  web.computeVoid(ltmIds);

  const result = void_space.sweep(state.nodes, web);

  if (!result.skipped) {
    archiveNodes(result.devoured);
    for (const n of result.devoured) {
      web.remove(n.id || n.hash);
    }
    for (const n of result.merged) {
      if (!n.id) n.id = n.hash;
      web.upsert(n);
    }
    saveSpatialWeb();
    ingestSince = 0;
  }

  const dt = (performance.now() - t0).toFixed(2);
  log(`Taotie sweep — ${result.before}→${result.after} nodes, devoured: ${result.devoured_count}, clusters: ${result.clusterCount}, strategy: ${result.strategy} (${dt}ms)`);

  return result;
}

const routes = {

  'POST /devour': async (req, res) => {
    const t0   = performance.now();
    const body = await readBody(req);
    const text = (body.text || '').trim();

    if (!text) return json(res, { error: 'text required' }, 400);

    const state = loadState();
    const ts    = body.ts || Date.now();

    const cc = runCCGate(text, state, { ts });
    if (!cc.pass) {
      log(`REJECT μ=${cc.mu.toFixed(6)} "${text.slice(0, 60)}"`);
      return json(res, {
        admitted: false, layer: 1, reason: 'CC gate: μ < τ',
        mu: cc.mu, tau: cc.tau, scores: cc.scores, whitlock: cc.whitlock,
        elapsed_ms: parseFloat((performance.now() - t0).toFixed(3))
      });
    }

    const sep = runSeparation(cc, text, ts);
    state.nodes.push(sep.node);
    state.n = state.nodes.length;
    sep.node.id = `${sep.node.hash}_${state.n - 1}`;

    const webResult = updateSpatialWeb(sep.node);

    let taotie_report = null;
    const sweep = runTaotie(state);
    if (sweep && !sweep.skipped) {
      state.nodes   = sweep.survivors;
      state.n       = sweep.survivors.length;
      taotie_report = {
        swept: true, before: sweep.before, after: sweep.after,
        devoured: sweep.devoured_count, clusters: sweep.clusterCount,
        strategy: sweep.strategy
      };
    }

    state.merkle_root = computeMerkle(state.nodes);

    if (state.nodes.length >= SQLITE_WARN) {
      log(`WARNING: ${state.nodes.length} nodes — consider SQLite migration`);
    }

    saveState(state);

    const elapsed = parseFloat((performance.now() - t0).toFixed(3));
    log(`ADMIT tier=${sep.tier} vertex=${sep.vertex} μ=${cc.mu.toFixed(6)} n=${state.n} edges_added=${webResult.edgesAdded} (${elapsed}ms)`);

    return json(res, {
      admitted: true, layer: 2, tier: sep.tier, vertex: sep.vertex,
      mu: cc.mu, hash: sep.hash, hash_preview: sep.hash.slice(0, 32) + '…',
      n: state.n, merkle_root: state.merkle_root ? state.merkle_root.slice(0, 32) + '…' : null,
      whitlock: cc.whitlock,
      spatial_web: {
        nodes: web.stats().nodes, edges: web.stats().edges,
        edges_added: webResult.edgesAdded, learning_cycles: web.stats().learningCycles
      },
      taotie: taotie_report, elapsed_ms: elapsed
    });
  },

  'GET /state': async (req, res) => {
    const state = loadState();
    const stm   = state.nodes.filter(n => (n.tier || 'STM') === 'STM');
    const ltm   = state.nodes.filter(n => (n.tier || 'STM') === 'LTM');
    const n     = state.nodes.length;
    const wc    = CC.whitlock(n);

    let archiveCount = 0;
    if (fs.existsSync(ARCHIVE_FILE)) {
      try { archiveCount = JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8')).length; } catch {}
    }

    return json(res, {
      n, stm_count: stm.length, ltm_count: ltm.length,
      capacity_pct: (n / MAX_NODES * 100).toFixed(1),
      merkle_root: state.merkle_root, whitlock: wc,
      taotie_status: void_space.status(), spatial_web: web.stats(),
      archive_count: archiveCount, sqlite_warn_at: SQLITE_WARN,
      sqlite_needed: n >= SQLITE_WARN
    });
  },

  'GET /nodes': async (req, res) => {
    const state  = loadState();
    const url    = new URL(req.url, `http://localhost:${PORT}`);
    const limit  = Math.min(parseInt(url.searchParams.get('limit')  || '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const tier   = url.searchParams.get('tier');
    let nodes    = state.nodes;
    if (tier)    nodes = nodes.filter(n => (n.tier || 'STM') === tier);
    const page   = nodes.slice(offset, offset + limit);
    return json(res, {
      total: nodes.length, offset, limit,
      nodes: page.map(n => ({
        hash: n.hash.slice(0, 16) + '…', mu: n.mu, tier: n.tier || 'STM',
        vertex: n.vertex, merge_count: n.merge_count || 1,
        merkle_root: n.merkle_root ? n.merkle_root.slice(0, 16) + '…' : null, ts: n.ts
      }))
    });
  },

  'GET /taotie': async (req, res) => {
    const state = loadState();
    const stats = void_space.voidStats(state.nodes, web);
    return json(res, {
      ...void_space.status(), current_n: state.nodes.length, void_stats: stats
    });
  },

  'POST /taotie/sweep': async (req, res) => {
    const state = loadState();
    const t0    = performance.now();

    const ltmIds = new Set(
      state.nodes.filter(n => (n.tier || classifyTier(n.mu)) === 'LTM').map(n => n.id || n.hash)
    );
    web.computeVoid(ltmIds);

    const result = void_space.sweep(state.nodes, web);

    if (!result.skipped) {
      archiveNodes(result.devoured);
      for (const n of result.devoured) web.remove(n.id || n.hash);
      for (const n of result.merged) {
        if (!n.id) n.id = n.hash;
        web.upsert(n);
      }
      saveSpatialWeb();

      state.nodes       = result.survivors;
      state.n           = result.survivors.length;
      state.merkle_root = computeMerkle(state.nodes);
      saveState(state);
    }

    return json(res, {
      skipped: result.skipped, before: result.before, after: result.after,
      devoured: result.devoured_count, clusterCount: result.clusterCount,
      strategy: result.strategy, merkle_root: state.merkle_root,
      spatial_web: web.stats(), elapsed_ms: parseFloat((performance.now() - t0).toFixed(3))
    });
  },

  'GET /void': async (req, res) => {
    const state  = loadState();
    const ltmIds = new Set(
      state.nodes.filter(n => (n.tier || 'STM') === 'LTM').map(n => n.id || n.hash)
    );
    const voidIds      = web.computeVoid(ltmIds);
    const spatClusters = web.spatialClusters(voidIds);
    const proxMap      = web.voidProximityMap(5);
    const webStats     = web.stats();
    return json(res, {
      void_nodes: voidIds.size, spatial_clusters: spatClusters.length,
      cluster_sizes: spatClusters.map(c => c.length),
      proximity_map: proxMap, spatial_web: webStats
    });
  },

  'GET /logs': async (req, res) => {
    try {
      const raw   = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = raw.trim().split('\n').slice(-100);
      return json(res, { lines });
    } catch {
      return json(res, { lines: [] });
    }
  },

  'GET /archive': async (req, res) => {
    ensureDataDir();
    let archive = [];
    if (fs.existsSync(ARCHIVE_FILE)) {
      try { archive = JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8')); } catch {}
    }
    const url    = new URL(req.url, `http://localhost:${PORT}`);
    const limit  = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const recent = archive.slice(-limit).reverse();
    return json(res, {
      total: archive.length,
      recent: recent.map(n => ({
        hash: (n.hash || '').slice(0, 16) + '…', mu: n.mu,
        tier: n.tier || 'STM', merge_count: n.merge_count || 1,
        merkle_root: n.merkle_root ? n.merkle_root.slice(0, 16) + '…' : null,
        archived_at: n.archived_at
      }))
    });
  },

  'GET /benchmark': async (req, res) => {
    const ITERS = 100;
    const text  = 'This is a benchmark entry for GHOST v9.0.9 performance measurement.';
    const state = loadState();
    const start = performance.now();
    for (let i = 0; i < ITERS; i++) CC.evaluate(text, { nodeCount: i });
    const ccMs  = (performance.now() - start) / ITERS;

    const s2    = performance.now();
    for (let i = 0; i < ITERS; i++) seal(text, Date.now());
    const shaMs = (performance.now() - s2) / ITERS;

    const s3    = performance.now();
    const dummy = Array.from({length:1000}, (_, i) => ({ hash: seal(String(i), i) }));
    computeMerkle(dummy);
    const merkMs = performance.now() - s3;

    return json(res, {
      cc_pipeline_ms: parseFloat(ccMs.toFixed(4)),
      sha3_512_ms: parseFloat(shaMs.toFixed(4)),
      merkle_1k_ms: parseFloat(merkMs.toFixed(2)),
      node: process.version, current_nodes: state.n, spatial_web: web.stats()
    });
  },

  'DELETE /reset': async (req, res) => {
    saveState({ nodes: [], merkle_root: null, n: 0 });
    web = new SpatialWeb();
    saveSpatialWeb();
    log('State reset (nodes + spatial web cleared; archive preserved)');
    return json(res, { ok: true, message: 'Active state cleared. Archive preserved.' });
  }
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
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

server.listen(PORT, '127.0.0.1', () => {
  const ws = web.stats();
  log(`GHOST FACE v9.0.9 listening on http://127.0.0.1:${PORT}`);
  log(`3-Layer pipeline: CC Gate → STM/LTM Separation → Taotie (trigger: ${void_space.triggerAt})`);
  log(`SpatialWeb: ${ws.nodes} nodes, ${ws.edges} edges, ${ws.learningCycles} learning cycles`);
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} in use. Stop existing handler: pkill -f ghost_face`);
    process.exit(1);
  }
  throw e;
});
