#!/usr/bin/env python3

with open('src/coherence_calculus.js', 'r') as f:
    content = f.read()

# Fix D3: Temporal contradictions should return 0.0001 (hard-block), not 0.9940
# Paper §3.3: "if any(online ∈ text) and any(offline ∈ text): return 0.0001"
content = content.replace(
    "  if (conflictCount >= 1) return 0.9940;\n  return 0.9997;",
    "  if (conflictCount >= 1) return 0.0001;\n  return 0.9997;"
)

# Fix D5: "must not" + "must" in benign declarative context should return 0.9997, not 0.70
# The paper's 0.70 is for "do not" + "do" (self-negation), not "must not disclose" (directive)
# "must not disclose" is a benign imperative, not a self-negation
# Only return 0.70 for actual self-negation patterns like "do not do this"

content = content.replace(
    """  const mustNot = /\\bmust not\\b/i.test(lo);
  const mustWord = /\\bmust\\b/i.test(lo);
  const neverWord = /\\bnever\\b/i.test(lo);
  const alwaysWord = /\\balways\\b/i.test(lo);
  if ((mustNot || neverWord) && (mustWord || alwaysWord)) return 0.70;""",
    """  const mustNot = /\\bmust not\\b/i.test(lo);
  const mustWord = /\\bmust\\b/i.test(lo);
  const neverWord = /\\bnever\\b/i.test(lo);
  const alwaysWord = /\\balways\\b/i.test(lo);
  // Only sub-threshold for "must not" + "must" in same sentence (self-negation)
  // "must not disclose" (single directive) = declarative, return ceiling
  if ((mustNot || neverWord) && (mustWord || alwaysWord)) {
    // Check if it's actual self-negation: "must not X and must X" or "never X and always X"
    const hasSelfNegation = /must not.*must\\b|must\\b.*must not|never.*always|always.*never/i.test(lo);
    return hasSelfNegation ? 0.70 : 0.9997;
  }"""
)

with open('src/coherence_calculus.js', 'w') as f:
    f.write(content)

print('FIXED: D3 temporal (0.0001 hard-block), D5 cognitive (self-negation detection)')
