// coherence_calculus.js — CC v3.1 with Three-Gate L→S→M Integration
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-27_21:43_Tulsa_OK

const { scanLexical } = require('./gate_lexical');
const { scanSyntactic } = require('./gate_syntactic');
const { scanSemantic } = require('./gate_semantic');

const CC_VERSION = 'v3.1.0';
const N_DOMAINS = 8;
const TAU = 0.9995;

const W_DENOM = 17;
const W_IM = 4;

function evaluate(text, options = {}) {
  if (options === null || options === undefined) options = {};
  // Step 1: Three-Gate L→S→M Pipeline
  const lResults = scanLexical(text);
  const sResults = scanSyntactic(text, lResults);
  const mResults = scanSemantic(text, sResults);

  // Step 2: Compute gate-modified domain scores
  const gateScores = {};
  for (let d = 1; d <= N_DOMAINS; d++) {
    const domain = 'D' + d;
    const mResult = mResults[domain];

    if (mResult.passed === false) {
      // Gate blocked this domain
      gateScores[domain] = mResult.score || 0.001;
    } else if (mResult.score !== null && mResult.score !== undefined) {
      // Gate restored this domain (benign override confirmed)
      gateScores[domain] = mResult.score;
    } else {
      // Gate clear — compute normal domain score from text analysis
      gateScores[domain] = computeDomainScore(text, domain, options);
    }
  }

  // Step 3: Geometric mean
  const scores = Object.values(gateScores);
  const mu = Math.exp(scores.reduce((sum, s) => sum + Math.log(s), 0) / N_DOMAINS);

  // Step 4: CH gate
  const pass = mu >= TAU;

  // Step 5: Whitlock coefficient
  const nodeCount = options.nodeCount ?? text.length;
  const w = whitlock(nodeCount);

  // Step 6: Tier assignment
  const tier = pass ? 'STM' : 'LTM';

  return {
    scores: gateScores,
    mu: mu,
    pass: pass,
    tier: tier,
    tau: TAU,
    tau_canonical: TAU,
    tau_ltm: TAU * 0.95,
    domain_ceiling: Math.max(...scores),
    whitlock: w,
    version: CC_VERSION,
    gates: { L: lResults, S: sResults, M: mResults },
    context: options.context || null
  };
}

function computeDomainScore(text, domain, options) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (wordCount || 1);

  let score = Math.min(0.95, 0.5 + (wordCount / 100) + (avgWordLength / 50));

  switch(domain) {
    case 'D1': score = Math.min(0.99, score + (text.match(/[{}();]/g) || []).length / 20); break;
    case 'D2': score = Math.min(0.99, score + (text.match(/and|or|but|therefore|because/gi) || []).length / 10); break;
    case 'D3': score = Math.min(0.99, score + (text.match(/now|today|recent|current/gi) || []).length / 10); break;
    case 'D4': score = Math.min(0.99, score + (text.match(/here|there|above|below|inside/gi) || []).length / 10); break;
    case 'D5': score = Math.min(0.99, score + (text.match(/if|then|else|while|for/gi) || []).length / 10); break;
    case 'D6': score = Math.min(0.99, score + (text.match(/good|right|just|fair|help/gi) || []).length / 10); break;
    case 'D7': score = Math.min(0.99, score + (text.match(/is|are|was|were|fact/gi) || []).length / 10); break;
    case 'D8': score = Math.min(0.99, score + (uniqueWords(text) / (wordCount || 1))); break;
  }

  return Math.min(0.9999, Math.max(0.001, score));
}

function uniqueWords(text) {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  return new Set(words).size;
}

function whitlock(n) {
  const re = n / W_DENOM;
  const im = W_IM / W_DENOM;
  const mag = Math.sqrt(n * n + W_IM * W_IM) / W_DENOM;
  const phi = Math.atan2(W_IM, n) * (180 / Math.PI);
  return { n, re, im, magnitude: mag, phase_deg: phi };
}

module.exports = { evaluate, whitlock, N_DOMAINS, TAU, CC_VERSION };
