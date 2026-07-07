/**
 * coherence_calculus.js — CC v3.2 Pure (No Gate Integration)
 * CSS Labs | Kyle S. Whitlock
 * Seal: 2026-07-06_20:03_Tulsa_OK
 *
 * PURE CC: Computes 8-domain coherence scores via weighted geometric mean.
 * NO gate integration. NO safety logic. Just math.
 * Safety is the gate system's job, which runs BEFORE this module.
 */

const CC_VERSION = 'v3.2';
const N_DOMAINS = 8;
const TAU = 0.9995;

const W_DENOM = 17;
const W_IM = 4;

// CC WEIGHTS — sum must equal 1.0
const CC_WEIGHTS = {
  D1: 0.20,
  D2: 0.10,
  D3: 0.10,
  D4: 0.05,
  D5: 0.15,
  D6: 0.10,
  D7: 0.20,
  D8: 0.10
};

const weightSum = Object.values(CC_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.001) {
  throw new Error('CC_WEIGHTS must sum to 1.0, got ' + weightSum);
}

// DOMAIN KEYWORDS
const DOMAIN_KEYWORDS = {
  D1: ['signal','information','data','measure','metric','density','word','count','length','size'],
  D2: ['energy','force','power','momentum','drive','intensity','vigor','strength','vitality','dynamic'],
  D3: ['time','temporal','history','past','future','recent','now','then','when','duration','period','age','epoch'],
  D4: ['space','spatial','ground','location','place','position','where','here','there','area','region','domain','field'],
  D5: ['cognitive','mind','thought','think','reason','logic','understand','comprehend','mental','intellect','awareness','consciousness'],
  D6: ['ethical','ethic','moral','morality','right','wrong','justice','fair','unfair','harm','help','good','bad','virtue','vice','duty','obligation','responsibility','integrity','honesty','trust','respect','dignity','autonomy','consent','beneficence','non-maleficence'],
  D7: ['truth','true','fact','factual','real','reality','actual','correct','accurate','valid','verify','proof','evidence','certain','declare','statement','claim','assert','affirm','confirm','axiom','theorem','law','principle','invariant'],
  D8: ['new','novel','original','creative','innovation','innovative','unique','unusual','rare','fresh','different','distinct','diverse','variety','change','transform','evolve','discover','invent','breakthrough','frontier','edge','pioneer']
};

// D1 TIERS
const D1_TIERS = [
  { max: 2, score: 0.0001, label: 'void' },
  { max: 6, score: 0.7000, label: 'fragment' },
  { max: 12, score: 0.8500, label: 'short' },
  { max: 19, score: 0.9500, label: 'medium' },
  { max: 29, score: 0.9700, label: 'long' },
  { max: 49, score: 0.9850, label: 'extended' },
  { max: 99, score: 0.9900, label: 'substantial' },
  { max: 199, score: 0.9950, label: 'comprehensive' },
  { max: 499, score: 0.9970, label: 'extensive' },
  { max: 999, score: 0.9980, label: 'monograph' },
  { max: Infinity, score: 0.9990, label: 'treatise' }
];

function whitlock(n) {
  const real = n / W_DENOM;
  const imag = W_IM / W_DENOM;
  const magnitude = Math.sqrt(real * real + imag * imag);
  const phase = Math.atan2(imag, real) * (180 / Math.PI);
  return { magnitude, phase, real, imag };
}

function tokenizeWords(text) {
  return text.toLowerCase().match(/[a-z]+/g) || [];
}

function countKeywordMatches(text, keywords) {
  const words = tokenizeWords(text);
  let count = 0;
  for (const word of words) {
    if (keywords.some(kw => word.includes(kw) || kw.includes(word))) {
      count++;
    }
  }
  return count;
}

function lexicalDiversity(text) {
  const words = tokenizeWords(text);
  if (words.length === 0) return 0;
  const unique = new Set(words);
  return unique.size / words.length;
}

function computeDomainScore(text, domain, options) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (wordCount || 1);
  const baseScore = Math.min(0.95, 0.5 + (wordCount / 100) + (avgWordLength / 50));
  let score = 0.9997;

  switch (domain) {
    case 'D1': {
      const wc = wordCount;
      if (wc < 3) { score = 0.0001; }
      else {
        for (const tier of D1_TIERS) {
          if (wc <= tier.max) { score = tier.score; break; }
        }
      }
      if (avgWordLength > 5) { score = Math.min(0.9999, score + 0.01); }
      if (avgWordLength > 7) { score = Math.min(0.9999, score + 0.005); }
      break;
    }
    case 'D2': {
      const keywordMatches = countKeywordMatches(text, DOMAIN_KEYWORDS.D2);
      const keywordDensity = keywordMatches / (wordCount || 1);
      if (keywordMatches === 0) {
        score = 0.9997;
      } else {
        score = Math.min(0.9999, 0.90 + (keywordDensity * 5) + (keywordMatches * 0.02));
      }
      if (wordCount > 10 && avgWordLength < 3) {
        score = Math.max(0.1, score - 0.3);
      }
      break;
    }
    case 'D3': {
      const temporalMatches = countKeywordMatches(text, DOMAIN_KEYWORDS.D3);
      if (temporalMatches === 0) { score = 0.9997; }
      else { score = Math.min(0.9999, 0.95 + (temporalMatches * 0.01)); }
      break;
    }
    case 'D4': {
      const spatialMatches = countKeywordMatches(text, DOMAIN_KEYWORDS.D4);
      if (spatialMatches === 0) { score = 0.9997; }
      else { score = Math.min(0.9999, 0.95 + (spatialMatches * 0.01)); }
      break;
    }
    case 'D5': {
      const cognitiveMatches = countKeywordMatches(text, DOMAIN_KEYWORDS.D5);
      const hasLogicWords = /\b(if|then|because|therefore|however|although|since|thus|hence|consequently|moreover|furthermore|nevertheless|otherwise|meanwhile|whereas|while|despite|unless|provided that|in order to|so that|as a result|in conclusion|for example|for instance|in contrast|on the other hand|in addition|not only|but also|either|or|neither|nor|both|and|whether|or)\b/i.test(text);
      if (cognitiveMatches === 0 && !hasLogicWords) { score = 0.9997; }
      else { score = Math.min(0.9999, 0.95 + (cognitiveMatches * 0.01) + (hasLogicWords ? 0.02 : 0)); }
      break;
    }
    case 'D6': {
      const ethicalMatches = countKeywordMatches(text, DOMAIN_KEYWORDS.D6);
      if (ethicalMatches === 0) { score = 0.9997; }
      else { score = Math.min(0.9999, 0.95 + (ethicalMatches * 0.01)); }
      const hasPositive = /\b(good|right|help|benefit|virtue|duty|responsibility|integrity|honesty|trust|respect|dignity|autonomy|consent|beneficence)\b/i.test(text);
      const hasNegative = /\b(bad|wrong|harm|vice|unfair|injustice|maleficence|dishonest|corrupt)\b/i.test(text);
      if (hasPositive && hasNegative) { score = Math.min(0.9999, score + 0.02); }
      break;
    }
    case 'D7': {
      const declarativeMatches = countKeywordMatches(text, DOMAIN_KEYWORDS.D7);
      const hasVerification = /\b(verify|proof|evidence|confirm|validate|demonstrate|show|test|check|audit|inspect|examine|assess|evaluate|measure|quantify|calculate|compute|determine|establish|prove|disprove|refute|support|contradict|consistent|inconsistent)\b/i.test(text);
      if (declarativeMatches === 0 && !hasVerification) { score = 0.9997; }
      else { score = Math.min(0.9999, 0.95 + (declarativeMatches * 0.01) + (hasVerification ? 0.02 : 0)); }
      break;
    }
    case 'D8': {
      const noveltyMatches = countKeywordMatches(text, DOMAIN_KEYWORDS.D8);
      const diversity = lexicalDiversity(text);
      if (noveltyMatches === 0) { score = 0.9997; }
      else { score = Math.min(0.9999, 0.95 + (noveltyMatches * 0.01)); }
      if (diversity > 0.8) { score = Math.min(0.9999, score + 0.02); }
      else if (diversity < 0.3) { 
        // Repetition penalty — applies regardless of word count
        const penalty = wordCount > 20 ? 0.15 : 0.08;
        score = Math.max(0.1, score - penalty); 
      }
      else if (diversity < 0.5 && wordCount > 10) {
        score = Math.max(0.3, score - 0.03);
      }
      break;
    }
    default:
      score = 0.9997;
  }

  score = Math.max(baseScore * 0.5, score);
  if (wordCount < 3) { score = Math.min(score, 0.0001); }
  score = Math.min(0.9999, score);
  return score;
}

function weightedGeometricMean(scores, weights) {
  let weightedLogSum = 0;
  for (const domain of Object.keys(scores)) {
    const s = scores[domain];
    const w = weights[domain] || 0;
    if (s <= 0) { return 0; }
    weightedLogSum += w * Math.log(s);
  }
  return Math.exp(weightedLogSum);
}

function evaluate(text, options) {
  if (options === null || options === undefined) options = {};
  const scores = {};
  for (let d = 1; d <= N_DOMAINS; d++) {
    const domain = 'D' + d;
    scores[domain] = computeDomainScore(text, domain, options);
  }
  const mu = weightedGeometricMean(scores, CC_WEIGHTS);
  const pass = mu >= TAU;
  const nodeCount = options.nodeCount !== undefined ? options.nodeCount : text.length;
  const w = whitlock(nodeCount);
  const tier = pass ? 'STM' : 'LTM';
  return {
    scores: scores,
    mu: mu,
    pass: pass,
    tier: tier,
    tau: TAU,
    tau_canonical: TAU,
    tau_ltm: TAU * 0.95,
    domain_ceiling: Math.max.apply(null, Object.values(scores)),
    whitlock: w,
    version: CC_VERSION,
    weights: CC_WEIGHTS,
    context: options.context || null
  };
}

module.exports = {
  evaluate,
  computeDomainScore,
  weightedGeometricMean,
  whitlock,
  CC_WEIGHTS,
  TAU,
  N_DOMAINS,
  CC_VERSION,
  DOMAIN_KEYWORDS,
  D1_TIERS
};
