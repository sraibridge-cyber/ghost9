const fs = require('fs');
const p = './src/gate_syntactic.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// 1. Infinitive + compound noun subject in hasSubject
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("words[0].endsWith('ing')")) {
    lines.splice(i + 1, 0,
      '  // Infinitive subject: "To learn is good."',
      '  for (let i = 0; i < words.length - 1; i++) {',
      '    if (words[i].toLowerCase() === \'to\' && ALL_VERBS.includes(words[i + 1].toLowerCase())) return true;',
      '  }',
      '  // Compound noun subject: "Quantum foam whispers secrets."',
      '  if (words.length >= 3 && /^[A-Z]/.test(words[0]) && words[1] && words[1].toLowerCase() === words[1] && !ALL_VERBS.includes(words[1].toLowerCase()) && ALL_VERBS.includes(words[2].toLowerCase())) return true;'
    );
    console.log('Added subject checks after line ' + (i + 1));
    break;
  }
}

// 2. Fragment detection in gateSyntactical
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("violations.push({ type: 'missing_verb' })")) {
    lines.splice(i + 1, 0,
      "  // Fragment: 'Meeting at 14:30.'",
      "  if (/^[A-Z][a-z]+ at \\d{1,2}:\\d{2}\\.?$/.test(trimmed)) { violations.push({ type: 'fragment' }); }"
    );
    console.log('Added fragment check after line ' + (i + 1));
    break;
  }
}

// 3. Verb pile detection in gateSyntactical
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const passed = violations.length === 0;')) {
    lines.splice(i, 0,
      '  // Verb pile: 3+ consecutive lexical verbs',
      '  let cv = 0;',
      '  for (const w of words) {',
      '    const wl = w.toLowerCase();',
      '    if (ALL_VERBS.includes(wl) && !MODAL_VERBS.includes(wl) && !AUXILIARY_VERBS.includes(wl) && !BE_VERBS.includes(wl)) {',
      '      if (++cv >= 3) { violations.push({ type: \'verb_pile\' }); break; }',
      '    } else if (!INTENSIFIERS.includes(wl) && wl !== \'not\') {',
      '      cv = 0;',
      '    }',
      '  }'
    );
    console.log('Added verb pile check before line ' + (i + 1));
    break;
  }
}

fs.writeFileSync(p, lines.join('\n'));
console.log('All core fixes applied');
