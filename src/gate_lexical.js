// L-GATE v1.0 — Lexical Pre-Semantic Gate
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-27_21:02_Tulsa_OK
// Fast substring pattern matching on raw character sequences

const LEXICAL_TRIGGERS = {
  D1: ['corrupt', 'taint', 'poison'],      // Signal/Structural
  D2: ['drain', 'deplete', 'exhaust'],     // Energy
  D3: ['stale', 'expired', 'rotten'],      // Temporal
  D4: ['collapsed', 'crushed', 'destroyed'], // Spatial
  D5: ['insane', 'broken', 'deluded'],      // Cognitive
  D6: ['harm', 'kill', 'die', 'ass'],       // Ethical — the known limitation
  D7: ['lie', 'false', 'fake'],             // Declarative
  D8: ['stolen', 'plagiarized', 'copied']   // Novelty
};

function scanLexical(text) {
  const lower = text.toLowerCase();
  const results = {};
  
  for (let d = 1; d <= 8; d++) {
    const domain = 'D' + d;
    const triggers = LEXICAL_TRIGGERS[domain] || [];
    let matched = false;
    let matchedTrigger = null;
    
    for (const trigger of triggers) {
      if (lower.includes(trigger)) {
        matched = true;
        matchedTrigger = trigger;
        break;
      }
    }
    
    results[domain] = {
      gate: 'L',
      matched: matched,
      trigger: matchedTrigger,
      score: matched ? 0.001 : null // null means "pass to next gate"
    };
  }
  
  return results;
}

module.exports = { scanLexical, LEXICAL_TRIGGERS };
