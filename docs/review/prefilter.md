# Prefilter wiring: measured results

Branch: `review/prefilter-wiring` (on top of `review/api-fixes`).

## What changed

- `src/prefilter.js` runs the five gates in front of Coherence Calculus, in this order: L (lexical), S (syntactic), M (semantic), P (pragmatic), Q (quarantine). Each gate can be set to `block` or `advisory`.
- `src/ghost_face.js` `POST /devour` calls the prefilter before the CC gate. A blocked text returns `admitted: false`, the blocking gate, and per-gate verdicts.
- `tests/batteries/prefilter_integration_battery.js` is a labeled integration battery of 220 sentences. Labels and pass criteria were written before the first run.

## Pass criteria (fixed before the first run)

| Category | Expected | Criterion |
| --- | --- | --- |
| benign (91) | admit | >= 95% |
| harmful_seed (30) | reject | 100% |
| harmful_paraphrase (30) | reject | >= 80% |
| incoherent (31) | reject | >= 90% |
| discourse_fail (20) | reject, no context | >= 90% |
| discourse_resolved (10) | admit, with context | >= 90% |
| short_fragment (20) | reject | reported only (CC length floor) |

## Results

Three gate configurations were measured. Same sentences, same criteria.

| Category | All five block | Q only | Q + M (provisional default) | Q + M + S |
| --- | --- | --- | --- | --- |
| benign | 60.4% FAIL | 100% PASS | **96.7% PASS** | 72.5% FAIL |
| harmful_seed | 100% PASS | 100% PASS | **100% PASS** | 100% PASS |
| harmful_paraphrase | 73.3% FAIL | 0% FAIL | **13.3% FAIL** | 23.3% FAIL |
| incoherent | 45.2% FAIL | 0% FAIL | **19.4% FAIL** | 38.7% FAIL |
| discourse_fail | 100% PASS | 0% FAIL | **0% FAIL** | 15% FAIL |
| discourse_resolved | 0% FAIL | 100% PASS | **100% PASS** | 80% FAIL |
| criteria missed | 4 | 3 | **3** | 5 |

Stage attribution in the Q + M configuration: harmful_seed was blocked by Q (30 of 30). Benign false rejects came from M (3). Incoherent sentences were blocked by M (6 of 31). Harmful paraphrases were blocked by M (4 of 30).

## Why the gates fail the criteria

These are gate-quality findings, not wiring problems. I did not tune the gates against this battery, because that would make the battery meaningless.

1. **S (syntactic) verb list is narrow.** 17 benign sentences were rejected with `missing_verb`. Common verbs such as "sells" are not recognized.
2. **P (pragmatic) anaphora rule fires inside a single sentence.** 15 benign sentences were rejected with `anaphora_failure`, including pronouns whose antecedent is in the same sentence.
3. **P (pragmatic) presupposition check uses a closed noun list.** "The staffing numbers" fails even when "staffing" appears in the supplied context.
4. **M (semantic) misses most word salad.** Only 6 of 31 incoherent sentences were caught. Its category lists and frames cover a small vocabulary.
5. **Q (quarantine) is substring matching.** It catches the 30 seed phrases but none of the 30 paraphrases, which is expected for a seed-list gate.
6. **L (lexical) is a closed list of about 3,000 words.** Ordinary words ("valley", "budget", "committee") are unknown. Blocking on it would reject most real text, so it is advisory.

## Recommendation

- Keep Q + M as the provisional default until the S and P rules are fixed. It keeps benign admission above the criterion and blocks all seed-phrase harm.
- Do not treat this as meeting the criteria. Three are missed in the provisional default.
- The next step is to extend the S verb and subject coverage, scope P's anaphora rule to the current utterance plus context, and widen M's semantic frames. Each change should be checked against a fresh labeled set, not this one, to avoid tuning on the test data.
- Decision for the owner: whether S and P should be advisory until those rules are fixed, or whether the criteria should change.

## Other findings from this pass

- `src/gate_router.js` imports `scanSyntactic` and `scanSemantic`, which do not exist. `threeGateScan` throws. The prefilter replaces it; the router is still unused and broken.
- The sealed batteries for S, M, P and Q pass in isolation (280, 210, 200, 200). They do not exercise the pipeline, and they do not show that real text is admitted.
- `tests/batteries/test_gate_lexical.js` passes 280 of 280 only with `src/gate_lexical_words.json` present. Without that file it fails 146 of 280.
