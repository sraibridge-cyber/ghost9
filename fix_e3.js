const fs = require('fs');
const p = './src/gate_syntactic.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Remove the broken brace check from gateSyntactical
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("invalid_braces")) {
    lines.splice(i, 1);
    console.log('Removed broken brace check from line ' + (i + 1));
    break;
  }
}

// Add brace check to checkPunctuationBalance
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function checkPunctuationBalance(text)')) {
    // Find the 'return true;' at the end of the function
    let j = i;
    for (; j < lines.length && !lines[j].includes('return true;'); j++) {}
    if (j < lines.length) {
      lines.splice(j, 0, "  if (text.includes('{') || text.includes('}')) return false;");
      console.log('Added brace check to checkPunctuationBalance at line ' + (j + 1));
    }
    break;
  }
}

fs.writeFileSync(p, lines.join('\n'));
console.log('Done');
