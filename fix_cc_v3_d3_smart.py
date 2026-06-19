#!/usr/bin/env python3

with open('src/coherence_calculus.js', 'r') as f:
    content = f.read()

# Fix D3: Only hard-block for contradictory state pairs, not narrative past/future
# "was active... will be running" = narrative (same state implied) → 0.9997
# "was online... is offline" = contradiction (opposite states) → 0.0001

content = content.replace(
    """const TEMPORAL_CONFLICTS = [
  ['was','will be'],['was','is'],['were','are'],
  ['yesterday','tomorrow'],['before','after'],['past','future'],
  ['last week','next week'],['ago','from now'],
  ['earlier','later'],['previously','upcoming'],
  ['online','offline'],['running','stopped'],['active','inactive'],
  ['started','halted'],['started','stopped'],['live','dead'],['up','down'],""",
    """const TEMPORAL_CONFLICTS = [
  ['yesterday','tomorrow'],['before','after'],['past','future'],
  ['last week','next week'],['ago','from now'],
  ['earlier','later'],['previously','upcoming'],
  ['online','offline'],['running','stopped'],['active','inactive'],
  ['started','halted'],['started','stopped'],['live','dead'],['up','down'],"""
)

# Also fix D5: "must always... Never bypass" is agreement, not self-negation
# Self-negation requires the SAME action to be both mandated and forbidden
# "must verify... Never bypass" = two different actions = agreement

content = content.replace(
    """    const hasSelfNegation = /must not.*must\\b|must\\b.*must not|never.*always|always.*never/i.test(lo);
    return hasSelfNegation ? 0.70 : 0.9997;""",
    """    const hasSelfNegation = /must not\\b.*\\bmust\\b.*\\b(same|this|it)|\\bdo\\b.*\\bnot\\b.*\\bdo\\b/i.test(lo);
    return hasSelfNegation ? 0.70 : 0.9997;"""
)

with open('src/coherence_calculus.js', 'w') as f:
    f.write(content)

print('FIXED: D3 smart (only opposite states), D5 smarter (same-action self-negation)')
