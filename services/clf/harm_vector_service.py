"""Ghost9 harm-vector service. Embeds text with the bundled sentence model and scores it against the harm web.

Dependencies: onnxruntime, tokenizers, numpy. Loopback only. Request text is never logged.

Run:
    python3 harm_vector_service.py [--web PATH] [--host 127.0.0.1] [--port 7770]

Routes:
    GET  /health  -> {"ok": true, "model": "...", "learned": {"harm": n, "benign": n}}
    POST /margin  body {"texts": ["...", ...]}  -> {"margins": [...]}
    POST /learn   body {"label": "harm"|"benign", "text": "...", "reviewer": "...", "source_id": "..."}
                  -> {"count": n}. reviewer is required; the web never learns from its own output.

The model files are checked against the SHA3-512 pins in models/minilm-embed/manifest.json before the server starts.
"""
import argparse
import hashlib
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

import numpy as np  # noqa: E402
import onnxruntime as ort  # noqa: E402
from tokenizers import Tokenizer  # noqa: E402

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harm_web import HarmWeb  # noqa: E402

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
MODEL_DIR = os.path.join(REPO, "models", "minilm-embed")
DEFAULT_WEB = os.path.join(os.path.expanduser("~"), ".ghost9", "harm_web.json")
MAX_LEN = 128
MAX_TEXTS = 256
MAX_BODY = 1_000_000
LOOPBACK = {"127.0.0.1", "localhost", "::1"}
LABELS = ("harm", "benign")


def verify(model_dir=MODEL_DIR):
    problems = []
    man = json.load(open(os.path.join(model_dir, "manifest.json"), encoding="utf-8"))
    for f in man["files"]:
        path = os.path.join(model_dir, f["name"])
        if not os.path.exists(path):
            problems.append(f"missing {f['name']}")
            continue
        digest = hashlib.sha3_512(open(path, "rb").read()).hexdigest()
        if digest != f["sha3_512"]:
            problems.append(f"hash mismatch {f['name']}")
    return problems


class Embedder:
    def __init__(self, model_dir=MODEL_DIR):
        self.tokenizer = Tokenizer.from_file(os.path.join(model_dir, "tokenizer.json"))
        self.tokenizer.enable_truncation(MAX_LEN)
        self.tokenizer.enable_padding(length=None)
        self.session = ort.InferenceSession(os.path.join(model_dir, "model_quantized.onnx"),
                                            providers=["CPUExecutionProvider"])
        self.inputs = {x.name for x in self.session.get_inputs()}

    def embed(self, texts):
        out = []
        for i in range(0, len(texts), 32):
            enc = self.tokenizer.encode_batch(texts[i:i + 32])
            ids = np.array([e.ids for e in enc], dtype=np.int64)
            mask = np.array([e.attention_mask for e in enc], dtype=np.int64)
            feed = {"input_ids": ids, "attention_mask": mask}
            if "token_type_ids" in self.inputs:
                feed["token_type_ids"] = np.zeros_like(ids)
            hid = self.session.run(None, feed)[0]
            m = mask[..., None].astype(np.float32)
            pooled = (hid * m).sum(1) / np.clip(m.sum(1), 1e-9, None)
            pooled /= np.linalg.norm(pooled, axis=1, keepdims=True) + 1e-12
            out.append(pooled.astype(np.float64))
        return np.vstack(out) if out else np.zeros((0, 384))


class Handler(BaseHTTPRequestHandler):
    web = None
    embedder = None

    def _send(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return None, (400, {"error": "bad Content-Length"})
        if length <= 0:
            return None, (400, {"error": "empty body"})
        if length > MAX_BODY:
            return None, (413, {"error": "body too large"})
        try:
            payload = json.loads(self.rfile.read(length))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return None, (400, {"error": "invalid JSON"})
        if not isinstance(payload, dict):
            return None, (400, {"error": "body must be a JSON object"})
        return payload, None

    def do_GET(self):
        if self.path == "/health":
            learned = {k: self.web.counts[k] for k in LABELS}
            return self._send(200, {"ok": True, "model": "all-MiniLM-L6-v2", "learned": learned})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path not in ("/margin", "/learn"):
            return self._send(404, {"error": "not found"})
        payload, err = self._body()
        if err:
            return self._send(*err)
        if self.path == "/margin":
            texts = payload.get("texts")
            if not isinstance(texts, list) or not all(isinstance(t, str) for t in texts):
                return self._send(400, {"error": "body must be {\"texts\": [strings]}"})
            if len(texts) > MAX_TEXTS:
                return self._send(400, {"error": f"at most {MAX_TEXTS} texts per request"})
            if not texts:
                return self._send(200, {"margins": []})
            if min(self.web.counts.values()) == 0:
                return self._send(409, {"error": "web needs at least one harm and one benign vector"})
            vecs = self.embedder.embed(texts)
            hc = self.web.centroid("harm")
            bc = self.web.centroid("benign")
            return self._send(200, {"margins": [float(v @ hc - v @ bc) for v in vecs]})
        label = payload.get("label")
        text = payload.get("text")
        reviewer = payload.get("reviewer")
        source_id = payload.get("source_id", "")
        if label not in LABELS:
            return self._send(400, {"error": "label must be harm or benign"})
        if not isinstance(text, str) or not text.strip():
            return self._send(400, {"error": "text must be a non-empty string"})
        if not isinstance(reviewer, str) or not reviewer.strip():
            return self._send(403, {"error": "learning needs a human reviewer id"})
        vec = self.embedder.embed([text])[0]
        try:
            count = self.web.learn(label, vec, reviewer=reviewer.strip(), source_id=str(source_id)[:64])
        except (ValueError, PermissionError) as exc:
            return self._send(400, {"error": str(exc)})
        return self._send(200, {"count": count})

    def log_message(self, fmt, *args):
        return


def main(argv=None):
    parser = argparse.ArgumentParser(description="Ghost9 harm-vector service.")
    parser.add_argument("--web", default=DEFAULT_WEB)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=7770)
    args = parser.parse_args(argv)
    if args.host not in LOOPBACK:
        sys.exit(f"refusing to bind {args.host}: this service is loopback-only")
    problems = verify()
    if problems:
        sys.exit("model check failed:\n" + "\n".join(problems))
    os.makedirs(os.path.dirname(args.web), exist_ok=True)
    Handler.web = HarmWeb(384, path=args.web)
    Handler.embedder = Embedder()
    server = HTTPServer((args.host, args.port), Handler)
    print(f"ghost-harm listening on http://{args.host}:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
