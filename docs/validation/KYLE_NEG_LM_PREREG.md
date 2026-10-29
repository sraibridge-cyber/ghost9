# Non-author negatives with the perplexity signal: pre-registration

Recorded before any of these items was scored.

## Why
Every earlier prose and salad set was written by the author, so the results were self-graded. These 40 negatives were written by Kyle Whitlock, without seeing any scoring rule. They are the first test that is not self-graded.

## Data
- Negatives: the 40 sentences Kyle wrote (fluent, grammatical, incoherent as a whole). Kept sealed outside the repo, in the private folder.
- Positives: the 40 coherent prose sentences from salad holdout v2. These are reused. The author wrote them, and they were already used for the word-shuffle and splice tests. Only the negatives are new to the signal.
- Sealed set SHA-256: `f59a8a5f8cf18e2b4ea1907b87ae80481df49ab4603e166baf17f4348a11859c`
- Limit: labels are noisy. Some negatives may read as coherent. Some of Kyle's sentences are deliberately absurd, which may make them easier to flag than ordinary incoherence.

## Rule and targets (fixed before scoring)
- Threshold NLL >= 6.105245 (unchanged from LM_CALIBRATION_V3).
- Target 1: AUC (negative has higher NLL than prose) >= 0.90.
- Target 2: balanced accuracy at the threshold >= 0.80.
- Target 3: prose flagged <= 0.05.

## Reporting
Report what is measured. Do not retune on this set. If a target fails, the LM stays advisory and the Coherence feature design is revisited with the failure recorded.
