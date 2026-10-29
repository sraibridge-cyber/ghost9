"""Contract test for services/lm/lm_service.py. Needs the pinned model.

Usage: LM_DIR=<dir with decoder_model_quantized.onnx and tokenizer.json> python3 tests/regression/lm_service_contract.py
Without LM_DIR it exits 0 with SKIP, so CI without the model stays green. It does not hide a failure with the skip.
"""
import json
import os
import sys
import threading
import urllib.error
import urllib.request
from http.server import HTTPServer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "services", "lm"))
import lm_service  # noqa: E402

LM_DIR = os.environ.get("LM_DIR", "")
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # loopback only
passed = failed = 0


def check(name, ok, detail=""):
    global passed, failed
    if ok:
        passed += 1
        print(f"  ok    {name}")
    else:
        failed += 1
        print(f"  FAIL  {name} {detail}")


def call(base, method, path, body=None, raw=None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(base + path, data=data, method=method, headers={"Content-Type": "application/json"})
    try:
        with OPENER.open(req, timeout=120) as r:
            return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        raw_body = e.read() or b"null"
        try:
            return e.code, json.loads(raw_body)
        except json.JSONDecodeError:
            return e.code, {"non_json": raw_body[:200].decode(errors="replace")}


def main():
    if not LM_DIR:
        print("SKIP: set LM_DIR to run the perplexity service contract test")
        sys.exit(0)
    problems = lm_service.verify(LM_DIR)
    check("model matches pinned hashes", not problems, problems)
    if problems:
        sys.exit(1)
    lm_service.Handler.scorer = lm_service.Scorer(LM_DIR)
    server = HTTPServer(("127.0.0.1", 0), lm_service.Handler)
    host, port = server.server_address
    base = f"http://{host}:{port}"
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        check("binds to loopback only", host == "127.0.0.1", host)
        s, b = call(base, "GET", "/health")
        check("GET /health 200 with ok and model id", s == 200 and b.get("ok") is True and b.get("model") == lm_service.MODEL_ID, (s, b))
        texts = ["The bakery on Maple Street opens at six, and the first batch of rye is usually gone by eight.",
                 "rye Maple first six gone the usually bakery batch street eight opens by at"]
        s, b = call(base, "POST", "/nll", {"texts": texts})
        vals = b.get("nll", []) if isinstance(b, dict) else []
        check("POST /nll 200, one value per text, in order", s == 200 and len(vals) == 2, (s, b))
        check("values are finite positive numbers", all(isinstance(v, (int, float)) and v > 0 for v in vals), vals)
        check("coherent sentence has lower NLL than its word shuffle", len(vals) == 2 and vals[0] < vals[1], vals)
        s, b = call(base, "POST", "/nll", {"texts": texts})
        check("same input gives same NLL (determinism)", b.get("nll") == vals, (vals, b.get("nll")))
        s, b = call(base, "POST", "/nll", {"texts": []})
        check("empty texts 200 with empty list", s == 200 and b.get("nll") == [], (s, b))
        s, b = call(base, "POST", "/nll", raw=b"not json")
        check("invalid JSON 400, no traceback", s == 400 and "Traceback" not in json.dumps(b), (s, b))
        s, b = call(base, "POST", "/nll", {"texts": "x"})
        check("texts must be a list (400)", s == 400, (s, b))
        s, b = call(base, "POST", "/nll", {"texts": [1]})
        check("texts must be strings (400)", s == 400, (s, b))
        s, b = call(base, "POST", "/nll", {"texts": ["x"] * (lm_service.MAX_TEXTS + 1)})
        check("over MAX_TEXTS 400", s == 400, (s, b))
        s, b = call(base, "GET", "/nope")
        check("unknown GET 404", s == 404, (s, b))
        s, b = call(base, "POST", "/score", {"texts": ["x"]})
        check("unknown POST path 404", s == 404, (s, b))
    finally:
        server.shutdown()
        server.server_close()
    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
