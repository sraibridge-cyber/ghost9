// === GHOST Pragmatic Gate v0.1 ===
// Validates discourse coherence across utterances.
// ASSUMES: utterance has passed L, S, and M gates.
// SCOPE: anaphora, temporal sequence, entity consistency,
//        presupposition, discourse markers.

// --- Helpers ---
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[.,;:!?]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 0);
}

function extractNouns(words) {
  // Simple noun extraction after determiners
  const nouns = [];
  const determiners = ["the","a","an","this","that","these","those","my","your","his","her","its","their","our"];
  for (let i = 0; i < words.length - 1; i++) {
    if (determiners.includes(words[i])) {
      nouns.push(words[i + 1]);
    }
  }
  return nouns;
}

function extractProperties(words) {
  // Extract "X is/was/are/were Y" properties
  const props = {};
  const copulas = ["is","was","are","were"];
  for (let i = 1; i < words.length - 1; i++) {
    if (copulas.includes(words[i])) {
      const entity = words[i - 1];
      const prop = words[i + 1];
      if (!props[entity]) props[entity] = [];
      props[entity].push(prop);
    }
  }
  return props;
}

function getContextNouns(context) {
  const all = [];
  for (const utterance of context) {
    all.push(...extractNouns(tokenize(utterance)));
  }
  return all;
}

function getContextProperties(context) {
  const all = {};
  for (const utterance of context) {
    const props = extractProperties(tokenize(utterance));
    for (const [ent, vals] of Object.entries(props)) {
      if (!all[ent]) all[ent] = [];
      all[ent].push(...vals);
    }
  }
  return all;
}

// --- Anaphora Check ---
const PRONOUNS = ["he","she","it","they","him","her","them","his","its","their"];
function checkAnaphora(words, context) {
  const contextNouns = getContextNouns(context);
  if (context.length === 0) {
    // No prior context: any pronoun is a failure
    for (const w of words) {
      if (PRONOUNS.includes(w)) {
        return { type: "anaphora_failure", detail: "Pronoun \"" + w + "\" with no context" };
      }
    }
    return null;
  }
  for (const w of words) {
    if (PRONOUNS.includes(w)) {
      // v0.1: check existence only, not gender/number match
      let found = false;
      for (const noun of contextNouns) {
        // Simple heuristic: pronoun needs ANY prior noun
        found = true;
        break;
      }
      if (!found || contextNouns.length === 0) {
        return { type: "anaphora_failure", detail: "Unresolved pronoun: \"" + w + "\"" };
      }
    }
  }
  return null;
}

// --- Temporal Sequence Check ---
const IMPOSSIBLE_SEQUENCES = [
  ["died","born"], ["died","lived"], ["set","rose"], ["ended","began"],
  ["finished","started"], ["closed","opened"], ["fell","rose"], ["lost","won"],
  ["destroyed","built"], ["forgot","remembered"], ["left","arrived"],
  ["sold","bought"], ["gave","received"]
];
function checkTemporal(words) {
  const text = words.join(" ");
  for (const [a, b] of IMPOSSIBLE_SEQUENCES) {
    const hasA = words.includes(a);
    const hasB = words.includes(b);
    if (hasA && hasB) {
      const idxA = words.indexOf(a);
      const idxB = words.indexOf(b);
      // If a comes before b AND we have a temporal marker
      if (idxA < idxB && (words.includes("then") || words.includes("before") || words.includes("after"))) {
        return { type: "temporal_violation", detail: a + " before " + b };
      }
      // If b comes before a with "already" or "yet" — also suspicious
      if (idxB < idxA && (words.includes("already") || words.includes("yet"))) {
        return { type: "temporal_violation", detail: b + " then " + a + " (reversed causality)" };
      }
    }
  }
  // Check standalone impossibilities
  if (text.includes("yesterday will happen tomorrow")) {
    return { type: "temporal_violation", detail: "Yesterday after tomorrow" };
  }
  if (text.includes("the future already happened")) {
    return { type: "temporal_violation", detail: "Future in past" };
  }
  return null;
}

// --- Entity Consistency Check ---
const CONTRADICTORY_PAIRS = [
  ["alive","dead"], ["open","closed"], ["hot","cold"], ["true","false"],
  ["present","absent"], ["happy","sad"], ["big","small"], ["young","old"],
  ["rich","poor"], ["strong","weak"], ["clean","dirty"], ["fast","slow"],
  ["married","single"], ["awake","asleep"], ["full","empty"], ["tall","short"], ["old","new"], ["tall","short"], ["old","new"]
];
function checkEntityConsistency(words, context) {
  const ctxProps = getContextProperties(context);
  const currentProps = extractProperties(words);
  for (const [entity, props] of Object.entries(currentProps)) {
    if (!ctxProps[entity]) continue;
    for (const prop of props) {
      for (const [a, b] of CONTRADICTORY_PAIRS) {
        if ((prop === a && ctxProps[entity].includes(b)) ||
            (prop === b && ctxProps[entity].includes(a))) {
          return { type: "entity_inconsistency", detail: entity + " is both " + a + " and " + b };
        }
      }
    }
  }
  return null;
}

// --- Presupposition Check ---
function checkPresupposition(words, context) {
  const ctxNouns = getContextNouns(context);
  // Definite "the X" requires prior mention (unless first utterance or global entity)
const GLOBAL_ENTITIES = ["sun","moon","earth","sky","ocean","world","universe","stars","galaxy"];
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === "the") {
      const noun = words[i + 1];
      if (context.length > 0 && !ctxNouns.includes(noun) && !GLOBAL_ENTITIES.includes(noun)) {
        return { type: "presupposition_failure", detail: "The " + noun + " not established" };
      }
    }
  }
  // Possessives "his X", "her X", "its X", "their X"
  const possessives = ["his","her","its","their"];
  for (let i = 0; i < words.length - 1; i++) {
    if (possessives.includes(words[i])) {
      const possessor = words[i];
      // Check if there is ANY prior noun that could be the possessor
      if (context.length === 0 || ctxNouns.length === 0) {
        return { type: "presupposition_failure", detail: "Possessor \"" + possessor + "\" unresolved" };
      }
    }
  }
  return null;
}

// --- Discourse Marker Check ---
function checkDiscourseMarkers(words, context) {
  if (words.length === 0) return null;
  
  // "However" at start needs prior context
  if (words[0] === "however" && context.length === 0) {
    return { type: "discourse_marker_violation", detail: "However without context" };
  }
  // "Therefore" at start needs prior context
  if (words[0] === "therefore" && context.length === 0) {
    return { type: "discourse_marker_violation", detail: "Therefore without context" };
  }
  // "Because" at start without prior claim
  if (words[0] === "because" && context.length === 0) {
    return { type: "discourse_marker_violation", detail: "Because without prior claim" };
  }
  // "Then" at start needs prior event
  if (words[0] === "then" && context.length === 0) {
    return { type: "discourse_marker_violation", detail: "Then without prior event" };
  }
  // "Also" at start needs prior related statement
  if (words[0] === "also" && context.length === 0) {
    return { type: "discourse_marker_violation", detail: "Also without prior statement" };
  }
  
  return null;
}

// --- Main Gate ---
function gatePragmatic(utterance, context) {
  const violations = [];
  const words = tokenize(utterance);
  
  const ana = checkAnaphora(words, context);
  if (ana) violations.push(ana);
  
  const temp = checkTemporal(words);
  if (temp) violations.push(temp);
  
  const ent = checkEntityConsistency(words, context);
  if (ent) violations.push(ent);
  
  const pres = checkPresupposition(words, context);
  if (pres) violations.push(pres);
  
  const disc = checkDiscourseMarkers(words, context);
  if (disc) violations.push(disc);
  
  const passed = violations.length === 0;
  const score = passed ? 1.0 : Math.max(0, 1.0 - violations.length * 0.2);
  
  return {
    passed,
    violations,
    score: parseFloat(score.toFixed(4)),
    details: {
      wordCount: words.length,
      contextLength: context.length,
      tokens: words
    }
  };
}

module.exports = {
  gatePragmatic,
  tokenize,
  extractNouns,
  extractProperties,
  getContextNouns,
  getContextProperties,
  checkAnaphora,
  checkTemporal,
  checkEntityConsistency,
  checkPresupposition,
  checkDiscourseMarkers,
  PRONOUNS,
  IMPOSSIBLE_SEQUENCES,
  CONTRADICTORY_PAIRS
};
