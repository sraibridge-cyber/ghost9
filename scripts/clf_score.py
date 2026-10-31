# Scores sentences with a local ONNX classifier. Runs fully offline once the model
# file exists. Usage: python3 scripts/clf_score.py <model_dir> <out.json>
import json, re, sys, os
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

MODEL_DIR = sys.argv[1]
OUT = sys.argv[2]
MAX_LEN = 128

tok = Tokenizer.from_file(os.path.join(MODEL_DIR, "tokenizer.json"))
tok.enable_truncation(MAX_LEN)
tok.enable_padding(length=MAX_LEN)
sess = ort.InferenceSession(os.path.join(MODEL_DIR, "model_quantized.onnx"), providers=["CPUExecutionProvider"])
input_names = [i.name for i in sess.get_inputs()]

def score(texts):
    enc = tok.encode_batch(texts)
    feed = {}
    if "input_ids" in input_names:
        feed["input_ids"] = np.array([e.ids for e in enc], dtype=np.int64)
    if "attention_mask" in input_names:
        feed["attention_mask"] = np.array([e.attention_mask for e in enc], dtype=np.int64)
    if "token_type_ids" in input_names:
        feed["token_type_ids"] = np.array([e.type_ids for e in enc], dtype=np.int64)
    logits = sess.run(None, feed)[0]
    probs = 1 / (1 + np.exp(-logits))
    return probs.max(axis=1).tolist()

def arr(src, name):
    m = re.search(r"const " + name + r" = \[([\s\S]*?)\n\];", src)
    return [s.replace("\\'", "'") for s in re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(1))]

src = open("tests/batteries/prefilter_integration_battery.js", encoding="utf-8").read()
sets = {
    "benign": arr(src, "BENIGN"),
    "harm_seed": arr(src, "HARMFUL_SEED"),
    "harm_para": arr(src, "HARMFUL_PARAPHRASE"),
    "incoherent": arr(src, "INCOHERENT"),
    "holdout_prose": json.load(open("tests/data/holdout_prose.json")),
}
result = {k: score(v) for k, v in sets.items()}
json.dump(result, open(OUT, "w"))
print("input names:", input_names)
for k, v in result.items():
    print(f"{k:14s} n={len(v):3d} median={np.median(v):.4f} min={min(v):.4f} max={max(v):.4f}")

def auc(pos, neg):
    pos, neg = np.array(pos), np.array(neg)
    return float(np.mean([(p > n) + 0.5 * (p == n) for p in pos for n in neg]))
harm = result["harm_seed"] + result["harm_para"]
print(f"AUC harm vs benign       {auc(harm, result['benign']):.3f}")
print(f"AUC harm_para vs benign  {auc(result['harm_para'], result['benign']):.3f}")
print(f"AUC incoherent vs benign {auc(result['benign'], result['incoherent']):.3f}  (higher = benign scores higher)")
