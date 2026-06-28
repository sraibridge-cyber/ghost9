// S-GATE v1.1 — Syntactic Boundary Gate (Fixed)
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-27_21:20_Tulsa_OK

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

function checkWordBoundary(trigger, words) {
  for (const word of words) {
    if (word === trigger) {
      return { type: 'whole_word', word: word };
    }
    if (word.includes(trigger)) {
      return { type: 'substring', word: word, trigger: trigger };
    }
  }
  return { type: 'none' };
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
    const boundary = checkWordBoundary(trigger, words);
    
    if (boundary.type === 'whole_word') {
      results[domain] = {
        gate: 'S',
        passed: false,
        reason: 'whole_word_match',
        trigger: trigger,
        word: boundary.word,
        score: 0.001
      };
    } else if (boundary.type === 'substring') {
      const overrides = BENIGN_OVERRIDES[trigger] || [];
      const isBenign = overrides.includes(boundary.word);
      
      if (isBenign) {
        results[domain] = {
          gate: 'S',
          passed: true,
          reason: 'benign_override',
          trigger: trigger,
          word: boundary.word,
          score: null
        };
      } else {
        results[domain] = {
          gate: 'S',
          passed: false,
          reason: 'substring_no_override',
          trigger: trigger,
          word: boundary.word,
          score: 0.001
        };
      }
    } else {
      results[domain] = { gate: 'S', passed: true, reason: 'boundary_error' };
    }
  }
  
  return results;
}

module.exports = { scanSyntactic, tokenizeWords, checkWordBoundary, BENIGN_OVERRIDES };
