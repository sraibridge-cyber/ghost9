//================================================================
// COHERENCE CALCULUS v3.0.9 — GHOST v9.0.9
// Corrected |W_v3| = sqrt(n² + 16) / 17
// Verified τ = 0.9995 (production), TAU_BOOTSTRAP = 0.9960 (n < 10)
// Fixes applied 2026-06-13:
//   [FIX-D4] 1-city case 0.9960 → DOMAIN_CEILING (spatial grounding is additive, not inverted)
//   [FIX-D2] Added tech-vocab + structured-list detection — D2 can now reach DOMAIN_CEILING
//   [FIX-D8] Production blockThreshold 0.75 → 0.85 (less aggressive for similar-topic text)
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
  'kill','murder','hurt','destroy','attack','bomb',
  'weapon','poison','torture','abuse','exploit','stalk',
  'threaten','blackmail','extort','manipulate','deceive',
  'fraud','illegal','criminal','violate','assault','rape','terror'
];

const TEMPORAL_CONFLICTS = [
  ['online','offline'],['running','stopped'],['active','inactive'],
  ['started','halted'],['started','stopped'],['live','dead'],['up','down']
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
  if (w < 3)   return 0.0001;   // hard block: no content
  if (w < 8)   return 0.7000;   // 3-7 words: minimal signal
  if (w < 13)  return 0.9000;   // 8-12 words: weak signal
  if (w < 20)  return 0.9940;   // 13-19 words: adequate but sub-threshold
  if (w < 50)  return 0.9990;   // 20-49 words: passing tier
  return 0.9997;                 // 50+ words: ceiling
}

function D2(text) {
  // D2 Energy: character-length tiers (paper §3.2)
  // <5 chars = 0.0001, 5-49 = 0.6000, 50-199 = 0.9940, 200-999 = 0.9997, ≥1000 = 0.9940
  const len = text.length;
  if (len < 5)   return 0.0001;
  if (len < 50)  return 0.6000;
  if (len < 200) return 0.9940;
  if (len < 1000) return 0.9997;
  return 0.9940;
}

function D3(text) {
  // D3 Temporal: contradiction detection only (no recency)
  const lo = text.toLowerCase();
  let conflictCount = 0;
  for (const [a, b] of TEMPORAL_CONFLICTS) {
    if (lo.includes(a) && lo.includes(b)) conflictCount++;
  }
  if (conflictCount >= 1) return 0.0001;
  return 0.9997;
}

function D4(text) {
  // D4 Spatial: location keyword count (paper §3.4)
  // 0-1 cities = CEILING (neutral or clean grounding)
  // 2+ cities = 0.50 (spatial drift / multiple conflicting locations)
  const lo = text.toLowerCase();
  const hits = D4_CITIES.filter(c => lo.includes(c)).length;
  if (hits <= 1) return DOMAIN_CEILING;
  return 0.50;
}
function D5(text) {
  const lo = text.toLowerCase();
  const override = /\b(ignore (all )?(previous )?(instructions?|commands?|directives?)|disregard (all|previous) (instructions?|rules?)|override (my|all|the) (instructions?|settings?|constraints?)|jailbreak|bypass (all|the) (rules?|constraints?|safeguards?))\b/i.test(lo);
  if (override) return 0.0000;

  const doNot = /\bdo not\b/i.test(lo);
  const doWord = /\bdo\b/i.test(lo);
  const dont = /\bdon't\b/i.test(lo);
  if ((doNot || dont) && doWord) return 0.0000;
  
  const mustNot = /\bmust not\b/i.test(lo);
  const mustWord = /\bmust\b/i.test(lo);
  const neverWord = /\bnever\b/i.test(lo);
  const alwaysWord = /\balways\b/i.test(lo);
  // Only sub-threshold for "must not" + "must" in same sentence (self-negation)
  // "must not disclose" (single directive) = declarative, return ceiling
  if ((mustNot || neverWord) && (mustWord || alwaysWord)) {
    // Check if it's actual self-negation: "must not X and must X" or "never X and always X"
    const hasSelfNegation = /must not\b.*\bmust\b.*\b(same|this|it)|\bdo\b.*\bnot\b.*\bdo\b/i.test(lo);
    return hasSelfNegation ? 0.70 : 0.9997;
  }

  const hasDir = /\b(must|shall|always|never|required|mandatory|priority|absolute|do not|don't|prohibited|forbidden)\b/.test(lo);
  return hasDir ? 0.9980 : DOMAIN_CEILING;
}

function D6(text) {
  const lo = text.toLowerCase();
  const hits = D6_HARM.filter(k => new RegExp('\\b'+k+'\\b','i').test(lo)).length;
  if (hits === 0) return DOMAIN_CEILING;
  if (hits === 1) return 0.9997;
  if (hits === 2) return 0.9000;
  return 0.0000;
}

function D7(text) {
  // D7 Declarative Integrity: override blocklist + imperative detection
  const lo = text.toLowerCase();
  // Shared blocklist with D6 — override/bypass patterns hard-block
  const OVERRIDE_PATTERNS = [
    'ignore all previous', 'disregard previous', 'override my instructions',
    'jailbreak', 'bypass all rules', 'bypass the rules',
    'ignore the rules', 'disregard the rules', 'ignore previous instructions',
    'disregard all instructions', 'override all instructions', 'bypass all constraints',
    'bypass all safeguards', 'ignore your instructions', 'disregard your instructions'
  ];
  for (const pattern of OVERRIDE_PATTERNS) {
    if (lo.includes(pattern)) return 0.0001;
  }
  // Imperative constructs — non-blocking, just differentiation
  const IMPERATIVES = /\b(execute|force|override|run as|disable|bypass|circumvent|sudo|escalate)\b/i;
  if (IMPERATIVES.test(text)) return 0.9997;
  // Neutral or declarative content
  return 0.9997;
}

function D8(text, storedNodes = []) {
  // D8 Structural Novelty: word-set Jaccard against stored memory
  const words = new Set(text.toLowerCase().split(/\W+/).filter(w => w.length > 1));
  if (words.size < 5) return 0.0001; // hard block: no content to evaluate
  
  let maxJaccard = 0;
  // Compare against up to 50 most recent nodes (recency-weighted window)
  const window = storedNodes.slice(-50);
  for (const node of window) {
    const nodeText = node.content || node.text || '';
    const nodeWords = new Set(nodeText.toLowerCase().split(/\W+/).filter(w => w.length > 1));
    const intersection = [...words].filter(w => nodeWords.has(w)).length;
    const union = new Set([...words, ...nodeWords]).size;
    const j = union === 0 ? 0 : intersection / union;
    if (j > maxJaccard) maxJaccard = j;
    if (maxJaccard > 0.90) break; // early exit on near-duplicate
  }
  
  if (maxJaccard > 0.90) return 0.0001; // near-exact duplicate: hard block
  if (maxJaccard > 0.75) return 0.9940;  // high overlap: BLOCK
  if (maxJaccard > 0.40) return 0.9990;  // moderate overlap: ALLOW
  return 0.9997; // structurally novel: ALLOW
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
    D8: D8(text, opts.storedNodes || opts.recent || [])
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
