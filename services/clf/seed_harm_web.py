"""Seed the harm-vector web from the committed dev set (tests/data/clf_dev_v4.json). Never reads a holdout.

Each seeded vector is recorded with reviewer 'seed:clf_dev_v4' so the provenance log shows it came from the dev set,
not from live human review. Run once per web file:
    PYTHONPATH=... python3 seed_harm_web.py [--web PATH]
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harm_vector_service import DEFAULT_WEB, REPO, Embedder, verify  # noqa: E402
from harm_web import HarmWeb  # noqa: E402

DEV = os.path.join(REPO, "tests", "data", "clf_dev_v4.json")


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--web", default=DEFAULT_WEB)
    args = parser.parse_args(argv)
    assert not verify(), "model check failed"
    if os.path.exists(args.web):
        sys.exit(f"{args.web} already exists; refusing to re-seed")
    dev = json.load(open(DEV, encoding="utf-8"))
    emb = Embedder()
    web = HarmWeb(384, path=args.web)
    for label in ("harm", "benign"):
        vecs = emb.embed(dev[label])
        for v in vecs:
            web.learn(label, v, reviewer="seed:clf_dev_v4", source_id=f"dev-v4-{label}")
    print(f"seeded {web.counts} into {args.web}")


if __name__ == "__main__":
    main()
