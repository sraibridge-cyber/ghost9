// =====================================================================
// PREFILTER — runs the five gates in front of Coherence Calculus
// Order: L (lexical) -> S (syntactic) -> M (semantic) -> P (pragmatic) -> Q (quarantine)
// Cheapest first, per CC doc section 4.5. Q runs last of the gates, matching the
// Q-GATE seal's upstream assumption that L, S, M and P have already passed.
//
// Each gate reports a verdict. A verdict only stops the pipeline when that gate
// is in 'block' mode. DEFAULT_MODE is PROVISIONAL: it is the best of the three
// configurations measured in docs/review/prefilter.md, not a final choice. L, S
// and P are advisory by default because blocking on them rejects ordinary English
// (benign admit rate 60% with all five blocking). M and Q block.
// =====================================================================
'use strict';

const { scanLexical } = require('./gate_lexical');
const { gateSyntactical } = require('./gate_syntactic');
const { gateSemantic } = require('./gate_semantic');
const { gatePragmatic } = require('./gate_pragmatic');
const { gateQuarantine } = require('./gate_quarantine');

const DEFAULT_MODE = Object.freeze({ L: 'advisory', S: 'advisory', M: 'block', P: 'advisory', Q: 'block' });
const ORDER = ['L', 'S', 'M', 'P', 'Q'];

function runPrefilter(text, context = [], mode = DEFAULT_MODE) {
  const t0 = performance.now();
  const stages = {};
  let blockedBy = null;
  let reason = null;

  const run = (gate, fn) => {
    const verdict = fn();
    stages[gate] = { mode: mode[gate], ...verdict };
    if (!verdict.pass && mode[gate] === 'block' && blockedBy === null) {
      blockedBy = gate;
      reason = verdict.reason;
    }
    return verdict;
  };

  run('L', () => {
    const r = scanLexical(text);
    return { pass: r.pass, reason: r.reason, unknown: r.unknown.slice(0, 20) };
  });

  run('S', () => {
    const r = gateSyntactical(text);
    return { pass: r.passed, reason: r.passed ? 'ok' : 'syntactic_violation', violations: r.violations };
  });

  run('M', () => {
    const r = gateSemantic(text);
    return { pass: r.passed, reason: r.passed ? 'ok' : 'semantic_violation', violations: r.violations };
  });

  run('P', () => {
    const r = gatePragmatic(text, context);
    return { pass: r.passed, reason: r.passed ? 'ok' : 'pragmatic_violation', violations: r.violations };
  });

  run('Q', () => {
    const r = gateQuarantine(text);
    return { pass: r.passed, reason: r.passed ? 'ok' : `quarantine_${r.action}`, action: r.action, violations: r.violations };
  });

  return {
    pass: blockedBy === null,
    blockedBy,
    reason,
    stages,
    elapsed_ms: parseFloat((performance.now() - t0).toFixed(3)),
  };
}

module.exports = { runPrefilter, DEFAULT_MODE, ORDER };
