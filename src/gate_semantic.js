// === GHOST Semantic Gate v1.1 ===
const SEMANTIC_CATEGORIES = {
  animate: ["dog","cat","person","man","woman","child","bird","fish","horse","snake","human","animal","ghost","unicorn","ant","bacteria","dragon","phoenix","wizard","elf","dwarf","troll","fairy","mermaid","vampire","werewolf","zombie","goblin","witch"] ,
  inanimate: ["rock","stone","table","chair","car","book","house","building","tree","plant","door","window","pencil","lamp","mountain","castle","atom"],
  abstract: ["idea","thought","concept","theory","love","hate","joy","sorrow","dream","hope","fear","truth","lie","sincerity","coherence","memory","empire"],
  food: ["apple","sandwich","pizza","cake","bread","meat","fruit","vegetable"],
  liquid: ["water","milk","juice","coffee","tea","wine","beer","oil"],
  celestial: ["sun","moon","star","stars","planet","galaxy","universe","cloud"],
  body: ["hand","foot","eye","ear","nose","mouth","heart","brain","arm","leg"],
  weather: ["rain","snow","thunder","lightning","hurricane","tornado","fog","mist","dew"],
  tool: ["hammer","saw","knife","spoon","fork","phone","computer","pen","brush","scissors"],
};
const POETIC_SUBJECTS = ["sun","moon","star","stars","galaxy","universe","hope","love","fear","dream","joy","sorrow","wind","river","fire","storm","shadow","silence","mountain"];
const VERB_FRAMES = {
  "eat":{requires:["animate"],blocks:["abstract"]},
  "run":{requires:["animate"],blocks:[]},
  "think":{requires:["animate"],blocks:[]},
  "speak":{requires:["animate"],blocks:[]},
  "sleep":{requires:["animate"],blocks:[]},
  "breathe":{requires:["animate"],blocks:[]},
  "read":{requires:["animate"],blocks:[]},
  "write":{requires:["animate"],blocks:[]},
  "love":{requires:["animate"],blocks:[]},
  "hate":{requires:["animate"],blocks:[]},
  "whisper":{requires:["animate"],blocks:[]},
  "measure":{requires:["animate"],blocks:[]},
  "validate":{requires:["animate"],blocks:[]},
  "process":{requires:["animate"],blocks:[]},
  "break":{requires:[],blocks:[]},
  "melt":{requires:[],blocks:["abstract"]},
  "fall":{requires:[],blocks:["abstract"]},
  "roll":{requires:[],blocks:["abstract"]},
  "float":{requires:[],blocks:["abstract"]},
  "shine":{requires:["celestial","inanimate","weather"],blocks:[]},
  "orbit":{requires:["celestial"],blocks:[]},
  "haunt":{requires:["animate","abstract"],blocks:[]},
  "dance":{requires:["animate"],blocks:[]},
  "sing":{requires:["animate"],blocks:[]},
  "fly":{requires:["animate","celestial"],blocks:[]},
  "bark":{requires:["animate"],blocks:[]},
  "drive":{requires:["animate"],blocks:[]},
  "lift":{requires:["animate"],blocks:[]},
  "conquer":{requires:["animate"],blocks:[]},
  "destroy":{requires:[],blocks:[]},
  "happen":{requires:[],blocks:[]},
  "watch":{requires:["animate"],blocks:[]},
  "rage":{requires:[],blocks:[]},
  "follow":{requires:[],blocks:[]},
  "fade":{requires:[],blocks:[]},
  "rise":{requires:[],blocks:[]},
  "cast":{requires:["animate"],blocks:[]},
  "stand":{requires:[],blocks:[]},
  "swim":{requires:["animate"],blocks:[]},
  "build":{requires:["animate"],blocks:[]},
  "cut":{requires:["animate"],blocks:[]},
  "paint":{requires:["animate"],blocks:[]},
  "draw":{requires:["animate"],blocks:[]},
  "cook":{requires:["animate"],blocks:[]},
  "clean":{requires:["animate"],blocks:[]},
  "wash":{requires:["animate"],blocks:[]},
  "open":{requires:["animate"],blocks:[]},
  "close":{requires:["animate"],blocks:[]},
  "throw":{requires:["animate"],blocks:[]},
  "catch":{requires:["animate"],blocks:[]},
  "kick":{requires:["animate"],blocks:[]},
  "hit":{requires:["animate"],blocks:[]},
  "push":{requires:["animate"],blocks:[]},
  "pull":{requires:["animate"],blocks:[]},
  "dream":{requires:["animate"],blocks:[]},
  "walk":{requires:["animate"],blocks:[]},
  "hide":{requires:["animate"],blocks:[]},
  "bite":{requires:["animate"],blocks:[]},
  "howl":{requires:["animate"],blocks:[]},
  "steal":{requires:["animate"],blocks:[]},
  "rumble":{requires:[],blocks:[]},
  "strike":{requires:[],blocks:[]},
  "blow":{requires:[],blocks:[]}
};
const NONSENSE_PATTERNS = [
  "colorless green ideas",
  "sleep furiously",
  "square circle",
  "square triangles",
  "married bachelor",
  "invisible pink unicorn"
];
const CONTRADICTION_PAIRS = [
  ["alive","dead"],["open","closed"],["hot","cold"],["always","never"],
  ["all","none"],["everyone","noone"],["everything","nothing"],["true","false"],
  ["present","absent"],["yesterday","tomorrow"],["future","happened"],["past","future"],["few","many"],["little","much"],["up","down"],["in","out"],["above","below"],["before","after"],["inside","outside"]
];
const SCALE_RANK = {
  small:["ant","bacteria","atom","molecule","cell","grain","speck","dust"],
  medium:["person","man","woman","child","dog","cat","car","house","tree","book","rock"],
  large:["elephant","whale","mountain","galaxy","empire","universe","planet","ocean","continent"]
};
function tokenizeWords(t){return t.toLowerCase().replace(/[.,;:!?]/g,"").split(/\s+/).filter(w=>w.length>0);}
function getCategory(w){for(const[c,ws]of Object.entries(SEMANTIC_CATEGORIES))if(ws.includes(w))return c;return null;}
function getScale(w){for(const[r,ws]of Object.entries(SCALE_RANK))if(ws.includes(w))return r;return null;}
function getVerbFrame(w){
  if(VERB_FRAMES[w])return VERB_FRAMES[w];
  const c=[w.replace(/es$/,"e"),w.replace(/s$/,""),w.replace(/ed$/,""),w.replace(/ing$/,"")];
  for(const x of c)if(VERB_FRAMES[x])return VERB_FRAMES[x];
  const i={ate:"eat",ran:"run",thought:"think",spoke:"speak",slept:"sleep",breathed:"breathe",wrote:"write",loved:"love",hated:"hate",whispered:"whisper",measured:"measure",validated:"validate",processed:"process",broke:"break",melted:"melt",fell:"fall",rolled:"roll",floated:"float",shone:"shine",orbited:"orbit",haunted:"haunt",danced:"dance",sang:"sing",flew:"fly",barked:"bark",flies:"fly",swims:"swim",drives:"drive",lifted:"lift",conquered:"conquer",destroyed:"destroy",happened:"happen",watches:"watch",raged:"rage",followed:"follow",faded:"fade",rose:"rise",casts:"cast",stood:"stand",swam:"swim",built:"build",washes:"wash",catches:"catch",pushes:"push",drew:"draw",throws:"throw",caught:"catch",dreamed:"dream",dreamt:"dream",walked:"walk",hid:"hide",stole:"steal",blew:"blow"};
  if(i[w])return VERB_FRAMES[i[w]];
  return null;
}
function checkNonsense(ws){const t=ws.join(" ");for(const p of NONSENSE_PATTERNS)if(t.includes(p))return{type:"semantic_nonsense",detail:p};return null;}
function checkCategoryViolation(ws){
  for(let i=0;i<ws.length;i++){
    const v=ws[i],f=getVerbFrame(v);if(!f)continue;
    let sc=null;for(let j=i-1;j>=0&&j>=i-8;j--){sc=getCategory(ws[j]);if(sc)break;}
    let oc=null;for(let j=i+1;j<ws.length&&j<=i+8;j++){oc=getCategory(ws[j]);if(oc)break;}
    if(sc&&f.requires.length>0&&!f.requires.includes(sc)){
      let ip=false;for(let j=i-1;j>=0&&j>=i-8;j--){if(POETIC_SUBJECTS.includes(ws[j])){ip=true;break;}}
      if(!ip)return{type:"category_violation",detail:sc+" subject with \""+v+"\""};
    }
    if(oc&&f.blocks.length>0&&f.blocks.includes(oc))return{type:"category_violation",detail:oc+" object with \""+v+"\""};
  }
  return null;
}
function checkContradiction(ws){const s=new Set(ws);for(const[a,b]of CONTRADICTION_PAIRS)if(s.has(a)&&s.has(b))return{type:"contradiction",detail:a+" + "+b};return null;}
function checkScaleViolation(ws){
  const pv=["lift","lifts","lifted","lifting","conquer","conquers","conquered","conquering","destroy","destroys","destroyed","destroying","move","moves","moved","moving","carry","carries","carried","carrying"];
  for(let i=0;i<ws.length;i++){
    if(!pv.includes(ws[i]))continue;
    let ss=null;for(let j=i-1;j>=0&&j>=i-8;j--){ss=getScale(ws[j]);if(ss)break;}
    let os=null;for(let j=i+1;j<ws.length&&j<=i+8;j++){os=getScale(ws[j]);if(os)break;}
    if(ss==="small"&&os==="large")return{type:"scale_violation",detail:ws[i]+" by "+ss+" on "+os};
  }
  return null;
}
function gateSemantic(t){
  const v=[],w=tokenizeWords(t);
  const n=checkNonsense(w);if(n)v.push(n);
  const c=checkCategoryViolation(w);if(c)v.push(c);
  const x=checkContradiction(w);if(x)v.push(x);
  const s=checkScaleViolation(w);if(s)v.push(s);
  const p=v.length===0;
  return{passed:p,violations:v,score:parseFloat((p?1.0:Math.max(0,1.0-v.length*0.25)).toFixed(4)),details:{wordCount:w.length,tokens:w}};
}
module.exports={gateSemantic,tokenizeWords,getCategory,getScale,getVerbFrame,SEMANTIC_CATEGORIES,VERB_FRAMES,NONSENSE_PATTERNS,POETIC_SUBJECTS,SCALE_RANK};
