#!/usr/bin/env python3

with open('src/coherence_calculus.js', 'r') as f:
    lines = f.readlines()

# Find and replace the entire TEMPORAL_CONFLICTS array (lines 37-46 approximately)
new_lines = []
in_array = False
skip_until = -1

for i, line in enumerate(lines):
    if 'const TEMPORAL_CONFLICTS = [' in line:
        # Start replacement
        new_lines.append("const TEMPORAL_CONFLICTS = [\n")
        new_lines.append("  ['online','offline'],['running','stopped'],['active','inactive'],\n")
        new_lines.append("  ['started','halted'],['started','stopped'],['live','dead'],['up','down']\n")
        new_lines.append("];\n")
        in_array = True
        continue
    if in_array:
        if '];' in line and 'TEMPORAL_CONFLICTS' not in line:
            in_array = False
            continue
        if 'function ' in line and not in_array:
            in_array = False
        # Skip all lines until we exit the array
        if line.strip().startswith('function ') or line.strip().startswith('function whitlock'):
            in_array = False
            new_lines.append(line)
            continue
        continue
    new_lines.append(line)

with open('src/coherence_calculus.js', 'w') as f:
    f.writelines(new_lines)

print('CLEANED: TEMPORAL_CONFLICTS array deduplicated, time markers removed')
