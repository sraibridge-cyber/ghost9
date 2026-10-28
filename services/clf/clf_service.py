"""Ghost9 local classifier service. Standard library HTTP, runs offline after the model is fetched.

Dependencies: onnxruntime, tokenizers, numpy. Nothing else.

Run:
    python3 clf_service.py [--model-dir PATH] [--host 127.0.0.1] [--port 7768]

Routes:
    GET  /health  -> {"ok": true, "model": "..."}
    POST /score   body {"texts": ["...", ...]}  ->  {"scores": [...], "model": "..."}

Each score is the highest sigmoid output across the model's labels, in [0, 1].
It is one signal for the gate, not a verdict. Request text is never logged.
The service binds to loopback only. Model files are checked against pinned
SHA-256 hashes (see fetch_model.py) before the server starts.
"""
import argparse
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np  # noqa: E402
import onnxruntime as ort  # noqa: E402
from tokenizers import Tokenizer  # noqa: E402

from fetch_model import DEFAULT_DIR, REPO, REVISION, verify  # noqa: E402

MODEL_ID = f"{REPO}@{REVISION}"
MAX_LEN = 128
MAX_TEXTS = 256
MAX_BODY = 1_000_000
LOOPBACK = {"127.0.0.1", "localhost", "::1"}


class Scorer:
    def __init__(self, model_dir):
        self.tokenizer = Tokenizer.from_file(os.path.join(model_dir, "tokenizer.json"))
        self.tokenizer.enable_truncation(MAX_LEN)
        self.tokenizer.enable_padding(length=MAX_LEN)
        self.session = ort.InferenceSession(
            os.path.join(model_dir, "model_quantized.onnx"),
            providers=["CPUExecutionProvider"],
        )
        self.inputs = {i.name for i in self.session.get_inputs()}

    def score(self, texts):
        enc = self.tokenizer.encode_batch(texts)
        feed = {}
        if "input_ids" in self.inputs:
            feed["input_ids"] = np.array([e.ids for e in enc], dtype=np.int64)
        if "attention_mask" in self.inputs:
            feed["attention_mask"] = np.array([e.attention_mask for e in enc], dtype=np.int64)
        if "token_type_ids" in self.inputs:
            feed["token_type_ids"] = np.array([e.type_ids for e in enc], dtype=np.int64)
        logits = self.session.run(None, feed)[0]
        probs = 1.0 / (1.0 + np.exp(-logits))
        return [round(float(x), 6) for x in probs.max(axis=1)]


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
        if self.path != "/score":
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
            return self._send(200, {"scores": [], "model": MODEL_ID})
        return self._send(200, {"scores": self.scorer.score(texts), "model": MODEL_ID})

    def log_message(self, fmt, *args):
        return


def main(argv=None):
    parser = argparse.ArgumentParser(description="Ghost9 local classifier service.")
    parser.add_argument("--model-dir", default=DEFAULT_DIR)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=7768)
    args = parser.parse_args(argv)

    if args.host not in LOOPBACK:
        sys.exit(f"refusing to bind {args.host}: this service is loopback-only")
    problems = verify(args.model_dir)
    if problems:
        sys.exit("model check failed:\n" + "\n".join(problems) + "\nRun fetch_model.py first.")

    Handler.scorer = Scorer(args.model_dir)
    server = HTTPServer((args.host, args.port), Handler)
    print(f"ghost-clf listening on http://{args.host}:{args.port} ({MODEL_ID})", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
