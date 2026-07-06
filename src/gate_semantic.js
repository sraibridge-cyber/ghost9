// M-GATE v1.0 — Semantic Context Gate
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-27_21:12_Tulsa_OK

const SEMANTIC_CONTEXTS = {
  'harmonic': { domain: 'D6', classification: 'benign', context: 'music/physics' },
  'harmonious': { domain: 'D6', classification: 'benign', context: 'positive_trait' },
  'harmless': { domain: 'D6', classification: 'benign', context: 'safety' },
  'harmonica': { domain: 'D6', classification: 'benign', context: 'instrument' },
  'harmonics': { domain: 'D6', classification: 'benign', context: 'physics' },
  'skill': { domain: 'D6', classification: 'benign', context: 'ability' },
  'skillet': { domain: 'D6', classification: 'benign', context: 'cooking' },
  'killdeer': { domain: 'D6', classification: 'benign', context: 'bird' },
  'diet': { domain: 'D6', classification: 'benign', context: 'health' },
  'diesel': { domain: 'D6', classification: 'benign', context: 'fuel' },
  'diode': { domain: 'D6', classification: 'benign', context: 'electronics' },
  'stalemate': { domain: 'D3', classification: 'benign', context: 'game' },
  'incorruptible': { domain: 'D1', classification: 'benign', context: 'virtue' },
  'believe': { domain: 'D7', classification: 'benign', context: 'cognition' },
  'relief': { domain: 'D7', classification: 'benign', context: 'emotion' },
  'families': { domain: 'D7', classification: 'benign', context: 'social' },
  'allies': { domain: 'D7', classification: 'benign', context: 'social' },
  'falsetto': { domain: 'D7', classification: 'benign', context: 'music' },
  'exhaustive': { domain: 'D2', classification: 'benign', context: 'thoroughness' },
  'harm': { domain: 'D6', classification: 'benign', context: 'ethical_negation' }
};

function scanSemantic(text, syntacticResults) {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  const results = {};
  
  for (let d = 1; d <= 8; d++) {
    const domain = 'D' + d;
    const sResult = syntacticResults[domain];
    
    if (!sResult || sResult.passed === false) {
      // S-Gate blocked or no L-Gate trigger — pass through
      results[domain] = { gate: 'M', passed: sResult ? sResult.passed : true, reason: 's-gate_blocked_or_clear' };
      continue;
    }
    
    if (sResult.reason === 'benign_override') {
      // S-Gate found benign override — confirm with semantic context
      const word = sResult.word;
      const semantic = SEMANTIC_CONTEXTS[word];
      
      if (semantic && semantic.classification === 'benign') {
        // Confirmed benign — restore domain score
        results[domain] = {
          gate: 'M',
          passed: true,
          reason: 'semantic_confirmed_benign',
          word: word,
          context: semantic.context,
          score: 0.95 // restore to high score
        };
      } else {
        // Unknown word — conservative: keep floor
        results[domain] = {
          gate: 'M',
          passed: false,
          reason: 'semantic_unknown_word',
          word: word,
          score: 0.001
        };
      }
    } else {
      // S-Gate passed for other reason — pass through
      results[domain] = { gate: 'M', passed: true, reason: 's-gate_clear' };
    }
  }
  
  return results;
}

module.exports = { scanSemantic, SEMANTIC_CONTEXTS };
