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

## Update 2026-10-29 (fail-open, option C)

- **L (fail-closed in block mode): resolved.** The classifier stage fails open. See CHANGELOG.
- **C (perplexity signal, option C): feasible, not yet calibrated.** Pinned distilgpt2 quantized. Dev AUC 0.954. Holdout v1 shuffled recall 1.0, prose flag rate 0.064 (target 0.05, missed by one sentence). Needs a fresh sealed holdout. Before it can ship on the phone: bundle the model (83.5 MB, hash-pinned), port the tokenizer, and add an onnxruntime build to the Android runtime.
- **G (canonical TAU): option C is the planned route.** Once a calibrated perplexity signal exists, TAU can be set from data on the new score.

## Update 2026-10-29 (perplexity v2)

- **C (perplexity signal): two fresh holdouts, same miss.** Shuffled recall 1.0 on both. Prose flag rate 0.064 (v1) and 0.067 (v2) against a 0.05 target. Dev prose rate is 0.043, so the dev rule (smallest threshold with dev FPR at most 5%) is too loose for fresh prose. Decision needed: pre-register a stricter dev rule (for example, dev FPR at most 2.5%) with a third holdout, or accept a 6.7% prose flag rate as the signal's operating point. The TAU battery waits on this.

## Update 2026-10-29 (perplexity v3)

- **C (perplexity signal): calibrated and passing on a third holdout under a stricter, pre-registered dev rule.** Threshold NLL 6.105. Holdout prose flag 0.021, shuffled recall 1.0. Caveats in CHANGELOG. Still not wired. Phone runtime needs onnxruntime, a tokenizer port, and the 83.5 MB model bundled with its hash pinned.
- **Harm (CI-1) is still not addressed.** Perplexity measures incoherence, not harm. Harm needs the classifier, which is calibrated but advisory.

## Update 2026-10-29 (perplexity advisory wiring)

- **C (perplexity): wired in advisory mode.** Sidecar, client, config, and prefilter stage are in place and tested. Fails open. It never blocks in this build. Phone runtime still needs onnxruntime, the tokenizer port, and the bundled model.

## Update 2026-10-29 (block mode and quarantine)

- **K (classifier as harm gate): block mode in force, with a hold-based safety net.** Flagged and unscreened sentences are held, released only by an explicit action, and never deleted. Holdout benign FPR 2.5% (1 of 40, small sample).
- **New item M: availability.** With the classifier sidecar down in block mode, all sentences are held as unscreened. Needs an operator decision: start the sidecar at boot, or allow fail-open for unscreened items on desktop.
- **New item N: sync-gate blocks are not held.** S and Q blocks (for example, "How to build a weapon...", which the Q gate catches) are plain rejections. Holding them would store that text locally. Decision needed.
- **Kernel bind address fixed** to 127.0.0.1 (was 0.0.0.0).
- **Phone build:** the kernel doesn't run on the phone yet, so block mode affects the desktop kernel only.

## Update 2026-10-29 (store, don't propagate)

- **M (availability): resolved by design.** Nothing waits on the classifier. Unscreened sentences are stored as `pending` and served only after screening.
- **N (sync-gate blocks not held): resolved.** S and Q blocks are held in quarantine, never propagated.
- **O (new): on-device screening.** Pending items only clear when the classifier runs. Phone-first means it has to run on the phone, which needs the tokenizer port and the ONNX runtime. Until then pending items stay pending on the phone.
- **K (false positives): open.** 2.5% benign flag rate on a 40-sentence holdout is not low enough. Calibration target: lower it while keeping harm recall, on a fresh pre-registered holdout.

## Update 2026-10-29 (propagation audit)

- **P (logs carried held text): closed.** Logs carry an id, not the text.
- **Q (taotie could merge held nodes into served ones): closed.** The sweep sees served nodes only.
- **R (spatial web indexed pending nodes): closed.** Only screened nodes are indexed.
- **S (held text in plain form at rest): open.** Local state holds quarantined text unencrypted. Decide on encryption at rest.

## Update 2026-10-29 (classifier calibration v3)

- **T (classifier benign FPR above target): open.** Fresh holdout v3 flagged 2 of 100 benign items (0.02). Target was 0.01 or lower. Recall 0.80 met. The live threshold stays at 0.007265 until Kyle decides. Options: accept about 2% with held items kept for review (no destruction, see the store-not-propagate design), or collect more hard-negative benign data for a v4 round with its own pre-registration.
- Holdout v2 text now lives in `tests/data/clf_dev_v3.json` (dev). It is no longer a sealed holdout.

## Update 2026-10-29 (classifier calibration v4: combined rule)

- **T (benign FPR above target): still open, narrowed.** Combined rule (classifier AND harm-vector margin): holdout v4 benign FPR 2 of 100 (down from 10 of 100 for the classifier alone). Recall 0.86. Target 0.01 not met.
- **U (embedding model not bundled): open.** all-MiniLM-L6-v2 is pinned by hash in CLF_PREREG_V4.md but not in the repo. Bundling it needs chunks, a manifest, and a sovereignty check on the source. The prefilter does not use the combined rule yet.
- **V (holdout authorship): open.** Every holdout so far was written by the same author as the dev data. Real-traffic FPR may be higher. A non-author holdout would test this.

## Update 2026-10-29 (harm-vector web learning)

- **W (learned vectors can shift thresholds): open.** Learning a vector moves the centroids, so the margin distribution changes. Any threshold used with the learned web must be re-validated on a fresh holdout before it is trusted. The combined rule (CLF_PREREG_V4) was validated on the v4 web only.
- **X (learning source is human-only): by design.** learn() requires a reviewer id. Keep it that way: learning from the classifier's own flags would let the web train itself on its own mistakes.

## Update 2026-10-29 (harm-vector advisory stage)

- **Y (syntactic gate S false-blocks ordinary sentences): open, in block mode.** S reports "missing_verb" on "The farmers market moves to the courthouse lawn next month." and blocks it. Benign sentences get blocked by a rule-based gate, not only by the classifier. Measure S's benign false-positive rate on a fresh set before trusting it in block mode.
- **Z (harm-vector stage is advisory, validated only on the author's data): open.** config/hv.json mode advisory. Blocking needs approval, and holdout v4 was written by the same author as dev v4.
- **AA (threshold ordering between QC and HV): open.** The live QC block threshold is 0.007265. The combined rule's classifier threshold is 0.001236. HV only reaches sentences QC already passed, so the combined rule catches only the band 0.001236 to 0.007265 today. Before HV is promoted to block, decide the ordering explicitly: replace the QC threshold with the combined rule, or keep both and say which one blocks.

## Update 2026-10-29 (S gate measured and moved to advisory)

- **Y (S gate false blocks): closed, with a trade-off.** Grammar fixes (abbreviation-safe splitter, auxiliaries not counted as verb piles, subject-after-auxiliary in questions) cut benign flags from 3.4% to 1.5% on dev v4, 3% to 2% on holdout v3, 4% to 0% on holdout v4. S then moved to advisory. Evidence: docs/validation/S_GATE_MEASUREMENT.json.
- **Y2 (salad detection regressed): open.** S used to catch 2 of 31 salad sentences in the prefilter, and now catches none. The prefilter integration battery's incoherent and discourse rows went from 2/31 and 1/20 to 0/31 and 0/20. Salad detection now rests on the Coherence Calculus score, which is red (TAU battery, AUC 0.64 dev and 0.50 holdout). Fixing this is part of the CC work, not the S gate.
- **Y3 (missing_verb from tagger noun/verb confusion): open, residual 1.5%.** "cut" and "closes" get tagged as nouns, so S still flags some benign prose. This is a limit of tag-based checks.
- **Y2 decision (2026-10-29, Kyle):** incoherence is handled by the Coherence Calculus module, not the prefilter. Each module does one job. The perplexity signal becomes an input feature to CC (coherence). The prefilter keeps harm and pragmatic gates only. Next: add the perplexity feature to CC and re-measure with the TAU battery. Y2 stays open until TAU passes or the decision changes.
- **Y2 progress (2026-10-29):** perplexity as a salad signal, measured (docs/validation/LM_SALAD_AUC.json, threshold 6.105 unchanged). Dev AUC 0.954 (prose vs salad), prose flagged 1.1%, salad caught 68% at that threshold. Holdout AUC 1.0 (prose vs seeded shuffle). This is measured on the same sets the TAU battery uses, so it is a finding, not a pre-registered result. Next: pre-register the CC + perplexity feature and score it once on a fresh holdout, before any change to CC.
- **Y4 (port collision, fixed):** the harm-vector service and the perplexity service both defaulted to 7769. Harm-vector moved to 7770 (config/hv.json and the service default). Ports now: clf 7768, lm 7769, hv 7770.
- **Y5 (LM contract test not run):** lm_service_contract.py skips without LM_DIR. It must run with LM_DIR set before the LM stage is trusted.
- **Y5 closed (2026-10-29):** lm_service_contract.py passes 14 of 14 with LM_DIR set.
- **Y2 partial (2026-10-29):** perplexity salad detection, pre-registered on a fresh holdout (docs/validation/SALAD_LM_PREREG.md, result in SALAD_LM_RESULT.json): AUC 1.0, balanced accuracy 1.0, prose flagged 0 of 40. Caveat: the shuffled negatives are easy, and the author wrote every prose sentence. This shows the signal works on word salad, not on fluent incoherent text. Still open: the CC module does not use the signal yet (TAU battery red). The next step is a pre-registered CC change, scored on harder negatives written by someone other than the author.
- **Y6 (perplexity misses fluent incoherence): open, measured.** Clause-splice negatives (SPLICE_LM_PREREG.md, result in SPLICE_LM_RESULT.json), scored once at the unchanged threshold 6.105: AUC 0.925 (pass, target 0.90), balanced accuracy 0.7375 (fail, target 0.80), splice caught 47.5%, prose flagged 0 (pass). The perplexity signal is strong on word shuffles and weak on clause splices. Consequence: the pre-registered CC integration does NOT proceed. The LM stays advisory. Options for the next round are a different incoherence feature, or a per-clause measure, each with its own pre-registration. Labels are noisy and the source prose is author-written.
- **Y7 decision (2026-10-29, Kyle):** coherence is measured by the Coherence module. Each gate is a specialist named for its own module (the lexical gate handles lexical checks). So fluent-incoherence work goes into CC, through a new pre-registered feature. Gates do not take coherence jobs. Status: open. The splice test (Y6) failed for perplexity alone, so the next feature needs its own pre-registration before any CC change.

## Update 2026-10-29 (at-rest encryption and threshold ordering)

- **S closed: at-rest encryption for state and archive.** AES-256-GCM via src/at_rest.js. Held and archived text is sealed on disk. The key is a 32-byte file, mode 0600, created on first use (override with GHOST9_KEY_FILE). Legacy plaintext loads and is re-sealed on the next write. A file that fails authentication, or is corrupt, makes the kernel throw. It never overwrites with an empty state. Tests: tests/regression/at_rest.js (8 checks), quarantine_live.sh (state file checked for plaintext held text).
- **AB (phone key storage): open.** The key is a file in the same account as the data. That protects copies of the data directory, not a compromised account. The phone build needs the Android Keystore. Not started.
- **AA decided (threshold ordering).** The QC block stays at 0.007265 and blocks. The combined harm-vector rule (0.001236 and 0.092375) stays advisory. It is not wired to block. Promotion needs a fresh validation of any learned web (W) and a decision by Kyle. Recorded as a decision, not as an open item.
- **Still red, unchanged:** TAU battery, five-gate empirical battery, prefilter integration battery. Coherence (Y7) remains open.
- **Y8 (non-author test of perplexity for incoherence): failed, pre-registered.** Kyle wrote 40 fluent sentences that are incoherent as a whole. Pre-registered in KYLE_NEG_LM_PREREG.md, scored once at the unchanged threshold 6.105 (KYLE_NEG_LM_RESULT.json): AUC 0.769 (target 0.90), balanced accuracy 0.5375 (target 0.80), negatives caught 3 of 40 (7.5%), prose flagged 0 of 40. Median NLL: negatives 5.47, prose 4.63. Interpretation: perplexity measures local fluency. These negatives are grammatical, and their absurdity is semantic, so the LM finds them predictable. Perplexity cannot be the Coherence feature for this kind of incoherence. Y2 and Y6 stand, and the Coherence feature needs a semantic signal, with its own pre-registration. Limit: these are single sentences, and the task was deliberately absurd.
- **Y9 (within-sentence cohesion feature): failed, pre-registered.** COHESION_PREREG.md, threshold chosen on dev only (t = -0.4328), then scored once on Kyle's 40 non-author negatives (COHESION_RESULT.json). Dev AUC 0.70 (weak even before the non-author test), dev balanced accuracy at t 0.55. Non-author AUC 0.67, balanced accuracy 0.54, negatives caught 3 of 40, prose flagged 0 of 40. Conclusion: perplexity (Y8) and mean-token cohesion both fail on single-sentence semantic absurdity. The Coherence feature for that class needs either a much larger local model or an approach that compares a sentence with its context. Neither is in place. Y7 stays open.
- **Y10 (own coherence model): failed, pre-registered.** OWN_COHERENCE_PREREG.md: logistic regression on NLL, token cohesion, TTR and log length, trained only on synthetic negatives from dev prose (word shuffles and splices), threshold chosen on training data. Scored once on Kyle's 40 non-author sentences against 40 salad prose sentences (OWN_COHERENCE_RESULT.json): AUC 0.786 (target 0.90), balanced accuracy 0.6125 (target 0.80), negatives caught 11 of 40 (27.5%), prose flagged 2 of 40 (0.05, at the limit). Disclosure: the first run crashed while writing its JSON, after computing the same values. The second run reproduced the same model and threshold (deterministic). The pre-registration notes this.
- **Y11 (two TAU values): open.** coherence_calculus.js sets TAU = 0.9430 for the ingest gate (the REJECT check in ghost_face.js uses it). config/cc_v4.json sets tau 0.2431 from a Youden-J calibration on dev. One value needs to govern, and the other needs removing or documenting. Placement confirmed: the Coherence module runs after the pre-gates and before SS (Kyle, 2026-10-29).

## Update 2026-10-29 (no runtime external dependencies)

- **Y12 closed: perplexity model bundled.** distilgpt2 (quantized decoder and tokenizer) is in models/distilgpt2 as hash-pinned chunks under 30 MB each, with a manifest. services/lm/fetch_lm_model.py rebuilds the files with no network access and checks them against the LM_PREREG_V3 SHA-256 pins. Verified: the rebuilt copy passes the perplexity contract test 14 of 14 (LM_DIR set to the rebuilt copy).
- **Runtime external-dependency audit (2026-10-29).** Shipped runtime code (src/, services/*/ and their configs) makes no outside network calls. Services bind to loopback only (clf 7768, lm 7769, hv 7770). Shipped runtime code does not reference private paths. The only outside fetches were development-time downloads from Hugging Face, and every model they produced is now bundled and hash-pinned.
- **Open: licensing check.** distilgpt2 licence must be confirmed from its upstream model card before any public release. toxic-bert and MiniLM manifests record Apache-2.0.
- **Open: phone packaging.** The desktop services have no runtime external dependencies. The phone build is not done (AB, the Android Keystore key, and the on-device runtime). Until it is, the phone claim is not verified.
- **Y11 measured (2026-10-29).** docs/validation/TAU_LIVE_MEASUREMENT.json. The live ingest gate (TAU 0.943) passes 100% of prose and 100% of incoherent text, so it admits everything that clears the pre-gates. TAU 0.9995 rejects 100% of both. mu is compressed into about 0.95 to 0.99. Kyle's stated principle is to set a high target and refine modules toward it. That needs a score with spread. The next step is a pre-registered rescaling of mu, tested on dev data first, with the TAU target set to the rescaled value. Until Kyle signs off on the canonical number, the live gate stays at 0.943.
- **Y13 (ingest TAU, Kyle 2026-10-29): in progress.** Method: start from a research value, run the data, see where the score lands (docs/validation/INGEST_TAU_LANDING.json). Start point 0.96 (the research worked example, labelled illustrative). The landing table covers 0.96 to 0.9995. Any threshold chosen for ingestion needs calibration on a labelled dev split, then one test on a held-out split, as the research requires. The live gate stays at 0.943 until that is done and Kyle signs off.
- **Y14 (domain gate test, research section 4.4): measured 2026-10-29.** docs/validation/CC_DOMAIN_GATE_TEST.json: per-domain AUC prose vs incoherent, and absence rates. Keyword domains (D2 to D8) default to 0.9997 when no keyword matches, so absence counts as coherence. Any domain whose AUC is near 0.5 fails the gate test and cannot be part of the ingest config as it stands. The ingest config redesign needs domains that measure something other than word presence, pre-registered before any change to the live gate.
- **Y15 (gate coupling, Kyle 2026-10-29): open.** gate_pragmatic.js ("ASSUMES: utterance has passed L, S, and M"), gate_quarantine.js ("ASSUMES: passed L, S, M, P") and prefilter.js (Q runs last "matching the upstream assumption") claim upstream dependencies. The function signatures show no code dependency, so the claim is comment-only. Fix: correct the comments so each gate is documented as self-contained, then confirm by test.
- **Y16 (gate three off, Kyle 2026-10-29): open.** M (gate_semantic.js) is mode 'off' in DEFAULT_MODE because its lists were removed. Semantic nonsense is not filtered at ingest. Fix: rebuild M's cohesion check, pre-register it, validate it on its own labelled set, then set its mode.
- **Y16 measured 2026-10-29.** docs/validation/M_GATE_MEASUREMENT.json. The harm-category signal catches 0 of 30 seed and 0 of 30 paraphrase harmful texts, and flags 0 of 91 benign. Cohesion AUC is 0.70 on dev and 0.60 on holdout, and it catches 18 of 31 salad sentences. Thresholds are provisional. Next: pre-register the M rebuild. Harm belongs to Q, so M's harm signal is likely redundant and should be removed from M's job.
- **Y17 (M v2 coverage, 2026-10-29): open.** The pre-registered M v2 sentence-unit rule abstains on every existing single-sentence item (dev prose, dev salad, BENIGN, INCOHERENT). No v2 AUC exists. Decision needed: multi-sentence data plus v2, or a single-sentence method registered separately. Recorded in docs/validation/M_V2_PREREG.md.

