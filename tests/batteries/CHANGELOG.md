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

## Not yet audited

- `tests/batteries/backend_empirical_battery.js`, `backend_empirical_battery_v2.js`, `persistence_empirical_battery.js`: read `test_tmp/`. Audit before `test_tmp/` is archived.
- `tests/e2e/ghost_kernel_e2e_battery.js`: lists `gate_router` as a core module. Loads fine. Not otherwise audited.
