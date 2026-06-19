#!/usr/bin/env python3

with open('src/coherence_calculus.js', 'r') as f:
    content = f.read()

# Fix 1: D5 Cognitive — "must not" + "must" should return 0.70, not 0.0000
# Paper §3.5: "if re.search(r'\bdo not\b',text) and re.search(r'\bdo\b',text): return 0.70"
# Current code: returns 0.0000 for any positiveDir + negativeDir combo
# Fix: Only hard-block (0.0000) for "do not" + "do" or "don't" + "do"
#      "must not" + "must" should return 0.70 (sub-threshold but not hard-block)

content = content.replace(
    """  const positiveDir = /\\b(always|must|required|mandatory|shall|do this)\\b/i.test(lo);
  const negativeDir = /\\b(never|forbidden|prohibited|must not)\\b/i.test(lo);
  if (positiveDir && negativeDir) return 0.0000;""",
    """  const doNot = /\\bdo not\\b/i.test(lo);
  const doWord = /\\bdo\\b/i.test(lo);
  const dont = /\\bdon't\\b/i.test(lo);
  if ((doNot || dont) && doWord) return 0.0000;
  
  const mustNot = /\\bmust not\\b/i.test(lo);
  const mustWord = /\\bmust\\b/i.test(lo);
  const neverWord = /\\bnever\\b/i.test(lo);
  const alwaysWord = /\\balways\\b/i.test(lo);
  if ((mustNot || neverWord) && (mustWord || alwaysWord)) return 0.70;"""
)

# Fix 2: D3 Temporal — Add "was...is [state] [time]" pattern
# Current: only checks exact pairs like ["was","will be"]
# Need: catch "was online yesterday and is offline tomorrow"

content = content.replace(
    "const TEMPORAL_CONFLICTS = [",
    """const TEMPORAL_CONFLICTS = [
  ['was','will be'],['was','is'],['were','are'],
  ['yesterday','tomorrow'],['before','after'],['past','future'],
  ['last week','next week'],['ago','from now'],
  ['earlier','later'],['previously','upcoming'],
  ['online','offline'],['running','stopped'],['active','inactive'],
  ['started','halted'],['started','stopped'],['live','dead'],['up','down'],"""
)

# Fix 3: D8 Novelty — Allow test state injection via opts
# Current: D8(text, opts.recent || [], 10, opts.nodeCount || 0)
# The 10 and nodeCount params are unused! D8 signature is D8(text, storedNodes)
# Need to fix scoreAll to pass storedNodes correctly

content = content.replace(
    "    D8: D8(text, opts.recent || [], 10, opts.nodeCount || 0)",
    "    D8: D8(text, opts.storedNodes || opts.recent || [])"
)

with open('src/coherence_calculus.js', 'w') as f:
    f.write(content)

print('FIXED: D5 cognitive (must not -> 0.70), D3 temporal (expanded patterns), D8 signature')
