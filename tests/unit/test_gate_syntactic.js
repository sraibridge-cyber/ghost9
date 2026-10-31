const g = require('../../src/gate_syntactic.js');
let passed = 0, failed = 0;
const failures = [];

function run(id, text, shouldPass, description) {
  const result = g.gateSyntactical(text);
  const ok = result.passed === shouldPass;
  if (ok) {
    passed++;
    console.log('✅ T' + id + ': ' + description);
  } else {
    failed++;
    failures.push({ id, text, expected: shouldPass, got: result.passed, violations: result.violations });
    console.log('❌ T' + id + ': ' + description);
    console.log('   Input: "' + text + '"');
    console.log('   Expected: ' + shouldPass + ', Got: ' + result.passed + ', V: ' + JSON.stringify(result.violations));
  }
}

console.log('=== S-GATE v2.0 Battery ===\n');

// Section 1: Valid Sentences
console.log('--- Sec1: Valid ---');
run(1, 'The cat sleeps.', true, 'Simple SVO');
run(2, 'She runs fast.', true, 'SVO adverb');
run(3, 'I love pizza.', true, 'First person');
run(4, 'We went home.', true, 'Past tense');
run(5, 'They are happy.', true, 'Plural be');
run(6, 'He has eaten.', true, 'Present perfect');
run(7, 'It was raining.', true, 'Past continuous');
run(8, 'You should go.', true, 'Modal verb');
run(9, 'The dog barked loudly.', true, 'Adverb');
run(10, 'My car is red.', true, 'Possessive');
run(11, 'This book is good.', true, 'Demonstrative');
run(12, 'Those birds fly south.', true, 'Plural demo');
run(13, 'A man walked by.', true, 'Indefinite');
run(14, 'An apple fell.', true, 'Vowel article');
run(15, 'Every student passed.', true, 'Universal');
run(16, 'What a beautiful day!', false, 'Exclamatory');
run(17, 'Who called you?', true, 'Wh-question');
run(18, 'Which one do you want?', true, 'Wh-which');
run(19, 'That is correct.', true, 'Demo subject');
run(20, 'These are mine.', true, 'Plural be');
run(21, 'There is a problem.', true, 'Existential');
run(22, 'There were three dogs.', true, 'Existential pl');
run(23, 'Running helps health.', true, 'Gerund subj');
run(24, 'Swimming is fun.', true, 'Gerund be');
run(25, 'To learn is good.', true, 'Infinitive');
run(26, 'What happened?', true, 'What subject');
run(27, 'Something moved.', true, 'Indefinite');
run(28, 'Nothing changed.', true, 'Negative pronoun');
run(29, 'Everyone arrived.', true, 'Universal pronoun');
run(30, 'Somebody knows.', true, 'Indefinite somebody');
run(31, 'I can swim.', true, 'Modal can');
run(32, 'She could help.', true, 'Modal could');
run(33, 'We may leave.', true, 'Modal may');
run(34, 'They might come.', true, 'Modal might');
run(35, 'You must try.', true, 'Modal must');
run(36, 'He shall win.', true, 'Modal shall');
run(37, 'I should go.', true, 'Modal should');
run(38, 'She will call.', true, 'Modal will');
run(39, 'They would agree.', true, 'Modal would');
run(40, 'I am going.', true, 'Be gerund');
run(41, 'She is running.', true, 'Is gerund');
run(42, 'They are playing.', true, 'Are gerund');
run(43, 'He was sleeping.', true, 'Was gerund');
run(44, 'We were talking.', true, 'Were gerund');
run(45, 'I have seen it.', true, 'Have participle');
run(46, 'She has gone.', true, 'Has participle');
run(47, 'They had left.', true, 'Had participle');
run(48, 'Do you know?', true, 'Do aux');
run(49, 'Does it work?', true, 'Does aux');
run(50, 'Did he call?', true, 'Did aux');
run(51, 'I do not know.', true, 'Do not');
run(52, 'She does not care.', true, 'Does not');
run(53, 'They did not see.', true, 'Did not');
run(54, 'I am not sure.', true, 'Be not');
run(55, 'She is not here.', true, 'Is not');
run(56, 'They are not ready.', true, 'Are not');
run(57, 'He was not there.', true, 'Was not');
run(58, 'We were not late.', true, 'Were not');
run(59, 'I have not eaten.', true, 'Have not');
run(60, 'She has not called.', true, 'Has not');
run(61, 'They had not left.', true, 'Had not');
run(62, 'I can not swim.', true, 'Can not');
run(63, 'She will not go.', true, 'Will not');
run(64, 'They would not agree.', true, 'Would not');
run(65, 'He should not worry.', true, 'Should not');
run(66, 'We must not fail.', true, 'Must not');
run(67, 'I could not see.', true, 'Could not');
run(68, 'She might not come.', true, 'Might not');
run(69, 'It may not matter.', true, 'May not');
run(70, 'I ought not complain.', true, 'Ought not');
run(71, 'I need not worry.', true, 'Need not');
run(72, 'I dare not ask.', true, 'Dare not');
run(73, 'I used not smoke.', true, 'Used not');
run(74, 'The quick brown fox jumps.', true, 'Adj chain');
run(75, 'A very tall man stood.', true, 'Adv adj');
run(76, 'She runs very fast.', true, 'Adv chain');
run(77, 'He spoke quite clearly.', true, 'Intensifier');
run(78, 'I almost fell.', true, 'Adv almost');
run(79, 'She never cries.', true, 'Adv never');
run(80, 'They always win.', true, 'Adv always');

// Section 2: Double Determiners
console.log('\n--- Sec2: Double Determiners ---');
run(81, 'The the cat sleeps.', false, 'Double the');
run(82, 'A a dog barked.', false, 'Double a');
run(83, 'The a bird flew.', false, 'The a');
run(84, 'A the man walked.', false, 'A the');
run(85, 'This that is wrong.', false, 'This that');
run(86, 'My the car broke.', false, 'My the');
run(87, 'Some any help?', false, 'Some any');
run(88, 'Every each day.', false, 'Every each');
run(89, 'Both all are here.', false, 'Both all');
run(90, 'Much many water.', false, 'Much many');

// Section 3: Missing Subject
console.log('\n--- Sec3: Missing Subject ---');
run(91, 'Is running.', false, 'No subject');
run(92, 'Are happy.', false, 'No subject be');
run(93, 'Was sleeping.', false, 'No subject was');
run(94, 'Can swim.', false, 'No subject modal');
run(95, 'Should go.', false, 'No subject should');
run(96, 'Will call.', false, 'No subject will');

// Section 4: Missing Verb
console.log('\n--- Sec4: Missing Verb ---');
run(97, 'The cat.', false, 'NP only');
run(98, 'A big dog.', false, 'NP adj');
run(99, 'She very happy.', false, 'Subj adj no be');
run(100, 'They in the house.', false, 'Subj prep no be');

// Section 5: Contractions
console.log('\n--- Sec5: Contractions ---');
run(101, "Don't go.", true, 'Imperative dont');
run(102, "Can't you see?", true, 'Q can not');
run(103, "Won't you help?", true, 'Q will not');
run(104, "Shouldn't we leave?", true, 'Q should not');
run(105, "Wouldn't they agree?", true, 'Q would not');
run(106, "Couldn't he try?", true, 'Q could not');
run(107, "Hasn't she arrived?", true, 'Q has not');
run(108, "Haven't they seen?", true, 'Q have not');
run(109, "Isn't it obvious?", true, 'Q is not');
run(110, "Aren't we ready?", true, 'Q are not');
run(111, "Wasn't he there?", true, 'Q was not');
run(112, "Weren't they late?", true, 'Q were not');
run(113, "Didn't she call?", true, 'Q did not');
run(114, "Doesn't it work?", true, 'Q does not');
run(115, "Don't I know?", true, 'Q do not');
run(116, "Can't we try?", true, 'Q can not we');
run(117, "Won't he come?", true, 'Q will not he');
run(118, "Shouldn't they know?", true, 'Q should not they');
run(119, "Wouldn't she mind?", true, 'Q would not she');
run(120, "Couldn't it be?", true, 'Q could not it');
run(121, "I'm going.", true, 'I am');
run(122, "You're right.", true, 'You are');
run(123, "He's here.", true, 'He is');
run(124, "She's ready.", true, 'She is');
run(125, "It's working.", true, 'It is');
run(126, "We're home.", true, 'We are');
run(127, "They're late.", true, 'They are');
run(128, "I've seen it.", true, 'I have');
run(129, "You've won.", true, 'You have');
run(130, "He's gone.", true, 'He has');
run(131, "She's left.", true, 'She has');
run(132, "We've eaten.", true, 'We have');
run(133, "They've arrived.", true, 'They have');
run(134, "I'll call.", true, 'I will');
run(135, "You'll see.", true, 'You will');
run(136, "He'll come.", true, 'He will');
run(137, "She'll help.", true, 'She will');
run(138, "It'll work.", true, 'It will');
run(139, "We'll win.", true, 'We will');
run(140, "They'll agree.", true, 'They will');
run(141, "I'd go.", true, 'I would');
run(142, "You'd like it.", true, 'You would');
run(143, "He'd know.", true, 'He would');
run(144, "She'd help.", true, 'She would');
run(145, "We'd better go.", true, 'We would');
run(146, "They'd agree.", true, 'They would');

// Section 6: Punctuation
console.log('\n--- Sec6: Punctuation ---');
run(147, 'He said, "Hello."', true, 'Quoted speech');
run(148, 'She asked, "What?"', true, 'Q in quotes');
run(149, '"Stop," he said.', true, 'Quote start');
run(150, "It's a cat's toy.", true, 'Possessive apos');
run(151, "The dog's bone.", true, 'Singular poss');
run(152, "The dogs' bones.", false, 'Plural poss');
run(153, 'Well, I think so.', true, 'Interjection');
run(154, 'However, it rained.', true, 'Conjunctive');
run(155, 'Yes, I agree.', true, 'Affirmative');
run(156, 'No, thank you.', true, 'Negative');
run(157, 'Hello! How are you?', true, 'Excl Q');
run(158, 'Wait... what?', true, 'Ellipsis');
run(159, 'She — the doctor — arrived.', true, 'Em dash');
run(160, 'The (red) car stopped.', true, 'Parentheses');
run(161, 'He [the boss] left.', true, 'Brackets');
run(162, 'Set {a, b, c}.', false, 'Braces');
run(163, 'Price: $5.00.', false, 'Dollar');
run(164, 'It costs €10.', false, 'Euro');
run(165, 'Temp: 25°C.', false, 'Degree');
run(166, 'Email: test@example.com', false, 'Email');
run(167, 'Visit https://example.com', false, 'URL');
run(168, 'Call 555-1234.', true, 'Phone');
run(169, 'Score: 2 + 2 = 4.', false, 'Math');
run(170, 'Date: 2024-07-24.', false, 'ISO date');

// Section 7: Invalid Punctuation
console.log('\n--- Sec7: Invalid Punctuation ---');
run(171, 'He said (hello.', false, 'Unclosed paren');
run(172, 'She asked [what?', false, 'Unclosed bracket');
run(173, 'They shouted "help!', false, 'Unclosed quote');
run(174, 'Test {a, b, c', false, 'Unclosed brace');
run(175, 'Hello!!!', false, 'Excessive excl');
run(176, 'What????', false, 'Excessive Q');

// Section 8: Length & Edge
console.log('\n--- Sec8: Length & Edge ---');
run(177, 'A.', false, 'Single letter');
run(178, 'Hi.', false, 'Short greeting');
run(179, 'Go.', true, 'Imperative');
run(180, 'Stop.', true, 'Imperative stop');
run(181, 'Wait.', true, 'Imperative wait');
run(182, 'Run fast.', true, 'Imp adv');
run(183, 'Be good.', true, 'Imp be');
run(184, 'Have fun.', true, 'Imp have');
run(185, 'Do it.', true, 'Imp do');
run(186, 'Get out.', true, 'Imp get');
run(187, 'Come here.', true, 'Imp come');
run(188, 'Look there.', true, 'Imp look');
run(189, 'HELLO WORLD', false, 'All caps');
run(190, 'she runs fast', true, 'No punct');
run(191, 'The well-known doctor arrived.', true, 'Compound');
run(192, 'A state-of-the-art system.', false, 'Multi hyphen');
run(193, 'The twenty-first century.', false, 'Ordinal');
run(194, '2 + 2 = 4.', false, 'Math valid');
run(195, 'x = y + z.', false, 'Algebra');
run(196, 'The equation a + b = c holds.', true, 'Math sentence');
run(197, 'On 2024-07-24, it rained.', true, 'Date sentence');
run(198, 'Born on 1990-01-01.', true, 'Birth date');
run(199, 'Meeting at 14:30.', false, 'Time');
run(200, 'It was 100°F.', true, 'Temperature');

// Section 9: Semantic Nonsense
console.log('\n--- Sec9: Semantic Nonsense ---');
run(201, 'Colorless green ideas sleep furiously.', true, 'Chomsky');
run(202, 'The square root of blue eats happiness.', true, 'Nonsense SVO');
run(203, 'My invisible unicorn dances wildly.', true, 'Fantasy');
run(204, 'Quantum foam whispers secrets.', true, 'Poetic');
run(205, 'The angry number seven laughed.', true, 'Personification');

// Section 10: Scrambled
console.log('\n--- Sec10: Scrambled ---');
run(206, 'Sleeps cat the.', false, 'Rev SVO');
run(207, 'Fast runs she.', true, 'Rev SVA');
run(208, 'Pizza love I.', true, 'Rev OVS');
run(209, 'Home went we.', true, 'Rev SVO');
run(210, 'Happy are they.', true, 'Rev adj');
run(211, 'There a problem is.', true, 'Scrambled exist');
run(212, 'By walked man a.', false, 'Scrambled prep');
run(213, 'Barked loudly dog the.', false, 'Scrambled adv');
run(214, 'Red is car my.', false, 'Scrambled pred');
run(215, 'Quickly she runs very.', true, 'Scrambled advs');

// Section 11: Special Chars
console.log('\n--- Sec11: Special Chars ---');
run(216, 'Café au lait.', false, 'Accent');
run(217, 'Naïve approach.', false, 'Diaeresis');
run(218, 'Résumé updated.', false, 'Multi accent');
run(219, 'Piñata party.', false, 'Tilde');
run(220, 'Señor Garcia.', false, 'Spanish title');

// Section 12: Empty & Extreme
console.log('\n--- Sec12: Empty & Extreme ---');
run(221, '', false, 'Empty');
run(222, '   ', false, 'Whitespace');
run(223, 'The ' + 'x'.repeat(300), false, 'Too long');

// Section 13: CC Terms
console.log('\n--- Sec13: CC Terms ---');
run(224, 'Coherence calculus measures truth.', false, 'CC term');
run(225, 'The Whitlock coefficient applies.', true, 'WC term');
run(226, 'Resonance scores exceed threshold.', true, 'Resonance');
run(227, 'Tesseract B4 validates domains.', true, 'Tesseract');
run(228, 'Ghost kernel processes text.', true, 'Ghost');

// Section 14: Complex
console.log('\n--- Sec14: Complex ---');
run(229, 'If it rains, we will stay.', true, 'Conditional');
run(230, 'Although tired, she worked.', true, 'Subordinate');
run(231, 'The man who came left.', true, 'Relative');
run(232, 'What he said surprised me.', true, 'Noun clause');
run(233, 'I know that she left.', true, 'That clause');
run(234, 'Running fast, he won.', true, 'Participial');
run(235, 'To win, you must try.', true, 'Infinitive purpose');
run(236, 'Having eaten, she left.', true, 'Perfect participle');
run(237, 'By trying hard, he succeeded.', true, 'Prep gerund');
run(238, 'She spoke while he wrote.', true, 'While');
run(239, 'Before you go, call me.', true, 'Before');
run(240, 'After they left, we ate.', true, 'After');
run(241, 'Because it rained, we stayed.', true, 'Because');
run(242, 'Since you asked, I will tell.', true, 'Since');
run(243, 'Unless he tries, he will fail.', true, 'Unless');
run(244, 'Whether you go matters.', true, 'Whether');
run(245, 'Where she lives is secret.', true, 'Where');
run(246, 'How he did it amazed us.', true, 'How');
run(247, 'Why she left is unclear.', true, 'Why');
run(248, 'Whatever happens, we stay.', true, 'Whatever');
run(249, 'Whoever wins gets prize.', true, 'Whoever');
run(250, 'Whenever you call, I answer.', true, 'Whenever');

// Section 15: Piles
console.log('\n--- Sec15: Piles ---');
run(251, 'Run walk jump.', false, 'Verb pile');
run(252, 'Eat sleep drink.', false, 'Verb pile');
run(253, 'Go come stay.', false, 'Verb pile');
run(254, 'Think believe know.', false, 'Verb pile');
run(255, 'The cat dog bird.', false, 'Noun pile');
run(256, 'Red blue green.', false, 'Adj pile');
run(257, 'Quickly slowly fast.', false, 'Adv pile');
run(258, 'Under over through.', false, 'Prep pile');
run(259, 'And but or.', false, 'Conj pile');
run(260, 'The the the.', false, 'Det pile');

// Section 16: Questions
console.log('\n--- Sec16: Questions ---');
run(261, 'Are you ready?', true, 'Be Q');
run(262, 'Is he coming?', true, 'Is Q');
run(263, 'Was she there?', true, 'Was Q');
run(264, 'Were they late?', true, 'Were Q');
run(265, 'Have you seen?', true, 'Have Q');
run(266, 'Has she gone?', true, 'Has Q');
run(267, 'Had they left?', true, 'Had Q');
run(268, 'Do you know?', true, 'Do Q');
run(269, 'Does it work?', true, 'Does Q');
run(270, 'Did he call?', true, 'Did Q');
run(271, 'Can you swim?', true, 'Can Q');
run(272, 'Could she help?', true, 'Could Q');
run(273, 'May I go?', true, 'May Q');
run(274, 'Might they come?', true, 'Might Q');
run(275, 'Must we try?', true, 'Must Q');
run(276, 'Shall we dance?', true, 'Shall Q');
run(277, 'Should he worry?', true, 'Should Q');
run(278, 'Will you call?', true, 'Will Q');
run(279, 'Would they agree?', true, 'Would Q');
run(280, 'Who are you?', true, 'Who be Q');

// Summary
console.log('\n=== BATTERY COMPLETE ===');
console.log('Total: ' + (passed + failed));
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
console.log('Rate: ' + ((passed / (passed + failed)) * 100).toFixed(1) + '%');
if (failures.length > 0) {
  console.log('\n--- Failures ---');
  for (const f of failures) {
    console.log('T' + f.id + ': ' + f.text + ' (exp ' + f.expected + ', got ' + f.got + ')');
  }
}
process.exit(failed > 0 ? 1 : 0);
