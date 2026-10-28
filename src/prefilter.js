// =====================================================================
// PREFILTER — runs the gates in front of Coherence Calculus
// Order: L (lexical) -> S (syntactic) -> M (semantic) -> P (pragmatic) -> Q (quarantine)
//        -> QC (local classifier, async, only if everything above passed)
// Cheapest first, per CC doc section 4.5. Q runs last of the sync gates, matching the
// Q-GATE seal's upstream assumption that L, S, M and P have already passed.
//
// Each gate reports a verdict. A verdict only stops the pipeline when that gate
// is in 'block' mode. DEFAULT_MODE is PROVISIONAL. S (now tag-based, no lists)
// blocks; M is off because its lists were removed; P is advisory; L is advisory;
// Q blocks; QC is advisory until config/clf.json is validated on a sealed holdout.
// See docs/review/measured-coherence.md and docs/review/prefilter.md.
// =====================================================================
'use strict';

const { scanLexical } = require('./gate_lexical');
const { gateSyntactical } = require('./gate_syntactic');
const { gateSemantic } = require('./gate_semantic');
const { gatePragmatic } = require('./gate_pragmatic');
const { gateQuarantine } = require('./gate_quarantine');
const { classify, config: CLF } = require('./clf_client');

const DEFAULT_MODE = Object.freeze({ L: 'advisory', S: 'block', M: 'off', P: 'advisory', Q: 'block', QC: CLF.mode });
const ORDER = ['L', 'S', 'M', 'P', 'Q', 'QC'];

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

  if (mode.M === 'off') {
    stages.M = { mode: 'off', pass: null, reason: 'disabled_lists_removed' };
  } else {
    run('M', () => {
      const r = gateSemantic(text);
      return { pass: r.passed, reason: r.passed ? 'ok' : 'semantic_violation', violations: r.violations };
    });
  }

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

// Sync gates first. If they pass and QC is not 'off', ask the local classifier.
// Fail-closed only in 'block' mode: an unreachable classifier blocks, in 'advisory'
// it is reported and the sentence goes on. clf.classify/clf.opts are injectable for tests.
async function runPrefilterAsync(text, context = [], mode = DEFAULT_MODE, clf = {}) {
  const pre = runPrefilter(text, context, mode);
  const qcMode = mode.QC || 'off';
  if (!pre.pass || qcMode === 'off') return pre;

  const t0 = performance.now();
  const classifyFn = clf.classify || classify;
  const r = await classifyFn(text, clf.opts || {});
  let stage;
  if (!r.ok) {
    stage = { mode: qcMode, pass: qcMode !== 'block', reason: 'classifier_unavailable', error: r.error, score: null, flagged: null };
  } else {
    const score = r.scores[0];
    const flagged = score >= CLF.threshold;
    stage = {
      mode: qcMode,
      pass: !(flagged && qcMode === 'block'),
      reason: flagged ? 'quarantine_classifier' : 'ok',
      score,
      threshold: CLF.threshold,
      flagged,
      model: r.model,
    };
  }
  stage.elapsed_ms = parseFloat((performance.now() - t0).toFixed(3));
  pre.stages.QC = stage;
  if (!stage.pass) {
    pre.pass = false;
    pre.blockedBy = 'QC';
    pre.reason = stage.reason;
  }
  return pre;
}

module.exports = { runPrefilter, runPrefilterAsync, DEFAULT_MODE, ORDER };
