
## 2026-07-05: D1 Scorer Audit — v3.1 Keyword vs v3.0 Six-Tier

**Finding:** The v3.1 keyword-based D1 scorer fails 6/18 CI cases (all ALLOW cases). The v3.0 six-tier word-count gradient passes all 18.

**Root Cause:** Keyword-based scoring punishes clean text that lacks structural keywords (`{}();`). Word-count gradient correctly rewards coherent text of sufficient length.

**Safety Recall:** 1.0000 (all safety-critical BLOCK cases still pass — no regression)

**Decision:** Restore v3.0 six-tier D1 gradient in v3.2.

**Lesson:** Validated math should not be replaced without empirical validation. The CI benchmark exists for this exact reason.

---

