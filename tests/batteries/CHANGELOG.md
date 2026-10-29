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

## Not yet audited

- `tests/batteries/backend_empirical_battery.js`, `backend_empirical_battery_v2.js`, `persistence_empirical_battery.js`: read `test_tmp/`. Audit before `test_tmp/` is archived.
- `tests/e2e/ghost_kernel_e2e_battery.js`: lists `gate_router` as a core module. Loads fine. Not otherwise audited.
