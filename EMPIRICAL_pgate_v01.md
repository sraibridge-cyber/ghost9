# P-GATE v0.1 — Empirical Accounting (Honest)

**Sealed:** 2026-10-14T14:51:17.061Z — Tulsa, OK
**Battery:** 200/200 (100.0%)
**Upstream gates:** L (lexical) ✅ | S (syntactic, 280/280) ✅ | M (semantic, 210/210) ✅

## What Is Validated
- 200 empirical tests across 19 sections: valid pragmatics (no context / with context / rich context), anaphora failures, discourse marker failures, temporal sequence (valid + violations), entity consistency (valid + contradictions), presupposition failures, edge cases, multi-feature stress tests.
- Every failure during construction was diagnosed as test-design error or documented scope limitation — zero silent module breakage.
- Module patches applied during build: GLOBAL_ENTITIES exception (sun/moon/earth/sky/ocean/world/universe/stars/galaxy), possessive check fails on empty context, +2 contradiction pairs (tall/short, old/new).

## Known Limitations (v0.1 Scope)
1. Anaphora checks existence only — any prior noun satisfies any pronoun. Gender/number agreement is NOT validated.
2. No pronoun-to-entity resolution — "He" does not resolve to "the man"; checks only that SOME antecedent exists.
3. Temporal violations are within-utterance only, triggered by curated pairs + explicit markers (then/before/after/already/yet). Cross-context temporal contradiction is NOT caught (see T199 lesson: contradiction must be in one utterance).
4. Entity consistency requires exact noun matching — "the woman" ≠ "she". Coreference is NOT implemented.
5. Presupposition: definite "the X" requires exact noun in prior context; 9 global entities exempt.
6. Discourse markers: only 5 markers (however/therefore/because/then/also), only at utterance start, existence-of-context check only.

## Test Design Lessons (for future batteries)
- Always introduce entities in context before testing another feature — empty context + pronouns/definite refs creates false anaphora/presupposition failures that mask the feature under test.
- Temporal tests must contain both events and the marker in the SAME utterance.
- Mythological exceptions (phoenix rising) are out of scope — curated lists are not world models.

## Seal
See SEAL_pgate_v01.json for SHA3-512 hashes of module + battery.
