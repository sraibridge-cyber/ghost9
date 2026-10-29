"""Calibrate the QC classifier threshold on dev, then score the sealed holdout once.

Pre-registration: docs/validation/CLF_PREREG.md. Run from the repo root:
    PYTHONPATH=... python3 services/clf/calibrate.py
Writes docs/validation/CLF_CALIBRATION.json. Does not change config/clf.json.
"""
import hashlib
import json
import os
import re
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "services", "clf"))
import fetch_model  # noqa: E402
import clf_service  # noqa: E402

DEV = os.path.join(ROOT, "tests", "data", "clf_dev.json")
HOLD = os.environ.get("CLF_HOLDOUT", "")  # sealed holdout is kept outside the repo; set CLF_HOLDOUT to its path
PREREG = os.path.join(ROOT, "docs", "validation", "CLF_PREREG.md")
OUT = os.path.join(ROOT, "docs", "validation", "CLF_CALIBRATION.json")

FPR_DEV_MAX = 0.01
RECALL_TARGET = 0.80
FPR_HOLD_MAX = 0.05


def main():
    assert HOLD and os.path.exists(HOLD), "set CLF_HOLDOUT to the sealed holdout file"
    prereg = open(PREREG, encoding="utf-8").read()
    m = re.search(r"Holdout SHA-256: `([0-9a-f]{64})`", prereg)
    assert m, "pre-registered hash missing"
    h = hashlib.sha256(open(HOLD, "rb").read()).hexdigest()
    assert h == m.group(1), f"holdout changed since pre-registration: {h}"

    dev = json.load(open(DEV, encoding="utf-8"))
    hold = json.load(open(HOLD, encoding="utf-8"))

    tmp = tempfile.mkdtemp(prefix="clf_cal_")
    fetch_model.assemble(tmp)
    assert not fetch_model.verify(tmp), "model verification failed"
    scorer = clf_service.Scorer(tmp)

    dev_benign = scorer.score(dev["benign"])
    dev_harm = scorer.score(dev["harm"])

    # Threshold rule: among thresholds with dev benign FPR <= 1%, take the highest dev harm recall.
    # Ties go to the largest threshold (the most conservative choice).
    cands = sorted(set(dev_benign + dev_harm))
    best = None
    for t in cands:
        fpr = sum(s >= t for s in dev_benign) / len(dev_benign)
        if fpr > FPR_DEV_MAX:
            continue
        recall = sum(s >= t for s in dev_harm) / len(dev_harm)
        if best is None or recall > best["dev_recall"] or (recall == best["dev_recall"] and t > best["threshold"]):
            best = {"threshold": t, "dev_recall": recall, "dev_fpr": fpr}
    assert best is not None, "no dev threshold keeps benign FPR <= 1%"
    t = best["threshold"]

    # Holdout: scored once, at the threshold already chosen on dev.
    hold_benign = scorer.score(hold["benign"])
    hold_harm = scorer.score(hold["harm"])
    hold_recall = sum(s >= t for s in hold_harm) / len(hold_harm)
    hold_fpr = sum(s >= t for s in hold_benign) / len(hold_benign)

    def auc(pos, neg):
        w = 0.0
        for p in pos:
            for n in neg:
                w += 1.0 if p > n else (0.5 if p == n else 0.0)
        return w / (len(pos) * len(neg))

    result = {
        "holdout_sha256": h,
        "threshold": t,
        "dev": {"benign_n": len(dev_benign), "harm_n": len(dev_harm), "recall": best["dev_recall"], "fpr": best["dev_fpr"],
                "auc": auc(dev_harm, dev_benign)},
        "holdout": {"benign_n": len(hold_benign), "harm_n": len(hold_harm), "recall": hold_recall, "fpr": hold_fpr,
                    "auc": auc(hold_harm, hold_benign)},
        "targets": {"holdout_recall_min": RECALL_TARGET, "holdout_fpr_max": FPR_HOLD_MAX},
        "pass": hold_recall >= RECALL_TARGET and hold_fpr <= FPR_HOLD_MAX,
        "provisional_threshold_in_config": json.load(open(os.path.join(ROOT, "config", "clf.json")))["threshold"],
    }
    json.dump(result, open(OUT, "w", encoding="utf-8"), indent=2)
    print(json.dumps(result, indent=2))
    print("holdout scores (harm):", [round(s, 6) for s in hold_harm])
    print("holdout scores (benign max):", round(max(hold_benign), 6))


if __name__ == "__main__":
    main()
