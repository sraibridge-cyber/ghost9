# M gate v2: semantic cohesion (pre-registration)

Status: pre-registered 2026-10-29, before any v2 scoring. The M v1 design (WordNet harm categories and WordNet cohesion) is retired, see docs/validation/M_GATE_MEASUREMENT.json.

## Job
M owns semantic coherence across the sentences of a text. It answers: do the sentences belong to one topic, or were they spliced together or shuffled? It does not judge harm (Q owns harm) and it does not judge single-sentence absurdity (out of scope until a judge model is validated).

## Input and abstention
- Units: sentences, split on terminal punctuation followed by whitespace or end of text.
- Each unit needs at least 4 content words (3+ letters, not in the stopword list). Units below that are dropped.
- If fewer than 2 units remain, M abstains. It returns verdict "abstain", passes the text on, and never blocks.

## Method
- Embedding: all-MiniLM-L6-v2, quantised ONNX, mean-pooled, L2-normalised. This is the bundled model in models/minilm-embed (pin: manifest.json sha256 values). No new model.
- Score per text: for each unit, cosine similarity between its embedding and the centroid of the other units (leave-one-out). Score = mean of those cosines. Higher means more unified.
- Order does not matter. A leave-one-out centroid measures topical unity, not adjacency, so it catches splices and shuffles without assuming order.

## Pre-registered tests
- Primary metric: AUC of the score, prose vs incoherent, on the dev split only (dev_prose n=91 vs dev_salad n=31).
- Acceptance: dev AUC >= 0.80. If the design clears it, the next step is threshold calibration on dev. If it fails, the design is rejected and no threshold is set.
- Holdout: holdout_prose (n=42) was used to measure M v1 and is now spent for M. A fresh holdout must be built before the final test. No final test is run on a spent set.
- Spent and excluded: Kyle's 40 non-author sentences, the splice set, and holdout_prose.

## Threshold and mode
- No threshold until acceptance. Calibration on dev uses the landing-table method.
- Mode is advisory until validated on a fresh holdout. Advisory means it records a verdict and never blocks.

## Config version
Config hash = SHA-256 of canonical JSON of: model pin, unit rule, content-word rule, stopword list, centroid rule, acceptance threshold. Every verdict records it.

## Coverage check (2026-10-29, before any v2 scoring)
- Dev and salad sets are single-sentence items. Median sentences per item is 1 for dev_prose (n=91), dev_salad (n=31), BENIGN (n=91) and INCOHERENT (n=31).
- Under the sentence-unit rule, 0 of 91 prose and 0 of 31 salad items have 2 or more units. M v2 abstains on all of them.
- The v2 run was stopped before scoring, so no AUC exists and no design decision has been made from outcome data.
- Consequence: the design as pre-registered cannot be tested on the existing sets. Testing it needs multi-sentence prose and multi-sentence incoherent text, which do not exist yet.
- Open decision for Kyle: (a) keep v2 multi-sentence only and build a multi-sentence labelled set, or (b) add a single-sentence word-unity method, pre-registered as a separate version. Any new method is registered before scoring.
