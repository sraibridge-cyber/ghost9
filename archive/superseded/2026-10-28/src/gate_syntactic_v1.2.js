// S-GATE v1.2 — Syntactic Boundary Gate (Fixed)
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-27_21:50_Tulsa_OK

const BENIGN_OVERRIDES = {
  'harm': ['harmonic', 'harmonious', 'harmless', 'harmonica', 'harmonics', 'harmony'],
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

// Negation context detection for ethical domain triggers
const NEGATION_WORDS = ['never','no','not','prevent','avoid','stop','against','protect','without','shall','must'];
function hasNegationContext(text, trigger) {
  const lower = text.toLowerCase();
  const words = lower.match(/[a-z]+/g) || [];
  for (let i = 0; i < words.length; i++) {
    if (words[i] === trigger) {
      for (let j = Math.max(0, i - 4); j < i; j++) {
        if (NEGATION_WORDS.includes(words[j])) return true;
      }
    }
  }
  return false;
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
        if (hasNegationContext(text, trigger)) {
          // Negated context - treat as benign even for whole word match
          hasBenignOverride = true;
          benignWord = word;
        } else {
          hasWholeWordBlock = true;
          blockWord = word;
        }
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
  } else if (hasNegationContext(text, trigger)) {
    // Negated context - treat as benign
    results[domain] = {
      gate: 'S',
      passed: true,
      reason: 'negation_context',
      trigger: trigger,
      word: null,
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
