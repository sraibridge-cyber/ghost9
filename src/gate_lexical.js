// gate_lexical.js v2.3 — Lexical validity gate
// CSS Labs | Kyle S. Whitlock
// Scope: "Is every word a real English word?" Harm is checked by later gates, not here.
// v2.3 (2026-10-31): the v2.2 closed list (~3,000 words) missed ordinary words. v2.3 accepts a word if it is a
// function word, a WordNet lemma (noun, verb, adjective, adverb), an inflection of one, or a listed modern term.
// Seal: 2026-07-11_12:15_Tulsa_OK (v2.2 provenance; v2.3 needs re-sealing)

const fs = require('fs');
const path = require('path');
const wn = require('./wordnet');

const FUNCTION = new Set(('i me my mine myself we us our ours ourselves you your yours yourself yourselves he him his himself she her hers herself it its itself they them their theirs themselves ' +
  'this that these those who whom whose which what whatever whoever anyone anybody everyone everybody someone somebody nobody no none nothing something everything anything nowhere somewhere everywhere anywhere ' +
  'a an the and or but nor so yet for because although though while if unless until whether than then when where why how as at by from in into of off on onto out over under up down with without within ' +
  'to about above below between among through during before after against across along around behind beyond near upon via per ' +
  'be is am are was were been being do does did doing done have has had having will would shall should can could may might must ought ' +
  'not also just only very too more most less least all any some each every both either neither few many much several such own same other another ' +
  'there here now once again ever never still even yes ok okay ' +
  'll re ve d m s t don doesn didn isn aren wasn weren won wouldn shouldn couldn haven hasn hadn let').split(/\s+/));

const EXCEPTIONS = { told:'tell', had:'have', did:'do', said:'say', made:'make', went:'go', came:'come', took:'take', got:'get', gave:'give', found:'find', thought:'think', knew:'know', felt:'feel', kept:'keep', left:'leave', meant:'mean', ran:'run', sent:'send', wrote:'write', began:'begin', broke:'break', spoke:'speak', chose:'choose', drove:'drive', ate:'eat', fell:'fall', hid:'hide', bit:'bite', led:'lead', lost:'lose', paid:'pay', held:'hold', heard:'hear', built:'build', sold:'sell', caught:'catch', taught:'teach', brought:'bring', bought:'buy', fought:'fight', threw:'throw', grew:'grow', drew:'draw', flew:'fly', wore:'wear', tore:'tear', swore:'swear', rode:'ride', shook:'shake', sang:'sing', stole:'steal', froze:'freeze', woke:'wake', stood:'stand', understood:'understand', became:'become', forgot:'forget', forgave:'forgive', sat:'sit', slept:'sleep', swept:'sweep', wept:'weep', dug:'dig', hung:'hang', spun:'spin', won:'win', shot:'shoot', lit:'light', bled:'bleed', fed:'feed', bred:'breed', met:'meet', dealt:'deal', dreamt:'dream', leapt:'leap', knelt:'kneel', shut:'shut', put:'put', cut:'cut', hit:'hit', hurt:'hurt', set:'set', let:'let', spread:'spread', cast:'cast', burst:'burst', better:'good', worse:'bad', worst:'bad', best:'good', children:'child', men:'man', women:'woman', people:'person', feet:'foot', teeth:'tooth', mice:'mouse', lives:'life', wives:'wife', knives:'knife', leaves:'leaf', halves:'half' };

const MODERN = new Set(['inbox','email','emails','online','username','password','passwords','login','wifi','bitcoin','crypto','cryptocurrency','emoji','selfie','covid','app','apps','website','websites','smartphone','sms','text','texts','dm','dms','hashtag','unfollow','blog','podcast','streamer','livestream','screenshot','screenshots','upload','uploads','download','downloads','voicemail','chatbot','hacker','hackers','hacked','phishing','spam','scammer','scammers','subscription','subscriptions','invoice','invoices','refund','refunds','transfer','transfers','wire','wires','prize','prizes']);

const extPath = path.join(__dirname, 'gate_lexical_words.json');
let EXT = new Set();
try { if (fs.existsSync(extPath)) EXT = new Set(JSON.parse(fs.readFileSync(extPath, 'utf8')).map(w => String(w).toLowerCase())); } catch (e) { EXT = new Set(); }

const cache = new Map();
function inWordNet(lemma) {
  if (cache.has(lemma)) return cache.get(lemma);
  let ok = false;
  for (const pos of ['n', 'v', 'a', 'r']) {
    try { if (wn.synsets(lemma, pos).length) { ok = true; break; } } catch (e) { /* missing lemma or DB */ }
  }
  cache.set(lemma, ok);
  return ok;
}

function lemmaCandidates(w) {
  const c = new Set();
  if (EXCEPTIONS[w]) c.add(EXCEPTIONS[w]);
  if (w.endsWith('ies') && w.length > 4) c.add(w.slice(0, -3) + 'y');
  if (w.endsWith('ied') && w.length > 4) c.add(w.slice(0, -3) + 'y');
  if (w.endsWith('es') && w.length > 3) c.add(w.slice(0, -2));
  if (w.endsWith('s') && w.length > 2) c.add(w.slice(0, -1));
  if (w.endsWith('ed') && w.length > 3) {
    const s = w.slice(0, -2); c.add(s); c.add(s + 'e'); c.add(w.slice(0, -1));
    if (/([bdgklmnprt])\1$/.test(s)) c.add(s.slice(0, -1));
  }
  if (w.endsWith('ing') && w.length > 4) {
    const s = w.slice(0, -3); c.add(s); c.add(s + 'e');
    if (/([bdgklmnprt])\1$/.test(s)) c.add(s.slice(0, -1));
  }
  if (w.endsWith('ly') && w.length > 3) c.add(w.slice(0, -2));
  if (w.endsWith('er') && w.length > 3) { c.add(w.slice(0, -2)); c.add(w.slice(0, -1)); }
  if (w.endsWith('est') && w.length > 4) { c.add(w.slice(0, -3)); c.add(w.slice(0, -2)); }
  if (w.endsWith('ness') && w.length > 5) c.add(w.slice(0, -4));
  if (w.endsWith('ment') && w.length > 5) c.add(w.slice(0, -4));
  return [...c];
}

function isValidWord(w) {
  if (FUNCTION.has(w) || MODERN.has(w) || EXT.has(w)) return true;
  if (w.length < 2) return false;
  if (inWordNet(w)) return true;
  return lemmaCandidates(w).some(l => l.length > 1 && inWordNet(l));
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z]+/g) || []);
}

function scanLexical(text) {
  const words = tokenize(text);
  if (words.length === 0) {
    return { pass: false, gate: 'lexical', reason: 'no_words_found', checked: 0, unknown: [] };
  }
  const unknown = [...new Set(words.filter(w => !isValidWord(w)))];
  return {
    pass: unknown.length === 0,
    gate: 'lexical',
    reason: unknown.length === 0 ? 'all_words_valid' : 'unknown_words_found',
    checked: words.length,
    unknown
  };
}

module.exports = { scanLexical, tokenize, isValidWord, wordCount: FUNCTION.size + MODERN.size + EXT.size, FUNCTION, MODERN, EXT };
