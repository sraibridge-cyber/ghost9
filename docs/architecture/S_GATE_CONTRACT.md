# S gate (syntactic) contract

Scope: structure of one sentence. S answers "is this well-formed English structure?"

Must pass:
- Declarative, interrogative, and imperative clauses (She runs fast. Can't you see?).
- Contractions and clitics (Don't go. The dog's bone.).
- One-word imperatives and interjections (Go. Stop. Wait. Hello!).
- Negative imperatives (Don't go.).
- Noun-phrase fragments with no verb (The dog's bone.).
- A participle headline with a number (Born on 1990-01-01.).
- Numerals, dates, phone numbers, and currency as tokens (Call 555-1234. Born on 1990-01-01. It costs €10.).
- A lowercase first letter, since casing is not structure.

Must fail:
- A bare sequence of verbs with no subject and no conjunction (Run walk jump. Eat sleep drink.).
- Two determiners in a row (My the car broke. This that is wrong.).
- A predicate with no subject and no imperative frame (Are happy.).
- Scrambled noun phrases with no clause (Red is car my.).

Does not judge: meaning, truth, plausibility, harm, or whether words are real (L's job).
Output: pass or fail, with the rule that fired.
