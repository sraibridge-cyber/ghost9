# τ (Tau) Values Across Ghost9 — Why There Are 5 Different Numbers

CSS Labs | Kyle S. Whitlock | Compiled 2026-07-13_Tulsa_OK

Ghost9 uses **one threshold concept (τ)** — "is this coherent enough to keep/promote/
trust?" — but **five different numeric values** for it, each scoped to a different
stage of the metabolic pipeline. This is intentional and already validated (see the
2026-07-07 "E2E CC v3.2 Configuration Audit — Tau Alignment" commit), but the values
were never collected into one table before. This is that table.

| Constant | Value | Defined in | Scope |
|---|---|---|---|
| `TAU` (canonical/constitutional) | **0.9995** | `src/coherence_calculus.js` | The "sacred" threshold — what the Five Laws and the LTM tier hold everything to. |
| `GHOST9_TAU` (empirical, live) | **0.9430** | `src/coherence_calculus.js` | What the running ingestion gate (FACE, port 7766) actually rejects/accepts on — derived from real μ-distribution cluster analysis, not from the constitution. |
| `BONSAI_TAU` (STM) | **0.943** | `src/merkle_bonsai.js` | Same empirical ingestion baseline, reused for Merkle Bonsai's short-term-memory tier. |
| `BONSAI_TAU_LTM` | **0.9995** | `src/merkle_bonsai.js` | Long-term-memory tier — matches the constitutional threshold. |
| `RIP_TAU` | **0.95** | `src/ghost_rip.js` | Training threshold for the 17-Laws verifier — deliberately set between the ingestion gate (0.943) and the constitutional gate (0.9995), so training data has to clear a slightly higher bar than raw ingestion but doesn't have to meet the full constitutional standard. |
| `FIVE_TAU` | **0.9995** | `src/five_laws.js` | The Five Laws engine (Chaos/Randomness/Observation/Causality/Chain — a *different* framework from the 17 Laws, see below) — also constitutional-grade. |

## Why the gap between 0.943 and 0.9995 is correct, not a bug
The system deliberately runs a **two-speed gate**: information is allowed *in* at a
lower, empirically-tuned bar (0.943) so the kernel doesn't starve on legitimate but
imperfect text, but nothing is promoted to long-term memory or treated as
constitutionally trustworthy until it clears 0.9995. `RIP_TAU=0.95` is the training
checkpoint in between. This is documented behavior, confirmed in
`docs/validation/VALIDATION_HISTORY.md`, Part 1 ("Honest Notes": *"GHOST9_TAU=0.96 is
empirically determined, not canonical... As system matures and weights refine, τ can
be raised"* — since further corrected down to 0.9430 by cluster analysis, per the same
doc).

## Two "Laws" systems — not the same thing, despite the shared name
- **The 17 Laws** (`src/ghost_rip.js`) = 1 Prime Law ("coherence is the only
  invariant") + 16 Invariants, one per Tesseract vertex. This is a checklist verifier
  with three flags (✅ VERIFIED / ⚠️ PARTIAL / ❌ FAILED) run against a piece of
  content's domain scores.
- **The Five Laws** (`src/five_laws.js`) = Chaos, Randomness, Observation, Causality,
  Chain — five *active engines*, each a class with its own state and methods
  (`ChaosLaw.inject()`, `RandomnessLaw.sequence()`, etc.), orchestrated together by
  `FiveLawsEngine.process()`. This governs controlled entropy injection, not content
  verification.

Both gate on Coherence Calculus output and both use "Law" in the name, but they answer
different questions ("does this content pass the constitutional checklist?" vs. "how
much controlled chaos can I inject while staying coherent?"). No file in the repo
previously stated this distinction explicitly — this doc is that statement.
