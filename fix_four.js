const fs = require('fs');
const p = './src/gate_syntactic.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');

function findFunction(name) {
  const start = lines.findIndex(l => l.includes(`function ${name}`));
  if (start === -1) return null;
  let depth = 0, end = start;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') depth++; if (ch === '}') depth--; }
    if (depth === 0 && i > start) { end = i; break; }
  }
  return { start, end };
}

// 1. Fix isImperativeSentence: handle "Please" prefix
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
  return true;
}`;
  lines.splice(imp.start, imp.end - imp.start + 1, newFn);
}

// 2. Fix checkPunctuationBalance: add single-quote check (only at word boundaries, not apostrophes inside words)
const pb = findFunction('checkPunctuationBalance');
if (pb) {
  const newFn = `function checkPunctuationBalance(text) {
  if (!text) return true;
  const counts = {};
  for (const ch of text) { counts[ch] = (counts[ch] || 0) + 1; }
  const pairs = [['(', ')'], ['[', ']'], ['{', '}'], ['"', '"']];
  for (const [o, c] of pairs) {
    if ((counts[o] || 0) !== (counts[c] || 0)) return false;
  }
  // Single quotes: count only standalone quotes (not apostrophes in contractions)
  // Simple heuristic: count all ' that appear after space/start or before space/end/punct
  let singleQuotes = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === \"'\") {
      const prev = text[i - 1] || ' ';
      const next = text[i + 1] || ' ';
      if (prev === ' ' || prev === '\"' || next === ' ' || next === '.' || next === ',' || next === '!' || next === '?') {
        singleQuotes++;
      }
    }
  }
  if (singleQuotes % 2 !== 0) return false;
  return true;
}`;
  lines.splice(pb.start, pb.end - pb.start + 1, newFn);
}

// 3. Fix hasSubject: add first-noun detection for adjective chains
const hs = findFunction('hasSubject');
if (hs) {
  const newFn = `function hasSubject(words) {
  if (!words || words.length === 0) return { found: false };
  for (let i = 0; i < words.length; i++) {
    if (SUBJECT_PRONOUNS.has(words[i])) {
      return { found: true, type: 'pronoun', index: i };
    }
  }
  for (let i = 0; i < words.length - 1; i++) {
    if (DETERMINERS.has(words[i])) {
      for (let j = i + 1; j < words.length; j++) {
        const w = words[j];
        if (INTENSIFIERS.has(w)) continue;
        if (!DETERMINERS.has(w) && !ALL_VERBS.has(w) &&
            !SUBJECT_PRONOUNS.has(w) && !PREPOSITIONS.has(w) &&
            !CONJUNCTIONS.has(w)) {
          return { found: true, type: 'noun_phrase', index: i };
        }
        break;
      }
    }
  }
  const first = words[0];
  if (first && COMMON_NOUNS.has(first) && !ALL_VERBS.has(first)) {
    return { found: true, type: 'bare_noun', index: 0 };
  }
  if (first && first.endsWith('ing') && words.length > 1) {
    return { found: true, type: 'gerund', index: 0 };
  }
  if (first === 'to' && words.length > 1) {
    return { found: true, type: 'infinitive', index: 0 };
  }
  // NEW: First noun anywhere before first verb (handles adjective chains)
  const firstVerbIdx = words.findIndex(w => ALL_VERBS.has(w) && !MODAL_VERBS.has(w));
  const searchLimit = firstVerbIdx === -1 ? words.length : firstVerbIdx;
  for (let i = 0; i < searchLimit; i++) {
    if (COMMON_NOUNS.has(words[i]) && !ALL_VERBS.has(words[i])) {
      return { found: true, type: 'noun_chain', index: i };
    }
  }
  const thereIdx = words.indexOf('there');
  if (thereIdx !== -1 && thereIdx < words.length - 1 && BE_VERBS.has(words[thereIdx + 1])) {
    return { found: true, type: 'existential', index: thereIdx };
  }
  return { found: false };
}`;
  lines.splice(hs.start, hs.end - hs.start + 1, newFn);
}

// 4. Fix checkWordOrder: detect verb piles (4+ consecutive verbs after subject)
const wo = findFunction('checkWordOrder');
if (wo) {
  // Insert verb-pile detection before the final return
  const finalReturn = lines.findIndex((l, i) => i > wo.start && l.trim() === 'return { scrambled: false };');
  if (finalReturn !== -1) {
    const pileCheck = [
      '  // DETECT: Verb pile — 4+ consecutive verbs after subject',
      '  if (subjInfo.found && subjInfo.index !== -1) {',
      '    let consecutiveVerbs = 0;',
      '    for (let i = subjInfo.index + 1; i < words.length; i++) {',
      '      if (ALL_VERBS.has(words[i])) {',
      '        consecutiveVerbs++;',
      '        if (consecutiveVerbs >= 4) return { scrambled: true, reason: \'verb_pile\' };',
      '      } else if (!INTENSIFIERS.has(words[i]) && words[i] !== \'not\') {',
      '        consecutiveVerbs = 0;',
      '      }',
      '    }',
      '  }',
      ''
    ];
    lines.splice(finalReturn, 0, ...pileCheck);
  }
}

fs.writeFileSync(p, lines.join('\n'));
console.log('Fix-4 applied');
