import os, sys, tempfile
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "services", "clf"))
from harm_web import HarmWeb

fails = []
def check(name, ok):
    print(("  ok    " if ok else "  FAIL  ") + name)
    if not ok: fails.append(name)

rng = np.random.default_rng(7)
dim = 384
H = rng.normal(size=(40, dim)) + 0.5
B = rng.normal(size=(60, dim)) - 0.5
Hn = H / np.linalg.norm(H, axis=1, keepdims=True)
Bn = B / np.linalg.norm(B, axis=1, keepdims=True)

web = HarmWeb(dim)
for v in Hn: web.learn("harm", v, reviewer="kyle", source_id="synthetic")
for v in Bn: web.learn("benign", v, reviewer="kyle", source_id="synthetic")
hc = Hn.mean(0); hc /= np.linalg.norm(hc); bc = Bn.mean(0); bc /= np.linalg.norm(bc)
check("incremental harm centroid equals batch centroid", np.allclose(web.centroid("harm"), hc, atol=1e-12))
check("incremental benign centroid equals batch centroid", np.allclose(web.centroid("benign"), bc, atol=1e-12))
probe = rng.normal(size=dim)
probe_n = probe / np.linalg.norm(probe)
check("margin equals batch margin", abs(web.margin(probe) - (probe_n @ hc - probe_n @ bc)) < 1e-12)

for bad in [dict(label="harm", reviewer=None), dict(label="harm", reviewer="")]:
    try:
        web.learn(bad["label"], Hn[0], reviewer=bad["reviewer"], source_id="x"); check("refuses without reviewer", False)
    except PermissionError:
        check("refuses without reviewer", True)
try:
    web.learn("maybe", Hn[0], reviewer="kyle", source_id="x"); check("refuses unknown label", False)
except ValueError:
    check("refuses unknown label", True)
try:
    web.learn("harm", np.ones(5), reviewer="kyle", source_id="x"); check("refuses wrong dimension", False)
except ValueError:
    check("refuses wrong dimension", True)
try:
    web.learn("harm", np.zeros(dim), reviewer="kyle", source_id="x"); check("refuses zero vector", False)
except ValueError:
    check("refuses zero vector", True)

before = web.margin(Hn[0])
new_harm = Hn[0] + 0.01 * rng.normal(size=dim)
web.learn("harm", new_harm, reviewer="kyle", source_id="review-42")
check("learning a new harm vector moves nearby margins up", web.margin(Hn[0]) > before - 1e-12)

path = os.path.join(tempfile.mkdtemp(), "web.json")
w1 = HarmWeb(dim, path=path)
for v in Hn[:5]: w1.learn("harm", v, reviewer="kyle", source_id="s")
for v in Bn[:5]: w1.learn("benign", v, reviewer="kyle", source_id="s")
w2 = HarmWeb(dim, path=path)
check("save and load keep the margin", abs(w1.margin(probe) - w2.margin(probe)) < 1e-12)
check("event log keeps provenance and no text", all(set(e) == {"label", "reviewer", "source", "n_after"} for e in w2.events) and len(w2.events) == 10)

seed = "/var/workspace/session/private/emb"
if os.path.exists(seed + "/dev_v4_harm.npy"):
    dh = np.load(seed + "/dev_v4_harm.npy"); db = np.load(seed + "/dev_v4_benign.npy")
    real = HarmWeb(dh.shape[1])
    for v in dh: real.learn("harm", v, reviewer="kyle", source_id="dev-v4")
    for v in db: real.learn("benign", v, reviewer="kyle", source_id="dev-v4")
    bh = dh.mean(0); bh /= np.linalg.norm(bh); bb = db.mean(0); bb /= np.linalg.norm(bb)
    # Dev vectors are stored as float32 (about 1e-9 drift after re-normalizing). Tolerance 1e-7 covers that and nothing larger.
    check("seeded from dev v4, centroids match the batch web", np.allclose(real.centroid("harm"), bh, atol=1e-7) and np.allclose(real.centroid("benign"), bb, atol=1e-7))
else:
    print("  skip  dev v4 seed check (embeddings not present)")

print(f"{len(fails)} failed")
sys.exit(1 if fails else 0)
