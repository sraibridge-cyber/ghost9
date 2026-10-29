// =====================================================================
// PREFILTER — runs the gates in front of Coherence Calculus
// Order: L (lexical) -> S (syntactic) -> M (semantic) -> P (pragmatic) -> Q (quarantine)
//        -> QC (local classifier, async, only if everything above passed)
// Cheapest first, per CC doc section 4.5. Q runs last of the sync gates, matching the
// Q-GATE seal's upstream assumption that L, S, M and P have already passed.
//
// Each gate reports a verdict. A verdict only stops the pipeline when that gate
// is in 'block' mode. DEFAULT_MODE is PROVISIONAL. S (now tag-based, no lists)
// is advisory (moved from block after measurement); M is off because its lists were removed; P is advisory; L is advisory;
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
const { postNll, config: LMCFG } = require('./lm_client');
const { margin: hvMargin, config: HVCFG } = require('./hv_client');

// S was 'block' until 2026-10-29. Moved to advisory after measurement: it flagged 1.5 to 4% of benign
// sentences and only 2 of 31 salad sentences (docs/validation/S_GATE_MEASUREMENT.json).
const DEFAULT_MODE = Object.freeze({ L: 'advisory', S: 'advisory', M: 'off', P: 'advisory', Q: 'block', QC: CLF.mode, LM: LMCFG.mode, HV: HVCFG.mode });
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
// Fail-open everywhere: an unreachable classifier is recorded in the trace and the sentence goes on.
// Only a flagged score blocks, and only in 'block' mode. The phone build has no classifier yet, so
// fail-closed would refuse every sentence. clf.classify/clf.opts are injectable for tests.
async function runQcStage(text, context = [], mode = DEFAULT_MODE, clf = {}) {
  const pre = runPrefilter(text, context, mode);
  const qcMode = mode.QC || 'off';
  if (!pre.pass || qcMode === 'off') return pre;

  const t0 = performance.now();
  const classifyFn = clf.classify || classify;
  const r = await classifyFn(text, clf.opts || {});
  let stage;
  if (!r.ok) {
    stage = { mode: qcMode, pass: true, reason: 'classifier_unavailable', error: r.error, score: null, flagged: null };
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

// Full async pipeline: sync gates, then the classifier (QC), then the advisory LM stage.
async function runPrefilterAsync(text, context = [], mode = DEFAULT_MODE, clf = {}) {
  const pre = await runQcStage(text, context, mode, clf);
  await runLmStage(pre, text, mode, clf);
  await runHvStage(pre, text, mode, clf);
  return pre;
}

// Harm-vector stage (combined second signal). Flags only when the classifier score and the harm-vector
// margin both clear their thresholds. Advisory only in this build: it reports and never changes pre.pass.
// Reuses the QC score, so it needs the classifier to have run. Fail-open when either side is unavailable.
async function runHvStage(pre, text, mode, hv = {}) {
  const hvMode = mode.HV || 'off';
  if (hvMode === 'off' || !pre.pass) return;
  if (hvMode !== 'advisory') {
    throw new Error(`HV stage is advisory-only in this build (got ${hvMode})`);
  }
  const score = pre.stages.QC ? pre.stages.QC.score : null;
  if (score === null || score === undefined) {
    pre.stages.HV = { mode: hvMode, pass: true, reason: 'classifier_unavailable', margin: null, flagged: null };
    return;
  }
  const r = await (hv.margin || hvMargin)(text, hv.opts || {});
  if (!r.ok) {
    pre.stages.HV = { mode: hvMode, pass: true, reason: 'hv_unavailable', error: r.error, margin: null, flagged: null };
    return;
  }
  const margin = r.margins[0];
  const flagged = score >= HVCFG.t_clf && margin >= HVCFG.t_margin;
  pre.stages.HV = {
    mode: hvMode, pass: true, reason: flagged ? 'advisory_flag' : 'ok',
    score, margin, flagged, t_clf: HVCFG.t_clf, t_margin: HVCFG.t_margin,
  };
}

// Perplexity stage (option C). Advisory only: it reports and never changes pre.pass in this build.
// It runs only for sentences that already passed the earlier gates. Fail-open when unreachable.
async function runLmStage(pre, text, mode, lm = {}) {
  const lmMode = mode.LM || 'off';
  if (lmMode === 'off' || !pre.pass) return;
  if (lmMode !== 'advisory') {
    throw new Error(`LM stage is advisory-only in this build (got ${lmMode})`);
  }
  const r = await (lm.nll || postNll)([text], lm.opts || {});
  if (!r.ok) {
    pre.stages.LM = { mode: lmMode, pass: true, reason: 'lm_unavailable', error: r.error, nll: null, threshold: LMCFG.threshold, flagged: null };
    return;
  }
  const v = r.values[0];
  const flagged = v !== null && v >= LMCFG.threshold;
  pre.stages.LM = { mode: lmMode, pass: true, reason: flagged ? 'advisory_flag' : 'ok', nll: v, threshold: LMCFG.threshold, flagged, model: r.model };
}

module.exports = { runPrefilter, runPrefilterAsync, DEFAULT_MODE, ORDER };
