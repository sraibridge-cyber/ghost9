# QC recalibration on the Node runtime (pre-registration)

Status: written 2026-10-30, before any dev or holdout scoring. Kyle's approval required before any config change.

## Why

The Node port (src/qc_node.js) does not reproduce the Python scores. Logit gap has median 0.18 and p99 0.44, so the Python block threshold (0.007265, config/clf.json) is not valid on Node scores. Phone builds need a threshold measured on Node.

## Labels

- Ground truth: Kyle's hand labels after the approved rules (LABEL_RULE_V3.md: scam rule, directive rule, contextual protocol). On the dev set these match the v3 writer key 93/93.
- Positive class: harm. Negative class: benign.
- Borderline rows are excluded from threshold selection and reported separately.

## Sets

- Dev: the 93 rows Kyle labelled (positions 1 to 94, minus 88). Caveat: the labelling rules were tuned on these rows, so dev is not independent of the rule set. It is used for threshold selection only.
- Holdout: the 66 rows at positions 95 to 160 of labeller_v2/blind_rater_input.csv. Kyle labels them by hand before any scoring. The holdout is scored once. Its scores are never used to change the threshold.

## Threshold rule (fixed before scoring)

- Block when score >= t (same convention as src/prefilter.js).
- Let nH be the number of dev harm rows and k = ceil(0.95 * nH). Set t* = the k-th highest harm score on dev. This is the largest t with dev harm recall >= 0.95, which blocks the fewest benign rows.
- If the dev harm recall cannot reach 0.95 at any threshold, the result is a fail. Keep the current threshold, report it, and offer the grey-band option (a logit band around t, with its cost stated).

## Holdout pass criteria (fixed before scoring)

- Harm recall at t* >= 0.90.
- Benign block rate at t* <= 0.10.
- Report both with Wilson 95% intervals. With 66 rows, the intervals will be wide, and the report must say so.

## Out of scope

- Phone policy for unscreened sentences (hold versus fail open). Open decision, resolved before any phone build.
- Android port and latency budget.


## Dev result (2026-10-30, dev only; holdout not scored)

- Original rule gives t* = 0.000929: dev harm recall 0.973, benign block 28/49 = 0.571.
- Problem: the original rule has no benign constraint at selection, so it picks a threshold that blocks more than half of benign dev rows. The holdout benign criterion (<= 0.10) would fail. Holdout is not scored under this rule.
- Reference: the Python threshold 0.007265 on Node scores gives dev harm recall 0.622 and benign block 10/49 = 0.204.

## Proposed amendment (v2, NOT yet approved; requires Kyle's sign-off before any holdout labels are scored)

- Select t as the lowest threshold with dev benign block <= 0.10. Candidate on dev: t = 0.072445, harm recall 0.459 (17/37), benign block 5/49.
- Holdout pass: harm recall >= 0.90 AND benign block <= 0.10 at t, Wilson 95% intervals reported.
- If the dev recall is too low for use, the outcome is fail. Next option: grey band in logit space, pre-registered separately.
- Amendment must be dated and signed off before the holdout is labelled or scored, so it cannot be fitted to the holdout.

## Holdout freeze and single scoring (2026-10-31, before holdout scoring)

- Holdout: positions 95 to 160 (66 rows), labelled by Kyle. Ground truth is Kyle's labels. Counts: harm 30, benign 32, borderline 4.
- Funnel (frozen): quarantine if the rule channel hits (cue list in RULE_CHANNEL_PREREG.md) OR QC score >= t_high = 0.122444. Pass if QC score < t_low = 0.072445 and no rule hit. Middle (QC >= t_low, not quarantined) goes to the second filter. The second filter is not scored in this step.
- t_low and t_high were chosen on dev only, from the same 93 rows. They are frozen here.
- Pragmatic gate is excluded from this holdout. Single-sentence rows give it no context, so it cannot be measured here.
- Holdout scored once with these values. Nothing is tuned after this scoring.
