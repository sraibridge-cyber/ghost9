# Archived 2026-10-31

These legacy gate suites were replaced by contract-based suites:

- tests/unit/contract_semantic.js (docs/architecture/M_GATE_CONTRACT.md)
- tests/unit/contract_syntactic.js (docs/architecture/S_GATE_CONTRACT.md)

Kept for history only. They are not run by scripts/run_all_tests.js. Their require paths point at the old
tests/unit location and will not resolve from here.
