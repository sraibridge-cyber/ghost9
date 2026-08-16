const fs = require('fs');
const p = './src/gate_syntactic.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');

function findFunction(name) {
  const start = lines.findIndex(l => l.includes(`function ${name}`));
  if (start === -1) return null;
  let depth = 0;
  let end = start;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (depth === 0 && i > start) { end = i; break; }
  }
  return { start, end };
}

// 1. Replace hasSubject
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
  const thereIdx = words.indexOf('there');
  if (thereIdx !== -1 && thereIdx < words.length - 1 && BE_VERBS.has(words[thereIdx + 1])) {
    return { found: true, type: 'existential', index: thereIdx };
  }
  return { found: false };
}`;
  lines.splice(hs.start, hs.end - hs.start + 1, newFn);
}

// 2. Replace isImperativeSentence
const imp = findFunction('isImperativeSentence');
if (imp) {
  const newFn = `function isImperativeSentence(words, text) {
  if (!words || words.length === 0) return false;
  const first = words[0];
  if (MODAL_VERBS.has(first)) return false;
  if (first === 'do' && words.length >= 2) {
    if (words[1] === 'not' || ALL_VERBS.has(words[1])) return true;
  }
  if (first === 'be') return true;
  if (first === 'have') return true;
  if (AUXILIARY_VERBS.has(first)) return false;
  if (!ALL_VERBS.has(first)) return false;
  return true;
}`;
  lines.splice(imp.start, imp.end - imp.start + 1, newFn);
}

// 3. Replace checkDoubleDeterminer
const dd = findFunction('checkDoubleDeterminer');
if (dd) {
  const newFn = `function checkDoubleDeterminer(words) {
  if (!words || words.length < 2) return false;
  for (let i = 0; i < words.length - 1; i++) {
    if (DETERMINERS.has(words[i]) && DETERMINERS.has(words[i + 1])) {
      if (words[i] === 'what' && words[i + 1] === 'a') continue;
      if (words[i] === 'which' && words[i + 1] === 'one') continue;
      const validPredets = ['all','both','half','double'];
      const validSeconds = ['the','a','an','this','that','these','those','my','your','his','her','its','our','their','some','any','no','every','each'];
      if (validPredets.includes(words[i]) && validSeconds.includes(words[i + 1])) continue;
      return true;
    }
  }
  return false;
}`;
  lines.splice(dd.start, dd.end - dd.start + 1, newFn);
}

// 4. Add missing verbs
const yellLine = lines.findIndex(l => l.includes("yell: ['yell','yells','yelled','yelling']"));
if (yellLine !== -1 && !lines.some(l => l.includes("pass: ['pass"))) {
  lines[yellLine] = "  yell: ['yell','yells','yelled','yelling'],\n  pass: ['pass','passes','passed','passing'],\n  rain: ['rain','rains','rained','raining']";
}

// 5. Add 'well' to interjections
const intLine = lines.findIndex(l => l.includes("'hi','hello','hey'"));
if (intLine !== -1 && !lines[intLine].includes("'well'")) {
  lines[intLine] = lines[intLine].replace("'hi','hello','hey'", "'hi','hello','hey','well'");
}

fs.writeFileSync(p, lines.join('\n'));
console.log('Robust patch applied');
