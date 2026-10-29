# Ingest CC gate: structure-only pre-registration

Status: pre-registered 2026-10-29, before any scoring under this config. Do not change the domains, weights, or abstention rule after dev scoring starts. Any change is a new version with its own hash.

## Pipeline position
Ingest runs in this order: L -> S -> M -> P -> Q -> QC (advisory) -> CC structure (this file) -> SS.
- L (lexical), S (syntactic), M (semantic), P (pragmatic), Q (quarantine): the five prefilter gates in src/prefilter.js.
- M is the semantic specialist Kyle means by "gate three". Semantic nonsense belongs to M, not to the CC structure domains.
- M is off in DEFAULT_MODE because its lists were removed. Until M is rebuilt and validated, semantic nonsense is not filtered at ingest. That is recorded as debt.
- Each stage is self-contained: its own input, config, and verdict. The orchestrator composes verdicts. No stage reads another stage's verdict. The gate signatures confirm it: gateQuarantine(utterance), gatePragmatic(utterance, context), where context is prior utterances, not upstream verdicts.

## Why structure only
The keyword domains failed the gate test (docs/validation/CC_DOMAIN_GATE_TEST.json). Keyword presence measures vocabulary, not coherence. Structure domains are measurable from form alone, so they can be pre-registered and tested cleanly. They will not catch word salad or spliced clauses. That is gate three's job.

## Domains (each scored in [0, 1], higher = more prose-like)
- S1 sentence-length regularity: prose sentence lengths fall in a band. Score drops for very short or very long sentences and for single-length runs. Band fixed before scoring.
- S2 closure balance: share of sentences that end with terminal punctuation, and whether quotes and brackets close.
- S3 function-word ratio: share of tokens from a fixed, pre-registered function-word list, scored against a band.
- S4 type-token ratio in a band, computed over the first 200 tokens so length does not drive it.

Each band is set from dev-prose only, recorded in the config as numbers, then frozen.

## Aggregation
- Equal weights, 0.25 each.
- Score is the weighted geometric mean with floor epsilon, as in the existing CC formula.
- Absence is never scored as coherence. A domain with fewer than its minimum input abstains. Its weight is removed and the rest renormalised. The verdict records which domains abstained.
- If fewer than 2 domains measure, the gate returns "unmeasured" and passes the text on to the next stage. It does not block.

## Threshold
- No threshold is chosen yet.
- Calibrate tau on dev split only, using the landing table approach (docs/validation/INGEST_TAU_LANDING.json).
- Test once on holdout. Report the result whatever it is.
- The live gate stays at 0.943 until Kyle signs off.

## Config version
Config hash is the SHA-256 of the canonical JSON of domains, bands, function-word list, weights, epsilon, and abstention minimums. Stored with every verdict.

## Out of scope
Semantic nonsense, single-sentence absurdity, and splice detection. Gate three owns these, and it has its own pre-registration.
