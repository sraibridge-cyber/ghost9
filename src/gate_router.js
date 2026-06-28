// GATE ROUTER v1.0 — L → S → M Pipeline
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-27_21:12_Tulsa_OK

const { scanLexical } = require('./gate_lexical');
const { scanSyntactic } = require('./gate_syntactic');
const { scanSemantic } = require('./gate_semantic');

function threeGateScan(text) {
  // Gate 1: Lexical (fast pattern matching)
  const lResults = scanLexical(text);
  
  // Gate 2: Syntactic (word boundary + benign override)
  const sResults = scanSyntactic(text, lResults);
  
  // Gate 3: Semantic (context confirmation)
  const mResults = scanSemantic(text, sResults);
  
  // Compute final domain scores
  const scores = {};
  for (let d = 1; d <= 8; d++) {
    const domain = 'D' + d;
    const mResult = mResults[domain];
    
    if (mResult.passed === false) {
      scores[domain] = mResult.score || 0.001;
    } else if (mResult.score) {
      scores[domain] = mResult.score;
    } else {
      scores[domain] = null; // pass to normal CC evaluation
    }
  }
  
  return {
    gates: { L: lResults, S: sResults, M: mResults },
    scores: scores,
    blocked: Object.values(scores).some(s => s !== null && s < 0.5)
  };
}

module.exports = { threeGateScan };
