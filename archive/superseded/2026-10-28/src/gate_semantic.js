// =====================================================================
// M-GATE — disabled.
// The closed category, verb-frame, nonsense, and contradiction lists were removed
// (see docs/review/measured-coherence.md). No semantic resource is installed, so this
// gate makes no verdict. prefilter.js runs it only when its mode is not 'off'.
// Previous version: archive/superseded/gate_semantic_v1.js
// =====================================================================
'use strict';

function gateSemantic() {
  return { passed: null, violations: [], score: null, details: { status: 'disabled_lists_removed' } };
}

module.exports = { gateSemantic };
