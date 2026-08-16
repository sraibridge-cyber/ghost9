const fs = require('fs');
const p = './src/gate_syntactic.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const isImperative = COMMON_VERBS.includes(firstWord) || firstWord === "be"')) {
    lines[i] = '    const isImperative = (COMMON_VERBS.includes(firstWord) && !firstWord.endsWith("s") && !firstWord.endsWith("ed") && !firstWord.endsWith("ing")) || firstWord === "be" || firstWord === "do" || firstWord === "have";';
    console.log('Fixed imperative check at line ' + (i + 1));
    break;
  }
}
fs.writeFileSync(p, lines.join('\n'));
console.log('Done');
