"""Ghost9 local perplexity service (option C). Standard library HTTP. Dependencies: onnxruntime, tokenizers, numpy.

Run:
    python3 lm_service.py --model-dir PATH [--host 127.0.0.1] [--port 7769]

Routes:
    GET  /health -> {"ok": true, "model": "..."}
    POST /nll    body {"texts": ["...", ...]} -> {"nll": [...], "model": "..."}

Each value is the mean per-token negative log-likelihood of the text. High means incoherent.
It is one signal, not a verdict. Request text is never logged. Loopback only.
Model files are checked against the SHA-256 values pinned in docs/validation/LM_PREREG_V3.md before the server starts.
"""
import argparse
import hashlib
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from perplexity import Scorer  # noqa: E402

PREREG = os.path.join(HERE, "..", "..", "docs", "validation", "LM_PREREG_V3.md")
MODEL_ID = "Xenova/distilgpt2@a41c10485c18a64b6606729b6a082330cbd8f49e:decoder_model_quantized"
MAX_TEXTS = 256
MAX_BODY = 1_000_000
LOOPBACK = {"127.0.0.1", "localhost", "::1"}


def sha256(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def verify(model_dir):
    """Return a list of problems. Empty means the model matches the pre-registration."""
    text = open(PREREG, encoding="utf-8").read()
    pins = {
        "decoder_model_quantized.onnx": re.search(r"decoder_model_quantized\.onnx SHA-256: `([0-9a-f]{64})`", text),
        "tokenizer.json": re.search(r"tokenizer\.json SHA-256: `([0-9a-f]{64})`", text),
    }
    problems = []
    for name, m in pins.items():
        if not m:
            problems.append(f"pin for {name} missing from LM_PREREG_V3.md")
            continue
        p = os.path.join(model_dir, name)
        if not os.path.exists(p):
            problems.append(f"missing {name}")
        elif sha256(p) != m.group(1):
            problems.append(f"hash mismatch for {name}")
    return problems


class Handler(BaseHTTPRequestHandler):
    scorer = None

    def _send(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"ok": True, "model": MODEL_ID})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/nll":
            return self._send(404, {"error": "not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self._send(400, {"error": "bad Content-Length"})
        if length <= 0:
            return self._send(400, {"error": "empty body"})
        if length > MAX_BODY:
            return self._send(413, {"error": "body too large"})
        try:
            payload = json.loads(self.rfile.read(length))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return self._send(400, {"error": "invalid JSON"})
        texts = payload.get("texts") if isinstance(payload, dict) else None
        if not isinstance(texts, list) or not all(isinstance(t, str) for t in texts):
            return self._send(400, {"error": "body must be {\"texts\": [strings]}"})
        if len(texts) > MAX_TEXTS:
            return self._send(400, {"error": f"at most {MAX_TEXTS} texts per request"})
        if not texts:
            return self._send(200, {"nll": [], "model": MODEL_ID})
        values = [self.scorer.nll(t) for t in texts]
        return self._send(200, {"nll": [None if v is None else round(v, 6) for v in values], "model": MODEL_ID})

    def log_message(self, fmt, *args):
        return


def main(argv=None):
    parser = argparse.ArgumentParser(description="Ghost9 local perplexity service.")
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=7769)
    args = parser.parse_args(argv)
    if args.host not in LOOPBACK:
        sys.exit(f"refusing to bind {args.host}: this service is loopback-only")
    problems = verify(args.model_dir)
    if problems:
        sys.exit("model check failed:\n" + "\n".join(problems))
    Handler.scorer = Scorer(args.model_dir)
    server = HTTPServer((args.host, args.port), Handler)
    print(f"ghost-lm listening on http://{args.host}:{args.port} ({MODEL_ID})", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
