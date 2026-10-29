# Perplexity signal (option C): calibration v2 pre-registration

Recorded before any item of the v2 holdout is scored. Supersedes LM_PREREG.md for the decision on whether the signal may be used.

## Model (pinned, same as v1)
- Source: Hugging Face `Xenova/distilgpt2`, files `onnx/decoder_model_quantized.onnx` and `tokenizer.json`.
- decoder_model_quantized.onnx SHA-256: `1d3ab4d7e08ca9b8ea9a42dda13a05b7ff0f1b0c9bdc4f6eba27e7f0ceff8431`
- tokenizer.json SHA-256: `cda20b8ca044949aa07ac4078420c80d1a57139d5f9f33700e46fb2d891e7c66`
- Score: mean per-token NLL. High NLL = incoherent.

## Data
- Calibration (dev v2): `tests/data/lm_dev_v2.json`. 138 coherent and 78 word salads. It is the v1 dev sets plus the v1 holdout, which is now used.
- Holdout v2, scored once: held OUTSIDE this repo. 45 new coherent sentences, each with a seeded word-shuffle (seed 20261031).
- Holdout v2 SHA-256: `76e5333d8f9b70ca00f1b84be24022abd5267a6d7ca4f20612844f9a3dee93a6`

Honest limit: the author wrote the holdout prose. The shuffled negatives are an easier kind of incoherence than dev salad.

## Threshold rule (fixed before scoring)
1. Flag a sentence when its NLL is at or above t.
2. Choose the smallest t at which the dev prose flag rate is at most 5%.
3. Score the holdout once at that t.

## Targets (fixed before scoring)
- Holdout prose flag rate <= 0.05.
- Holdout shuffled-salad recall >= 0.80.
