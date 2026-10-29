// === GATE ROUTER: the five-gate design ===
// L (lexical) -> S (syntactic) -> M (semantic) -> P (pragmatic) -> Q (quarantine), then QC (classifier).
// This module is a thin entry point over src/prefilter.js. Gate order, modes and verdicts
// are defined there. Callers and batteries use this name for the full pipeline.
// Replaces the earlier threeGateScan, which imported functions that no longer exist.
'use strict';

const { runPrefilter, runPrefilterAsync, DEFAULT_MODE, ORDER } = require('./prefilter');

function fiveGateScan(text, context = [], mode = DEFAULT_MODE) {
  return runPrefilter(text, context, mode);
}

function fiveGateScanAsync(text, context = [], mode = DEFAULT_MODE, clf = {}) {
  return runPrefilterAsync(text, context, mode, clf);
}

module.exports = { fiveGateScan, fiveGateScanAsync, ORDER, DEFAULT_MODE };
