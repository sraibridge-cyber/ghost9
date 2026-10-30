# M v2 same-topic splice test (pre-registration)

Status: pre-registered 2026-10-29, before any scoring of this test. Dev pool only.

## Question
Does M v2 still flag incoherent text when the spliced sentences come from related articles, not unrelated ones?

## Items
- Dev pool: the same 75 extracts as M_V2_WIKI_DEV (seed 45 split of docs/validation/M_V2_MULTISENTENCE_PREREG.md Amendment 2).
- Nearest neighbours: for each dev extract, its nearest neighbour by MiniLM cosine of the full summary text, within the dev pool.
- Item construction (seed 47 for order, seed 48 for sentence choice): take extract A, then B = nearest neighbour of A, then C = nearest neighbour of B excluding A. Pick one sentence of 8+ words from each, in order A, B, C. 60 items. Extracts may repeat across items, and the test says so.
- Benign items: the 60 dev benign windows already used in M_V2_WIKI_DEV, rescored unchanged.

## Threshold and bar
- Threshold c = 0.2265, fixed from dev calibration. Not changed by this test.
- Pass bar: same-topic recall >= 0.80 and benign false positive rate <= 0.05 at c. The benign rate comes from the same 60 dev benign items.
- Limits, stated before scoring: the benign FPR was already used to set c, so it is optimistic. Extracts repeat across items. A pass means M v2 handles related-article splices at this threshold. It does not show that M v2 separates same-topic prose from same-topic splices in general.
- Holdout is not used. The holdout is spent for M v2.
