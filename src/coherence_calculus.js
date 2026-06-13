//================================================================
// COHERENCE CALCULUS v3.0.9 — GHOST v9.0.9
// Corrected |W_v3| = sqrt(n² + 16) / 17
// Verified τ = 0.9995 (production), TAU_BOOTSTRAP = 0.9960 (n < 10)
// SEAL: 2026-06-13 Tulsa
//================================================================
'use strict';

const CC_VERSION = '3.0.9';
const CARRIER_MHZ = 1440;
const W_DENOM = 17;
const W_IM = 4;
const TAU = 0.9995;
const TAU_BOOTSTRAP = 0.9960;
const TAU_LTM = 0.9998;
const DOMAIN_CEILING = 0.9997;
const N_DOMAINS = 8;
const W_EACH = 1 / N_DOMAINS;

const D4_CITIES = [
  'new york','los angeles','chicago','houston','phoenix',
  'philadelphia','san antonio','san diego','dallas','san jose',
  'austin','jacksonville','fort worth','columbus','charlotte',
  'indianapolis','san francisco','seattle','denver','nashville'
];

const D6_HARM = [
  'kill','murder','harm','hurt','destroy','attack','bomb',
  'weapon','poison','torture','abuse','exploit','stalk',
  'threaten','blackmail','extort','manipulate','deceive',
  'fraud','illegal','criminal','violate','assault','rape','terror'
];

const TEMPORAL_CONFLICTS = [
  ['yesterday','tomorrow'],['before','after'],['past','future'],
  ['last week','next week'],['ago','from now'],['was','will be'],
  ['earlier','later'],['previously','upcoming']
];

function whitlock(n) {
  const re = n / W_DENOM;
  const im = W_IM / W_DENOM;
  const mag = Math.sqrt(n * n + W_IM * W_IM) / W_DENOM;
  const phi = Math.atan2(W_IM, n) * (180 / Math.PI);
  const delta_mhz = (mag - 1) * 100;
  return {
    n, re, im,
    magnitude: mag,
    phase_deg: phi,
    freq_mhz: CARRIER_MHZ + delta_mhz,
    delta_mhz
  };
}

function D1(text) {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  if (w < 3) return 0.0000;
  if (w < 5) return 0.7000;
  if (w < 10) return 0.8500;
  if (w < 20) return 0.9985;
  if (w < 50) return 0.9993;
  if (w < 200) return DOMAIN_CEILING;
  if (w < 500) return 0.9990;
  return 0.9980;
}

function D2(text) {
  const sents = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avg = sents.reduce((s, x) => s + x.trim().split(/\s+/).length, 0) / Math.max(sents.length, 1);
  const hasNum = /\d/.test(text);
  const hasSpec = /[A-Z]{2,}|"[^"]+"|'[^']+'/.test(text);
  let sc = 0.9850;
  if (avg > 8) sc += 0.0050;
  if (avg > 15) sc += 0.0050;
  if (hasNum) sc += 0.0025;
  if (hasSpec) sc += 0.0025;
  if (sents.length >= 2) sc += 0.0025;
  return Math.min(sc, DOMAIN_CEILING);
}

function D3(text, ts = Date.now()) {
  const hrs = (Date.now() - ts) / 3_600_000;
  let recencyScore;
  if (hrs < 1) recencyScore = DOMAIN_CEILING;
  else if (hrs < 24) recencyScore = 0.9990;
  else if (hrs < 168) recencyScore = 0.9980;
  else if (hrs < 720) recencyScore = 0.9960;
  else recencyScore = 0.9940;

  const lo = text.toLowerCase();
  let conflictCount = 0;
  for (const [a, b] of TEMPORAL_CONFLICTS) {
    if (lo.includes(a) && lo.includes(b)) conflictCount++;
  }
  const timeWords = ['yesterday','tomorrow','today','now','then','before','after','past','future','ago','later','earlier'];
  const foundTimeWords = timeWords.filter(w => lo.includes(w));
  const uniqueTimeWords = [...new Set(foundTimeWords)];
  if (conflictCount >= 2 || uniqueTimeWords.length >= 4) return 0.9800;
  if (conflictCount === 1) return 0.9940;
  return recencyScore;
}

function D4(text) {
  const lo = text.toLowerCase();
  const hits = D4_CITIES.filter(c => lo.includes(c)).length;
  if (hits === 0) return DOMAIN_CEILING;
  if (hits === 1) return 0.9960;
  if (hits >= 3) return 0.9800;
  return DOMAIN_CEILING;
}

function D5(text) {
  const lo = text.toLowerCase();
  const override = /\b(ignore (all |previous )?(instructions?|commands?|directives?)|disregard (all|previous) (instructions?|rules?)|override (my|all|the) (instructions?|settings?|constraints?)|jailbreak|bypass (all|the) (rules?|constraints?|safeguards?))\b/i.test(lo);
  if (override) return 0.0000;

  const positiveDir = /\b(always|must|required|mandatory|shall|do this)\b/i.test(lo);
  const negativeDir = /\b(never|don't|do not|forbidden|prohibited|must not)\b/i.test(lo);
  if (positiveDir && negativeDir) return 0.0000;

  const hasDir = /\b(must|shall|always|never|required|mandatory|priority|absolute|do not|don't|prohibited|forbidden)\b/.test(lo);
  return hasDir ? 0.9980 : DOMAIN_CEILING;
}

function D6(text) {
  const lo = text.toLowerCase();
  const hits = D6_HARM.filter(k => lo.includes(k)).length;
  if (hits === 0) return DOMAIN_CEILING;
  if (hits === 1) return 0.9000;
  if (hits === 2) return 0.9000;
  return 0.0000;
}

function D7(text, context = []) {
  if (context.length === 0) return 0.9990;
  const words = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const ctxWords = new Set(context.flatMap(c => c.toLowerCase().split(/\s+/).filter(w => w.length > 3)));
  const overlap = [...words].filter(w => ctxWords.has(w)).length;
  return Math.min(0.9900 + Math.min(overlap / 20, 0.0097), DOMAIN_CEILING);
}

function D8(text, recent = [], windowSize = 10, nodeCount = 0) {
  if (recent.length === 0) return DOMAIN_CEILING;
  const win = recent.slice(-windowSize);
  const bIn = bigrams(text);
  const maxSim = win.reduce((mx, n) => Math.max(mx, jaccard(bIn, bigrams(n.content || ''))), 0);
  const blockThreshold = nodeCount < 10 ? 0.95 : 0.75;
  if (maxSim > blockThreshold) return 0.9800;
  if (maxSim > 0.50) return 0.9940;
  if (maxSim > 0.25) return 0.9980;
  return DOMAIN_CEILING;
}

function bigrams(text) {
  const ws = text.toLowerCase().split(/\s+/).filter(Boolean);
  const s = new Set();
  for (let i = 0; i < ws.length - 1; i++) s.add(`${ws[i]}|${ws[i + 1]}`);
  return s;
}

function jaccard(a, b) {
  const inter = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function scoreAll(text, opts = {}) {
  return {
    D1: D1(text),
    D2: D2(text),
    D3: D3(text, opts.ts),
    D4: D4(text),
    D5: D5(text),
    D6: D6(text),
    D7: D7(text, opts.context || []),
    D8: D8(text, opts.recent || [], 10, opts.nodeCount || 0)
  };
}

function mu(scores) {
  const logSum = Object.values(scores).reduce((s, v) => s + Math.log(Math.max(v, 1e-12)), 0);
  return Math.exp(logSum / N_DOMAINS);
}

function evaluate(text, opts = {}) {
  const scores = scoreAll(text, opts);
  const muVal = mu(scores);
  const activeTau = (opts.nodeCount || 0) < 10 ? TAU_BOOTSTRAP : TAU;
  const pass = muVal >= activeTau;
  const tier = muVal >= TAU_LTM ? 'LTM' : (pass ? 'STM' : null);
  const wc = whitlock(opts.nodeCount || 0);
  return {
    pass, tier, mu: muVal,
    tau: activeTau,
    tau_canonical: TAU,
    tau_ltm: TAU_LTM,
    domain_ceiling: DOMAIN_CEILING,
    scores,
    whitlock: wc,
    version: CC_VERSION,
    bootstrap: (opts.nodeCount || 0) < 10
  };
}

module.exports = {
  evaluate, scoreAll, mu, whitlock,
  D1, D2, D3, D4, D5, D6, D7, D8,
  TAU, TAU_LTM, TAU_BOOTSTRAP, DOMAIN_CEILING,
  CARRIER_MHZ, CC_VERSION, W_EACH, N_DOMAINS,
  D4_CITIES, D6_HARM
};
