"""Fetch and verify the Ghost9 classifier model files. Standard library only.

Pins one Hugging Face revision and checks SHA-256 for every file. Files that
already match are kept. A download that does not match is deleted and refused.
Model files never enter the repo; they live under ~/.ghost9/models by default.

Model: Xenova/toxic-bert (ONNX port of unitary/toxic-bert), license Apache-2.0.

Usage:
    python3 fetch_model.py                 # fetch into ~/.ghost9/models/toxic-bert
    python3 fetch_model.py --dir PATH      # fetch somewhere else
    python3 fetch_model.py --verify-only   # check existing files, no network
"""
import argparse
import hashlib
import os
import sys
import tempfile
import urllib.request

REPO = "Xenova/toxic-bert"
REVISION = "65cbc2607cb7fad64f98d1e8a5a3d1f8577895fd"
FILES = {
    "model_quantized.onnx": (
        "onnx/model_quantized.onnx",
        "620012c9bed13e3c58b9c959d160d955ff033a1a27528212b9da5b0aa4ac3f73",
    ),
    "tokenizer.json": (
        "tokenizer.json",
        "d241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66",
    ),
}
DEFAULT_DIR = os.environ.get(
    "GHOST9_MODEL_DIR",
    os.path.join(os.path.expanduser("~"), ".ghost9", "models", "toxic-bert"),
)


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def url_for(remote):
    return f"https://huggingface.co/{REPO}/resolve/{REVISION}/{remote}"


def verify(model_dir):
    """Return a list of problems. An empty list means every file matches its pin."""
    problems = []
    for local, (_, want) in FILES.items():
        path = os.path.join(model_dir, local)
        if not os.path.exists(path):
            problems.append(f"missing {local} in {model_dir}")
            continue
        got = sha256_file(path)
        if got != want:
            problems.append(f"{local} sha256 mismatch: got {got[:12]}..., pinned {want[:12]}...")
    return problems


def fetch(model_dir):
    os.makedirs(model_dir, exist_ok=True)
    for local, (remote, want) in FILES.items():
        path = os.path.join(model_dir, local)
        if os.path.exists(path) and sha256_file(path) == want:
            print(f"ok      {local} (present, hash matches)", flush=True)
            continue
        fd, tmp = tempfile.mkstemp(dir=model_dir, suffix=".part")
        os.close(fd)
        try:
            print(f"fetch   {local} from {REPO}@{REVISION[:12]}", flush=True)
            with urllib.request.urlopen(url_for(remote), timeout=120) as resp, open(tmp, "wb") as out:
                while chunk := resp.read(1 << 20):
                    out.write(chunk)
            got = sha256_file(tmp)
            if got != want:
                sys.exit(f"refusing {local}: downloaded sha256 {got} does not match pinned {want}")
            os.replace(tmp, path)
            print(f"ok      {local}", flush=True)
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Fetch and verify the Ghost9 classifier model.")
    parser.add_argument("--dir", default=DEFAULT_DIR)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args(argv)
    if not args.verify_only:
        fetch(args.dir)
    problems = verify(args.dir)
    if problems:
        sys.exit("\n".join(problems))
    print(f"verified {len(FILES)} files in {args.dir}")


if __name__ == "__main__":
    main()
