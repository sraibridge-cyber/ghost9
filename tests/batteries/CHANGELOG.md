# Batteries changelog

Rule: every fix or update sprint updates the batteries it touches. Superseded batteries are archived, never deleted.

## 2026-10-28

- **Added** `tests/batteries/five_gate_battery.js` (40 tests): CC contract, the five-gate pipeline (L, S, M, P, Q), the QC classifier stage, and module contracts. Passes 40/40.
- **Retired** `tests/batteries/three_gate_kernel_battery.js`. It tested a three-gate router with list-based M and fragment-accepting S, and read per-gate verdicts from `evaluate()`, which no longer returns them. It is archived at `archive/superseded/2026-10-28/tests/batteries/three_gate_kernel_battery.js`. Its path fix (`./src/` to `../../src/`) and P1.17 to P1.20 edits were local only and are not in the archive.
- **Changed** `src/gate_router.js`: rewritten as a thin five-gate entry point over `src/prefilter.js`. Replaces `threeGateScan`, which imported `scanSyntactic` and `scanSemantic` (not exported by the gate modules).
- **Expectations that changed under the five-gate design** (recorded so the change stays visible):
  - `hello world` was expected not blocked. Now blocked at S, because S requires a sentence.
  - `harmonic` was expected not blocked. Now blocked at S for the same reason.
  - `harm` was expected blocked by list-based M. M is off. The five-gate battery checks `kill yourself` at Q instead.
  - `evaluate()` version and τ moved (v3.2, τ 0.943). The five-gate battery checks the contract, not the values.
- **Known benign false positive:** S blocks `The river bends east past the old mill.` The earlier 220-sentence battery measured S at 97.8% benign pass, so this is expected at that rate. Recorded in TECH_DEBT.

- **Added** `tests/batteries/five_gate_empirical_battery.js`. Runs the five-gate pipeline on the labeled sets (benign 91, harm seed 30, harm paraphrase 30, incoherent 31). Each sentence gets a verdict check and a determinism check, so the battery has 364 per-sentence checks plus 4 aggregate thresholds and 1 timing check (369 total). This meets the CSS Labs standard of 200+ empirical checks per battery.
  - Measured on 2026-10-28: BENIGN 89/91 pass (0.978, threshold 0.95, PASS). HARMFUL_SEED 30/30 blocked (1.000, PASS). HARMFUL_PARAPHRASE 5/30 blocked (0.167, threshold 0.80, FAIL, known gap). INCOHERENT 2/31 blocked (0.065, threshold 0.90, FAIL, known gap).
  - Exit 1 until the M gate is replaced. The failures are the measured state, not hidden. The sets were used during development, so this is a regression measure, not a holdout.

- **Added** `src/wordnet.js`: reader for the WordNet 3.1 dictionary files shipped by the new required dependency `wordnet-db`. Positional reads keep memory low.
- **Replaced** `src/gate_semantic.js` (list-based M, previously off) with M v1: WordNet harm categories plus a cohesion signal. The list-based version is archived at `archive/superseded/2026-10-28/src/gate_semantic.js`. M stays off in `DEFAULT_MODE`, so production behavior is unchanged.
  - Measured standalone on 2026-10-28: BENIGN passes 0.725 (threshold 0.95). HARMFUL_SEED blocked 0.267 (0.95). HARMFUL_PARAPHRASE blocked 0.300 (0.80). INCOHERENT blocked 0.581 (0.90). All four fail.
  - Category signal: zero hits on every set. Harm verbs in the paraphrases (kill, attack, steal, threat, injure) do not reach the harm roots in WordNet's hypernym chain. 'harm' and 'hurt' do.
  - Cohesion signal: AUC 0.70 on the dev sets (prose 91 vs salad 31). It flags 13% to 27% of prose at thresholds 0.3 to 0.5.
  - Conclusion: WordNet hypernyms do not capture paraphrased harm intent. A harm-intent signal needs something that reads context, not word-level ancestry. The local classifier (QC) scored paraphrases higher earlier (AUC 0.93), so it is the next candidate.
- **Added** four M-gate aggregate checks to `five_gate_empirical_battery.js`. They fail and are reported as known gaps.

- **Service worker is cache-only** (`src/ghost_persistence.js`). A cache miss returns 404 and never calls the network (SOVEREIGNTY rule 1). Regression test: `tests/regression/sw_offline.js` (4/4).
- **Updated** `tests/batteries/persistence_empirical_battery.js` (255 tests, exit 0). Its require paths were fixed (`./src/` to `../../src/`). Expectations changed, with old values kept in comments:
  - P1.2.15, P5.3.4: offline message text now 'GHOST: asset not bundled'.
  - P2.1.11: cache miss returns 404, not 503.
  - P2.3.2: no network fallback is expected now. Old: `fetch(event.request)` present.
  - P2.3.3: no offline catch is expected now.
  - P1.3.9, P3.3.2: CC version is v3.2. Old: '3.0'.
  - P1.3.10, P3.3.3: UI docs test count claim is 207/207. Old: 315/315. This count is hard-coded, not measured (see TECH_DEBT).

- **Batteries no longer write to `test_tmp/`.** `backend_empirical_battery.js` (91/91), `backend_empirical_battery_v2.js` (265/265) and `persistence_empirical_battery.js` (255/255) now write to a per-run directory under `os.tmpdir()`, removed on exit. Their `require('./src/...')` paths are now `../../src/...`. That was why both backend batteries crashed at startup. The persistence P5.1.10 check now uses a `persist.json` file in its temp directory. `test_tmp/` was never tracked (it is gitignored scratch output), so nothing was in git history. Its 55 local files were moved to `archive/temp/2026-10-28/test_tmp/` in the working copy. They are not committed.

- **Added** `tests/regression/clf_service_contract.py` (16/16). It runs the real classifier server on loopback and checks routes, status codes, score shape, determinism and input errors. The client bypasses `HTTP_PROXY`.

## Not yet audited

- `tests/e2e/ghost_kernel_e2e_battery.js`: lists `gate_router` as a core module. Loads fine. Not otherwise audited.

## 2026-10-29: thresholds to config, batteries repaired, hidden failures exposed

- **Tier thresholds moved to `config/thresholds.json`.** `src/thresholds.js` validates them (each in (0, 1], STM below LTM). `taotie.js`, `rip_generative_loop.js`, `reconstruction_pipeline.js`, `spatial_web.js`, `five_laws.js` and `merkle_bonsai.js` read them. Values are unchanged. Every battery that ran before gives the same result after.
- **Two LTM values are kept on purpose.** `ltm_min` is 0.9998 (taotie, ghost_face, rip). `bonsai_ltm_tau` is 0.9995 (merkle_bonsai). The disagreement is recorded in TECH_DEBT and needs your decision.
- **Path repair.** Batteries and e2e tests required `./src/...` from `tests/batteries/`, which doesn't resolve. They now use `../../src/...`. Fourteen batteries that had never run now run: bonsai, five_laws, phase4, recon, rip, rip_generative, spatial_web, spectral_graph, taotie, ab_test, test_gate_lexical, ci_benchmark, ghost_kernel_e2e, and the UI battery's file-level checks.
- **Exit codes are honest.** These batteries print failures and now exit 1: bonsai, phase4, taotie, ui, ghost_kernel_e2e, kernel_integration, ci_benchmark. Before this, CI would have passed them.
- **Archived.** `three_gate_kernel_battery.js` tested the removed L/S/M gates. TECH_DEBT already said it was archived, but the file was still live. It is now at `archive/superseded/2026-10-29/`.
- **`kernel_integration_test.js`.** Removed-gate assertions were dropped (original archived). K2.6 now checks the score is above the block floor, not the old pinned 0.95. K7.1 expects `v3.2`. K8.x uses the whitlock field names (`magnitude`, `real`, `imag`).
- **`test_cc_ghost9_v35.js`.** A stray non-JS line after `process.exit` caused a SyntaxError. Removed. Original kept at `archive/superseded/2026-10-29/`.
- **`ui_empirical_battery.js`.** Reads the UI files from `ui/`.

### Open failures (red on purpose, not edited away)

- `ci_benchmark`: 9 failing. **CI-1 (harmful instruction, "synthesize weapon", SAFETY) is not blocked.** Priority one.
- `ghost_kernel_e2e_battery`: 158 failing. Not triaged yet.
- `phase4_empirical_battery`: 24 failing. Not triaged yet.
- `taotie_empirical_battery`: 10 failing. Not triaged yet.
- `bonsai_empirical_battery`: 6 failing. Not triaged yet.
- `kernel_integration_test`: K3.1 ("I will harm you") and K6.1 ("That is a lie") are not blocked by the five-gate scan. "Lie" is blocked only because it is an unknown word. This is the harm gap again.
- `test_cc_ghost9_v35` WT-11 and `kernel_integration_test` K7.3: expect canonical TAU 0.9995. Code has 0.943. Decision needed.
- `ui_empirical_battery` L9.1.3: `ui/ghost_api.js` hard-codes LAN addresses (`192.0.0.8`), not localhost. Decision needed.
- `five_gate_empirical_battery` (62) and `prefilter_integration_battery` (paraphrase 16.7%): known gaps, documented.

## 2026-10-29 (later): UI on localhost, TAU measured, classifier probed

- **UI endpoints are `localhost`** (`ui/ghost_api.js`). They were hard-coded LAN addresses (`192.0.0.8`). The UI should only reach the kernel on the device it's installed on. `ui_empirical_battery` is now 399/0.
- **Added `tests/batteries/tau_empirical_battery.js`.** It calibrates on dev (Youden J) and scores the holdout once. Targets were fixed before the run: AUC >= 0.80 on dev and holdout, holdout balanced accuracy >= 0.80. **Result: red, as a finding.**
  - Dev: AUC 0.641. Holdout (word-shuffled prose as negatives): AUC 0.503, 95% CI [0.375, 0.623].
  - Dev-optimal TAU is 0.9849 (J = 0.357), but holdout balanced accuracy is 0.50 there.
  - Code TAU 0.943 accepts every prose and salad text. The gate blocks nothing on these sets.
  - Per domain, dev AUC: D1 0.89. D2, D5, D6, D8 are near 0.55. D3, D4, D7 are inverted (salad scores higher).
  - Conclusion: no threshold can be set from this score, because the score doesn't separate prose from salad. This is a design question about the score, not about the threshold.
- **Classifier probe (not in the battery, nothing enabled).** The local toxic-bert scored the five harm phrases above the provisional threshold 0.004992: 0.0084 to 0.3377. That includes CI-1 at 0.0298. Eleven benign, short, and salad texts stayed below it, except one prose sample at 0.0044. Five phrases are not a calibration. A sealed holdout is still needed before it can block anything.

## 2026-10-29 (classifier calibration and score options)

- **Classifier calibrated on dev, sealed holdout scored once.** Pre-registration: `docs/validation/CLF_PREREG.md` (holdout hash recorded before scoring). Calibration script: `services/clf/calibrate.py`. Results: `docs/validation/CLF_CALIBRATION.json`.
  - Chosen threshold (dev, benign FPR at most 1%, max recall): 0.006103. Dev recall 0.433, dev FPR 0.000, dev AUC 0.908.
  - Holdout: recall 0.800 (meets the 0.80 target), benign FPR 0.067 (misses the 0.05 target: two of thirty benign sentences), AUC 0.964.
  - The holdout file is kept out of the repo so it stays sealed. The repo holds its SHA-256, and `services/clf/calibrate.py` reads it from `CLF_HOLDOUT`.
  - **Result: target missed by two benign sentences.** Config is unchanged and stays advisory. The holdout has now been used, so any new threshold needs a new sealed holdout.
- **Toxicity classifier does not measure coherence.** Prose vs salad AUC 0.303 (dev). It is a harm signal, not a coherence signal.
- **Score redesign options written** in `docs/review/CC_SCORE_OPTIONS.md`. Nothing in the coherence score was changed. A decision is needed.

## 2026-10-29 (fresh classifier calibration, v2)

- **Fresh calibration.** Calibration set (dev v2): the v1 dev sets plus the v1 holdout, which is now used. 121 benign, 90 harm. Pre-registration: `docs/validation/CLF_PREREG_V2.md`. Results: `docs/validation/CLF_CALIBRATION_V2.json`.
  - Threshold 0.007265 (calibration benign FPR 0.8%, calibration recall 0.533).
  - Fresh holdout v2 (40 harm, 40 benign, held outside the repo, hash committed): **harm recall 0.800 (32/40), benign FPR 0.025 (1/40), AUC 0.983. Both targets met.**
  - Caveats: recall sits exactly at the 0.80 target. The author wrote the holdout, so it is sealed against tuning, not independent of the author.
- `config/clf.json`: threshold set to 0.007265. Mode stays `advisory`.
- **Blocker before block mode.** In `src/prefilter.js`, block mode with the classifier unreachable fails the QC stage, so every text is refused. A dead sidecar would brick the app. Fix (fail-open, or fail-closed only for a flagged result) needs your decision before block mode.

## 2026-10-29 (fail-open, option C feasibility and calibration)

- **Classifier stage fails open** (`src/prefilter.js`). An unreachable classifier is recorded in the trace and the sentence goes on, in both advisory and block mode. Only a flagged score blocks, and only in block mode. Reason: the phone build has no classifier yet, so fail-closed would refuse every sentence. Blocker L in TECH_DEBT is resolved by this.
  - Two expectations changed, with the old assertions kept in comments: `tests/regression/clf_wiring.js` ("block fails closed" to "fails open"), and `tests/batteries/five_gate_battery.js` P3.3 ("block QC fails closed" to "fails open").
  - Added `tests/regression/prefilter_failopen.js` (5/5): unreachable in block mode passes; unreachable in advisory passes; flagged in block mode blocks; flagged in advisory reports only; clear passes.
- **Option C feasibility (perplexity).** Pinned model: Xenova/distilgpt2 quantized (SHA-256 in `docs/validation/LM_PREREG.md`). Score: mean per-token NLL. Probe on dev: salad NLL above prose NLL, AUC 0.954.
- **Option C calibration, pre-registered** (`docs/validation/LM_PREREG.md`, script `services/lm/perplexity.py`, results `docs/validation/LM_CALIBRATION.json`):
  - Threshold from dev: NLL 5.94 (smallest threshold with dev prose flag rate at most 5%). Dev salad recall 0.774.
  - Holdout v1 (47 prose, 47 shuffled, held outside the repo, hash committed): shuffled recall **1.000** (target met). Prose flag rate **0.064 (3/47)**, target 0.05. **Missed.**
  - Not wired into the prefilter. The holdout is used now, so a new threshold needs a fresh sealed holdout.

## 2026-10-29 (perplexity calibration v2)

- **Pre-registered v2** (`docs/validation/LM_PREREG_V2.md`). Calibration (dev v2) = v1 dev plus the used v1 holdout: 138 prose, 78 salad. Holdout v2 held outside the repo (45 prose, 45 shuffled, hash committed).
- Threshold NLL 5.949 (smallest with dev prose flag rate at most 5%). Dev salad recall 0.910. Dev AUC 0.981.
- Holdout v2: shuffled recall **1.000** (met). Prose flag rate **0.067 (3/45)**, target 0.05 (missed).
- **Systematic gap.** Both fresh holdouts land at 6.4% to 6.7% prose flags, while dev sits at 4.3% to 4.4%. The dev rule is too loose for fresh prose. A stricter dev rule would need a new pre-registration and a third holdout, not a retune on v1 or v2.
- Not wired into the prefilter. Config unchanged.

## 2026-10-29 (perplexity calibration v3, stricter dev rule)

- **Rule changed before the third holdout was written** (`docs/validation/LM_PREREG_V3.md`). Dev prose flag limit lowered from 5% to 2.5%, because v1 and v2 showed the 5% limit was too loose for fresh prose. v1 and v2 remain as recorded.
- Threshold NLL **6.105** (dev v2: 138 prose, 78 salad). Dev prose flag rate 0.022. Dev salad recall 0.872. Dev AUC 0.981.
- Holdout v3 (47 prose, 47 shuffled, held outside the repo, hash committed): prose flag rate **0.021 (1/47), target met**. Shuffled recall **1.000, target met**. **Pass.**
- Caveats: the holdout prose was written by the author. Shuffled negatives are an easier kind of incoherence than dev salad. The signal measures incoherence. It does not detect harm; CI-1 is fluent, so its NLL is low.
- Not wired into the prefilter. Config unchanged. Wiring waits on the phone runtime (onnxruntime and tokenizer).

## 2026-10-29 (perplexity wired in as advisory, step 2)

- **Sidecar** `services/lm/lm_service.py` (loopback, pinned-hash check, `GET /health`, `POST /nll`). Contract test `tests/regression/lm_service_contract.py`: 14/14 against the pinned model. Skips without `LM_DIR`.
- **Client** `src/lm_client.js` (loopback only, never throws). Config `config/lm.json`: threshold 6.105 (v3), mode `advisory`.
- **Prefilter** (`src/prefilter.js`): the classifier stage is unchanged and moved into `runQcStage`. A new advisory LM stage runs after the earlier gates pass. It reports `stages.LM` and never changes `pass`. Block mode for LM throws, so it cannot be enabled by config alone.
- **Tests:** `tests/regression/prefilter_lm_advisory.js` (6/6). Existing suites unchanged: fail-open 5/5, classifier wiring 11/11, five-gate 40/40.
- **Live check** (sidecar running, pinned model): a coherent sentence scored NLL 3.49 and was not flagged. A word salad scored 9.37 and was flagged. Both passed the prefilter.
- Step 3 (not done): decide whether to move LM from advisory to block. That needs a harm-independent calibration and your approval, since incoherence is not harm.

## 2026-10-29 (block mode approved, quarantine safety net)

- **Classifier block mode** (`config/clf.json`). Approved by you for harm detection. Benign false-positive rate is 2.5% on the v2 holdout (1 of 40). The holdout is small, so the true rate is uncertain.
- **Safety net: hold, don't drop** (`src/ghost_face.js`).
  - A classifier flag is held as `quarantined`, with its score and threshold, in `state.quarantine`.
  - An unreachable classifier in block mode is held as `unscreened`.
  - `GET /quarantine` lists held items. `POST /quarantine/release` re-runs the normal admission path (CC gate and sync gates still apply). An override that skips the classifier is allowed only for a classifier flag, and only when requested. A re-flagged item is marked `superseded`. Nothing is deleted.
- **Kernel binds to 127.0.0.1.** It was `0.0.0.0`, which exposed it on the local network.
- **Live verification** (`tests/regression/quarantine_live.sh`, scratch copy, block mode, classifier sidecar): flagged sentence held (score 0.674); release without override re-holds it; override release admits it; benign sentence admitted.
- **Test updates**: `run.js` runs its scratch copy in advisory mode, because no classifier runs there, and says so. `five_gate_battery` P4.2 expects `block`, with the old expectation kept in a comment.
- **Availability cost, not yet decided.** In block mode, if the classifier sidecar is down, every sentence is held as `unscreened`. Nothing is admitted until it is back and the held items are released. Start the sidecar first.
- **Not held yet.** Sentences blocked by the synchronous S or Q gates are still plain rejections, not holds. That's a policy choice (held text is stored locally).

## 2026-10-29 (store, don't propagate: revises the block-mode hold design)

Direction from you: the app is phone-first, so nothing can depend on a desktop. Harmful text may be stored for learning, but it must never propagate.

- **Admission never waits on the classifier.** An unscreened sentence is admitted as `screen: pending`. A classifier-screened sentence is `passed`. An override is `released`.
- **Propagation filter.** `GET /nodes` serves only `passed` and `released` nodes. Pending and quarantined nodes are stored, not served. Legacy nodes count as passed.
- **Sync-gate and classifier blocks are held, not dropped.** S, Q, and classifier blocks go to `state.quarantine` (`gate_S`, `gate_Q`, or `quarantined`). They never reach the node list.
- **`POST /rescreen`.** Screens pending nodes once the classifier is available. Flagged or gate-blocked nodes are marked `quarantined` and stored. Nothing is deleted.
- **Release.** `POST /quarantine/release` takes an override for any held item after a human decision. The CC gate always applies.
- **Live test** (`tests/regression/quarantine_live.sh`, 11 checks): device-only operation with no classifier running, rescreen, override release, and propagation filtering.
- **Suites:** end-to-end runner, five-gate battery, prefilter and classifier wiring, and the UI battery all pass.
- **Not yet done.** The false-positive rate is still too high (2.5% on a 40-sentence holdout). Lowering it is the next calibration target, and the classifier must run on the phone, because screening no longer depends on a desktop.

