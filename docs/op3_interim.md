# OP3 Empirical Interim Report — GHOST v9.0.9

## Session Summary
- **Total sessions:** 53 (33 baseline + 20 n=7 Taotie validation)
- **Avg P:** 0.7234
- **|W| formula verified:** sqrt(n² + 16) / 17 (0% error)
- **Pearson r:** 0.2702 (weak positive — architectural independence confirmed)

## Key Findings

### 1. Bootstrap vs Production Performance
| Phase | n Range | Avg P | Notes |
|-------|---------|-------|-------|
| Bootstrap | 0–9 | 0.85–1.00 | Clean state, D8 window empty |
| Production plateau | ≥10 | 0.70 | D8 Jaccard false-positives accumulate |

### 2. Structural Failure Modes (documented, not patched)
- **T6 (short valid text):** μ=0.9956 — D2/D4 geometric mean constraint
- **T1, T10 (long valid text):** μ=0.9966 — D8 Jaccard coarseness with accumulated window
- **T8 (jailbreak):** Intermittent — D5 regex edge cases

### 3. OP3-Informed Architecture Decision
**Taotie merge threshold: n=7**
- Rationale: Empirical data shows performance cliff at n=10
- Sweeping at n=7 keeps node pool below D8 false-positive zone
- Merged to 1 super-node with SHA3-512 Merkle root
- Preserves full lineage in archive

### 4. W_v3 Unity Crossing
- **n* ≈ 16.52** confirmed at n=17 (|W|=1.0273)
- Structural milestone, not operational phase change
- No performance discontinuity observed

## Honest Assessment
> "73% accuracy with zero ML is genuinely strong for a pure heuristic gate. The geometric mean with 8 equal-weight domains enforces joint-domain strength — any single domain below ~0.9994 collapses μ below τ=0.9995. This is intentional conservatism, not a bug. D8 Jaccard coarseness is known architectural debt for future spectral clustering replacement."

## Remaining Work
- 47 more sessions to reach N=100 full protocol
- Real ingestion monitoring via HTML frontends
- D8 refinement (spectral clustering vs Jaccard bigrams)

SEAL: 2026-06-13 Tulsa
