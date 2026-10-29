const fs = require('fs');
const p = './src/gate_syntactic.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Find LAST occurrence (handles appended overrides)
function findFunction(name) {
  let start = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('function ' + name)) { start = i; break; }
  }
  if (start === -1) return null;
  let depth = 0, end = start;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') depth++; if (ch === '}') depth--; }
    if (depth === 0 && i > start) { end = i; break; }
  }
  return { start, end };
}

// 1. Fix checkPunctuationBalance — BUG: ['"','"'] compares same key, always passes
const pb = findFunction('checkPunctuationBalance');
if (pb) {
  const newFn = `function checkPunctuationBalance(text) {
  if (!text) return true;
  const counts = {};
  for (const ch of text) { counts[ch] = (counts[ch] || 0) + 1; }
  const pairs = [['(', ')'], ['[', ']'], ['{', '}']];
  for (const [o, c] of pairs) {
    if ((counts[o] || 0) !== (counts[c] || 0)) return false;
  }
  if ((counts['"'] || 0) % 2 !== 0) return false;
  let singleQuotes = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "'") {
      const prev = text[i - 1] || ' ';
      const next = text[i + 1] || ' ';
      if (prev === ' ' || prev === '"' || next === ' ' || next === '.' || next === ',' || next === '!' || next === '?' || next === undefined) {
        singleQuotes++;
      }
    }
  }
  if (singleQuotes % 2 !== 0) return false;
  return true;
}`;
  lines.splice(pb.start, pb.end - pb.start + 1, newFn);
}

// 2. Fix isImperativeSentence — reject verb piles, allow 'get'
const imp = findFunction('isImperativeSentence');
if (imp) {
  const newFn = `function isImperativeSentence(words, text) {
  if (!words || words.length === 0) return false;
  let first = words[0];
  let offset = 0;
  if (first === 'please') {
    if (words.length < 2) return false;
    first = words[1];
    offset = 1;
  }
  if (MODAL_VERBS.has(first)) return false;
  if (first === 'do' && words.length >= 2 + offset) {
    if (words[1 + offset] === 'not' || ALL_VERBS.has(words[1 + offset])) return true;
  }
  if (first === 'be') return true;
  if (first === 'have') return true;
  if (AUXILIARY_VERBS.has(first)) return false;
  if (!ALL_VERBS.has(first)) return false;
  // Reject verb piles: 2+ consecutive verbs at start (e.g. "Run walk jump.")
  if (words.length >= 2 + offset && ALL_VERBS.has(words[1 + offset]) && !MODAL_VERBS.has(words[1 + offset]) && !AUXILIARY_VERBS.has(words[1 + offset])) {
    return false;
  }
  return true;
}`;
  lines.splice(imp.start, imp.end - imp.start + 1, newFn);
}

// 3. Fix checkWordOrder — catch VSO, Adv-V-S, and verb piles
const wo = findFunction('checkWordOrder');
if (wo) {
  const newFn = `function checkWordOrder(words) {
  if (!words || words.length < 2) return { scrambled: false };
  const subjInfo = hasSubject(words);
  if (!subjInfo.found) return { scrambled: false };
  const subjIdx = subjInfo.index;
  let firstVerbIdx = -1;
  for (let i = 0; i < words.length; i++) {
    if (ALL_VERBS.has(words[i]) && !MODAL_VERBS.has(words[i])) {
      firstVerbIdx = i;
      break;
    }
  }
  if (firstVerbIdx !== -1 && firstVerbIdx < subjIdx) {
    return { scrambled: true, reason: 'verb_before_subject' };
  }
  let consecutiveVerbs = 0;
  for (let i = subjIdx + 1; i < words.length; i++) {
    if (ALL_VERBS.has(words[i]) && !MODAL_VERBS.has(words[i])) {
      consecutiveVerbs++;
      if (consecutiveVerbs >= 3) return { scrambled: true, reason: 'verb_pile' };
    } else if (!INTENSIFIERS.has(words[i]) && words[i] !== 'not' && !CONJUNCTIONS.has(words[i])) {
      consecutiveVerbs = 0;
    }
  }
  return { scrambled: false };
}`;
  lines.splice(wo.start, wo.end - wo.start + 1, newFn);
}

fs.writeFileSync(p, lines.join('\n'));
console.log('Surgery complete');
