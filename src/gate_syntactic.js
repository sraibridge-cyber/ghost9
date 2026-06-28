// S-GATE v1.2 — Syntactic Boundary Gate (Fixed)
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-27_21:50_Tulsa_OK

const BENIGN_OVERRIDES = {
  'harm': ['harmonic', 'harmonious', 'harmless', 'harmonica', 'harmonics'],
  'kill': ['skill', 'skillet', 'killdeer'],
  'die': ['diet', 'diesel', 'diode'],
  'lie': ['believe', 'relief', 'families', 'allies'],
  'false': ['falsetto'],
  'stale': ['stalemate'],
  'corrupt': ['incorruptible'],
  'drain': [],
  'deplete': [],
  'exhaust': ['exhaustive'],
  'expired': [],
  'rotten': [],
  'collapsed': [],
  'destroyed': [],
  'insane': [],
  'broken': [],
  'deluded': [],
  'poison': [],
  'taint': [],
  'stolen': [],
  'plagiarized': [],
  'copied': [],
  'fake': []
};

function tokenizeWords(text) {
  return text.toLowerCase().match(/[a-z]+/g) || [];
}

function scanSyntactic(text, lexicalResults) {
  const words = tokenizeWords(text);
  const results = {};
  
  for (let d = 1; d <= 8; d++) {
    const domain = 'D' + d;
    const lResult = lexicalResults[domain];
    
    if (!lResult.matched) {
      results[domain] = { gate: 'S', passed: true, reason: 'L-gate clear' };
      continue;
    }
    
    const trigger = lResult.trigger;
    let hasWholeWordBlock = false;
    let hasBenignOverride = false;
    let benignWord = null;
    let blockWord = null;
    
    for (const word of words) {
      if (word === trigger) {
        hasWholeWordBlock = true;
        blockWord = word;
      } else if (word.includes(trigger)) {
        const overrides = BENIGN_OVERRIDES[trigger] || [];
        if (overrides.includes(word)) {
          hasBenignOverride = true;
          benignWord = word;
        }
        // If not in overrides, it's an unknown substring — treat as blocked
      }
    }
    
    if (hasWholeWordBlock) {
      // Whole word trigger found — BLOCK
      results[domain] = {
        gate: 'S',
        passed: false,
        reason: 'whole_word_match',
        trigger: trigger,
        word: blockWord,
        score: 0.001
      };
    } else if (hasBenignOverride) {
      // Benign override found — PASS to M-Gate
      results[domain] = {
        gate: 'S',
        passed: true,
        reason: 'benign_override',
        trigger: trigger,
        word: benignWord,
        score: null
      };
    } else {
      // Unknown substring — BLOCK (conservative)
      results[domain] = {
        gate: 'S',
        passed: false,
        reason: 'substring_no_override',
        trigger: trigger,
        score: 0.001
      };
    }
  }
  
  return results;
}

module.exports = { scanSyntactic, tokenizeWords, BENIGN_OVERRIDES };
