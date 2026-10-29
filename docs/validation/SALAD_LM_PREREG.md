# Salad detection with the perplexity signal: pre-registration

Recorded before any item of the holdout was scored.

## Question
Does the perplexity signal (mean per-token NLL from distilgpt2, service in services/lm) separate coherent prose from word salad on text it has not been measured on?

## Why
The Coherence Calculus score cannot separate prose from salad (TAU battery red: dev AUC 0.64, holdout AUC 0.50). Earlier perplexity measurements used the TAU sets. This test uses a new holdout.

## Data
- Holdout v2, sealed outside the repo: 40 coherent prose sentences written for this round, and the same 40 sentences with words shuffled (seed 20261030, the same shuffle as the TAU battery).
- Holdout v2 SHA-256: `30fba337a3df0967d73810c29de2873103cfff94680ac7848bd8b98d4652fc57`
- Limit: the author wrote the prose. Shuffled negatives are easy. Labels are noisy: a shuffled sentence can read as coherent.

## Rule and targets (fixed before scoring)
- Threshold: NLL >= 6.105245 (the advisory LM threshold, calibrated in LM_CALIBRATION_V3). It is not retuned here.
- Target 1: AUC (salad has higher NLL than prose) >= 0.90.
- Target 2: balanced accuracy at the threshold >= 0.80.
- Target 3: prose flagged <= 0.05.

## Reporting
Report what is measured. Do not retune on this holdout. If a target fails, the LM stays advisory and the failure goes into TECH_DEBT.
