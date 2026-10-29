"""Perplexity signal (option C): mean per-token NLL under a pinned small language model.

Calibration follows docs/validation/LM_PREREG.md. Run from the repo root:
    LM_DIR=<dir with decoder_model_quantized.onnx and tokenizer.json> \
    LM_HOLDOUT=<path to holdout file, kept outside the repo> \
    python3 services/lm/perplexity.py
Writes docs/validation/LM_CALIBRATION.json. Does not change any gate or config.
"""
import hashlib
import json
import os
import re
import sys

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LM_DIR = os.environ.get("LM_DIR", "")
HOLD = os.environ.get("LM_HOLDOUT", "")
PREREG = os.environ.get("LM_PREREG", os.path.join(ROOT, "docs", "validation", "LM_PREREG.md"))
DEV = os.environ.get("LM_DEV", "")
OUT = os.environ.get("LM_OUT", os.path.join(ROOT, "docs", "validation", "LM_CALIBRATION.json"))
FLAG_FPR_MAX = 0.05
DEV_FPR_MAX = float(os.environ.get("LM_DEV_FPR_MAX", "0.05"))  # v3 sets 0.025 (see LM_PREREG_V3.md)
RECALL_TARGET = 0.80
MAX_TOKENS = 512


def sha256(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def pinned(prereg, label):
    m = re.search(label + r": `([0-9a-f]{64})`", prereg)
    assert m, f"pinned hash for {label} missing from LM_PREREG.md"
    return m.group(1)


class Scorer:
    def __init__(self, lm_dir):
        self.tok = Tokenizer.from_file(os.path.join(lm_dir, "tokenizer.json"))
        self.sess = ort.InferenceSession(os.path.join(lm_dir, "decoder_model_quantized.onnx"),
                                         providers=["CPUExecutionProvider"])

    def nll(self, text):
        ids = self.tok.encode(text).ids[:MAX_TOKENS]
        if len(ids) < 2:
            return None
        x = np.array([ids], dtype=np.int64)
        logits = self.sess.run(["logits"], {"input_ids": x, "attention_mask": np.ones_like(x)})[0][0][:-1]
        logits = logits - logits.max(axis=1, keepdims=True)
        logp = logits - np.log(np.exp(logits).sum(axis=1, keepdims=True))
        targets = np.array(ids[1:])
        return float(-logp[np.arange(len(targets)), targets].mean())


def auc(pos, neg):
    w = 0.0
    for p in pos:
        for n in neg:
            w += 1.0 if p > n else (0.5 if p == n else 0.0)
    return w / (len(pos) * len(neg))


def main():
    assert LM_DIR and os.path.isdir(LM_DIR), "set LM_DIR"
    assert HOLD and os.path.exists(HOLD), "set LM_HOLDOUT to the holdout file"
    prereg = open(PREREG, encoding="utf-8").read()
    assert sha256(os.path.join(LM_DIR, "decoder_model_quantized.onnx")) == pinned(prereg, "decoder_model_quantized.onnx SHA-256"), "model hash mismatch"
    assert sha256(os.path.join(LM_DIR, "tokenizer.json")) == pinned(prereg, "tokenizer.json SHA-256"), "tokenizer hash mismatch"
    m = re.search(r"Holdout v\d+ SHA-256: `([0-9a-f]{64})`", prereg)
    print("dev FPR limit:", DEV_FPR_MAX)
    assert m and sha256(HOLD) == m.group(1), "holdout changed since pre-registration"

    sc = Scorer(LM_DIR)
    if DEV:
        d = json.load(open(DEV, encoding="utf-8"))
        dev_prose_txt, dev_salad_txt = d["prose"], d["salad"]
    else:
        dev_prose_txt = json.load(open(os.path.join(ROOT, "tests", "data", "dev_prose.json")))
        dev_salad_txt = json.load(open(os.path.join(ROOT, "tests", "data", "dev_salad.json")))
    dev_prose = [v for v in (sc.nll(t) for t in dev_prose_txt) if v is not None]
    dev_salad = [v for v in (sc.nll(t) for t in dev_salad_txt) if v is not None]

    # Smallest threshold with dev prose flag rate <= 5%. Flag = NLL >= t.
    t_star = None
    for t in sorted(set(dev_prose)):
        if sum(v >= t for v in dev_prose) / len(dev_prose) <= DEV_FPR_MAX:
            t_star = t
            break
    assert t_star is not None
    dev_recall = sum(v >= t_star for v in dev_salad) / len(dev_salad)
    dev_fpr = sum(v >= t_star for v in dev_prose) / len(dev_prose)

    hold = json.load(open(HOLD, encoding="utf-8"))
    ho_prose = [v for v in (sc.nll(t) for t in hold["prose"]) if v is not None]
    ho_shuf = [v for v in (sc.nll(t) for t in hold["shuffled"]) if v is not None]
    ho_fpr = sum(v >= t_star for v in ho_prose) / len(ho_prose)
    ho_recall = sum(v >= t_star for v in ho_shuf) / len(ho_shuf)

    result = {
        "threshold_nll": t_star,
        "dev": {"prose_n": len(dev_prose), "salad_n": len(dev_salad), "prose_flag_rate": dev_fpr,
                "salad_recall": dev_recall, "auc_salad_gt_prose": auc(dev_salad, dev_prose)},
        "holdout": {"prose_n": len(ho_prose), "shuffled_n": len(ho_shuf), "prose_flag_rate": ho_fpr,
                    "shuffled_recall": ho_recall, "auc_shuffled_gt_prose": auc(ho_shuf, ho_prose)},
        "dev_fpr_max_rule": DEV_FPR_MAX,
        "targets": {"holdout_prose_flag_rate_max": FLAG_FPR_MAX, "holdout_shuffled_recall_min": RECALL_TARGET},
        "pass": ho_fpr <= FLAG_FPR_MAX and ho_recall >= RECALL_TARGET,
        "holdout_sha256": sha256(HOLD),
    }
    json.dump(result, open(OUT, "w", encoding="utf-8"), indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
