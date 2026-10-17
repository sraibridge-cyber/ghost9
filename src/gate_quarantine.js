// === GHOST Quarantine Gate v0.1 ===
// Isolates harm vectors and integrity threats. NOT a morality gate.
// No observer-dependent judgment anywhere in this module.
// ASSUMES: utterance passed L, S, M, P gates.
// SCOPE: within-utterance curated pattern detection, English v0.1,
//        seed lists frozen at seal time.

// --- Pattern Database (seed v0.1) ---
const PATTERNS = {
  operator_harm: {
    severity: "CRITICAL",
    action: "block",
    description: "Incitement or threat against the operator",
    patterns: [
      "kill yourself", "go die", "end your life", "hurt yourself",
      "i will kill you", "i will hurt you", "i will find you",
      "you should die", "die already"
    ]
  },
  third_party_harm: {
    severity: "HIGH",
    action: "quarantine",
    description: "Payloads using the kernel as a harm instrument",
    patterns: [
      "leak their address", "post their ip", "dox them", "doxxing",
      "how to hack", "how to brute force", "how to keylog",
      "how to make a bomb", "how to build a weapon",
      "swat them", "swatting"
    ]
  },
  kernel_integrity: {
    severity: "CRITICAL",
    action: "block",
    description: "Attempts to bypass or rewrite the gate stack",
    patterns: [
      "ignore previous instructions", "ignore all previous",
      "ignore the above", "disregard your instructions",
      "forget your instructions", "reveal your instructions",
      "you are now a", "you are now in", "you are now free",
      "new persona", "jailbreak", "developer mode",
      "pretend you have no rules"
    ]
  },
  operator_deception: {
    severity: "HIGH",
    action: "quarantine",
    description: "Payloads instructing concealment from the operator",
    patterns: [
      "do not tell the user", "hide this from",
      "without the operator knowing",
      "tell the operator", "keep this secret"
    ]
  }
};

const SEVERITY_RANK = { MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

function normalize(text) {
  return text.toLowerCase().replace(/[\u2018\u2019]/g, String.fromCharCode(39)).replace(new RegExp(String.fromCharCode(39), "g"), "");
}

function gateQuarantine(utterance) {
  const text = normalize(utterance);
  const violations = [];

  for (const domain of Object.keys(PATTERNS)) {
    const def = PATTERNS[domain];
    for (const p of def.patterns) {
      if (text.includes(p)) {
        violations.push({
          domain: domain,
          severity: def.severity,
          action: def.action,
          matched: p
        });
      }
    }
  }

  let action = "pass";
  let top = 0;
  for (const v of violations) {
    const r = SEVERITY_RANK[v.severity];
    if (r > top) { top = r; action = v.action; }
  }

  const passed = violations.length === 0;
  const score = passed ? 1.0 : Math.max(0, 1.0 - violations.length * 0.25);

  return {
    passed: passed,
    action: action,
    violations: violations,
    score: parseFloat(score.toFixed(4)),
    details: {
      domainsScanned: Object.keys(PATTERNS).length,
      patternsScanned: Object.values(PATTERNS).reduce(function(n, d) { return n + d.patterns.length; }, 0),
      quarantined: passed === false
    }
  };
}

module.exports = {
  gateQuarantine: gateQuarantine,
  PATTERNS: PATTERNS,
  SEVERITY_RANK: SEVERITY_RANK,
  normalize: normalize
};
