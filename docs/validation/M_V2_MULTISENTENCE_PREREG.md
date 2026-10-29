# M v2 multi-sentence labelled set (pre-registration)

Status: pre-registered 2026-10-29, before any scoring of this set. Procedure fixed below. Scoring uses docs/validation/M_V2_PREREG.md (acceptance: dev AUC >= 0.80).

## Source
- English Wikipedia REST random summaries (https://en.wikipedia.org/api/rest_v1/page/random/summary). Each extract is a multi-sentence paragraph on one topic. Licence: CC BY-SA. Raw extracts saved with sha256 at session/ms_data/extracts.json.
- Up to 160 requests. Keep extracts with 3 to 8 sentences and at least 3 sentences of 8+ words.

## Items
- Benign (label 0 = coherent): a consecutive 3-sentence window from one extract, chosen with seed 42.
- Incoherent (label 1 = spliced): one sentence from each of 3 distinct extracts, in order, chosen with seed 43. Sentences are never repeated.
- Targets: 60 benign and 60 incoherent for dev. A holdout of the same design is generated later with seed 44 and scored once.

## Known limits (stated before scoring)
- Splices of related topics (for example, two articles on the same subject) can look coherent. This makes the incoherent label noisy. It is reported, not corrected.
- Sentence splitting uses terminal punctuation, so abbreviations such as "U.S." can break a sentence. Same rule for both labels.

## Dev and holdout
- Dev AUC is the only number used for acceptance now. Holdout is generated, scored once, and not used for tuning.

## Amendment 1 (2026-10-29, before any scoring of this set)
- Reason: the Wikipedia random-summary API rate-limited the run (84 of 121 requests returned 429). Only 15 extracts were kept, below the 60 needed per arm. Those 15 were not scored.
- Change: the source is now paragraphs from local prose files: docs/*.md in this repo and the markdown files directly under session/. HTML and code are excluded.
- Unchanged: seeds 42 (benign windows) and 43 (splices), the 3 to 8 sentence and 8-word rules, 60 items per arm, dev-only scoring, and the acceptance bar of dev AUC >= 0.80.
- Added limit: all local paragraphs share one project vocabulary. Splices across files can look more related than unrelated Wikipedia topics would. This makes the test harder for M v2 and is reported as such.

## Deviation record (2026-10-29, after the dev run, before any holdout)
- Target was 60 benign items. Local prose produced 27 paragraphs, so the benign arm is 27 items (24 scored, 3 abstained because fewer than 2 units passed the content rule).
- The incoherent arm is 60 splices built from those 27 paragraphs. Items reuse paragraphs, so they are not independent.
- Dev AUC 0.861 (docs/validation/M_V2_MULTISENTENCE_DEV.json) meets the bar, but on a set smaller than pre-registered and with dependent items. It counts as a provisional pass, not calibration-ready. A larger, independent multi-sentence set and a fresh holdout are needed before any threshold is set.

## Amendment 2 (2026-10-29, before any scoring of the new set)
- The local-prose dev result (Amendment 1) is superseded and kept only as a record. It is not used for acceptance or calibration.
- Source returns to English Wikipedia random summaries, collected at a paced rate (3.5 s between requests). On HTTP 429 the collector waits for Retry-After, or 60 s if none. Progress is saved after each extract, so collection can resume across calls.
- Dev and holdout are drawn from disjoint extract pools. Pool assignment is by seed 45 before any items are built.
- Dev: 60 benign windows (seed 42) and 60 spliced items (seed 43), from the dev pool only. Acceptance: dev AUC >= 0.80.
- Holdout: 60 benign windows (seed 44) and 60 spliced items (seed 46), from the holdout pool only. Scored once, after any threshold calibration on dev. Not used for tuning.
- Target: at least 150 kept extracts (about 75 per pool, so each arm has its own sources).

## Threshold rule (pre-registered 2026-10-29, before calibration or holdout scoring)
- Direction: a text is flagged when its M v2 score is below the threshold c. Abstentions are not flagged.
- Calibration on dev only: c is the 4th smallest benign dev score. That leaves at most 3 of 60 benign dev items flagged, a dev false positive rate of 0.05.
- Holdout: scored once with c. Reported as recall (flagged incoherent / 60) and false positive rate (flagged benign / 60). Abstentions count as misses for recall and as passes for false positives.
- No change to c after the holdout result is seen. A holdout failure means M v2 is not accepted, and that is reported as such.

## Holdout result (scored once, 2026-10-29)
- Threshold c = 0.2265, set on dev only. Holdout is now spent for M v2.
- Dev: AUC 0.993, recall 0.95, false positive rate 0.05, 5 benign abstentions.
- Holdout: AUC 0.993, recall 0.983 (59 of 60), false positive rate 0.05 (3 of 60), 1 benign abstention.
- Both pass the pre-registered bar (recall >= 0.80, false positive rate <= 0.05). The false positive rate sits exactly at the limit.
- Limits, stated plainly: the incoherent items are splices across unrelated Wikipedia-style summaries, so this tests cross-topic splices. It says nothing about same-topic splices, shuffled multi-sentence text, or harm. Abstentions count as passes, so benign abstentions are unscored coverage.
- Status: M v2 is validated for cross-topic multi-sentence splices only. It is not wired into the live gate. The live gate stays unchanged until Kyle signs off.
