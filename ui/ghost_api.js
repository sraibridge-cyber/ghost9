// GHOST API CLIENT v1.0 — CSS Labs | Offline/Online Unified API
// Maps every FACE (7766) and KERNEL (7767) endpoint
// Offline: local simulation with identical response shapes
// Online: direct backend connection with auto-resync queue

const GHOST = {
  FACE: 'http://192.0.0.8:7766',
  KERN: 'http://192.0.0.8:7767',
  VERSION: 'v9.1.0',
  SEAL: '2026-07-04_Tulsa_OK'
};

// ============================================
// OFFLINE STATE SIMULATION
// ============================================
const _offline = {
  nodes: [],
  n: 0,
  merkle_root: null,
  archive: [],
  logs: [],
  offerings: JSON.parse(localStorage.getItem('gh_offerings') || '[]'),
  lastSync: 0,
  online: false
};

// Simple CC simulation for offline mode
function _simulateCC(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 2);
  const wordCount = words.length;
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const diversity = uniqueWords.size / Math.max(wordCount, 1);
  
  // Domain scores based on text analysis
  const scores = {
    signal: Math.min(0.95, 0.5 + wordCount * 0.02),
    energy: Math.min(0.99, 0.6 + diversity * 0.3),
    temporal: 0.85,
    spatial: Math.min(0.95, 0.5 + text.length * 0.001),
    cognitive: Math.min(0.99, 0.7 + diversity * 0.2),
    ethical: 0.92,
    declarative: Math.min(0.98, 0.6 + wordCount * 0.015),
    novelty: Math.min(0.97, 0.5 + uniqueWords.size * 0.02)
  };
  
  const mu = Math.pow(Object.values(scores).reduce((a,b) => a*b, 1), 1/8);
  const tau = 0.9995;
  const pass = mu >= tau;
  
  return { mu, pass, scores, tau, version: 'v3.1.0', tier: pass ? (mu >= 0.9998 ? 'LTM' : 'STM') : null };
}

function _simulateWhitlock(n) {
  const w = (n + 4) / 17;
  const phi = Math.atan2(4, n) * (180 / Math.PI);
  const freq = 1 / (2 * Math.PI * Math.sqrt(w * w + 1));
  return { magnitude: parseFloat(w.toFixed(5)), phase_deg: parseFloat(phi.toFixed(2)), freq_mhz: parseFloat((freq * 1000).toFixed(3)) };
}

function _simulateVertex(scores) {
  const keys = Object.keys(scores || {});
  if (!keys.length) return 'PPPP';
  const max = Math.max(...Object.values(scores));
  const dom = keys.find(k => scores[k] === max) || 'signal';
  const map = { signal:'P', energy:'P', temporal:'T', spatial:'S', cognitive:'C', ethical:'E', declarative:'D', novelty:'N' };
  return (map[dom] || 'P') + 'PPP';
}

// ============================================
// UNIFIED FETCH — tries backend, falls back to offline
// ============================================
async function ghostFetch(base, path, opts = {}) {
  const url = base + path;
  const isFace = base === GHOST.FACE;
  
  try {
    const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(opts.timeout || 3000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    _offline.online = true;
    _offline.lastSync = Date.now();
    return { success: true, data, source: 'backend', offline: false };
  } catch (e) {
    _offline.online = false;
    // Return offline simulation
    const sim = _simulateOffline(path, opts, isFace);
    return { success: true, data: sim, source: 'offline', offline: true, error: e.message };
  }
}

function _simulateOffline(path, opts, isFace) {
  if (isFace) {
    if (path === '/state') {
      const stm = _offline.nodes.filter(n => (n.tier || 'STM') === 'STM');
      const ltm = _offline.nodes.filter(n => (n.tier || 'STM') === 'LTM');
      const wc = _simulateWhitlock(_offline.n);
      return {
        n: _offline.n, stm_count: stm.length, ltm_count: ltm.length,
        capacity_pct: (_offline.n / 10000 * 100).toFixed(1),
        merkle_root: _offline.merkle_root, whitlock: wc,
        taotie_status: { active: false, void_count: 0 },
        spatial_web: { nodes: _offline.n, edges: 0, learningCycles: 0 },
        archive_count: _offline.archive.length,
        sqlite_warn_at: 8000, sqlite_needed: _offline.n >= 8000
      };
    }
    if (path === '/nodes') {
      return { total: _offline.nodes.length, offset: 0, limit: 50, nodes: _offline.nodes.slice(0, 50) };
    }
    if (path === '/devour' && opts.method === 'POST') {
      const body = JSON.parse(opts.body || '{}');
      const text = (body.text || '').trim();
      const cc = _simulateCC(text);
      if (!cc.pass) {
        return {
          admitted: false, layer: 1, reason: 'CC gate: μ < τ (offline)',
          mu: cc.mu, tau: cc.tau, scores: cc.scores, whitlock: _simulateWhitlock(_offline.n),
          elapsed_ms: 0.1
        };
      }
      const node = {
        hash: 'h_' + Math.random().toString(36).slice(2, 10),
        content: text.slice(0, 200),
        mu: cc.mu, tier: cc.tier, vertex: _simulateVertex(cc.scores),
        ts: Date.now(), merge_count: 1
      };
      _offline.nodes.push(node);
      _offline.n = _offline.nodes.length;
      return {
        admitted: true, layer: 2, tier: cc.tier, vertex: node.vertex,
        mu: cc.mu, hash: node.hash, hash_preview: node.hash.slice(0, 16) + '…',
        n: _offline.n, merkle_root: null,
        whitlock: _simulateWhitlock(_offline.n),
        spatial_web: { nodes: _offline.n, edges: 0, edges_added: 0, learning_cycles: 0 },
        taotie: null, elapsed_ms: 0.5
      };
    }
    if (path === '/taotie') {
      return { ..._offline.taotie_status, current_n: _offline.n, void_stats: {} };
    }
    if (path === '/logs') {
      return { lines: _offline.logs.slice(-100) };
    }
    if (path === '/archive') {
      return { total: _offline.archive.length, recent: _offline.archive.slice(-20).reverse() };
    }
    if (path === '/benchmark') {
      return {
        cc_pipeline_ms: 0.05, sha3_512_ms: 0.02, merkle_1k_ms: 1.5,
        node: 'offline', current_nodes: _offline.n, spatial_web: { nodes: _offline.n, edges: 0, learningCycles: 0 }
      };
    }
    if (path === '/void') {
      return { void_nodes: 0, spatial_clusters: [], cluster_sizes: [], proximity_map: {}, spatial_web: { nodes: _offline.n, edges: 0 } };
    }
  } else {
    // KERNEL offline simulation
    if (path === '/recall') {
      const limit = 20;
      const results = _offline.nodes.slice(-limit).reverse().map(n => ({
        hash: n.hash.slice(0, 16) + '…', content: n.content.slice(0, 200),
        mu: n.mu, tier: n.tier || 'STM', vertex: n.vertex, merge_count: n.merge_count || 1, ts: n.ts
      }));
      return { q: '', vertex: null, tier: null, count: results.length, results };
    }
    if (path === '/verify') {
      return { status: 'OK', chain_valid: true, n: _offline.n, checked_at: Date.now() };
    }
    if (path === '/nav') {
      return {
        current_vertex: null, vertex_count: null, neighbors: [],
        distribution: { P: _offline.n, T: 0, S: 0, C: 0, E: 0, D: 0, N: 0 },
        total_nodes: _offline.n, tesseract_edges: 0, dominant_vertex: 'P'
      };
    }
    if (path === '/ghostlet') {
      const n = _offline.n;
      const wc = _simulateWhitlock(n);
      let advice = '';
      if (n === 0) advice = 'GHOST kernel is empty. Begin devouring.';
      else if (n < 4) advice = `Early kernel (n=${n}). Feed high-coherence entries.`;
      else if (wc.magnitude < 1.0) advice = `Pre-unity phase. ${Math.ceil(16.52 - n)} entries to unity.`;
      else advice = `n=${n}, |W|=${wc.magnitude.toFixed(5)}, φ=${wc.phase_deg.toFixed(2)}°.`;
      return { n, advice, whitlock: wc, stm_count: n, ltm_count: 0, merkle_root: null };
    }
    if (path === '/bench') {
      return { n: _offline.n, verify: 'OK', sample_ops: Math.min(50, _offline.n), elapsed_ms: 0.1, whitlock_n: _simulateWhitlock(_offline.n) };
    }
    if (path === '/cmd' && opts.method === 'POST') {
      const body = JSON.parse(opts.body || '{}');
      return { cmd: body.cmd || 'unknown', result: { status: 'offline', n: _offline.n } };
    }
  }
  return { error: 'Unknown endpoint (offline)', path, method: opts.method || 'GET' };
}

// ============================================
// RESYNC QUEUE
// ============================================
function queueOffering(offering) {
  _offline.offerings.unshift(offering);
  if (_offline.offerings.length > 50) _offline.offerings.pop();
  localStorage.setItem('gh_offerings', JSON.stringify(_offline.offerings));
}

async function resyncOfferings() {
  if (!_offline.online || !_offline.offerings.length) return { synced: 0 };
  let synced = 0;
  const remaining = [];
  for (const off of _offline.offerings) {
    try {
      const r = await fetch(GHOST.FACE + '/devour', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: off.text, ts: off.ts }),
        signal: AbortSignal.timeout(5000)
      });
      if (r.ok) { synced++; continue; }
    } catch (e) {}
    remaining.push(off);
  }
  _offline.offerings = remaining;
  localStorage.setItem('gh_offerings', JSON.stringify(_offline.offerings));
  return { synced, remaining: remaining.length };
}

// ============================================
// CONNECTION STATUS
// ============================================
async function checkStatus() {
  const face = await ghostFetch(GHOST.FACE, '/state', { timeout: 2000 });
  const kern = await ghostFetch(GHOST.KERN, '/bench', { timeout: 2000 });
  return {
    face: { online: !face.offline, ...face.data },
    kernel: { online: !kern.offline, ...kern.data },
    anyOnline: !face.offline || !kern.offline,
    offeringsQueued: _offline.offerings.length
  };
}

// ============================================
// EXPORTS
// ============================================
window.GHOST = GHOST;
window.ghostFetch = ghostFetch;
window.checkStatus = checkStatus;
window.queueOffering = queueOffering;
window.resyncOfferings = resyncOfferings;
window._offline = _offline;
