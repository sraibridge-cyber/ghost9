# Ghost9 technical debt register

Updated 2026-10-28. Each item has a status and the decision it needs. "Closed" means done and verified. Nothing here is closed by assumption.

## Closed this round

- Service worker made cache-only; persistence battery updated (255 tests, exit 0).
- Model integrity moved from SHA-256 to SHA3-512 to match the Ghost kernel.
- WordNet added as a second required Node dependency (Kyle's decision, 2026-10-28). README updated.
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
| 3 | M gate is off. WordNet M v1 built and measured, does not reach target: category signal fires zero times, cohesion AUC 0.70, benign flags 13% to 27%. Incoherent 0.581, paraphrase 0.300 standalone. | Open | A harm-intent signal that reads context. Candidate: the local classifier (QC), calibrated on dev and tested on a sealed holdout. WordNet stays a dependency for cohesion work. |
| 4 | ~~`src/gate_router.js` broken imports~~ | Closed 2026-10-28 | Router rewritten as a thin five-gate entry point. Three-gate battery archived, five-gate battery added (40/40). See `tests/batteries/CHANGELOG.md`. |
| 5 | Tier thresholds (0.9995, 0.9998) are hard-coded in `src/taotie.js` and `src/ghost_face.js`. | Open | Move to `config/thresholds.json` per engine and tier. Validate per design decision in `ghost9-design-v2.md`. |
| 6 | CC v4 threshold (0.243) and Taotie tier thresholds (0.9995+) are on different scales. | Open | Decide which scale each engine uses. Never combine them numerically. |
| 7 | CC v3 is live. CC v4 failed the handwritten word-salad test (AUC 0.638). | Open | Keep v3 until v4 passes pre-registered criteria. |
| 8 | `cc_structure` floor (1e-6) and max_share (0.5) are provisional. | Open | Validate on labeled data. |
| 9 | Report §2.2 wording on the geometric mean still differs from the v3 revision. | Open | Author decision on wording. |
| 10 | Stale files (archive, do not delete. Done 2026-10-28 for `.bak`, `_v1.2`, and root scripts. `test_tmp/` was never tracked (gitignored scratch). Its local files were moved to `archive/temp/2026-10-28/test_tmp/`, not committed, after the batteries moved to a per-run temp dir): `src/gate_syntactic.js.bak`, `src/gate_syntactic_v1.2.js`, `test_tmp/`, `archive/`, and repo-root scripts `fix_core.js`, `fix_four.js`, `fix_q.js`, `fix_quotes.js`, `fix_v6.js`, `robust_patch.js`, `surgery.js`, `SEAL_mgate_v11.json`. | Open | Provenance check, then delete or archive. Not deleted without approval. |

## Open: sovereignty (see docs/architecture/SOVEREIGNTY.md)

| # | Item | Status | Needs |
|---|------|--------|-------|
| S1 | ~~The model is fetched from Hugging Face at setup.~~ | Closed 2026-10-28 | Model is stored as 5 chunks in `models/toxic-bert/` with a SHA3-512 manifest. The fetch script and the Gradle step assemble and verify it. Nothing is downloaded. Gradle step not yet built in CI. |
| S2 | ~~Service worker fell back to the network on a cache miss.~~ | Closed 2026-10-28 | Worker is cache-only, returns 404 on a miss. Regression test `tests/regression/sw_offline.js`. |
| S6 | UI self-documentation hard-codes test counts (`generateUIDocs`: CC '207/207', etc.). They are claims, not measured results. | Open | Generate counts from the battery runs, or drop the field. |
| S3 | GitHub Actions actions are pinned by tag, not by commit SHA. | Open | Pin each action to a commit SHA. The workflow file needs a web UI edit. |
| S4 | Android build inputs come from Maven Central and Google Maven. | Open | Vendor the AARs or mirror them in the repo. Decide which. |
| S5 | GitHub is the only copy of the repo and of the releases. | Open | A second copy under the user's control. |

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

## Open after the 2026-10-29 battery repair

The batteries now run. Several had been crashing since the `./src/` path bug, and they report real failures. Each one is red on purpose. None is edited away. See `tests/batteries/CHANGELOG.md` for the list.

| # | Item | Status |
| --- | --- | --- |
| A | `ci_benchmark` CI-1: harmful instruction (weapon synthesis) not blocked (SAFETY) | Open, priority one |
| B | `ghost_kernel_e2e_battery`: 158 failures | Open, not triaged |
| C | `phase4_empirical_battery`: 24 failures | Open, not triaged |
| D | `taotie_empirical_battery`: 10 failures | Open, not triaged |
| E | `bonsai_empirical_battery`: 6 failures | Open, not triaged |
| F | Harm and lie gap in the five-gate path (kernel K3.1, K6.1) | Open, same gap as the paraphrase numbers |
| G | Canonical TAU: 0.943 in code, 0.9995 in WT-11 and K7.3 | Decision needed |
| H | Two LTM thresholds: `ltm_min` 0.9998 vs `bonsai_ltm_tau` 0.9995 | Decision needed |
| I | UI endpoints hard-coded to LAN addresses (`ui/ghost_api.js`) | Decision needed |
| J | Five-gate S gate blocks the benign pangram "The quick brown fox..." | Open, found while probing |

## Update 2026-10-29 (later)

- **I (UI LAN addresses): closed.** `ui/ghost_api.js` uses `localhost`. The UI reaches only the device it runs on.
- **G (canonical TAU): measured, not set.** `tests/batteries/tau_empirical_battery.js` is red. The CC score doesn't separate prose from word salad (dev AUC 0.64, holdout AUC 0.50). No threshold can be chosen from it. Decision needed: redesign the score, or change what the battery measures. The threshold can't be fixed first.
- **K (classifier as harm signal): probed, not validated.** Five harm phrases, including CI-1, score above the provisional threshold 0.004992, and the benign and salad samples mostly score below it. Needs a new sealed holdout before it can block (`config/clf.json` is still marked provisional).

## Update 2026-10-29 (classifier and score)

- **K (classifier as harm signal): calibrated, target missed.** Holdout recall 0.80 (target met), holdout benign FPR 0.067 (target 0.05, missed by two sentences). Threshold 0.006103 from dev. Holdout now used, so a new threshold needs a new sealed holdout. Config stays advisory. See `docs/validation/CLF_CALIBRATION.json`.
- **G (canonical TAU): blocked by the score.** The coherence score cannot separate prose from salad (AUC 0.64 dev, 0.50 holdout). The toxicity classifier can't measure coherence either (AUC 0.30). Options are in `docs/review/CC_SCORE_OPTIONS.md`. Decision needed. Recommendation: option C (pinned local language model perplexity).

## Update 2026-10-29 (fresh classifier calibration)

- **K (classifier as harm gate): v2 targets met on a fresh holdout.** Recall 0.80 (32/40, exactly at target), benign FPR 0.025 (1/40). Threshold 0.007265. Mode is still advisory.
- **New blocker L: fail-closed in block mode.** `src/prefilter.js` refuses everything when the classifier is unreachable in block mode. Decide fail-open or fail-closed-on-flag before block mode is enabled.

