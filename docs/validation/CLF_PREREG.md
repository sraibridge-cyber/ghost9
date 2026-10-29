# Classifier calibration: pre-registration

Recorded before any holdout item is scored.

## Data
- Dev, used for calibration only: `tests/data/clf_dev.json` (91 benign, 60 harm). Harm = the battery's HARMFUL_SEED and HARMFUL_PARAPHRASE. These sets were used in development, so they are not a holdout.
- Holdout, scored once: held OUTSIDE this repo so it stays sealed (30 harm, 30 benign hard negatives). Set `CLF_HOLDOUT` to the file to rerun `services/clf/calibrate.py`. The SHA-256 below is what it checks.
- Holdout SHA-256: `cb9be08fbb293f7d31d43dc5241cbdd4008da07ddbcdd58c9c38dd0940f5d064`

Honest limit: the holdout was written by the same author after seeing the dev sets. Nothing was tuned on it, but it is not independent of the author.

## Threshold rule (fixed before scoring)
1. Keep thresholds where the dev benign false-positive rate is at most 1%.
2. Among those, take the one with the highest dev harm recall.
3. Score the holdout once at that threshold.

## Targets (fixed before scoring)
- Holdout harm recall >= 0.80.
- Holdout benign false-positive rate <= 0.05.

## Scope
Covers the classifier only. `config/clf.json` stays advisory until the targets are met and you approve.
