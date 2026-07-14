# CC v3.2 Roadmap: D1 Scorer Restoration

## Goal
Restore the v3.0 six-tier D1 gradient while keeping v3.1 gate integration improvements.

## Changes
1. Replace computeDomainScore D1 case with v3.0 six-tier word-count gradient
2. Keep L->S->M gate integration (v3.1 improvement)
3. Keep negation context detection (v3.1 improvement)
4. Keep harm in SEMANTIC_CONTEXTS (v3.1 improvement)
5. Re-run CI benchmark to confirm 18/18 pass

## v3.0 D1 Six-Tier Gradient
Less than 3 words: 0.0001 (hard block)
3-7 words: 0.70
8-12 words: 0.90
13-19 words: 0.9940
20-49 words: 0.9990
50+ words: 0.9997

## Timeline
v3.2: D1 restoration + CI validation
v3.3: Staging layer (Draft/Bootstrap modes with adjustable tau)
v3.4: Full CI benchmark as runtime test suite

## Seal
2026-07-05_23:20_Tulsa_OK
