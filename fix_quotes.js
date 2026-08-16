const fs = require('fs');
const p = './src/gate_syntactic.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const pairs = [['(', ')'], ['[', ']'], ['{', '}'], ['\"', '\"']]")) {
    lines[i] = "  const pairs = [['(', ')'], ['[', ']'], ['{', '}']];";
    lines.splice(i + 1, 0, "  if ((counts['\"'] || 0) % 2 !== 0) return false;");
    console.log('Fixed quote balance at line ' + (i + 1));
    break;
  }
}
fs.writeFileSync(p, lines.join('\n'));
console.log('Done');
