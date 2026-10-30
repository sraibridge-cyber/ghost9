# M v2 score contract

Reference: src/gate_cohesion.js. Config: config/m_v2.json. Golden vectors: tests/data/m_v2_golden.json.
Any port (Kotlin on Android, or another runtime) must reproduce the golden vectors within 1e-5.

## Pins
- Model: all-MiniLM-L6-v2, quantised ONNX. SHA-256 pins in config/m_v2.json. Load fails closed on mismatch.
- Config hash: SHA-256 of JSON.stringify of the config object minus config_hash, key order as written in the file.

## Units
- Split on terminal punctuation followed by whitespace: /(?<=[.!?])\s+/.
- Content words: lowercase [a-z]+ runs, length >= 3, not in config/m_gate.json stopwords.
- A unit needs >= 4 distinct content words. Fewer than 2 units: verdict abstain (passes, never blocks).

## Tokenizer (WordPiece, from tokenizer.json)
- Lowercase, strip combining marks after NFD.
- Basic split: runs of non-space non-punctuation, and each punctuation or symbol character as its own token.
- WordPiece greedy longest match, continuing prefix "##", max 100 chars per word (else [UNK]). Unknown piece: [UNK].
- [CLS] + pieces, truncated to 256 total including [CLS] and [SEP], then [SEP].
- Known gap: this is hand-written, not checked against the reference tokenizers library. Covered by the golden vectors only for the sample texts. Tracked as debt.

## Inference
- Inputs: input_ids, attention_mask (all 1), token_type_ids (all 0), int64.
- Mean-pool the last hidden state over all tokens, then L2-normalise.

## Score
- For each unit i: c = sum of the other units' vectors, normalised. cos_i = dot(E_i, c).
- Score = mean of cos_i. Higher = more coherent.

## Verdict
- Flag when score < threshold (0.2265). Advisory: never blocks.
- Load or integrity failure: verdict unmeasured, passes. Fail open.
