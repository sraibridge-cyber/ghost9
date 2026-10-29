# Single-sentence coherence method (pre-registration, separate from M v2)

Status: pre-registered 2026-10-29, before any scoring by this method. The method is separate from M v2 and has its own acceptance test.

## Job
Detect word salad and other single-sentence incoherence, which M v2 abstains on. Harm is excluded (Q owns it).

## Method
- Words: lowercase a-z runs from the sentence.
- Units: 4-word windows at stride 2 over the word list. A sentence needs at least 8 words (3 windows), or the method abstains.
- Embedding: all-MiniLM-L6-v2, quantised ONNX, mean-pooled, L2-normalised (the bundled model, same pin as M v2).
- Score: mean over windows of the cosine between each window and the centroid of the other windows (leave-one-out), exactly as M v2.

## Test
- Dev only: dev_prose (n=91, label 0) vs dev_salad (n=31, label 1).
- Acceptance: dev AUC >= 0.80.
- Caveat: dev_prose and dev_salad were already used to measure M v1 and the CC gate, so they are reused dev data, not a fresh holdout. Windows overlap, so scores are not independent. Both are stated before scoring.
- No threshold until acceptance and a fresh holdout.
