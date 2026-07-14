// test_gate_lexical.js — 200+ Empirical Battery
// CSS Labs | Kyle S. Whitlock
// Scope: Isolate-test the Lexical Gate v2.2
// Seal: 2026-07-11_12:30_Tulsa_OK

const { scanLexical, tokenize, wordCount } = require('./src/gate_lexical');

let passed = 0;
let failed = 0;
const failures = [];

function assert(name, condition, details) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push({ name, details });
  }
}

// ============================================================
// SECTION 1: BASIC VOCABULARY (Tests 1-40)
// ============================================================

// Test 1-10: Common articles/pronouns
assert('T01: the', scanLexical('the').pass === true, scanLexical('the'));
assert('T02: a', scanLexical('a').pass === true, scanLexical('a'));
assert('T03: an', scanLexical('an').pass === true, scanLexical('an'));
assert('T04: i', scanLexical('i').pass === true, scanLexical('i'));
assert('T05: you', scanLexical('you').pass === true, scanLexical('you'));
assert('T06: he', scanLexical('he').pass === true, scanLexical('he'));
assert('T07: she', scanLexical('she').pass === true, scanLexical('she'));
assert('T08: it', scanLexical('it').pass === true, scanLexical('it'));
assert('T09: we', scanLexical('we').pass === true, scanLexical('we'));
assert('T10: they', scanLexical('they').pass === true, scanLexical('they'));

// Test 11-20: Common verbs
assert('T11: be', scanLexical('be').pass === true, scanLexical('be'));
assert('T12: is', scanLexical('is').pass === true, scanLexical('is'));
assert('T13: are', scanLexical('are').pass === true, scanLexical('are'));
assert('T14: was', scanLexical('was').pass === true, scanLexical('was'));
assert('T15: were', scanLexical('were').pass === true, scanLexical('were'));
assert('T16: have', scanLexical('have').pass === true, scanLexical('have'));
assert('T17: has', scanLexical('has').pass === true, scanLexical('has'));
assert('T18: had', scanLexical('had').pass === true, scanLexical('had'));
assert('T19: do', scanLexical('do').pass === true, scanLexical('do'));
assert('T20: does', scanLexical('does').pass === true, scanLexical('does'));

// Test 21-30: Common nouns
assert('T21: time', scanLexical('time').pass === true, scanLexical('time'));
assert('T22: people', scanLexical('people').pass === true, scanLexical('people'));
assert('T23: way', scanLexical('way').pass === true, scanLexical('way'));
assert('T24: year', scanLexical('year').pass === true, scanLexical('year'));
assert('T25: work', scanLexical('work').pass === true, scanLexical('work'));
assert('T26: day', scanLexical('day').pass === true, scanLexical('day'));
assert('T27: man', scanLexical('man').pass === true, scanLexical('man'));
assert('T28: world', scanLexical('world').pass === true, scanLexical('world'));
assert('T29: life', scanLexical('life').pass === true, scanLexical('life'));
assert('T30: hand', scanLexical('hand').pass === true, scanLexical('hand'));

// Test 31-40: Common adjectives/adverbs
assert('T31: good', scanLexical('good').pass === true, scanLexical('good'));
assert('T32: new', scanLexical('new').pass === true, scanLexical('new'));
assert('T33: first', scanLexical('first').pass === true, scanLexical('first'));
assert('T34: last', scanLexical('last').pass === true, scanLexical('last'));
assert('T35: long', scanLexical('long').pass === true, scanLexical('long'));
assert('T36: great', scanLexical('great').pass === true, scanLexical('great'));
assert('T37: little', scanLexical('little').pass === true, scanLexical('little'));
assert('T38: own', scanLexical('own').pass === true, scanLexical('own'));
assert('T39: other', scanLexical('other').pass === true, scanLexical('other'));
assert('T40: old', scanLexical('old').pass === true, scanLexical('old'));

// ============================================================
// SECTION 2: SENTENCE-LEVEL VALIDATION (Tests 41-60)
// ============================================================

assert('T41: Simple sentence', scanLexical('The cat sat on the mat').pass === true, scanLexical('The cat sat on the mat'));
assert('T42: Question', scanLexical('What time is it').pass === true, scanLexical('What time is it'));
assert('T43: Statement', scanLexical('I have a dream').pass === true, scanLexical('I have a dream'));
assert('T44: Complex', scanLexical('The quick brown fox jumps over the lazy dog').pass === true, scanLexical('The quick brown fox jumps over the lazy dog'));
assert('T45: Multiple verbs', scanLexical('She walked and talked all day').pass === true, scanLexical('She walked and talked all day'));
assert('T46: Past tense', scanLexical('He went to the store yesterday').pass === true, scanLexical('He went to the store yesterday'));
assert('T47: Future intent', scanLexical('We will go tomorrow').pass === true, scanLexical('We will go tomorrow'));
assert('T48: Negation', scanLexical('I do not know').pass === true, scanLexical('I do not know'));
assert('T49: Possessive', scanLexical('This is my book').pass === true, scanLexical('This is my book'));
assert('T50: Comparison', scanLexical('She is better than him').pass === true, scanLexical('She is better than him'));

assert('T51: Long valid sentence', scanLexical('The government announced new policies for the coming year').pass === true, scanLexical('The government announced new policies for the coming year'));
assert('T52: Technical sentence', scanLexical('The system process function works well').pass === true, scanLexical('The system process function works well'));
assert('T53: Abstract concepts', scanLexical('Truth and justice matter').pass === true, scanLexical('Truth and justice matter'));
assert('T54: Action sequence', scanLexical('Run jump swim climb').pass === true, scanLexical('Run jump swim climb'));
assert('T55: Mixed tense', scanLexical('I was running and will be swimming').pass === true, scanLexical('I was running and will be swimming'));
assert('T56: Prepositions', scanLexical('In on at by for with about').pass === true, scanLexical('In on at by for with about'));
assert('T57: Conjunctions', scanLexical('And but or nor yet so').pass === true, scanLexical('And but or nor yet so'));
assert('T58: Numbers as words', scanLexical('One two three four five').pass === true, scanLexical('One two three four five'));
assert('T59: Common phrase', scanLexical('Thank you very much').pass === true, scanLexical('Thank you very much'));
assert('T60: Greeting', scanLexical('Hello how are you today').pass === true, scanLexical('Hello how are you today'));

// ============================================================
// SECTION 3: GIBBERISH / UNKNOWN WORD REJECTION (Tests 61-90)
// ============================================================

assert('T61: Single gibberish', scanLexical('xyzzy').pass === false, scanLexical('xyzzy'));
assert('T62: Double gibberish', scanLexical('xyzzy plugh').pass === false, scanLexical('xyzzy plugh'));
assert('T63: Triple gibberish', scanLexical('xyzzy plugh frotz').pass === false, scanLexical('xyzzy plugh frotz'));
assert('T64: Mixed valid and gibberish', scanLexical('The xyzzy fox').pass === false, scanLexical('The xyzzy fox'));
assert('T65: Fake verb', scanLexical('I glorbled the thing').pass === false, scanLexical('I glorbled the thing'));
assert('T66: Fake noun', scanLexical('The blarg was huge').pass === false, scanLexical('The blarg was huge'));
assert('T67: Fake adjective', scanLexical('A snorp day').pass === false, scanLexical('A snorp day'));
assert('T68: Random letters', scanLexical('qwerty asdf zxcv').pass === false, scanLexical('qwerty asdf zxcv'));
assert('T69: Vowel cluster', scanLexical('aeiou oiea uoie').pass === false, scanLexical('aeiou oiea uoie'));
assert('T70: Consonant cluster', scanLexical('bcdfgh jklmnp qrstvw').pass === false, scanLexical('bcdfgh jklmnp qrstvw'));

assert('T71: Mixed case gibberish', scanLexical('XyZZy PluGH').pass === false, scanLexical('XyZZy PluGH'));
assert('T72: Gibberish with punctuation', scanLexical('xyzzy! plugh?').pass === false, scanLexical('xyzzy! plugh?'));
assert('T73: Long gibberish', scanLexical('supercalifragilisticexpialidocious').pass === false, scanLexical('supercalifragilisticexpialidocious'));
assert('T74: Short gibberish', scanLexical('z q x').pass === false, scanLexical('z q x'));
assert('T75: Repeated gibberish', scanLexical('xyzzy xyzzy xyzzy').pass === false, scanLexical('xyzzy xyzzy xyzzy'));
assert('T76: Borderline fake', scanLexical('The glorb was very snorp').pass === false, scanLexical('The glorb was very snorp'));
assert('T77: Fake compound', scanLexical('blargnorp flimflam').pass === false, scanLexical('blargnorp flimflam'));
assert('T78: Keyboard smash', scanLexical('asdfghjkl qwertyuiop').pass === false, scanLexical('asdfghjkl qwertyuiop'));
assert('T79: Number-like letters', scanLexical('l33t h4x0r').pass === false, scanLexical('l33t h4x0r'));
assert('T80: Symbol injection', scanLexical('xy@zzy pl#ugh').pass === false, scanLexical('xy@zzy pl#ugh'));

assert('T81: Foreign - Spanish', scanLexical('hola mundo').pass === false, scanLexical('hola mundo'));
assert('T82: Foreign - French', scanLexical('bonjour monde').pass === false, scanLexical('bonjour monde'));
assert('T83: Foreign - German', scanLexical('guten tag').pass === false, scanLexical('guten tag'));
assert('T84: Foreign - Latin', scanLexical('lorem ipsum').pass === false, scanLexical('lorem ipsum'));
assert('T85: Foreign - Japanese romanized', scanLexical('konichiwa sayonara').pass === false, scanLexical('konichiwa sayonara'));
assert('T86: Mixed English and foreign', scanLexical('The hello world bonjour').pass === false, scanLexical('The hello world bonjour'));
assert('T87: Fake technical', scanLexical('The quantum flux capacitor').pass === false, scanLexical('The quantum flux capacitor'));
assert('T88: Fake medical', scanLexical('Patient has severe glorbritis').pass === false, scanLexical('Patient has severe glorbritis'));
assert('T89: Fake legal', scanLexical('The defendant committed blargfraud').pass === false, scanLexical('The defendant committed blargfraud'));
assert('T90: Fake scientific', scanLexical('The snorp particle was detected').pass === false, scanLexical('The snorp particle was detected'));

// ============================================================
// SECTION 4: EDGE CASES & BOUNDARY CONDITIONS (Tests 91-120)
// ============================================================

assert('T91: Empty string', scanLexical('').pass === false && scanLexical('').reason === 'no_words_found', scanLexical(''));
assert('T92: Whitespace only', scanLexical('   ').pass === false && scanLexical('   ').reason === 'no_words_found', scanLexical('   '));
assert('T93: Tabs and newlines', scanLexical('\t\n\r').pass === false, scanLexical('\t\n\r'));
assert('T94: Single valid word', scanLexical('hello').pass === true, scanLexical('hello'));
assert('T95: Single invalid word', scanLexical('xyzzy').pass === false, scanLexical('xyzzy'));
assert('T96: Very long valid sentence', scanLexical('The government of the people by the people for the people shall not perish from the earth').pass === true, scanLexical('The government of the people by the people for the people shall not perish from the earth'));
assert('T97: Repeated valid words', scanLexical('the the the the the').pass === true, scanLexical('the the the the the'));
assert('T98: Mixed valid and invalid repeated', scanLexical('the xyzzy the xyzzy the').pass === false, scanLexical('the xyzzy the xyzzy the'));
assert('T99: All caps', scanLexical('THE QUICK BROWN FOX').pass === true, scanLexical('THE QUICK BROWN FOX'));
assert('T100: Mixed case', scanLexical('ThE qUiCk BrOwN fOx').pass === true, scanLexical('ThE qUiCk BrOwN fOx'));

assert('T101: Numbers only', scanLexical('123 456 789').pass === false && scanLexical('123 456 789').reason === 'no_words_found', scanLexical('123 456 789'));
assert('T102: Numbers with words', scanLexical('I have 2 apples').pass === true, scanLexical('I have 2 apples'));
assert('T103: Punctuation only', scanLexical('!!! ??? ...').pass === false && scanLexical('!!! ??? ...').reason === 'no_words_found', scanLexical('!!! ??? ...'));
assert('T104: Words with punctuation', scanLexical('Hello, world! How are you?').pass === true, scanLexical('Hello, world! How are you?'));
assert('T105: Hyphens (ignored)', scanLexical('well-known fact').pass === true, scanLexical('well-known fact'));
assert('T106: Apostrophes (ignored)', scanLexical("don't can't won't").pass === true, scanLexical("don't can't won't"));
assert('T107: Quotes around words', scanLexical('"hello" \'world\'').pass === true, scanLexical('"hello" \'world\''));
assert('T108: Parentheses', scanLexical('(hello) [world]').pass === true, scanLexical('(hello) [world]'));
assert('T109: HTML-like tags', scanLexical('<hello> world </hello>').pass === true, scanLexical('<hello> world </hello>'));
assert('T110: URL-like', scanLexical('Visit example dot com').pass === true, scanLexical('Visit example dot com'));

assert('T111: Single letter valid', scanLexical('a').pass === true, scanLexical('a'));
assert('T112: Single letter invalid', scanLexical('x').pass === false, scanLexical('x'));
assert('T113: Two letter valid', scanLexical('an').pass === true, scanLexical('an'));
assert('T114: Two letter invalid', scanLexical('qx').pass === false, scanLexical('qx'));
assert('T115: Three letter valid', scanLexical('the').pass === true, scanLexical('the'));
assert('T116: Three letter invalid', scanLexical('xyz').pass === false, scanLexical('xyz'));
assert('T117: Long valid word', scanLexical('responsibility').pass === true, scanLexical('responsibility'));
assert('T118: Very long invalid word', scanLexical('abcdefghijklmnopqrstuvwxyz').pass === false, scanLexical('abcdefghijklmnopqrstuvwxyz'));
assert('T119: Palindrome valid', scanLexical('civic').pass === true, scanLexical('civic'));
assert('T120: Palindrome invalid', scanLexical('qwertrewq').pass === false, scanLexical('qwertrewq'));

// ============================================================
// SECTION 5: CC DOMAIN VOCABULARY (Tests 121-160)
// ============================================================

// D1 Signal domain
assert('T121: signal', scanLexical('signal').pass === true, scanLexical('signal'));
assert('T122: information', scanLexical('information').pass === true, scanLexical('information'));
assert('T123: data', scanLexical('data').pass === true, scanLexical('data'));
assert('T124: measure', scanLexical('measure').pass === true, scanLexical('measure'));
assert('T125: metric', scanLexical('metric').pass === true, scanLexical('metric'));
assert('T126: density', scanLexical('density').pass === true, scanLexical('density'));
assert('T127: word', scanLexical('word').pass === true, scanLexical('word'));
assert('T128: count', scanLexical('count').pass === true, scanLexical('count'));

// D2 Structural
assert('T129: length', scanLexical('length').pass === true, scanLexical('length'));
assert('T130: size', scanLexical('size').pass === true, scanLexical('size'));
assert('T131: quality', scanLexical('quality').pass === true, scanLexical('quality'));
assert('T132: integrity', scanLexical('integrity').pass === true, scanLexical('integrity'));

// D3 Temporal
assert('T133: time', scanLexical('time').pass === true, scanLexical('time'));
assert('T134: temporal', scanLexical('temporal').pass === true, scanLexical('temporal'));
assert('T135: history', scanLexical('history').pass === true, scanLexical('history'));
assert('T136: past', scanLexical('past').pass === true, scanLexical('past'));
assert('T137: future', scanLexical('future').pass === true, scanLexical('future'));
assert('T138: duration', scanLexical('duration').pass === true, scanLexical('duration'));
assert('T139: period', scanLexical('period').pass === true, scanLexical('period'));
assert('T140: epoch', scanLexical('epoch').pass === true, scanLexical('epoch'));

// D4 Spatial
assert('T141: space', scanLexical('space').pass === true, scanLexical('space'));
assert('T142: spatial', scanLexical('spatial').pass === true, scanLexical('spatial'));
assert('T143: ground', scanLexical('ground').pass === true, scanLexical('ground'));
assert('T144: location', scanLexical('location').pass === true, scanLexical('location'));
assert('T145: position', scanLexical('position').pass === true, scanLexical('position'));
assert('T146: area', scanLexical('area').pass === true, scanLexical('area'));
assert('T147: region', scanLexical('region').pass === true, scanLexical('region'));
assert('T148: domain', scanLexical('domain').pass === true, scanLexical('domain'));

// D5 Cognitive
assert('T149: cognitive', scanLexical('cognitive').pass === true, scanLexical('cognitive'));
assert('T150: mind', scanLexical('mind').pass === true, scanLexical('mind'));
assert('T151: thought', scanLexical('thought').pass === true, scanLexical('thought'));
assert('T152: reason', scanLexical('reason').pass === true, scanLexical('reason'));
assert('T153: logic', scanLexical('logic').pass === true, scanLexical('logic'));
assert('T154: understand', scanLexical('understand').pass === true, scanLexical('understand'));
assert('T155: mental', scanLexical('mental').pass === true, scanLexical('mental'));
assert('T156: intellect', scanLexical('intellect').pass === true, scanLexical('intellect'));

// D6 Ethical
assert('T157: ethical', scanLexical('ethical').pass === true, scanLexical('ethical'));
assert('T158: moral', scanLexical('moral').pass === true, scanLexical('moral'));
assert('T159: justice', scanLexical('justice').pass === true, scanLexical('justice'));
assert('T160: responsibility', scanLexical('responsibility').pass === true, scanLexical('responsibility'));

// D7 Declarative
assert('T161: truth', scanLexical('truth').pass === true, scanLexical('truth'));
assert('T162: fact', scanLexical('fact').pass === true, scanLexical('fact'));
assert('T163: axiom', scanLexical('axiom').pass === true, scanLexical('axiom'));
assert('T164: theorem', scanLexical('theorem').pass === true, scanLexical('theorem'));
assert('T165: principle', scanLexical('principle').pass === true, scanLexical('principle'));
assert('T166: invariant', scanLexical('invariant').pass === true, scanLexical('invariant'));
assert('T167: verify', scanLexical('verify').pass === true, scanLexical('verify'));
assert('T168: proof', scanLexical('proof').pass === true, scanLexical('proof'));

// D8 Novelty
assert('T169: novel', scanLexical('novel').pass === true, scanLexical('novel'));
assert('T170: creative', scanLexical('creative').pass === true, scanLexical('creative'));
assert('T171: innovation', scanLexical('innovation').pass === true, scanLexical('innovation'));
assert('T172: unique', scanLexical('unique').pass === true, scanLexical('unique'));
assert('T173: discover', scanLexical('discover').pass === true, scanLexical('discover'));
assert('T174: invent', scanLexical('invent').pass === true, scanLexical('invent'));
assert('T175: breakthrough', scanLexical('breakthrough').pass === true, scanLexical('breakthrough'));
assert('T176: pioneer', scanLexical('pioneer').pass === true, scanLexical('pioneer'));

// CC System terms
assert('T177: coherence', scanLexical('coherence').pass === true, scanLexical('coherence'));
assert('T178: resonance', scanLexical('resonance').pass === true, scanLexical('resonance'));
assert('T179: harmony', scanLexical('harmony').pass === true, scanLexical('harmony'));
assert('T180: calculus', scanLexical('calculus').pass === true, scanLexical('calculus'));
assert('T181: tesseract', scanLexical('tesseract').pass === true, scanLexical('tesseract'));
assert('T182: topology', scanLexical('topology').pass === true, scanLexical('topology'));
assert('T183: vertex', scanLexical('vertex').pass === true, scanLexical('vertex'));
assert('T184: quadrant', scanLexical('quadrant').pass === true, scanLexical('quadrant'));

// GHOST system terms
assert('T185: spectral', scanLexical('spectral').pass === true, scanLexical('spectral'));
assert('T186: graph', scanLexical('graph').pass === true, scanLexical('graph'));
assert('T187: merkle', scanLexical('merkle').pass === true, scanLexical('merkle'));
assert('T188: bonsai', scanLexical('bonsai').pass === true, scanLexical('bonsai'));
assert('T189: kernel', scanLexical('kernel').pass === true, scanLexical('kernel'));
assert('T190: ghost', scanLexical('ghost').pass === true, scanLexical('ghost'));
assert('T191: module', scanLexical('module').pass === true, scanLexical('module'));
assert('T192: system', scanLexical('system').pass === true, scanLexical('system'));

// Technical infrastructure
assert('T193: algorithm', scanLexical('algorithm').pass === true, scanLexical('algorithm'));
assert('T194: protocol', scanLexical('protocol').pass === true, scanLexical('protocol'));
assert('T195: interface', scanLexical('interface').pass === true, scanLexical('interface'));
assert('T196: pipeline', scanLexical('pipeline').pass === true, scanLexical('pipeline'));
assert('T197: router', scanLexical('router').pass === true, scanLexical('router'));
assert('T198: gate', scanLexical('gate').pass === true, scanLexical('gate'));
assert('T199: filter', scanLexical('filter').pass === true, scanLexical('filter'));
assert('T200: validate', scanLexical('validate').pass === true, scanLexical('validate'));

// ============================================================
// SECTION 6: TOKENIZATION BEHAVIOR (Tests 201-230)
// ============================================================

assert('T201: tokenize basic', JSON.stringify(tokenize('hello world')) === JSON.stringify(['hello','world']), tokenize('hello world'));
assert('T202: tokenize uppercase', JSON.stringify(tokenize('HELLO WORLD')) === JSON.stringify(['hello','world']), tokenize('HELLO WORLD'));
assert('T203: tokenize mixed case', JSON.stringify(tokenize('Hello World')) === JSON.stringify(['hello','world']), tokenize('Hello World'));
assert('T204: tokenize with punctuation', JSON.stringify(tokenize('hello, world!')) === JSON.stringify(['hello','world']), tokenize('hello, world!'));
assert('T205: tokenize numbers stripped', JSON.stringify(tokenize('hello 123 world')) === JSON.stringify(['hello','world']), tokenize('hello 123 world'));
assert('T206: tokenize empty', JSON.stringify(tokenize('')) === JSON.stringify([]), tokenize(''));
assert('T207: tokenize whitespace', JSON.stringify(tokenize('   ')) === JSON.stringify([]), tokenize('   '));
assert('T208: tokenize single word', JSON.stringify(tokenize('hello')) === JSON.stringify(['hello']), tokenize('hello'));
assert('T209: tokenize hyphenated', JSON.stringify(tokenize('well-known')) === JSON.stringify(['well','known']), tokenize('well-known'));
assert('T210: tokenize apostrophe', JSON.stringify(tokenize("don't")) === JSON.stringify(['don','t']), tokenize("don't"));

assert('T211: tokenize quotes', JSON.stringify(tokenize('"hello"')) === JSON.stringify(['hello']), tokenize('"hello"'));
assert('T212: tokenize parentheses', JSON.stringify(tokenize('(hello)')) === JSON.stringify(['hello']), tokenize('(hello)'));
assert('T213: tokenize brackets', JSON.stringify(tokenize('[world]')) === JSON.stringify(['world']), tokenize('[world]'));
assert('T214: tokenize braces', JSON.stringify(tokenize('{test}')) === JSON.stringify(['test']), tokenize('{test}'));
assert('T215: tokenize angle brackets', JSON.stringify(tokenize('<html>')) === JSON.stringify(['html']), tokenize('<html>'));
assert('T216: tokenize multiple spaces', JSON.stringify(tokenize('hello    world')) === JSON.stringify(['hello','world']), tokenize('hello    world'));
assert('T217: tokenize tabs', JSON.stringify(tokenize('hello\tworld')) === JSON.stringify(['hello','world']), tokenize('hello\tworld'));
assert('T218: tokenize newlines', JSON.stringify(tokenize('hello\nworld')) === JSON.stringify(['hello','world']), tokenize('hello\nworld'));
assert('T219: tokenize mixed whitespace', JSON.stringify(tokenize('hello \t\n world')) === JSON.stringify(['hello','world']), tokenize('hello \t\n world'));
assert('T220: tokenize long text', tokenize('The quick brown fox jumps over the lazy dog').length === 9, tokenize('The quick brown fox jumps over the lazy dog'));

assert('T221: tokenize only numbers', JSON.stringify(tokenize('123 456')) === JSON.stringify([]), tokenize('123 456'));
assert('T222: tokenize only punctuation', JSON.stringify(tokenize('!!! ???')) === JSON.stringify([]), tokenize('!!! ???'));
assert('T223: tokenize mixed valid invalid', JSON.stringify(tokenize('hello xyzzy world')) === JSON.stringify(['hello','xyzzy','world']), tokenize('hello xyzzy world'));
assert('T224: tokenize repeated words', JSON.stringify(tokenize('the the the')) === JSON.stringify(['the','the','the']), tokenize('the the the'));
assert('T225: tokenize email-like', JSON.stringify(tokenize('user@example.com')) === JSON.stringify(['user','example','com']), tokenize('user@example.com'));
assert('T226: tokenize underscore', JSON.stringify(tokenize('hello_world')) === JSON.stringify(['hello','world']), tokenize('hello_world'));
assert('T227: tokenize slash', JSON.stringify(tokenize('hello/world')) === JSON.stringify(['hello','world']), tokenize('hello/world'));
assert('T228: tokenize colon', JSON.stringify(tokenize('hello:world')) === JSON.stringify(['hello','world']), tokenize('hello:world'));
assert('T229: tokenize semicolon', JSON.stringify(tokenize('hello;world')) === JSON.stringify(['hello','world']), tokenize('hello;world'));
assert('T230: tokenize pipe', JSON.stringify(tokenize('hello|world')) === JSON.stringify(['hello','world']), tokenize('hello|world'));

// ============================================================
// SECTION 7: RETURN STRUCTURE VALIDATION (Tests 231-250)
// ============================================================

const r1 = scanLexical('hello');
assert('T231: return has pass', typeof r1.pass === 'boolean', r1);
assert('T232: return has gate', r1.gate === 'lexical', r1);
assert('T233: return has reason', typeof r1.reason === 'string', r1);
assert('T234: return has checked', typeof r1.checked === 'number', r1);
assert('T235: return has unknown', Array.isArray(r1.unknown), r1);
assert('T236: pass true reason', r1.pass === true && r1.reason === 'all_words_valid', r1);
assert('T237: checked count', r1.checked === 1, r1);
assert('T238: unknown empty', r1.unknown.length === 0, r1);

const r2 = scanLexical('xyzzy');
assert('T239: pass false reason', r2.pass === false && r2.reason === 'unknown_words_found', r2);
assert('T240: checked count fail', r2.checked === 1, r2);
assert('T241: unknown populated', r2.unknown.length === 1 && r2.unknown[0] === 'xyzzy', r2);

const r3 = scanLexical('');
assert('T242: empty pass false', r3.pass === false, r3);
assert('T243: empty reason', r3.reason === 'no_words_found', r3);
assert('T244: empty checked', r3.checked === 0, r3);
assert('T245: empty unknown', r3.unknown.length === 0, r3);

const r4 = scanLexical('hello xyzzy');
assert('T246: mixed pass false', r4.pass === false, r4);
assert('T247: mixed unknown', r4.unknown.length === 1 && r4.unknown[0] === 'xyzzy', r4);
assert('T248: mixed checked', r4.checked === 2, r4);

const r5 = scanLexical('hello world');
assert('T249: multi pass true', r5.pass === true, r5);
assert('T250: multi checked', r5.checked === 2, r5);

// ============================================================
// SECTION 8: STRESS & PERFORMANCE (Tests 251-270)
// ============================================================

const longValid = 'The quick brown fox jumps over the lazy dog '.repeat(20).trim();
assert('T251: long text valid', scanLexical(longValid).pass === true, { len: longValid.length });
assert('T252: long text checked', scanLexical(longValid).checked === 180, scanLexical(longValid));

const longMixed = 'The quick brown fox jumps over the lazy dog xyzzy '.repeat(10).trim();
assert('T253: long mixed false', scanLexical(longMixed).pass === false, scanLexical(longMixed));
assert('T254: long mixed unknown count', scanLexical(longMixed).unknown.length === 10, scanLexical(longMixed));

const manyWords = Array(50).fill('hello').join(' ');
assert('T255: repeated word valid', scanLexical(manyWords).pass === true, scanLexical(manyWords));
assert('T256: repeated word checked', scanLexical(manyWords).checked === 50, scanLexical(manyWords));

assert('T257: wordCount exported', typeof wordCount === 'number' && wordCount >= 500, { wordCount });
assert('T258: scanLexical exported', typeof scanLexical === 'function', {});
assert('T259: tokenize exported', typeof tokenize === 'function', {});
assert('T260: module loads', true, {});

// ============================================================
// SECTION 9: REAL-WORLD SAMPLES (Tests 261-280)
// ============================================================

assert('T261: News headline', scanLexical('Government announces new policy today').pass === true, scanLexical('Government announces new policy today'));
assert('T262: Technical doc', scanLexical('The module processes data through the pipeline').pass === true, scanLexical('The module processes data through the pipeline'));
assert('T263: CC description', scanLexical('The tesseract topology maps spectral coherence across eight domains').pass === true, scanLexical('The tesseract topology maps spectral coherence across eight domains'));
assert('T264: GHOST kernel', scanLexical('The ghost kernel validates input through the lexical gate').pass === true, scanLexical('The ghost kernel validates input through the lexical gate'));
assert('T265: Ethical statement', scanLexical('Truth honesty and integrity matter').pass === true, scanLexical('Truth honesty and integrity matter'));
assert('T266: Research abstract', scanLexical('This study investigates the temporal dynamics of cognitive systems').pass === true, scanLexical('This study investigates the temporal dynamics of cognitive systems'));
assert('T267: System log', scanLexical('Error detected in module at location zero').pass === true, scanLexical('Error detected in module at location zero'));
assert('T268: User query', scanLexical('How does the system process input data').pass === true, scanLexical('How does the system process input data'));
assert('T269: Command', scanLexical('Run the test and verify results').pass === true, scanLexical('Run the test and verify results'));
assert('T270: Description', scanLexical('The spectral graph shows node connections').pass === true, scanLexical('The spectral graph shows node connections'));

// ============================================================
// SECTION 10: NEGATIVE REAL-WORLD (Tests 271-290)
// ============================================================

assert('T271: Spam', scanLexical('Buy cheap viagra now').pass === false, scanLexical('Buy cheap viagra now'));
assert('T272: Gibberish sentence', scanLexical('The glorb snorp blarg of xyzzy').pass === false, scanLexical('The glorb snorp blarg of xyzzy'));
assert('T273: Mixed spam', scanLexical('Hello buy now xyzzy').pass === false, scanLexical('Hello buy now xyzzy'));
assert('T274: Fake technical', scanLexical('The quantum flux capacitor needs more jiggawatts').pass === false, scanLexical('The quantum flux capacitor needs more jiggawatts'));
assert('T275: Fake medical', scanLexical('Patient has severe glorbritis and snorpoma').pass === false, scanLexical('Patient has severe glorbritis and snorpoma'));
assert('T276: Code injection', scanLexical('alert xyzzy script').pass === false, scanLexical('alert xyzzy script'));
assert('T277: Foreign mixed', scanLexical('The bonjour world of glorb').pass === false, scanLexical('The bonjour world of glorb'));
assert('T278: Nonsense poem', scanLexical('Twas brillig and the slithy toves').pass === false, scanLexical('Twas brillig and the slithy toves'));
assert('T279: Keyboard walk', scanLexical('asdf qwerty zxcvbnm').pass === false, scanLexical('asdf qwerty zxcvbnm'));
assert('T280: Repeated gibberish', scanLexical('xyzzy xyzzy xyzzy xyzzy xyzzy').pass === false, scanLexical('xyzzy xyzzy xyzzy xyzzy xyzzy'));

// ============================================================
// REPORT
// ============================================================

console.log('\n=== LEXICAL GATE TEST BATTERY ===');
console.log('Total:', passed + failed);
console.log('Passed:', passed);
console.log('Failed:', failed);
console.log('Success Rate:', ((passed / (passed + failed)) * 100).toFixed(2) + '%');

if (failed > 0) {
  console.log('\n=== FAILURES ===');
  failures.forEach(f => {
    console.log('\n' + f.name + ':');
    console.log('  Expected: PASS condition failed');
    console.log('  Got:', JSON.stringify(f.details, null, 2));
  });
}

console.log('\n=== SEAL: 2026-07-11_12:30_Tulsa_OK ===');
process.exit(failed > 0 ? 1 : 0);
