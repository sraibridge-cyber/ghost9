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
