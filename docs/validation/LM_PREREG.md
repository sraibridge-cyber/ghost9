# Perplexity signal (option C): calibration pre-registration

Recorded before any item of the v1 holdout is scored.

## Model (pinned)
- Source: Hugging Face `Xenova/distilgpt2`, files `onnx/decoder_model_quantized.onnx` and `tokenizer.json`.
- decoder_model_quantized.onnx SHA-256: `1d3ab4d7e08ca9b8ea9a42dda13a05b7ff0f1b0c9bdc4f6eba27e7f0ceff8431`
- tokenizer.json SHA-256: `cda20b8ca044949aa07ac4078420c80d1a57139d5f9f33700e46fb2d891e7c66`
- Score: mean per-token negative log-likelihood (NLL) of the sentence. High NLL = incoherent.

## Data
- Calibration: `tests/data/dev_prose.json` (91 coherent) and `tests/data/dev_salad.json` (31 word salads). These were used in the coherence-score study, so they are dev, not a holdout.
- Holdout v1, scored once: held OUTSIDE this repo. 47 new coherent sentences, each with a seeded word-shuffle (seed 20261030).
- Holdout v1 SHA-256: `cb19acf5e16f7d03d2bfc226685cf2debb0afcf5aad8a457b9ff92b547f88d7c`

Honest limit: the author wrote the holdout prose. The shuffled negatives are an easier kind of incoherence than dev salad.

## Threshold rule (fixed before scoring)
1. Flag a sentence when its NLL is at or above a threshold t.
2. Choose the smallest t at which the dev prose flag rate is at most 5%. Recall falls as t rises, so the smallest feasible t has the highest recall.
3. Score the holdout once at that t.

## Targets (fixed before scoring)
- Holdout prose flag rate <= 0.05.
- Holdout shuffled-salad recall >= 0.80.
- Dev salad recall is reported but not a pass criterion, because dev salad is harder.

## Scope
Measurement only. Not wired into the prefilter. Does not change the coherence score or any gate mode.
