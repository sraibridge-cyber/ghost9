# Own coherence model for the ingest gate: pre-registration

Written before any feature was computed. Placement: the Coherence module runs after the pre-gates and before the SS module (src/ghost_face.js, the CC.evaluate call, then the REJECT check).

## Model
Logistic regression on four interpretable features, label 1 = incoherent:
1. NLL: mean per-token negative log-likelihood from the bundled perplexity service (distilgpt2, models pinned in LM_PREREG_V3).
2. Cohesion: mean cosine between content-token vectors and the sentence mean, from the bundled MiniLM model (same definition as COHESION_PREREG.md, same stopword list).
3. TTR: unique lowercase words divided by total words.
4. LogLen: log of the word count.
Features are standardized with training means and standard deviations. The model uses L2 regularization 0.01 and 2000 gradient steps at learning rate 0.1.

## Training data (synthetic, dev prose only)
- Positives (coherent): tests/data/dev_prose.json (91 sentences).
- Negatives (incoherent): for each dev prose sentence, one word shuffle (seed 20261031) and one clause splice (head of sentence i with tail of sentence (i+7) mod 91). That gives 182 negatives.
- Limit: these negatives are synthetic and easy. A good fit on them does not show that the model generalizes.

## Threshold rule (fixed before scoring the non-author set)
Score = model probability of incoherence. Choose the threshold t that maximizes balanced accuracy on the training positives and negatives, subject to training prose flagged at most 0.05. Ties go to the smaller t. Write t into this file before scoring.

## Test
Non-author negatives: Kyle's 40 sentences (sealed set SHA-256 f59a8a5f8cf18e2b4ea1907b87ae80481df49ab4603e166baf17f4348a11859c). Positives: the 40 prose sentences from salad holdout v2 (reused, flagged in earlier results).

## Targets (fixed before scoring)
- AUC (Kyle negatives score higher than prose) >= 0.90.
- Balanced accuracy at t >= 0.80.
- Prose flagged <= 0.05.

## Limits
Dev prose, the synthetic negatives, and the salad prose were written by the author. Only Kyle's 40 sentences are non-author data.

## Chosen model and threshold (recorded before scoring the non-author set)
- weights (standardized NLL, cohesion, TTR, LogLen): [2.6721, -0.3421, -0.2613, -0.0532], bias 1.7231
- t = 0.6571888682189045
- training balanced accuracy at t = 0.8709; training negatives caught = 0.7857; training prose flagged = 0.0440
- Note: the first run of this script crashed while writing its JSON, after computing these values. This run reproduces them exactly (deterministic model, seeded shuffles, fixed threshold).
