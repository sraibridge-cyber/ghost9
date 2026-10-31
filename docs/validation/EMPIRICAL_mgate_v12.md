# M-GATE v1.2 Battery — Empirical Record

**Date:** 2026-08-29
**Location:** Tulsa, OK
**Validator:** Kyle S. Whitlock + Kimi K2.6
**Result:** 210/210 (100.0%)

## What This Gate Actually Does
A semantic coherence validator. Assumes text has already passed lexical and syntactic gates.
Checks:
- Selectional restrictions (verb frames with subject/object category requirements)
- Known semantic nonsense (Chomsky-style, contradictory nouns)
- Contradiction pairs (binary opposites in same sentence)
- Scale violations (small agent acting on large object)
- Poetic exceptions (culturally accepted personification)

## What This Gate Does NOT Do
- Full parse tree construction (no simile disambiguation)
- Deep world-knowledge reasoning beyond curated frames
- Context-dependent disambiguation
- Semantic role labeling (agent vs. patient vs. instrument)

## Honest Accounting
- **Categories:** animate, inanimate, abstract, food, liquid, celestial, body, weather, tool
- **Verb frames:** 38 verbs with requires/blocks constraints
- **Poetic subjects:** 18 culturally accepted personification targets
- **Contradiction pairs:** 18 binary opposition pairs
- **Scale ontology:** small/medium/large with 25+ ranked entities
- **Nonsense patterns:** 6 known semantic absurdities
- **Irregular verb stemmer:** 40+ irregular mappings

## Seal
See SEAL_mgate_v12.json for SHA3-512 hashes.

---
*Process is the product. Truth over theater.*
