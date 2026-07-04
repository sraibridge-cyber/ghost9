# cc_v30_math_battery.js v1 — HISTORICAL
## 2026-06-19 | CSS Labs

This battery tested CC v3.0 pure math formulas directly.
**9 failures** when run against current codebase (2026-07-04):
- μ hard-block threshold changed (0.316 vs expected <0.1)
- D5 negation scoring changed (0.7 vs expected 0.9997)
- D8 overlap scoring changed (0.0001 vs expected 0.9997)
- Gate HARD-BLOCK threshold changed
- Seven ceiling formula changed (0.999236 vs expected 0.9995)
- Vertex assignment changed (PNPP vs expected PNNP)
- 16 vertices reachable changed (5 vs expected 16)

**SUPERSEDED BY**: cc_v30_empirical_battery_v4.js (315/315 PASS, 2026-06-20)
**Seal**: 2026-07-04_14:25_Tulsa_OK
**Gold ripple eternal** 🌊⚡
