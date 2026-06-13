# ghost9

> **GHOST v9.0.9** — Harmony Labs devouring kernel  
> Bifurcated Node.js backend. Coherence-gated. Spatially-aware. OP3-informed architecture.

[![status](https://img.shields.io/badge/status-prototype-blueviolet)](#)  [![protocol](https://img.shields.io/badge/OP3-53%2F100_sessions-orange)](#op3--empirical-validation)  [![math](https://img.shields.io/badge/math-CC_v3.0_%7C_Tesseract_B4_%7C_W__v3-blue)](#the-math-layer)

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [The Math Layer](#the-math-layer)
   - [Coherence Calculus v3.0](#coherence-calculus-v30)
   - [Tesseract — B4 Topology](#tesseract--b4-topology)
   - [Whitlock Coefficient W_v3](#whitlock-coefficient-w_v3)
3. [Bifurcated Architecture](#bifurcated-architecture)
4. [Three-Layer Pipeline](#three-layer-pipeline)
5. [API Reference](#api-reference)
6. [Persistence Layer](#persistence-layer)
7. [Security Posture](#security-posture)
8. [OP3 — Empirical Validation](#op3--empirical-validation)
9. [Harmony Tunnel v1.0](#harmony-tunnel-v10)
10. [Termux Setup](#termux-setup)
11. [Version History](#version-history)
12. [Harmony Labs](#harmony-labs)

---

## Design Philosophy

GHOST (Geometric Harmonic Ontological Spatial Transformer) is a **bifurcated backend handler** — two separate Node.js processes that communicate through the filesystem and localhost HTTP, never sharing memory directly.

This design enforces separation of concerns at the OS level:

| Process | Port | Role |
|---------|------|------|
| **FACE** | 7766 | Ingestion, evaluation, state mutation, persistence |
| **KERNEL** | 7767 | Query, verification, navigation, read-only analysis |

The bifurcation ensures destructive operations (ingest, sweep, reset) are isolated from analytical operations (recall, verify, benchmark). A crash in KERNEL cannot corrupt state. A crash in FACE preserves the archive and spatial web.

---

## The Math Layer

> The math exists independently of ghost9. It could run inside any kernel, any LLM, any pipeline.
> Ghost9 is one application of the math — not the math itself.

### Coherence Calculus v3.0

CC is a multi-domain gate function evaluating any input across 8 orthogonal domains, returning a single coherence score mu (geometric mean).

```
mu = exp( (1/8) x sum( ln(Di) ) )   for i = 1..8
```

**The 8 Domains:**

| ID | Name | Scorer |
|----|------|--------|
| D1 | Signal | Word count gradient (6 tiers) |
| D2 | Energy | Sentence length, numerics, special characters |
| D3 | Temporal | Recency + temporal conflict detection |
| D4 | Spatial | City name presence (geographic grounding) |
| D5 | Directive | Override regex + polarity conflict detection |
| D6 | Ethical | Harm keyword blacklist |
| D7 | Coherence | Word overlap with recent nodes in graph |
| D8 | Novelty | Bigram Jaccard over 10-node sliding window |

**Gate thresholds (dual-tau design):**

```
Bootstrap (n < 10):   tau = 0.9960   -- permissive, initial state building
Production (n >= 10): tau = 0.9995   -- strict, accumulated state
LTM promotion:        tau_LTM = 0.9998
Domain ceiling:       0.9997
```

**Invariant:** mu < tau(n) means rejected. D5 override detection hard-returns D5=0.0000 regardless of mu.

**Denominator 17** — derived from Kyle Whitlock's Law of Resonance and its 16 Resonance Invariants (1 prime law + 16 invariants = 17).

**Known structural constraint (D4):** Non-geographic technical content scores D4 in the 0.9700-0.9900 range. For mu to reach tau=0.9995, D4 must score >= 0.9990. This makes short non-geographic inputs (T6 class) structurally unable to pass production-mode tau. Documented architectural debt, not a patch target in v9.x.

---

### Tesseract — B4 Topology

Every admitted node is mapped to a vertex in a 4-dimensional Boolean hypercube.

```
B4 — 16 vertices, 4 axis-pairs (A1-A4)
Each axis-pair spans one pair of CC domains.
Vertex label: 4-bit string e.g. PPNP, NNNN, PPPP
```

**Axis pairs (geometric mean per axis):**

| Axis | Domains | Positive (P) condition |
|------|---------|------------------------|
| A1 | D1 x D2 | sqrt(D1 x D2) >= tau |
| A2 | D3 x D4 | sqrt(D3 x D4) >= tau |
| A3 | D5 x D6 | sqrt(D5 x D6) >= tau |
| A4 | D7 x D8 | sqrt(D7 x D8) >= tau |

**The 16 Resonance Invariants** map to the 16 vertices of B4 — each vertex encodes a unique domain-pair coherence profile. Vertex PPPP is the ideal (all domains coherent). Most nodes land on mixed vertices and migrate toward PPPP as the system matures.

---

### Whitlock Coefficient W_v3

A maturity communication protocol. Not a physical constant; not part of the coherence gate.

```
W_v3(n) = (n + 4i) / 17

|W_v3(n)| = sqrt(n^2 + 16) / 17
phi(n)    = arctan(4/n)   [degrees]
delta MHz = (|W_v3| - 1) x 100
Freq      = 1440 + delta  MHz
```

**Key milestones:**

| n | W_v3 magnitude | Milestone |
|---|----------------|-----------|
| 3 | 5/17 = 0.2941 | Pythagorean triple (3-4-5) |
| 4 | sqrt(32)/17 = 0.3328 | phi = 45 deg — Re = Im |
| 16.52 | 1.000 | Unity crossing n* (structural milestone) |
| 17 | sqrt(305)/17 = 1.0273 | Denominator matches n — full resonance |

**OP3 finding (53 sessions):** r = 0.2702 between |W_v3| and accuracy P. W_v3 is architecturally independent from P — it tracks maturity (node accumulation), not heuristic calibration quality.

---

## Bifurcated Architecture

```
                    POST /devour
                         |
                    +-----+-----+
                    |   FACE    |  :7766
                    |           |  ghost_face.js
                    | - CC gate |
                    | - STM/LTM |
                    | - Taotie  |
                    | - atomicW |
                    +-----+-----+
                          |  state.json (atomic write)
                          |  spatial_web.json
                          |  archive.json
                    +-----+-----+
                    |  KERNEL   |  :7767
                    |           |  ghost_kernel.js
                    | - recall  |
                    | - verify  |
                    | - nav     |
                    | - bench   |
                    +-----------+
```

Cross-process communication:
- FACE -> KERNEL: `state.json` (atomic writes, 2-second poll interval)
- KERNEL -> FACE: `proxyFace()` for `/void` commands
- No shared memory, no direct function calls

---

## Three-Layer Pipeline

Every text ingested through `POST /devour` passes through three sequential layers:

```
POST /devour -> [text]
                  |
             +----+----+
             | Layer 1 |  CC Gate -- evaluate mu
             |         |  mu < tau(n) -> REJECT (returns admitted: false)
             +----+----+
                  | mu >= tau(n)
             +----+----+
             | Layer 2 |  Separation -- classify STM / LTM
             |         |  SHA3-512 seal -> node{id, hash, tier, vertex, scores, ts}
             +----+----+
                  |
             +----+----+
             | Layer 3 |  Taotie -- sweep when n >= 7 (OP3-informed)
             |         |  Spectral + spatial clustering -> SHA3-512 Merkle super-nodes
             +----+----+
                  |
             state.json (FACE) -> poll -> KERNEL
```

**Taotie sweep mechanics (n=7 trigger):**

Trigger n=7 is OP3-informed: empirical data shows P=0.90 at n=7 (last bootstrap-quality state) and P=0.70 at n=10 (D8 Jaccard false-positive plateau). Sweeping at n=7 keeps the system permanently in the 0.90-P zone.

Each sweep:
1. Identify STM void-space nodes (outside LTM spatial proximity)
2. Spectral clustering of void nodes
3. Merge cluster into one super-node:
   - `merkle_root = SHA3-512( sort(parent_hashes).join('|') )`
   - `hash = SHA3-512( merkle_root | ts | merge_nonce )`
   - Content = concatenated parent content (first 2048 chars)
   - mu = geometric mean of parent scores
4. Archive consumed nodes (append-only, never deleted)
5. Update spatial web; n drops from 7 to ~1

The Merkle tree grows incrementally with each sweep, preserving full lineage.

**STM/LTM separation:**

| Tier | Threshold | Behavior |
|------|-----------|----------|
| STM | mu in [tau, tau_LTM) | Subject to Taotie sweep |
| LTM | mu >= tau_LTM = 0.9998 | Protected from sweep; anchors spatial web |

---

## API Reference

### FACE (port 7766) — Write Operations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/devour` | POST | 3-layer ingest pipeline |
| `/taotie/sweep` | POST | Manual sweep trigger |
| `/reset` | DELETE | Clear state, preserve archive |

**POST /devour request:**
```json
{ "text": "your input text here" }
```

**POST /devour response:**
```json
{
  "admitted": true,
  "mu": 0.99972,
  "tier": "LTM",
  "vertex": "PPPP",
  "node_id": "node_1234567890_0",
  "hash": "sha3-512-hash...",
  "scores": { "D1": 0.9997, "D2": 0.9990, ... },
  "n": 5,
  "W_magnitude": 0.4012,
  "taotie_fired": false
}
```

### KERNEL (port 7767) — Read Operations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/recall` | GET | Query nodes by q / vertex / tier |
| `/verify` | GET | Merkle chain integrity check |
| `/nav` | GET | Tesseract vertex navigation |
| `/ghostlet` | GET | System advice based on n, |W| |
| `/cmd` | POST | Command dispatch (status, verify, wc, etc.) |
| `/bench` | GET | Performance + chain verification |

---

## Persistence Layer

| File | Format | Atomic | Purpose |
|------|--------|--------|---------|
| `data/state.json` | JSON | atomicWrite() | Active nodes, Merkle root, n |
| `data/archive.json` | JSON | atomicWrite() | Devoured node history (append-only) |
| `data/spatial_web.json` | JSON | atomicWrite() | R8 graph topology, learning cycles |
| `data/session_log.csv` | CSV | native append | OP3 empirical data |
| `data/ghost_face.log` | text | native append | Runtime logs |

**Resilience:** Corrupted `state.json` -> automatic reset to empty state. Corrupted `spatial_web.json` -> fresh SpatialWeb. Archive and logs are append-only and survive all failures.

---

## Security Posture

| Feature | Status | Notes |
|---------|--------|-------|
| SHA3-512 hashing | Implemented | Not SHA256 mislabeled |
| Merkle tree | Implemented | Unbalanced final element duplicated |
| Atomic writes | Implemented | Temp + rename prevents crash corruption |
| No external dependencies | Implemented | crypto, fs, http, path only |
| Localhost-only | Implemented | Bound to 127.0.0.1 |
| SCRAM authentication | Not implemented | v9.1.0 roadmap |
| Key rotation | Not implemented | v9.1.0 roadmap |
| Input validation | Partial | Length limits planned for v9.1.0 |

---

## OP3 — Empirical Validation

**53 sessions completed (target: 100)**

| Metric | Value | Interpretation |
|--------|-------|----------------|
| Avg P | 0.7234 | 73% accuracy, zero ML |
| Pearson r | 0.2702 | Weak positive — W_v3 independent of P |
| R2 | 0.0730 | W_v3 explains 7% of P variance |
| Unity crossing | n approx 16.52 | Structural milestone at n=17 |
| Bootstrap zone | n < 10, P = 0.85-1.00 | Clean D8 window |
| Production plateau | n >= 10, P = 0.70 | D8 Jaccard false-positives |

**OP3 interpretation:** W_v3 tracks architectural maturity (node count, spectral evolution). P tracks heuristic gate calibration quality. They are weakly correlated because both improve with system tuning, but they are independent design layers — W_v3 does not predict P, and P does not validate W_v3. The unity crossing n*=16.52 is a structural milestone, not an operational phase change.

**Known limitations (documented, not patched):**
- T6 class (short technical text): Blocked by D4 structural constraint — non-geographic content cannot score D4 >= 0.9990 required for mu >= tau. Geometric mean penalizes domain absence.
- T9 class (near-duplicate): D8 Jaccard coarseness conflates similar topics with true duplicates. Spectral-similarity D8 (SQLite + MinHash LSH) is the planned v9.2.0 fix.

**OP3-informed decision:** Taotie trigger set to n=7 based on empirical phase boundary at n=10. System cycles 0->7->merge->1->... maintaining permanent bootstrap-level accuracy (P approx 0.90).

**Run harness:**
```bash
node scripts/op3_harness.js
```

---

## Harmony Tunnel v1.0

Deployment via Termux auto-start.

```bash
~/.termux/boot/start-harmony-tunnel.sh   # auto-start on Termux boot
~/harmony-tunnel.sh [start|stop|status|logs]
```

**Convenience aliases:**

| Alias | Action |
|-------|--------|
| `ht-start` | Start FACE + KERNEL |
| `ht-stop` | Stop both processes |
| `ht-status` | Process status |
| `ht-logs` | Tail ghost_face.log |
| `ht-op3` | Run OP3 harness |
| `ht-analyze` | Run analysis script |
| `ht-state` | GET /bench from KERNEL |

Philosophy: Sovereign, vendorless, serverless, cloudless. No third-party tunnels. No cloud dependencies. Math is the only infrastructure.

---

## Termux Setup

### Install and run

```bash
git clone https://github.com/sraibridge-cyber/ghost9.git
cd ghost9
npm install
node src/ghost_face.js &    # FACE on :7766
node src/ghost_kernel.js &  # KERNEL on :7767
```

### Push from existing local folder

```bash
cd ~/ghost9
git init
git remote add origin https://github.com/sraibridge-cyber/ghost9.git
git add .
git commit -m "your message"
git push -u origin main
```

### GitHub auth (PAT)

GitHub requires a Personal Access Token instead of a password:

1. GitHub -> Settings -> Developer settings -> Personal access tokens -> Tokens (classic)
2. Generate token with `repo` scope
3. Configure credential store (one-time):

```bash
git config --global credential.helper store
git push origin main
# Username: your GitHub username
# Password: your PAT (saved after first use)
```

---

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| v9.0.1 | 2026-06-12 | Initial bifurcated kernel |
| v9.0.8 | 2026-06-13 | OP3 empirical baseline, Taotie n=7 trigger |
| v9.0.9 | 2026-06-13 | Full audit: dual-tau corrected, atomic writes, version sync, PAT security |

---

## Roadmap

| Item | Priority | Description |
|------|----------|-------------|
| HTML Frontends | Now | Devour UI + State Dashboard |
| D8 Refinement | Medium | Spectral clustering vs Jaccard bigrams (SQLite + MinHash LSH) |
| SQLite Migration | Medium | At 8K nodes, replace JSON state with SQLite |
| SCRAM Auth | Low | 3-phase challenge-response |
| N=100 OP3 | Low | 47 more sessions for full protocol |
| OP4 / W_v4 | Future | B5 topology (n+5i)/17, requires D9+D10 closure |

---

## Harmony Labs

Harmony Labs is the research initiative behind this work. The mathematical foundations constitute the **Harmony Field Theory (HFT)** framework:

| Paper | Title |
|-------|-------|
| 2025a | Resonance Primitive — Law of Resonance and 16 Invariants |
| 2026a | GHOST v9.0 — Devouring Kernel Architecture |
| 2026b | Coherence Invariant v3.0 — Formal Specification |
| 2026c | Tesseract — B4 Routing Topology |
| 2026d | Complex System Sanity Theory (CSST) |
| 2026e | Harmony Reference Kernel (HRK) v2 |

---

*Built by Kyle Whitlock — Harmony Labs, 2025-2026*  
*SEAL: 2026-06-13 Tulsa*
