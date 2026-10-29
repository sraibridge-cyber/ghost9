# Within-sentence cohesion: pre-registration

Written before any cohesion value was computed.

## Feature
- Model: the bundled sentence model (all-MiniLM-L6-v2, models/minilm-embed, hash-pinned). Last hidden state per token, batch size 1, no padding.
- Content tokens: all word-piece tokens except [CLS], [SEP], punctuation, and the stopword list below. Sub-word pieces (prefix "##") count as their own tokens.
- Sentence vector: the mean of all non-special token vectors, L2-normalized.
- Cohesion = mean cosine(content token vector, sentence vector). Higher cohesion means the content tokens agree with the sentence's overall meaning.
- Score for incoherence = -cohesion. Higher score means more incoherent.

Stopword list (fixed): the a an of to in on at by for with and or but is was were be been are it its that this these those as from into than then so if when while which who whom whose not no his her their our my your he she they we you i me him them us after before about over under up down out off did do does had has have will would can could should may might must shall there here all any each every some one

## Direction (fixed in advance)
A priori, absurd sentences should have lower cohesion, so higher -cohesion means incoherent. If dev AUC is below 0.5 in this direction, the feature fails, and no direction is flipped.

## Threshold rule (fixed before scoring the non-author set)
- Dev data only: clf prose dev set (tests/data/dev_prose.json, 91) against dev salad (tests/data/dev_salad.json, 31).
- Choose the threshold t that maximizes dev balanced accuracy, subject to dev prose flagged (score >= t) at most 0.05. Ties go to the smaller t.
- Write the chosen t into this file before scoring anything else.

## Targets (fixed before scoring)
Scored once on the non-author negatives (sealed set SHA-256 f59a8a5f8cf18e2b4ea1907b87ae80481df49ab4603e166baf17f4348a11859c, from KYLE_NEG_LM_PREREG.md) against the 40 prose sentences from salad holdout v2:
- AUC (negative score higher than prose) >= 0.90.
- Balanced accuracy at t >= 0.80.
- Prose flagged <= 0.05.

## Limits
Dev prose and dev salad are author-written. The 40 prose positives are reused from earlier tests. Kyle's 40 negatives are the only non-author data here, and they are deliberately absurd.

## Chosen threshold (dev only, recorded before scoring the non-author set)
- t = -0.4327884614467621
- dev AUC = 0.7015; dev balanced accuracy at t = 0.5535; dev salad caught = 0.1290; dev prose flagged = 0.0220
