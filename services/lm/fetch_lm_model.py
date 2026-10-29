"""Assemble the perplexity model from the chunks bundled in models/distilgpt2. Standard library only.

No network access. The app never downloads anything at runtime.
Usage:
    python3 fetch_lm_model.py [--dir PATH]     # default ~/.ghost9/models/distilgpt2
    python3 fetch_lm_model.py --verify-only [--dir PATH]
Each assembled file is checked against its SHA-256 pin (docs/validation/LM_PREREG_V3.md) and its SHA3-512 in manifest.json.
"""
import argparse
import hashlib
import json
import os
import shutil
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SOURCE = os.path.join(REPO, "models", "distilgpt2")
MANIFEST = os.path.join(SOURCE, "manifest.json")
DEFAULT_DIR = os.path.join(os.path.expanduser("~"), ".ghost9", "models", "distilgpt2")


def sha(data, algo):
    return hashlib.new(algo, data).hexdigest()


def assemble(dest):
    man = json.load(open(MANIFEST, encoding="utf-8"))
    os.makedirs(dest, exist_ok=True)
    for f in man["files"]:
        if f["chunks"]:
            data = b""
            for c in f["chunks"]:
                part = open(os.path.join(SOURCE, c["name"]), "rb").read()
                if sha(part, "sha3_512") != c["sha3_512"] or len(part) != c["size"]:
                    raise SystemExit(f"chunk check failed: {c['name']}")
                data += part
        else:
            data = open(os.path.join(SOURCE, f["name"]), "rb").read()
        if sha(data, "sha256") != f["sha256"] or sha(data, "sha3_512") != f["sha3_512"]:
            raise SystemExit(f"assembled file check failed: {f['name']}")
        tmp = os.path.join(dest, f["name"] + ".tmp")
        with open(tmp, "wb") as out:
            out.write(data)
        os.replace(tmp, os.path.join(dest, f["name"]))
    return dest


def verify(dest):
    problems = []
    man = json.load(open(MANIFEST, encoding="utf-8"))
    for f in man["files"]:
        path = os.path.join(dest, f["name"])
        if not os.path.exists(path):
            problems.append(f"missing {f['name']}")
            continue
        data = open(path, "rb").read()
        if sha(data, "sha256") != f["sha256"]:
            problems.append(f"sha256 mismatch {f['name']}")
    return problems


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("--dir", default=DEFAULT_DIR)
    p.add_argument("--verify-only", action="store_true")
    args = p.parse_args(argv)
    if args.verify_only:
        problems = verify(args.dir)
        print("\n".join(problems) if problems else "ok")
        return 1 if problems else 0
    assemble(args.dir)
    problems = verify(args.dir)
    if problems:
        print("\n".join(problems))
        return 1
    print(f"assembled and verified in {args.dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
