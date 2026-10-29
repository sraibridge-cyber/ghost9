import json, os, socket, subprocess, sys, tempfile, time, urllib.request, urllib.error
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
sys.path.insert(0, os.path.join(REPO, "services", "clf"))
from harm_vector_service import verify  # noqa: E402
fails = []
def check(name, ok):
    print(("  ok    " if ok else "  FAIL  ") + name)
    if not ok: fails.append(name)
check("bundled model matches its SHA3-512 pins", verify() == [])
s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
web = os.path.join(tempfile.mkdtemp(), "web.json")
proc = subprocess.Popen([sys.executable, os.path.join(REPO, "services", "clf", "harm_vector_service.py"), "--web", web, "--port", str(port)],
                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
base = f"http://127.0.0.1:{port}"
def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method, headers={"Content-Type": "application/json"})
    try:
        with opener.open(req, timeout=60) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
try:
    for _ in range(120):
        try:
            if call("GET", "/health")[0] == 200: break
        except Exception:
            time.sleep(0.5)
    st, h = call("GET", "/health")
    check("health reports an empty web", st == 200 and h["learned"] == {"harm": 0, "benign": 0})
    st, b = call("POST", "/margin", {"texts": ["hello there"]})
    check("margin refuses until both classes have a vector", st == 409)
    st, _ = call("POST", "/learn", {"label": "harm", "text": "I will hurt you", "reviewer": "", "source_id": "t"})
    check("learn refuses without a reviewer", st == 403)
    st, _ = call("POST", "/learn", {"label": "maybe", "text": "x", "reviewer": "kyle"})
    check("learn refuses an unknown label", st == 400)
    st, _ = call("POST", "/learn", {"label": "harm", "text": "   ", "reviewer": "kyle"})
    check("learn refuses empty text", st == 400)
    st, r1 = call("POST", "/learn", {"label": "harm", "text": "I will find you and make you pay for this.", "reviewer": "kyle", "source_id": "t1"})
    st2, r2 = call("POST", "/learn", {"label": "benign", "text": "The farmers market moves to the courthouse lawn next month.", "reviewer": "kyle", "source_id": "t2"})
    check("learning one harm and one benign vector succeeds", st == 200 and st2 == 200 and r1["count"] == 1 and r2["count"] == 1)
    st, m = call("POST", "/margin", {"texts": ["I will find you and make you pay.", "The library hours are longer this week."]})
    check("margin returns one float per text", st == 200 and len(m["margins"]) == 2 and all(isinstance(x, float) for x in m["margins"]))
    check("harm-like text scores higher than benign text", m["margins"][0] > m["margins"][1])
    st, _ = call("POST", "/margin", {"texts": "not a list"})
    check("margin rejects a non-list body", st == 400)
    st, _ = call("GET", "/nope")
    check("unknown route is 404", st == 404)
    check("the web file stores vectors and provenance, never the learned text",
          "I will find you" not in open(web, encoding="utf-8").read())
finally:
    proc.terminate()
    try: proc.wait(timeout=10)
    except subprocess.TimeoutExpired: proc.kill()
bad = subprocess.run([sys.executable, os.path.join(REPO, "services", "clf", "harm_vector_service.py"), "--host", "0.0.0.0", "--port", "1"], capture_output=True, text=True)
check("refuses a non-loopback bind", bad.returncode != 0 and "loopback" in bad.stderr)
print(f"{len(fails)} failed")
sys.exit(1 if fails else 0)
