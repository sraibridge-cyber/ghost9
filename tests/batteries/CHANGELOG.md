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

