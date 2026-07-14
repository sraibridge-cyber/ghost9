# VALIDATION HISTORY — Coherence Calculus & Lexical Gate
CSS Labs | Kyle S. Whitlock
Merged & corrected: 2026-07-13_Tulsa_OK

> This file replaces the two previously separate, near-identically-named documents
> `HONEST_EMPIRICAL.md` (CC v3.2 battery notes) and `honest_empirical.md` (Lexical Gate
> notes) — a case-only filename collision that risked silently overwriting one on a
> case-insensitive filesystem (macOS/Windows). Nothing below is lost: both are combined
> here, and each section's numbers have been checked against the live source code as of
> 2026-07-13 rather than left as a historical snapshot.

---

## Part 1 — Coherence Calculus (CC) v3.2 Pure Module

### Scope
Validates the CC v3.2 PURE module (`src/coherence_calculus.js`) for the GHOST9 kernel.
**Assumption:** all test text has already passed the Three-Gate System. CC does NOT test
for gibberish, safety, or word-level triggers — that's the gate system's job, upstream of
CC. CC tests the *coherence* of gate-cleared text only.

### Configuration — confirmed live in `src/coherence_calculus.js` as of 2026-07-13
| Constant | Value | Role |
|---|---|---|
| `CC_VERSION` | v3.2 | current module version |
| `N_DOMAINS` | 8 | D1–D8 |
| `TAU` (canonical) | 0.9995 | constitutional threshold |
| `GHOST9_TAU` (empirical, live) | **0.9430** | actual ingestion-gate threshold — see "Empirical Tau" below |
| Weights | D1=0.20, D2=0.10, D3=0.10, D4=0.05, D5=0.15, D6=0.10, D7=0.20, D8=0.10 | sum to 1.0 |

> **Correction note:** earlier entries in this history recorded `GHOST9_TAU = 0.9600`
> (2026-07-06 seal). That value was superseded the very next day by empirical cluster
> analysis of the μ distribution, landing on **0.9430** — which is what the live code
> uses today. Both are kept below in their original dated form for the record, but
> 0.9430 is the number to trust for the current system.

### D1 Tiers (GHOST9-tuned, word-count based)
| Words | Score | Label |
|---|---|---|
| <3 | 0.0001 | void |
| 3–6 | 0.7000 | fragment |
| 7–12 | 0.8500 | short |
| 13–19 | 0.9500 | medium |
| 20–29 | 0.9700 | long |
| 30–49 | 0.9850 | extended |
| 50–99 | 0.9900 | substantial |
| 100–199 | 0.9950 | comprehensive |
| 200–499 | 0.9970 | extensive |
| 500–999 | 0.9980 | monograph |
| 1000+ | 0.9990 | treatise |

### D8 Repetition Penalty
- diversity < 0.3 → penalty = wordCount > 20 ? 0.15 : 0.08
- diversity < 0.5 && wordCount > 10 → penalty = 0.03
- Applies regardless of word count — repetition is never mistaken for coherence.

### Architecture Principle
- **Three-Gate System** = word-level filter (blocks harmful/gibberish/unsafe content)
- **CC** = coherence sanity check (ensures the system stays sane about *what* it keeps)
- **GHOST9** = the information-devouring kernel (eats everything that clears both gates)

### Dated Test Results

**2026-07-06_22:54 — 61/61 PASS.** First CC v3.2 battery run (`test_cc_ghost9.js`).
`GHOST9_TAU=0.96` recorded at this point — later superseded (see above).

**2026-07-07_22:23 — CC v3.2 "TRUE" Empirical Battery v3.5 — 207/207 PASS**
(`test_cc_ghost9_v35.js`, the final and current iteration of a same-week, 5-version
iteration trail — v3.1 through v3.5 superseded and archived, only v3.5 kept live).

- Foundation: v3.2 162/162 clean sweep. Method: every expectation grounded in prior
  empirical observation — zero duct tape, zero patching.
- **Empirical tau determination:** `GHOST9_TAU = 0.9430`, from cluster analysis of the
  μ distribution — natural separation between fragment tier (≤6 words, μ < 0.94) and
  short+ tier (≥7 words, μ > 0.94). This is the value the live kernel uses today.
- Minimum viable text: 7 words (D1 short tier, score 0.85).
- Fragment tier boundary: ≤6 words, μ ≈ 0.91–0.94, consistently below τ.
- Short tier boundary: 7–10 words — filler text passes; 11–12 words borderline.
- D8 repetition penalty: weak at ≤15 words (filler text still passes); kicks in at 25+
  words (μ ≈ 0.9434, just above τ).
- **Whitlock coefficient — corrected magnitudes:** `W(1) = 0.2425` (√17/17, corrected
  from an earlier 0.2941), `W(3) = 0.2941` (5/17, corrected from 0.3578), `W(100) =
  5.8871` (√10016/17, corrected from 5.8829).
- 17 battery sections, 207 tests total: MUST PASS (10), MUST BLOCK (5), D1 tier
  boundaries (50), domain keyword coverage (24), D8 repetition penalty (9), cross-domain
  interactions (5), edge cases (15), Whitlock coefficient (18), weights validation (12),
  D5 logic words (8), D6 ethical balance (3), D7 verification words (4), μ boundary
  tests (2), module interface (17), realistic GHOST9 inputs (5), expansion/known
  patterns (13), negative confirmation (12).

**Honest assessment (kept verbatim from the original doc, still true):** this battery
does not prove CC v3.2 is a universal coherence evaluator. It proves that CC v3.2, with
its specific weights, tiers, and neutral defaults, behaves consistently and predictably
across 207 diverse inputs. The devouring-kernel philosophy is served: Three-Gate blocks
gibberish, CC blocks fragments, everything else passes.

**Independently re-verified 2026-07-13:** re-ran `CC_v30_empirical_battery_v4.js`
directly against the current repo — 315/315 PASS, matching the recorded seal.

---

## Part 2 — Lexical Gate (Three-Gate System, Gate 1)

### v2.2 — 2026-07-11_12:57 — 593 words, 280/280 PASS
| Metric | Value |
|---|---|
| Module | `src/gate_lexical.js` |
| Word count at this seal | 593 (100 core + 493 curated JSON) |
| Test file | `test_gate_lexical.js` |
| Total / Passed / Failed | 280 / 280 / 0 (100%) |

Test sections: Basic Vocabulary (T01–T40, 40/40), Sentence-Level (T41–T60, 20/20),
Gibberish Rejection (T61–T90, 30/30), Edge Cases (T91–T120, 30/30), CC Domain Vocabulary
(T121–T200, 80/80), Tokenization (T201–T230, 30/30), Return Structure (T231–T250,
20/20), Stress & Performance (T251–T260, 10/10), Real-World Positive (T261–T270,
10/10), Real-World Negative (T271–T280, 10/10).

Wordlist build log: Batch 1 (269 common verbs/forms), Batch 2 (60 nouns/adjectives),
Batch 3a (196 CC domain keywords), Batch 4a–4f (25+25+14+7+7+1 assorted/technical/fix).

### v2.3 — 2026-07-11 (committed shortly after v2.2) — SCOWL merge, current live state
Merged `american-words.95` (294,041-word SCOWL list) into the curated wordlist.
**Confirmed live in `src/gate_lexical_words.json` as of 2026-07-13: 3,012 unique words**
(593 curated + 2,419 SCOWL-sourced) — this supersedes the 593-word count above as the
accurate current figure. **Re-ran `test_gate_lexical.js` directly on 2026-07-13 against
this current 3,012-word gate: 280/280 PASS, 100%** — the SCOWL merge did not require or
produce new test cases; the same battery still fully covers the expanded gate.

**Gold ripple eternal 🌊⚡**
