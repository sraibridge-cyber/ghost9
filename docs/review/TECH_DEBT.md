# Ghost9 technical debt register

Updated 2026-10-28. Each item has a status and the decision it needs. "Closed" means done and verified. Nothing here is closed by assumption.

## Closed this round

- Gate router rewritten for the five-gate design; three-gate battery archived; five-gate battery added (40/40). Batteries updated in the same sprint, per Kyle's rule.

- Redundant branches consolidated into `review/ghost9-combined`. Old review branches and `spike/android-apk` deleted after confirming they were contained in the combined branch.
- Debug APK built in GitHub Actions from the combined branch, arm64-only, 14 MB artifact.
- CC structural checks added as a separate module with 9 tests (`src/cc_structure.js`). `coherence_calculus.js` unchanged.
- Classifier wired as advisory QC stage with 11 tests. Node client bypasses HTTP_PROXY for loopback.
- CC/SS technical report revised (v3 draft): geometric-mean table corrected (0.448→0.433, 0.208→0.201, 0.096→0.093), floor stated, universal claim scoped, text-coherence results added.

## Open: blocks correctness or claims

| # | Item | Status | Needs |
|---|------|--------|-------|
| 1 | Classifier threshold (0.004992) is provisional and was chosen on dev benign prose. | Open | Sealed labeled harm-intent holdout. |
| 2 | Q lists are the only blocking harm check. Measured: harm paraphrase blocked 5/30 (0.167). Seed harm 30/30. | Open | A semantic check that lifts paraphrase recall to 0.80, validated on a sealed holdout before the lists come out. |
| 3 | M gate is off. Measured: incoherent text blocked 2/31 (0.065), benign 89/91. WordNet hypernym replacement not started. | Open | Build the category set and a decision on adding WordNet as a dependency (doctrine: one required Node dependency today). |
| 4 | ~~`src/gate_router.js` broken imports~~ | Closed 2026-10-28 | Router rewritten as a thin five-gate entry point. Three-gate battery archived, five-gate battery added (40/40). See `tests/batteries/CHANGELOG.md`. |
| 5 | Tier thresholds (0.9995, 0.9998) are hard-coded in `src/taotie.js` and `src/ghost_face.js`. | Open | Move to `config/thresholds.json` per engine and tier. Validate per design decision in `ghost9-design-v2.md`. |
| 6 | CC v4 threshold (0.243) and Taotie tier thresholds (0.9995+) are on different scales. | Open | Decide which scale each engine uses. Never combine them numerically. |
| 7 | CC v3 is live. CC v4 failed the handwritten word-salad test (AUC 0.638). | Open | Keep v3 until v4 passes pre-registered criteria. |
| 8 | `cc_structure` floor (1e-6) and max_share (0.5) are provisional. | Open | Validate on labeled data. |
| 9 | Report §2.2 wording on the geometric mean still differs from the v3 revision. | Open | Author decision on wording. |
| 10 | Stale files (archive, do not delete. Done 2026-10-28 for `.bak`, `_v1.2`, and root scripts. `test_tmp/` deferred until its two batteries are audited): `src/gate_syntactic.js.bak`, `src/gate_syntactic_v1.2.js`, `test_tmp/`, `archive/`, and repo-root scripts `fix_core.js`, `fix_four.js`, `fix_q.js`, `fix_quotes.js`, `fix_v6.js`, `robust_patch.js`, `surgery.js`, `SEAL_mgate_v11.json`. | Open | Provenance check, then delete or archive. Not deleted without approval. |

## Open: Android APK and the phone runtime

| # | Item | Status | Needs |
|---|------|--------|-------|
| 11 | Shell `/score` returns 501. The Kotlin tokenizer (WordPiece, normalization) is not ported. | Open | Port the tokenizer and wire onnxruntime-android. Add a conformance test against `CLF_SCORE_CONTRACT.md`. |
| 12 | nodejs-mobile is unverified. The release check returned no data. The Node kernel on Android is untested. | Open | Spike: check release assets and run the kernel on a device or emulator. |
| 13 | The release `v0.1.0-spike` has no APK attached. The connection cannot upload to `uploads.github.com`. | Blocked by environment | Manual attach through the GitHub web UI. |
| 14 | The workflow file cannot be pushed through the API. The connection lacks the `workflow` scope. | Blocked by environment | Edit workflow files in the web UI, or re-grant the scope. |
| 15 | No automated test covers `services/clf/clf_service.py`. It was checked by hand. | Open | Add a Python test that runs the conformance items in the contract. |

## Open: evidence and claims

| # | Item | Status | Needs |
|---|------|--------|-------|
| 16 | No baseline has been run against CC on the same labeled data. | Open | Min, arithmetic mean, word count, trained classifier, all on one labeled set. |
| 17 | Word count beat CC v3 on word salad (0.90 vs 0.64). The length confound is not ruled out. | Open | Control for length, then report. |
| 18 | No labels exist for memory tiers (STM, LTM, neither). | Open | Hybrid labeling plan, kappa tracked. |
| 19 | Falsifiers are proposed in the v3 report and not pre-registered. | Open | Pre-register before any test run. |
| 20 | The collapse model (report §8) has no historical coding. | Open | Move to a separate note labeled hypothesis, or code historical cases. |

## Resolved or accepted

- Model file (106 MB) stays out of git. Fetched from a pinned Hugging Face revision with SHA-256 checks. License Apache-2.0 (checked in the upstream README).
- `wink-pos-tagger` is a required Node dependency. README says so.
- Python sidecar is optional. Node side has one required dependency.
- `reorg/organize-and-document` belongs to another contributor. Not reviewed or changed here.
