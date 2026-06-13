# ghost9

> **GHOST v9.0** — Harmony Labs devouring kernel prototype
> Three-layer ingest pipeline. Coherence-gated. Spatially-aware. Empirically validated.

---

## Table of Contents

1. [Overview](#overview)
2. [The Math Layer](#the-math-layer)
   - [Coherence Calculus v3.0](#coherence-calculus-v30)
   - [Tesseract — B4 Topology](#tesseract--b4-topology)
   - [Whitlock Coefficient W_v3](#whitlock-coefficient-w_v3)
3. [Ghost9 — The Kernel](#ghost9--the-kernel)
   - [Three-Layer Pipeline](#three-layer-pipeline)
   - [Taotie Sweep Operator](#taotie-sweep-operator)
   - [Spatial Web](#spatial-web)
4. [OP3 — Empirical Validation](#op3--empirical-validation)
5. [Termux Setup](#termux-setup)
6. [Harmony Labs](#harmony-labs)

---

## Overview

**ghost9** is a prototype devouring kernel — an information-ingestion engine that gates, classifies, and compresses knowledge using a mathematically grounded coherence measure. It is the first working implementation of the **Harmony Field Theory (HFT)** framework.

The project has two distinct layers that must not be conflated:

| Layer | What it is | Files |
|-------|-----------|-------|
| **The Math** | Theory: how coherence is measured, how space is shaped, how maturity is communicated | `coherence_calculus.js`, `tesseract.js` |
| **Ghost9** | Implementation: the kernel that runs the math as a live ingest server | `ghost_face.js`, `ghost_kernel.js`, `taotie.js`, `spatial_web.js`, `spectral_graph.js` |

---

## The Math Layer

> The math exists independently of ghost9. It could run inside any kernel, any LLM, any pipeline.
> Ghost9 is one application of the math — not the math itself.

### Coherence Calculus v3.0

Coherence Calculus (CC) is a **multi-domain gate function** that evaluates any piece of information across 8 orthogonal domains and returns a single coherence score mu.

```
mu = exp( (1/8) x sum( ln(Di) ) )   for i = 1..8
```

mu is the **geometric mean** of all domain scores — not a sum, not an average. Any domain near zero collapses the whole score.

**The 8 Domains:**

| ID | Name | What it measures |
|----|------|------------------|
| D1 | Signal | Word-count tier — information density floor |
| D2 | Energy | Semantic depth — sentence complexity, numerics, specificity |
| D3 | Temporal | Recency — freshness of the information |
| D4 | Spatial | Geographic grounding — place-anchored content |
| D5 | Directive | Constitutional compliance — override / jailbreak detection |
| D6 | Ethical | Harm keyword exposure — safety gate |
| D7 | Coherence | Contextual consistency — overlap with prior context |
| D8 | Novelty | Structural novelty — Jaccard-bigram duplicate detection |

**Gate thresholds:**

```
tau       = 0.9995   — CC gate (admit to STM)
tau_LTM   = 0.9998   — LTM promotion threshold
Domain ceiling = 0.9997
```

**Invariant:** mu < tau means rejected. No exceptions. D5 override detection hard-returns 0.0000 regardless of mu.

**Denominator 17** — The choice of 17 as the Whitlock denominator traces back to Kyle Whitlock's **Law of Resonance and its 16 Resonance Invariants** — 1 prime law + 16 invariants = 17.

---

### Tesseract — B4 Topology

The Tesseract is the **routing topology** that maps every admitted node to a position in a 4-dimensional Boolean hypercube.

```
B4 — 16 vertices, 4 axis-pairs (A1-A4)
Each axis-pair spans one pair of CC domains.
Vertex label: 4-bit string e.g. PPNP, NNNN, PPPP
```

**Axis pairs:**

| Axis | Domains | Positive (P) condition |
|------|---------|------------------------|
| A1 | D1 x D2 | sqrt(D1 x D2) >= tau |
| A2 | D3 x D4 | sqrt(D3 x D4) >= tau |
| A3 | D5 x D6 | sqrt(D5 x D6) >= tau |
| A4 | D7 x D8 | sqrt(D7 x D8) >= tau |

Classification uses **geometric mean per axis** — both domains in the pair must be strong for the axis to be positive. A node with one excellent domain and one mediocre domain gets N on that axis. This is intentional: the tesseract enforces joint-domain strength.

**Vertex PPPP** is the ideal — all four axes positive, all 8 domains coherent. Most nodes land on mixed vertices and migrate toward PPPP as the system matures.

**The 16 Resonance Invariants** map to the 16 vertices of B4. Each invariant corresponds to a unique domain-pair configuration, encoding one of the 16 distinct coherence profiles the system can recognize.

---

### Whitlock Coefficient W_v3

The Whitlock Coefficient is a **maturity communication protocol** — not a physical constant, not part of the coherence gate itself. It converts the raw node count `n` into a complex frequency indicator.

```
W_v3(n) = (n + 4i) / 17

|W_v3(n)| = sqrt(n^2 + 16) / 17
phi(n)    = arctan(4/n)        [degrees]
delta MHz = (|W_v3| - 1) x 100
Freq      = 1440 + delta  MHz
```

**Key milestones:**

| n | W_v3 magnitude | Milestone |
|---|----------------|-----------|
| 3 | sqrt(25)/17 = 5/17 | Pythagorean triple: 3^2 + 4^2 = 5^2 |
| 4 | sqrt(32)/17 | phi = 45 deg exactly — Re = Im |
| 16.52 | 1.000 | **Unity crossing n*** — W_v3 = 1 |
| 17 | sqrt(305)/17 approx 1.027 | W denom matches n — full resonance |

The unity crossing n* approx 16.52 is the **OP3 phase-change hypothesis**: the kernel transitions from bootstrap mode (|W| < 1) to mature operation (|W| > 1) at this threshold. OP3 tests whether this crossing corresponds to a measurable jump in task-battery performance P.

**The 4i term** encodes B4: the tesseract has 4 axis-pairs, each contributing one imaginary dimension to the coefficient. The 17 denominator: Law of Resonance + 16 Resonance Invariants.

---

## Ghost9 — The Kernel

> Ghost9 is what runs when the math is deployed. It is a Node.js HTTP server (port 7766) implementing the full CC/Tesseract/W_v3 stack as a live ingest-and-recall engine.

### Three-Layer Pipeline

Every text input passes through three sequential layers:

```
POST /devour  ->  [text]
                   |
              +----+----+
              | Layer 1 |  CC Gate -- evaluate mu
              |         |  mu < tau=0.9995 -> REJECT
              +----+----+
                   | mu >= tau
              +----+----+
              | Layer 2 |  Separation -- classify STM / LTM
              |         |  SHA3-512 seal -> node{id, hash, tier, vertex, scores, ts}
              +----+----+
                   |
              +----+----+
              | Layer 3 |  Taotie -- sweep at 80% capacity
              |         |  Joint spectral + spatial clustering -> super-nodes
              +----+----+
                   |
              state.json / SQLite
```

### Taotie Sweep Operator

Taotie is the **devouring merge operator**. When the node pool reaches 80% of MAX_NODES (default 10,000), Taotie fires:

1. Identifies STM void-space nodes (not in spatial proximity of LTM)
2. Clusters them via joint spectral + spatial overlap
3. Merges each cluster into one super-node:
   - `merkle_root = SHA3-512( sort(parent_hashes).join('|') )`
   - `hash = SHA3-512( merkle_root | ts | merge_nonce )`
   - Content = concatenated parent content (first 2048 chars)
   - mu = geometric mean of parent scores
4. Archives consumed nodes — nothing is deleted, full lineage preserved
5. Replaces the cluster with one super-node; node count drops

This is the compression mechanism. The kernel devours redundant STM to make room for new information, preserving the essence of what was consumed in the super-node's Merkle chain.

### Spatial Web

The **SpatialWeb** (`spatial_web.js`) is a persistent R8 proximity graph — 8-dimensional because there are 8 CC domains. Every admitted node gets an R8 position from its domain score vector. Nearby nodes are connected by edges; clusters emerge naturally.

- Persists to `data/spatial_web.json` — survives server restarts
- Updates on every ingest (upsert) and every Taotie sweep
- Used by Taotie for joint spectral+spatial clustering

**State files:**

```
data/state.json       -- active nodes + global Merkle root (< 10K nodes)
data/spatial_web.json -- R8 node positions + edge graph
data/archive.json     -- all consumed nodes (append-only, never deleted)
data/session_log.csv  -- OP3 empirical results
```

---

## OP3 — Empirical Validation

OP3 (*Empirical W_v3 Fit*) is the current active experiment. Kyle runs N >= 100 GHOST kernel sessions in Termux, recording performance against the Whitlock Coefficient at each session.

**Protocol:**

1. Read `n` from `GET /state`
2. Compute `|W_v3(n)|`
3. Run 10-input task battery (`node scripts/op3_harness.js`)
4. Score `P = correct / 10`
5. Append `{n, |W|, phi, P}` to `data/session_log.csv`
6. After N >= 100 sessions: fit linear, power, and logistic models against |W_v3|
7. Test unity crossing n* approx 16.52 as a phase-change threshold

Both outcomes are valid and publishable:

- **Fit found** — W_v3 is empirically validated as a kernel maturity indicator
- **No fit** — W_v3 remains a valid design-layer communication tool

---

## Termux Setup

### Clone and push from Termux

```bash
# One-time: clone this repo
git clone https://github.com/sraibridge-cyber/ghost9.git
cd ghost9

# Install dependencies
npm install

# Start the kernel
node src/ghost_kernel.js

# In a separate session, run OP3 harness
node scripts/op3_harness.js
```

### Push from an existing local ghost9 folder

```bash
cd ~/ghost9          # wherever your ghost9 lives in Termux
git init             # skip if already a git repo
git remote add origin https://github.com/sraibridge-cyber/ghost9.git
git add .
git commit -m "initial source"
git push -u origin main
```

### GitHub auth in Termux

GitHub no longer accepts passwords over HTTPS. Use a **Personal Access Token (PAT)**:

1. GitHub -> Settings -> Developer settings -> Personal access tokens -> Tokens (classic)
2. Generate new token, check `repo` scope, copy the token
3. Configure git credential store so you only type it once:

```bash
git config --global credential.helper store
git push origin main
# When prompted: username = your GitHub username, password = your PAT
# Saved after first use
```

---

## Harmony Labs

Harmony Labs is the research initiative behind this work. The mathematical foundations — Coherence Calculus, Tesseract, and the Whitlock Coefficient — constitute the **Harmony Field Theory (HFT)** framework, documented across six arXiv-formatted papers:

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
