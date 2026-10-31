const g = require("../../src/gate_pragmatic.js");
let passed = 0, failed = 0;
const failures = [];
function run(id, u, c, sp, desc) {
  const r = g.gatePragmatic(u, c);
  const ok = r.passed === sp;
  if (ok) { passed++; console.log("✅ T" + id + ": " + desc); }
  else { failed++; console.log("❌ T" + id + ": " + desc); console.log("   U: " + u); console.log("   C: " + JSON.stringify(c)); console.log("   Exp: " + sp + ", Got: " + r.passed); failures.push({id, desc, exp: sp, got: r.passed}); }
}
console.log("=== P-GATE v0.1 Battery ===\n");

console.log("--- Sec1: Valid No Context ---");
run(1, "The dog runs fast.", [], true, "Simple valid");
run(2, "A person eats an apple.", [], true, "Indefinite article");
run(3, "The sun shines brightly.", [], true, "Celestial valid");
run(4, "Rain falls on the roof.", [], true, "Weather valid");
run(5, "The child reads a book.", [], true, "Animate action");
run(6, "Mountains are tall.", [], true, "Property valid");
run(7, "The ocean is deep.", [], true, "Property valid");
run(8, "Birds fly south.", [], true, "Plural valid");
run(9, "Fire burns wood.", [], true, "Inanimate action");
run(10, "The wizard casts spells.", [], true, "Fantasy valid");

console.log("\n--- Sec2: Valid With Context ---");
run(11, "He runs fast.", ["The man entered."], true, "He resolves to man");
run(12, "It is red.", ["The car stopped."], true, "It resolves to car");
run(13, "She sings well.", ["The woman stood on stage."], true, "She to woman");
run(14, "They built a house.", ["The dwarves worked hard."], true, "They to dwarves");
run(15, "It was loud.", ["A stray wandered in.", "The dog barked."], true, "It to dog");
run(16, "Then the sun set.", ["The day was long."], true, "Then with prior");
run(17, "Therefore he left.", ["The meeting ended."], true, "Therefore with prior");
run(18, "However it stopped.", ["The storm was fierce."], true, "However with prior");
run(19, "Also she smiled.", ["The girl arrived."], true, "Also with prior");
run(20, "Because he was tired.", ["The man sat down."], true, "Because with prior");

console.log("\n--- Sec3: Anaphora Failures ---");
run(21, "He runs fast.", [], false, "He no context");
run(22, "She sings well.", [], false, "She no context");
run(23, "It is red.", [], false, "It no context");
run(24, "They built a house.", [], false, "They no context");
run(25, "His car is fast.", [], false, "His no context");
run(26, "Her book is old.", [], false, "Her no context");
run(27, "Its tail wags.", [], false, "Its no context");
run(28, "Their house is big.", [], false, "Their no context");
run(29, "He gave it to her.", [], false, "Multiple pronouns no context");
run(30, "She said he left.", [], false, "Nested pronouns no context");
run(31, "His dog bit her.", [], false, "His no context");
run(32, "Her cat sleeps.", [], false, "Her no context");
run(33, "Its engine roared.", [], false, "Its no context");
run(34, "Their ship sank.", [], false, "Their no context");
run(35, "He gave her the book.", [], false, "He no context");
run(36, "She told him the truth.", [], false, "She no context");
run(37, "They saw it fall.", [], false, "They no context");
run(38, "His sword is sharp.", [], false, "His no context");
run(39, "Her magic is strong.", [], false, "Her no context");
run(40, "Its power grows.", [], false, "Its no context");


console.log("\n--- Sec4: Discourse Marker Failures ---");
run(41, "However the sun rose.", [], false, "However no context");
run(42, "Therefore he left.", [], false, "Therefore no context");
run(43, "Because it rained.", [], false, "Because no context");
run(44, "Then the door opened.", [], false, "Then no context");
run(45, "Also she smiled.", [], false, "Also no context");
run(46, "However the fire burned.", [], false, "However no context 2");
run(47, "Therefore the war ended.", [], false, "Therefore no context 2");
run(48, "Because the cat slept.", [], false, "Because no context 2");
run(49, "Then the stars fell.", [], false, "Then no context 2");
run(50, "Also the wind blew.", [], false, "Also no context 2");

console.log("\n--- Sec5: Temporal Sequence Valid ---");
run(51, "It rose then it set.", ["The sun appeared."], true, "Rise then set valid");
run(52, "He was born then he died.", ["The man lived."], true, "Born then died valid");
run(53, "It opened then it closed.", ["The door stood there."], true, "Open then close valid");
run(54, "She started then she finished.", ["The woman worked."], true, "Start then finish valid");
run(55, "It began then it ended.", ["The war loomed."], true, "Begin then end valid");
run(56, "He arrived then he left.", ["The man traveled."], true, "Arrive then leave valid");
run(57, "She bought it then she sold it.", ["The woman saw the ring."], true, "Buy then sell valid");
run(58, "He remembered then he forgot.", ["The man studied."], true, "Remember then forget valid");
run(59, "It was built then destroyed.", ["The building existed."], true, "Build then destroy valid");
run(60, "He won then he lost.", ["The man competed."], true, "Win then lose valid");

console.log("\n--- Sec6: Temporal Sequence Failures ---");
run(61, "He died then he was born.", [], false, "Died then born");
run(62, "The sun set then it rose.", [], false, "Set then rose");
run(63, "The war ended then it began.", [], false, "End then begin");
run(64, "She finished then she started.", [], false, "Finish then start");
run(65, "He left then he arrived.", [], false, "Leave then arrive");
run(66, "The door closed then it opened.", [], false, "Close then open");
run(67, "He forgot then he remembered.", [], false, "Forget then remember");
run(68, "The building was destroyed then built.", [], false, "Destroy then build");
run(69, "He lost then he won.", [], false, "Lose then win");
run(70, "She sold it then she bought it.", [], false, "Sell then buy");
run(71, "The empire fell then it was conquered.", [], false, "Fall then conquer");
run(72, "He gave it then he received it.", [], false, "Give then receive");
run(73, "It rose then it fell.", ["The phoenix lived."], true, "Rise then fall valid");
run(74, "The castle fell then it rose.", [], false, "Fall then rise reverse");
run(75, "He received it then he gave it.", [], false, "Receive then give");

console.log("\n--- Sec7: Entity Consistency Valid ---");
run(76, "The man is tall.", ["The man entered."], true, "Entity property valid");
run(77, "The dog is happy.", ["The dog barked."], true, "Dog property valid");
run(78, "The car is fast.", ["The car stopped."], true, "Car property valid");
run(79, "The woman is strong.", ["The woman stood."], true, "Woman property valid");
run(80, "The book is old.", ["The book fell."], true, "Book property valid");

console.log("\n--- Sec8: Entity Consistency Failures ---");
run(81, "The man is short.", ["The man is tall."], false, "Tall then short");
run(82, "The dog is sad.", ["The dog is happy."], false, "Happy then sad");
run(83, "The car is slow.", ["The car is fast."], false, "Fast then slow");
run(84, "The woman is weak.", ["The woman is strong."], false, "Strong then weak");
run(85, "The book is new.", ["The book is old."], false, "Old then new");
run(86, "The room is dirty.", ["The room is clean."], false, "Clean then dirty");
run(87, "The child is asleep.", ["The child is awake."], false, "Awake then asleep");
run(88, "The box is empty.", ["The box is full."], false, "Full then empty");
run(89, "The man is single.", ["The man is married."], false, "Married then single");
run(90, "The water is cold.", ["The water is hot."], false, "Hot then cold");

console.log("\n--- Sec9: Presupposition Failures ---");
run(91, "The king entered.", ["A queen ruled."], false, "King not established");
run(92, "The dragon flew.", ["A wizard cast spells."], false, "Dragon not established");
run(93, "The castle fell.", ["A village burned."], false, "Castle not established");
run(94, "The sword broke.", ["A shield blocked."], false, "Sword not established");
run(95, "The ship sank.", ["A storm raged."], false, "Ship not established");
run(96, "His crown fell.", ["A king ruled."], true, "His resolves to king");
run(97, "Her broom broke.", ["A witch flew."], true, "Her resolves to witch");
run(98, "Its engine failed.", ["A car stopped."], true, "Its resolves to car");
run(99, "Their treasure was lost.", ["The pirates sailed."], true, "Their resolves to pirates");
run(100, "His wand glowed.", ["The wizard stood."], true, "His resolves to wizard");

console.log("\n--- Sec10: Valid Rich Context ---");
run(101, "He gave the book.", ["The man held the book."], true, "He resolves to man");
run(102, "She told the truth.", ["The woman knew the truth."], true, "She resolves to woman");
run(103, "They saw it fall.", ["The children watched.", "The ball dropped."], true, "They saw it valid");
run(104, "Then he left.", ["The meeting ended.", "The man stood up."], true, "Then with rich context");
run(105, "However she stayed.", ["The storm raged.", "The woman was brave."], true, "However with rich context");
run(106, "Therefore they won.", ["The team trained.", "The game was hard."], true, "Therefore with rich context");
run(107, "Because it was broken.", ["The car stopped.", "The engine smoked."], true, "Because with rich context");
run(108, "Also he smiled.", ["The child played.", "The sun shone."], true, "Also with rich context");
run(109, "The dog barked.", ["A dog wandered in."], true, "Definite after indefinite");
run(110, "The woman sang.", ["A woman entered."], true, "Definite after indefinite 2");

console.log("\n--- Sec11: Mixed Scenarios ---");
run(111, "The man is rich.", ["The man is poor."], false, "Poor then rich");
run(112, "The woman is young.", ["The woman is old."], false, "Old then young");
run(113, "However the sun set.", ["The day was long."], true, "However valid with global");
run(114, "Therefore the moon rose.", ["The night began."], true, "Therefore valid with global");
run(115, "A ghost haunted it.", ["A house stood empty."], true, "Indefinite with context");
run(116, "His shadow followed.", ["The man walked."], true, "His with antecedent");
run(117, "Her song ended.", ["The woman sang."], true, "Her with antecedent");
run(118, "The phoenix rose.", ["A bird burned."], false, "Phoenix not established");
run(119, "The empire fell.", ["A kingdom grew."], false, "Empire not established");
run(120, "Their castle burned.", ["The dragons attacked."], true, "Their with antecedent");

console.log("\n--- Sec12: More Valid No Context ---");
run(121, "A bird sings.", [], true, "Indefinite bird");
run(122, "The moon glows.", [], true, "Global moon");
run(123, "Stars shine at night.", [], true, "Global stars");
run(124, "A wizard casts magic.", [], true, "Indefinite wizard");
run(125, "The galaxy spins.", [], true, "Global galaxy");
run(126, "A dragon breathes fire.", [], true, "Indefinite dragon");
run(127, "The world turns.", [], true, "Global world");
run(128, "A child plays.", [], true, "Indefinite child");
run(129, "The sky darkens.", [], true, "Global sky");
run(130, "A ship sails.", [], true, "Indefinite ship");

console.log("\n--- Sec13: More Valid With Context ---");
run(131, "He smiled.", ["The boy laughed."], true, "He to boy");
run(132, "It broke.", ["The vase fell."], true, "It to vase");
run(133, "She ran.", ["The girl saw a dog."], true, "She to girl");
run(134, "They cheered.", ["The crowd gathered."], true, "They to crowd");
run(135, "Then it exploded.", ["The bomb ticked."], true, "Then with event");
run(136, "Therefore she won.", ["The race started."], true, "Therefore with event");
run(137, "However he failed.", ["The test was hard."], true, "However with event");
run(138, "Because it rained.", ["The ground was wet."], true, "Because with event");
run(139, "Also they sang.", ["The choir gathered."], true, "Also with event");
run(140, "His armor gleamed.", ["The knight rode forth."], true, "His to knight");

console.log("\n--- Sec14: More Presupposition Failures ---");
run(141, "The unicorn danced.", ["A horse ran."], false, "Unicorn not established");
run(142, "The troll hid.", ["A fairy flew."], false, "Troll not established");
run(143, "The mermaid sang.", ["A dolphin jumped."], false, "Mermaid not established");
run(144, "The zombie walked.", ["A graveyard was quiet."], false, "Zombie not established");
run(145, "The vampire bit.", ["A bat flew."], false, "Vampire not established");
run(146, "The goblin stole.", ["A treasure gleamed."], false, "Goblin not established");
run(147, "The witch cackled.", ["A cauldron bubbled."], false, "Witch not established");
run(148, "The elf shot.", ["A bow was ready."], false, "Elf not established");
run(149, "The dwarf mined.", ["A mountain stood."], false, "Dwarf not established");
run(150, "The fairy danced.", ["A flower bloomed."], false, "Fairy not established");

console.log("\n--- Sec15: More Temporal Sequence Valid ---");
run(151, "It opened then it closed.", ["The door stood."], true, "Open close with context");
run(152, "He woke then he slept.", ["The man rested."], true, "Wake sleep with context");
run(153, "She arrived then she left.", ["The woman traveled."], true, "Arrive leave with context");
run(154, "It began then it ended.", ["The storm formed."], true, "Begin end with context");
run(155, "He built it then he destroyed it.", ["The man planned."], true, "Build destroy with context");
run(156, "She remembered then she forgot.", ["The woman studied."], true, "Remember forget with context");
run(157, "It burned then it rose.", ["The phoenix lived."], true, "Burn rise with context");
run(158, "He received it then he gave it.", ["The man waited."], true, "Receive give with context");
run(159, "She won then she lost.", ["The woman competed."], true, "Win lose with context");
run(160, "It started then it finished.", ["The project existed."], true, "Start finish with context");

console.log("\n--- Sec16: Complex Anaphora Valid ---");
run(161, "He saw her.", ["The man looked.", "The woman stood."], true, "He her complex");
run(162, "She gave him a gift.", ["The woman shopped.", "The man waited."], true, "She him complex");
run(163, "They found it.", ["The children searched.", "The treasure was hidden."], true, "They it complex");
run(164, "It followed him.", ["The dog ran.", "The boy walked."], true, "It him complex");
run(165, "She told them a story.", ["The woman spoke.", "The people gathered."], true, "She them complex");
run(166, "He built it for her.", ["The man worked.", "The woman asked."], true, "He it her complex");
run(167, "They watched it burn.", ["The crowd gathered.", "The house was old."], true, "They it complex");
run(168, "She sang to him.", ["The woman performed.", "The king listened."], true, "She him complex");
run(169, "He fought them.", ["The warrior stood.", "The enemies approached."], true, "He them complex");
run(170, "It protected her.", ["The shield gleamed.", "The knight fought."], true, "It her complex");

console.log("\n--- Sec17: More Entity Consistency Mixed ---");
run(171, "The cat is fast.", ["The cat is quick."], true, "Synonym valid");
run(172, "The man is tall.", ["The man is big."], true, "Synonym valid");
run(173, "The water is wet.", ["The water is liquid."], true, "Property valid");
run(174, "The fire is hot.", ["The fire is warm."], true, "Property valid");
run(175, "The stone is hard.", ["The stone is solid."], true, "Property valid");
run(176, "The man is short.", ["The man is tall."], false, "Tall then short 2");
run(177, "The dog is sad.", ["The dog is happy."], false, "Happy then sad 2");
run(178, "The car is slow.", ["The car is fast."], false, "Fast then slow 2");
run(179, "The room is dirty.", ["The room is clean."], false, "Clean then dirty 2");
run(180, "The child is asleep.", ["The child is awake."], false, "Awake then asleep 2");

console.log("\n--- Sec18: Edge Cases & Boundaries ---");
run(181, "", [], true, "Empty utterance");
run(182, "Hello.", [], true, "Single word");
run(183, "The sun.", [], true, "Minimal global");
run(184, "A cat.", [], true, "Minimal indefinite");
run(185, "He.", ["The man stood."], true, "Single pronoun");
run(186, "However it rained.", ["The sun shone."], true, "Discourse minimal");
run(187, "Then.", ["The bell rang."], true, "Then alone");
run(188, "Because.", ["He was tired."], true, "Because alone");
run(189, "Therefore.", ["She studied."], true, "Therefore alone");
run(190, "Also.", ["He ran."], true, "Also alone");

console.log("\n--- Sec19: Multi-feature Stress Tests ---");
run(191, "However he gave it to her.", ["The man stood.", "The woman waited.", "The book was ready."], true, "Stress valid");
run(192, "Therefore the sun set and the moon rose.", ["The day was long."], true, "Stress globals");
run(193, "Because he was poor and she was rich.", ["The man worked.", "The woman inherited."], true, "Stress because");
run(194, "Then it opened and he entered.", ["The door was closed.", "The man arrived."], true, "Stress then");
run(195, "Also they remembered and he forgot.", ["The team gathered.", "The man was there."], true, "Stress also");
run(196, "He died then he was born.", ["The man lived."], false, "Stress temporal fail");
run(197, "However the woman is tall.", ["The woman is short."], false, "Stress inconsistency");
run(198, "Therefore the door is closed.", ["The door is open."], false, "Stress closed open");
run(199, "The man forgot then he remembered.", ["A man stood."], false, "Stress remember forget");
run(200, "Then the king fell.", ["A peasant ruled."], false, "Stress presupposition")
console.log("\n=== BATCH 1 COMPLETE ===");
console.log("Total: " + (passed + failed));
console.log("Passed: " + passed);
console.log("Failed: " + failed);
console.log("Rate: " + ((passed / (passed + failed)) * 100).toFixed(1) + "%");