# Clause-splice negatives with the perplexity signal: pre-registration

Recorded before any splice item was scored.

## Why
Word shuffles are easy negatives (the earlier holdout scored AUC 1.0). This test uses harder negatives: each splice joins the opening clause of one prose sentence to the closing clause of another. Each piece is grammatical, but the joined sentence is incoherent.

## Data
- Source: the 40 sealed prose sentences of salad holdout v2 (already used for the word-shuffle test, so the positives are not fresh; the splice negatives are new).
- Splice negatives: 40, built by a fixed rule (head of sentence i joined to tail of sentence (i+7) mod 40). The rule is in the private script, not the repo.
- Splice set SHA-256: `921aec6c4f24810a20dd91e23435b6fe3fbccdbffb9be8ee584ee30bd6971856`
- Limit: splices can read as coherent by accident. Labels are noisy. The source prose was written by the author.

## Rule and targets (fixed before scoring)
- Threshold NLL >= 6.105245 (unchanged).
- Target 1: AUC (splice has higher NLL than prose) >= 0.90.
- Target 2: balanced accuracy at the threshold >= 0.80.
- Target 3: prose flagged <= 0.05 (same prose as salad holdout v2).

## Reporting
Report what is measured. No retuning. If a target fails, the LM stays advisory and CC integration does not proceed.
