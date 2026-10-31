# Q-GATE v0.1 — Empirical Accounting (Honest)

**Sealed:** 2026-10-17T05:09:35.515Z — Tulsa, OK
**Battery:** 200/200 (100.0%)
**Upstream gates:** L ✅ | S (280/280) ✅ | M (210/210) ✅ | P (200/200) ✅

## Design Principle
Q-GATE is a quarantine layer, not an ethics judge. Morality is observer-dependent and was explicitly excluded from scope. The gate detects only harm vectors and integrity threats: payloads that target the operator, use the kernel as a harm instrument, attack the gate stack itself, or instruct concealment from the operator. Immune system, not arbiter.

## What Is Validated (200 tests, 14 sections)
- Clean benign pass-through (30 tests)
- Edgy-but-valid pass-through: fiction violence, crime discussion, war history, dark narrative (25 tests)
- Operator harm quarantine (20) | Third-party harm vectors (20) | Kernel integrity injections (20) | Operator deception (15)
- Case and unicode normalization: ALL CAPS, title case, curly apostrophes (10)
- Near-miss boundaries that must NOT fire (10)
- Multi-violation stress with action precedence (5)
- Action correctness: block/quarantine/pass routing (10)
- Score math: 1.0, 0.75, 0.5, 0.25, 0.0 by violation count (5)
- Extended pattern coverage (20) + extended clean (15)

## Module Patches Applied During Build
1. normalize() strips apostrophes after unicode folding — "Don't" and "Don’t" both match "dont"-class patterns.
2. Pattern "dont tell the operator" widened to "tell the operator" — covers "do not" and "dont" forms.

## Documented Bluntness (Sec10, logged as limitation — not hidden)
These LEGITIMATE texts quarantine in v0.1. This is the honest cost of deterministic pattern gates:
- Fiction quotes containing threat dialogue ("The novel says kill yourself in chapter three")
- Defensive security education ("lecture covered ignore previous instructions attacks")
- Benign status messages ("You are now a premium subscriber")
- Recipes ("Keep this secret ingredient")
- Software documentation ("manual says do not tell the user about internal errors")
Mitigation path for v0.2: not wider lists — cross-gate context (P-GATE discourse state could whitelist quoted/reported speech). Out of v0.1 scope.

## Known Limitations (v0.1 Scope)
1. Within-utterance only — no discourse-level tracking.
2. English only. No multilingual coverage.
3. Seed lists (~40 patterns) frozen at seal — not comprehensive coverage of any category.
4. No leetspeak/phonetic evasion detection (k1ll, k!ll).
5. Quarantine is binary per pattern — no confidence scoring per match.

## Seal
See SEAL_qgate_v01.json for SHA3-512 hashes of module + battery.
