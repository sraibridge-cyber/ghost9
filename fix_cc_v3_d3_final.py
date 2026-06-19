#!/usr/bin/env python3

with open('src/coherence_calculus.js', 'r') as f:
    content = f.read()

# Fix D3: Only hard-block for contradictory STATE pairs, not time markers
# Time markers (yesterday/tomorrow, before/after) = narrative context → 0.9997
# Opposite states (online/offline, running/stopped) = contradiction → 0.0001

content = content.replace(
    """const TEMPORAL_CONFLICTS = [
  ['yesterday','tomorrow'],['before','after'],['past','future'],
  ['last week','next week'],['ago','from now'],
  ['earlier','later'],['previously','upcoming'],
  ['online','offline'],['running','stopped'],['active','inactive'],
  ['started','halted'],['started','stopped'],['live','dead'],['up','down'],""",
    """const TEMPORAL_CONFLICTS = [
  ['online','offline'],['running','stopped'],['active','inactive'],
  ['started','halted'],['started','stopped'],['live','dead'],['up','down'],"""
)

with open('src/coherence_calculus.js', 'w') as f:
    f.write(content)

print('FIXED: D3 final — only opposite state pairs hard-block, time markers = narrative')
