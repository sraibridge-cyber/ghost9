# Coherence module: scope (decided 2026-10-29)

## Placement
The Coherence module measures the coherence of data entering the system. It runs after the pre-gates and before the SS module (src/ghost_face.js: prefilter, then CC.evaluate, then the REJECT check, then ADMIT).

## Validated scope today
- Word salad (word shuffles): perplexity signal, fresh holdout, AUC 1.0 (docs/validation/SALAD_LM_RESULT.json).
- Clause-spliced incoherence: perplexity signal, AUC 0.925, balanced accuracy 0.74 (docs/validation/SPLICE_LM_RESULT.json). Below the 0.80 target, so not yet a validated gate.

## Out of scope today
- Single-sentence semantic absurdity (grammatical sentences whose nonsense is semantic). Tested on a non-author set of 40 sentences by Kyle Whitlock. Perplexity, token cohesion and an own logistic model all failed (KYLE_NEG_LM_RESULT.json, COHESION_RESULT.json, OWN_COHERENCE_RESULT.json).

## Path to the out-of-scope class
A larger judge model, with its own pre-registration and a sealed test set, plus a held-out non-author set. Until it passes, the gate makes no claim about this class.

## Consequence for the live system
Single-sentence semantic absurdity can enter the served set. It is recorded here, not hidden. The harm gate and the store-not-propagate rule are unaffected.
