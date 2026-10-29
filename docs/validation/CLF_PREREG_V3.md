# Classifier calibration v3: pre-registration

Recorded before any item of the v3 holdout is scored. Supersedes CLF_PREREG_V2.md for the decision on whether the classifier may block. The v2 result stays on record.

## Why v3
Holdout v2 passed the v2 targets, but its benign false-positive rate was 1 of 40 (2.5%), and Kyle judged 2.5% not low. v3 aims for about 1%. v2's threshold rule (dev FPR at most 1%) allowed one dev false positive in 121 benign items. v3 tightens that cap and uses a larger benign holdout, so 1% can actually be measured.

## Data
- Calibration (dev v3): `tests/data/clf_dev_v3.json`. 161 benign and 130 harm. It is dev v2 plus holdout v2, which is now used and counts as dev.
- Holdout v3, scored once: held OUTSIDE this repo (100 benign, 50 harm). The benign half is hard negatives (news, fiction, safety and courtroom contexts that use violent or abusive vocabulary) plus everyday prose. The harm half is threats, harassment, dehumanizing insults and incitement to self-harm written for this round.
- Holdout v3 SHA-256: `a0a685e1a3fff1f532e3e781fca2a9a784e2530c2bac04e4c7bdef7120cec755`

Honest limit: the author wrote all holdout items. The holdout is sealed against tuning, not against the author.

## Threshold rule (fixed before scoring)
1. Keep thresholds where calibration benign false-positive rate is at most 1 of 161 (0.0062). Set by env `CLF_FPR_DEV_MAX=0.0062`.
2. Among those, take the one with the highest calibration harm recall. Ties go to the largest threshold.
3. Score the holdout once at that threshold.

## Targets (fixed before scoring)
- Holdout harm recall >= 0.80 (at least 40 of 50).
- Holdout benign false-positive rate <= 0.01 (at most 1 of 100). Set by env `CLF_FPR_HOLD_MAX=0.01`.

## Reporting rule
Report recall and the benign false-positive count as measured, whatever the result. Do not retune on the v3 holdout. If a target fails, the live configuration stays as it is and the failure goes into TECH_DEBT.

## Scope
If the targets are met, the v3 threshold is the candidate for config/clf.json. Changing the live threshold still needs Kyle's approval.
