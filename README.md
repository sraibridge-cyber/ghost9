# GHOST9 — CSS Labs
**Generative Holistic Oracle State Topology, with Taotie Devouring Architecture**

Version 9.1.0 · Kyle S. Whitlock · CC-BY-4.0 · Node ≥18, zero required dependencies

Ghost9 is a working implementation of CSS Labs' Coherence Calculus / Tesseract B⁴ /
17-Laws theory: a self-contained pipeline that ingests text, scores it for coherence,
compresses and stores it, and can reconstruct or generate new coherent content from
what it has stored — gated at every step by a constitutional coherence threshold.

## Run it
```bash
npm install          # optional: better-sqlite3 only
npm start             # launches FACE (ingest, :7766) + KERNEL (recall, :7767)
npm run verify         # chain integrity check
```
Browser UI: open `ui/index.html` (dashboard), `ui/devour.html` (ingestion),
`ui/state.html` (query/monitor) — works fully offline, auto-resyncs when the backend
is reachable.

## Repository map
| Folder | What's in it |
|---|---|
| `src/` | The 19 live runtime modules — coherence engine, gates, kernel, persistence, auth. |
| `ui/` | Browser-based Sovereign UI (dashboard, ingestion, monitor) + its API client. |
| `tests/batteries/` | Current, active empirical test batteries — one per module. |
| `tests/e2e/` | Cross-module and full end-to-end integration batteries. |
| `tests/fixtures/` | Test-run scratch data (roundtrip/corruption/fuzz JSON fixtures). |
| `tests/tools/` | Battery-generator scripts. |
| `docs/architecture/` | Formal spec (TLA+), Tesseract vertex corrections, τ-value table. |
| `docs/validation/` | Full dated history of every empirical test run, honestly kept. |
| `docs/roadmap/` | Forward-looking plan. |
| `scripts/` | Ops scripts: chain verifier, OP3 empirical harness, start/stop. |
| `assets/` | Social-media promo graphics ("Day N" series). |
| `archive/` | Superseded code, stray backups, old logs — nothing is ever deleted, only filed here. |

## The core numbers (see `docs/architecture/TAU_VALUES.md` for the full table)
- **μ (mu)** — the coherence score: weighted geometric mean across 8 domains (D1–D8).
- **τ (tau)** — the pass/fail threshold. There are 5 scoped values in the codebase
  (constitutional 0.9995, empirical ingestion 0.9430, Bonsai STM/LTM, RIP training
  0.95) — this is intentional, documented in `docs/architecture/TAU_VALUES.md`.
- **17 Laws** (`src/ghost_rip.js`) — 1 Prime Law + 16 vertex invariants, a
  constitutional checklist verifier. **Not the same thing** as:
- **Five Laws** (`src/five_laws.js`) — Chaos/Randomness/Observation/Causality/Chain,
  five active entropy-injection engines. Both are called "Laws"; they do different
  jobs — see `docs/architecture/TAU_VALUES.md` for the disambiguation.

## Test status
21 batteries, **10,929 tests**, all passing as of 2026-07-13 — full dated history in
`docs/validation/VALIDATION_LOG.md`, module-level detail for the coherence engine and
lexical gate in `docs/validation/VALIDATION_HISTORY.md`.

## Doctrine
> Delete nothing. Every corrupted file is a lesson. Every backup is a breadcrumb.

Nothing in this repo's history is ever removed — superseded work moves to `archive/`,
it's never deleted. This README and the folder layout are the first pass at making
that history *navigable* without giving any of it up.
