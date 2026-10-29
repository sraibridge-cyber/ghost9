# Classifier calibration v4: pre-registration (combined second signal)

Recorded before any item of the v4 holdout is scored. Supersedes CLF_PREREG_V3.md for the decision on whether the classifier may block. The v3 result stays on record (benign FPR 2 of 100 against a 1% target).

## Why v4
Kyle chose a second signal to cut benign false positives, and the v4 round. The second signal is a harm-vector web: a hash-pinned sentence-embedding model (Xenova/all-MiniLM-L6-v2, quantized ONNX, mean-pooled, L2-normalized). It is independent of the toxic-bert classifier, so the two signals fail independently.

## Data
- Dev v4 (used for every choice below): `tests/data/clf_dev_v4.json`. 261 benign, 180 harm. It is dev v3 plus holdout v3, which is now used.
- Holdout v4, scored once: held OUTSIDE this repo (100 benign, 50 harm). Benign = hard negatives (news, courtroom, fiction, safety, sport with violent vocabulary) plus everyday prose. Harm = threats and harassment written for this round.
- Holdout v4 SHA-256: `702ca435bc4b8ff62a74599654e04bcce7fd83f2c312480578128acdd2f17084`

Honest limit: the author wrote every item. The holdout is sealed against tuning, not against the author.

## Rule (fixed before v4 holdout was written)
Combined: a sentence is held only when BOTH fire.
- Classifier: score >= 0.001236 (toxic-bert, sigmoid, highest label).
- Harm-vector margin: cos(x, harm centroid) - cos(x, benign centroid) >= 0.092375.
- Centroids are the normalized means of the dev v4 harm and benign embeddings. For dev selection they were leave-one-out. For the holdout they use the full dev v4 set.
- Dev selection (already run, `private/emb/grid_v4b.py`): among pairs with dev benign FPR at most 1 of 261, the pair with the highest dev harm recall. Result: dev recall 0.7944, dev FPR 0.0038.
- Reference, not decision-making: classifier alone at the live 0.007265 gave dev recall 0.678, dev FPR 0.034. Margin alone at 0.02 gave dev recall 0.939, dev FPR 0.073.

## Targets (fixed before scoring)
- Holdout harm recall >= 0.80 (at least 40 of 50).
- Holdout benign false-positive rate <= 0.01 (at most 1 of 100).

## Reporting rule
Report recall and the benign false-positive count as measured. Do not retune on the v4 holdout. If a target fails, the live configuration stays as it is and the failure goes into TECH_DEBT.

## Scope
If both targets are met, the combined rule is a candidate for the prefilter, subject to Kyle's approval. The live classifier stage is not changed by this document.

## Embedding model pins (second signal)
- Source: Xenova/all-MiniLM-L6-v2, `onnx/model_quantized.onnx` and `tokenizer.json` from huggingface.co.
- model_quantized.onnx SHA-256: `afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1`
- tokenizer.json SHA-256: `da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0`
- Not yet bundled in the repo. Bundling needs its own chunking and manifest, and a sovereignty check on the source.

## Result (scored once, 2026-10-29)
- Holdout v4 SHA-256 `702ca435bc4b8ff62a74599654e04bcce7fd83f2c312480578128acdd2f17084` (matches the pre-registered hash).
- Combined rule: harm recall 43 of 50 (0.86, target met). Benign flagged 2 of 100 (0.02, target 0.01 missed).
- Reference only: classifier alone at 0.007265 flagged 10 of 100 benign and caught 48 of 50. Margin alone at 0.02 flagged 10 of 100 and caught 47 of 50.
- Pass: false. The live configuration is unchanged. No retuning on the v4 holdout.
- Honest read: the combined rule roughly fifths the false-positive rate on this holdout (10 down to 2) at a small recall cost (0.96 down to 0.86). The 1% target is not reached. The holdout was written by the same author as the dev data, so the numbers are optimistic for real traffic.
