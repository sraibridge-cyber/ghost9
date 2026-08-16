const fs = require('fs');
const p = './src/gate_syntactic.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("violations.push({ type: 'unbalanced_punctuation' })")) {
    lines.splice(i + 1, 0, "  if (trimmed.includes('{') || trimmed.includes('}')) { violations.push({ type: 'invalid_braces' }); }");
    console.log('Added brace check after line ' + (i + 1));
    break;
  }
}
fs.writeFileSync(p, lines.join('\n'));
console.log('Done');
