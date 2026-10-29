"""Assemble and verify the Ghost9 classifier model from files in this repo. Standard library only.

The model ships in the repo as chunks under models/toxic-bert/, each under GitHub's
100 MB file limit. manifest.json pins SHA3-512 (the algorithm the Ghost kernel uses)
for every chunk and every assembled file. Nothing is downloaded from any third party.

Model: Xenova/toxic-bert (ONNX port of unitary/toxic-bert), Apache-2.0.

Usage:
    python3 fetch_model.py                 # assemble into ~/.ghost9/models/toxic-bert
    python3 fetch_model.py --dir PATH      # assemble somewhere else
    python3 fetch_model.py --verify-only   # check the assembled files, no assembly
"""
import argparse
import hashlib
import json
import os
import shutil
import sys
import tempfile

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SOURCE = os.path.join(REPO_ROOT, "models", "toxic-bert")
MANIFEST_PATH = os.path.join(SOURCE, "manifest.json")
DEFAULT_DIR = os.environ.get(
    "GHOST9_MODEL_DIR",
    os.path.join(os.path.expanduser("~"), ".ghost9", "models", "toxic-bert"),
)


def load_manifest():
    with open(MANIFEST_PATH, encoding="utf-8") as f:
        manifest = json.load(f)
    if manifest.get("algorithm") != "sha3-512":
        sys.exit(f"manifest algorithm must be sha3-512, got {manifest.get('algorithm')!r}")
    return manifest


MANIFEST = load_manifest()
MODEL_ID = MANIFEST["model_id"]


def sha3_512_file(path):
    digest = hashlib.sha3_512()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _assembled_ok(path, entry):
    return (
        os.path.exists(path)
        and os.path.getsize(path) == entry["size"]
        and sha3_512_file(path) == entry["sha3_512"]
    )


def verify(model_dir):
    """Return a list of problems. An empty list means every assembled file matches its pin."""
    problems = []
    for entry in MANIFEST["files"]:
        path = os.path.join(model_dir, entry["name"])
        if not os.path.exists(path):
            problems.append(f"missing {entry['name']} in {model_dir}")
            continue
        got = sha3_512_file(path)
        if got != entry["sha3_512"]:
            problems.append(f"{entry['name']} sha3_512 mismatch: got {got[:12]}..., pinned {entry['sha3_512'][:12]}...")
    return problems


def assemble(model_dir):
    os.makedirs(model_dir, exist_ok=True)
    for entry in MANIFEST["files"]:
        dest = os.path.join(model_dir, entry["name"])
        if _assembled_ok(dest, entry):
            print(f"ok      {entry['name']} (present, hash matches)", flush=True)
            continue
        fd, tmp = tempfile.mkstemp(dir=model_dir, suffix=".part")
        os.close(fd)
        try:
            with open(tmp, "wb") as out:
                for chunk in entry.get("chunks") or []:
                    src = os.path.join(SOURCE, chunk["name"])
                    if sha3_512_file(src) != chunk["sha3_512"]:
                        sys.exit(f"refusing {entry['name']}: chunk {chunk['name']} fails its SHA3-512 pin")
                    with open(src, "rb") as f:
                        shutil.copyfileobj(f, out, 1 << 20)
                if not entry.get("chunks"):
                    shutil.copyfile(os.path.join(SOURCE, entry["name"]), tmp)
            if not _assembled_ok(tmp, entry):
                sys.exit(f"refusing {entry['name']}: assembled file fails its SHA3-512 pin")
            os.replace(tmp, dest)
            print(f"ok      {entry['name']} (assembled from {len(entry.get('chunks') or [1])} part(s))", flush=True)
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Assemble and verify the Ghost9 classifier model.")
    parser.add_argument("--dir", default=DEFAULT_DIR)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args(argv)
    if not args.verify_only:
        assemble(args.dir)
    problems = verify(args.dir)
    if problems:
        sys.exit("\n".join(problems))
    print(f"verified {len(MANIFEST['files'])} files in {args.dir} ({MODEL_ID})")


if __name__ == "__main__":
    main()
