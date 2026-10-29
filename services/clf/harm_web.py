"""Harm-vector web: class centroids that learn new vectors without a rebuild.

Each class (harm, benign) keeps the running sum of its L2-normalized embedding vectors and a count.
The centroid is the normalized sum, so adding one vector is O(dim) and exact: the result equals the
batch centroid of every vector seen so far (no drift, no re-embedding).

Rules:
- Stores vectors and provenance only, never text. The event log records label, reviewer, source id and count.
- learn() requires a human reviewer id. Nothing is learned from the classifier's own output, so the web
  cannot train itself on its own flags.
- Changing centroids changes the margin distribution. Any threshold used with this web must be
  re-validated on a fresh holdout (see docs/validation/CLF_PREREG_V4.md and TECH_DEBT W).
"""
import json
import os

import numpy as np

LABELS = ("harm", "benign")


class HarmWeb:
    def __init__(self, dim, path=None):
        self.dim = int(dim)
        self.path = path
        self.sums = {k: np.zeros(self.dim, dtype=np.float64) for k in LABELS}
        self.counts = {k: 0 for k in LABELS}
        self.events = []
        if path and os.path.exists(path):
            self._load()

    def learn(self, label, vec, reviewer, source_id):
        if label not in LABELS:
            raise ValueError("label must be 'harm' or 'benign'")
        if not reviewer:
            raise PermissionError("learning needs a human reviewer id")
        v = np.asarray(vec, dtype=np.float64)
        if v.shape != (self.dim,):
            raise ValueError(f"expected a vector of dimension {self.dim}")
        norm = np.linalg.norm(v)
        if not np.isfinite(norm) or norm == 0.0:
            raise ValueError("vector must be finite and non-zero")
        self.sums[label] += v / norm
        self.counts[label] += 1
        self.events.append({"label": label, "reviewer": str(reviewer), "source": str(source_id),
                            "n_after": self.counts[label]})
        self._save()
        return self.counts[label]

    def centroid(self, label):
        if self.counts[label] == 0:
            raise RuntimeError(f"no '{label}' vectors learned yet")
        c = self.sums[label]
        return c / np.linalg.norm(c)

    def margin(self, vec):
        if min(self.counts.values()) == 0:
            raise RuntimeError("both classes need at least one vector before scoring")
        v = np.asarray(vec, dtype=np.float64)
        v = v / np.linalg.norm(v)
        return float(v @ self.centroid("harm") - v @ self.centroid("benign"))

    def _save(self):
        if not self.path:
            return
        state = {"dim": self.dim, "counts": self.counts,
                 "sums": {k: self.sums[k].tolist() for k in LABELS}, "events": self.events}
        tmp = self.path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(state, f)
        os.replace(tmp, self.path)

    def _load(self):
        with open(self.path, encoding="utf-8") as f:
            state = json.load(f)
        if state["dim"] != self.dim:
            raise ValueError("saved web has a different dimension")
        self.counts = {k: int(state["counts"][k]) for k in LABELS}
        self.sums = {k: np.asarray(state["sums"][k], dtype=np.float64) for k in LABELS}
        self.events = list(state.get("events", []))
