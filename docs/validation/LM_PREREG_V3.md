# Perplexity signal (option C): calibration v3 pre-registration

Written before the v3 holdout exists and before any v3 item is scored. Supersedes LM_PREREG_V2.md for the decision on whether the signal may be used. v1 and v2 rules were not changed; they were not met, and their holdouts are used.

## Why a stricter rule
v1 and v2 both produced a prose flag rate on fresh holdouts of 6.4% to 6.7%, against 4.3% to 4.4% on dev with a 5% dev limit. The 5% dev limit is too loose for fresh prose.

## Model (pinned, same as v1 and v2)
- Source: Hugging Face `Xenova/distilgpt2`, files `onnx/decoder_model_quantized.onnx` and `tokenizer.json`.
- decoder_model_quantized.onnx SHA-256: `1d3ab4d7e08ca9b8ea9a42dda13a05b7ff0f1b0c9bdc4f6eba27e7f0ceff8431`
- tokenizer.json SHA-256: `cda20b8ca044949aa07ac4078420c80d1a57139d5f9f33700e46fb2d891e7c66`
- Score: mean per-token NLL. High NLL = incoherent.

## Calibration data (dev v3 = dev v2)
- `tests/data/lm_dev_v2.json`: 138 coherent, 78 word salads. Includes the used v1 holdout.

## Threshold rule (fixed before scoring)
1. Flag a sentence when its NLL is at or above t.
2. Choose the smallest t at which the dev-v2 prose flag rate is at most 2.5%.
3. Score the v3 holdout once at that t.

## Targets (fixed before scoring)
- Holdout v3 prose flag rate <= 0.05.
- Holdout v3 shuffled-salad recall >= 0.80.

## Holdout v3
- Held OUTSIDE this repo: 47 new coherent sentences, each with a seeded word-shuffle (seed 20261101).
- Holdout v3 SHA-256: `244cae88ba734a9bd41542871471bc118b03b9849810e7bb9541241bc3f270dc`

Honest limit: the author wrote the holdout prose. The shuffled negatives are an easier kind of incoherence than dev salad.
