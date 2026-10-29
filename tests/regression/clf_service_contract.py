"""Contract test for services/clf/clf_service.py (docs/architecture/CLF_SCORE_CONTRACT.md).

Assembles the model from the repo chunks into a temp dir, runs the real server on a free
loopback port in a thread, and checks the contract: routes, status codes, score shape,
determinism, and loopback-only binding. Needs onnxruntime, tokenizers, numpy.
Usage (from repo root): python3 tests/regression/clf_service_contract.py
"""
import json
import os
import sys
import tempfile
import threading
import urllib.error
import urllib.request
from http.server import HTTPServer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SVC = os.path.join(ROOT, "services", "clf")
sys.path.insert(0, SVC)

import clf_service  # noqa: E402
import fetch_model  # noqa: E402

passed = 0
failed = 0


def check(name, ok, detail=""):
    global passed, failed
    if ok:
        passed += 1
        print(f"  ok    {name}")
    else:
        failed += 1
        print(f"  FAIL  {name} {detail}")


# Loopback only: bypass HTTP_PROXY so requests reach the server, not an egress proxy.
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def request(base, method, path, body=None, raw=None, headers=None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(base + path, data=data, method=method, headers=headers or {"Content-Type": "application/json"})
    try:
        with OPENER.open(req, timeout=60) as r:
            return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        raw_body = e.read() or b"null"
        try:
            return e.code, json.loads(raw_body)
        except json.JSONDecodeError:
            return e.code, {"non_json": raw_body[:200].decode(errors="replace")}


def main():
    model_dir = tempfile.mkdtemp(prefix="clf_contract_")
    fetch_model.assemble(model_dir)
    problems = fetch_model.verify(model_dir)
    check("model assembles and verifies (SHA3-512)", not problems, problems)

    clf_service.Handler.scorer = clf_service.Scorer(model_dir)
    server = HTTPServer(("127.0.0.1", 0), clf_service.Handler)
    host, port = server.server_address
    base = f"http://{host}:{port}"
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        check("binds to loopback only", host == "127.0.0.1", host)

        status, body = request(base, "GET", "/health")
        check("GET /health returns 200 with ok and model id", status == 200 and body.get("ok") is True and body.get("model") == clf_service.MODEL_ID, (status, body))

        texts = ["The committee approved the budget after a long debate.", "kill yourself"]
        status, body = request(base, "POST", "/score", {"texts": texts})
        scores = body.get("scores", []) if isinstance(body, dict) else []
        check("POST /score returns 200", status == 200, status)
        check("one score per text, in input order", len(scores) == len(texts), scores)
        check("every score is a number in [0, 1]", all(isinstance(x, (int, float)) and 0.0 <= x <= 1.0 for x in scores), scores)
        check("response carries the model id", body.get("model") == clf_service.MODEL_ID, body)

        status, again = request(base, "POST", "/score", {"texts": texts})
        check("same input gives the same score (determinism)", again.get("scores") == scores, (scores, again.get("scores")))

        status, body = request(base, "POST", "/score", {"texts": []})
        check("empty texts returns 200 with empty scores", status == 200 and body.get("scores") == [], (status, body))

        status, body = request(base, "POST", "/score", raw=b"not json", headers={"Content-Type": "application/json", "Content-Length": "8"})
        check("invalid JSON returns 400 with an error, no stack trace", status == 400 and "error" in body and "Traceback" not in json.dumps(body), (status, body))

        status, body = request(base, "POST", "/score", {"texts": "not a list"})
        check("texts must be a list of strings (400)", status == 400, (status, body))

        status, body = request(base, "POST", "/score", {"texts": [1, 2]})
        check("texts must be strings, not numbers (400)", status == 400, (status, body))

        status, body = request(base, "POST", "/score", {"texts": ["x"] * (clf_service.MAX_TEXTS + 1)})
        check("more than MAX_TEXTS returns 400", status == 400, (status, body))

        status, body = request(base, "GET", "/nope")
        check("unknown GET path returns 404", status == 404, (status, body))

        status, body = request(base, "POST", "/nope", {"texts": ["x"]})
        check("unknown POST path returns 404", status == 404, (status, body))

        req = urllib.request.Request(base + "/score", data=b"{}", method="POST", headers={"Content-Type": "application/json", "Content-Length": str(clf_service.MAX_BODY + 1)})
        try:
            OPENER.open(req, timeout=10)
            code = 200
        except urllib.error.HTTPError as e:
            code = e.code
        except Exception:
            code = None
        check("body over MAX_BODY returns 413 (or refuses the oversized body)", code in (413, None), code)
    finally:
        server.shutdown()
        server.server_close()

    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
