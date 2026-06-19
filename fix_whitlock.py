#!/usr/bin/env python3

with open('test_whitlock.js', 'r') as f:
    content = f.read()

# Fix: The record() function stores the function literal, not the result
# Need to execute the check and store the boolean result
content = content.replace(
    "record('n_negative', () => { try { CC.whitlock(-1); return false; } catch(e) { return true; } }, true, (() => { try { CC.whitlock(-1); return false; } catch(e) { return true; } })(), 'negative n error');",
    "const negCheck = (() => { try { CC.whitlock(-1); return false; } catch(e) { return true; } })();\nrecord('n_negative', negCheck, true, negCheck, 'negative n error');"
)

content = content.replace(
    "record('n_string', () => { try { CC.whitlock('5'); return false; } catch(e) { return true; } }, true, (() => { try { CC.whitlock('5'); return false; } catch(e) { return true; } })(), 'string n error');",
    "const strCheck = (() => { try { CC.whitlock('5'); return false; } catch(e) { return true; } })();\nrecord('n_string', strCheck, true, strCheck, 'string n error');"
)

with open('test_whitlock.js', 'w') as f:
    f.write(content)

print('FIXED: 2 test execution patterns corrected')
