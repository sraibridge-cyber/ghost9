# Coherence score: redesign options

Status: proposal. Nothing in `src/coherence_calculus.js` has changed. Pick an option, then the TAU battery and its threshold follow.

## What the data says (2026-10-29)

Measured on `tests/data/dev_prose.json` (91 coherent sentences) and `tests/data/dev_salad.json` (31 word salads). Holdout is a seeded word-shuffle of `holdout_prose.json` (42).

| Signal | Dev AUC (prose vs salad) | Holdout AUC | Note |
| --- | --- | --- | --- |
| CC μ (geometric mean with floor) | 0.641 | 0.503 (CI 0.375 to 0.623) | Score values all sit in 0.971 to 0.994. |
| CC D1 (word-count tiers) | 0.890 | not measured | The only domain with real signal. |
| CC D2 | 0.557 | | Near chance. Values are about 0.9998 for everything. |
| CC D3 | 0.418 | | Inverted: salad scores higher. |
| CC D4 | 0.454 | | Inverted. |
| CC D5 | 0.588 | | Weak. |
| CC D6 | 0.551 | | Weak. |
| CC D7 | 0.373 | | Inverted. |
| CC D8 | 0.576 | | Weak. |
| Toxicity classifier (toxic-bert) | 0.303 | | Salad scores slightly higher than prose. It measures toxicity, not coherence. |

Two facts that constrain the choice:
1. AUC depends only on ranking. A log or rescaling of μ can spread the numbers out, but it cannot make prose and salad separate better. The 0.64 is the ranking quality of μ itself.
2. The toxicity classifier separates harm from benign well (holdout AUC 0.96), but it cannot see incoherence. Harm and incoherence are two different measurements.

## Options

**A. Repair the domain scorers (D3, D4, D7 are inverted).**
Each domain needs its own dev-set check and sealed holdout. Cost: several domain rewrites. Risk: fitting the dev set. Keeps the geometric-mean structure you chose.

**B. Learn the domain weights (logistic regression on dev, validate on a sealed holdout).**
Fast to run. It can tell you which domains carry signal. Risk: overfitting with only 91 and 31 examples. It needs a new holdout before any result counts.

**C. Use a pinned local language model for incoherence (perplexity).**
Word salad has high perplexity under a small language model, and coherent prose has low perplexity. This measures the thing the battery is named for. Cost: bundle one more pinned model (sovereignty allows bundled, pinned dependencies). The CC structure would stay, and perplexity would become one signal inside it. Most likely to separate the classes.

**D. Keep CC for what it measures, and stop asking it to gate incoherence.**
Report CC μ as a diagnostic. Move the incoherence gate to option C. Honest, but it changes the target in `five_gate_empirical_battery` (incoherent-text block target 90%). That change needs your approval, since it is a target change.

## Recommendation

C first. It is the only option with a plausible path to separation, and it tests the battery's own definition of incoherence. Run it on dev only, pre-register a holdout the same way `docs/validation/CLF_PREREG.md` does, then set TAU from the data. Option A or B only makes sense if you want to keep the current score's structure.

## Decision needed

Which of A, B, C, or D should I build? My recommendation is C.
