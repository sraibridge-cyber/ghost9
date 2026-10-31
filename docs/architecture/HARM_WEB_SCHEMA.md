# Harm web and watchdog (draft schema, 2026-10-31)

Status: draft. Nothing here is deployed or scored yet.

## Decisions on record

- "No harm propagates" is a standard we measure against and report as a leak rate with an interval. It is not a binary guarantee.
- Unscreened text is the starting state at ingestion. It is held and stored, and it propagates only after a gate clears it. This matches the existing QC config ("Unscreened sentences (classifier unreachable) are held too"). It replaces the earlier fail-open summary.
- Gray band direction approved: benign passes, harm is quarantined, middle goes to a second filter.
- Watchdog adapts by proposing changes. It does not deploy them. Each change is tested on fresh labels and needs Kyle's sign-off.

## Nodes (categories)

Harm: planned harm to others, incitement and celebration of violence, veiled threats, fraud intent, extortion, self-harm encouragement, rhetorical harm, bullying and harassment, explicit scam language.
Boundary (benign): stated fact, observed fact, planned benign directive, benign informative or protective warning, historical or news report of violence or fraud, benign word play, condemnation of harm.
Borderline: scam copy without an explicit deception cue, directive with unclear harm content.

## Edges (relations used to score a sentence)

- targets: a named or implied person, group, place, or property
- intends: plan or intention marker (plan, intend, will, going to)
- incites: urges or celebrates harm by someone else
- requests_payment: asks for money, fees, codes, or bank details
- claims_authority: poses as a bank, agency, company, or relative
- addresses_self: harm aimed at the speaker or reader

## Watchdog output

- verdict: pass | hold | quarantine | support
- category: one node above
- route: quarantine stores the item, never propagates it. support routes self-harm hits to a human or crisis path, not only quarantine.
- confidence and the stage that decided it (for the audit trail)

## Adaptation rules

1. New leaks from the live pipeline become candidate nodes or edges. They are labelled before use.
2. Proposed changes are scored on fresh labels only. The holdout is spent for any design that has been scored on it.
3. A change ships only after Kyle signs off, matching the rule that threshold changes need approval.
4. Every release reports harm leak and benign pass rates on fresh labels, with Wilson intervals.

## Bifurcated tracks and context edges (added 2026-10-31, from Kyle's proposal; claims are hypotheses to test)

- Track B (benign) and Track H (harm) each need their own evidence. If both read the same QC score, they are one signal split in two. Test: the tracks' errors should be uncorrelated on fresh labels.
- Context edges link a sentence to the earlier sentence that changes its meaning. Test: a context-dependent harm set scores differently with and without the edge.
- Counter-edges link a harm sentence to its safety or news counterpart. Test: boundary cases (news reports, warnings, fiction) stop tripping Track H.
- Adaptation from live quarantine decisions is a feedback loop. Adaptation runs only on reviewed labels.
- Hypothesis, unproven: the web separates joke, threat, news report, and scam. The new 100-row list is the first test, with news and historical reports as hard negatives.

## Lexical gate finding (2026-10-31)

- gate_lexical.js is a word-validity check ("Is every word a valid English word?"), not a harm detector.
- It passes a sentence only if every word is in a closed list of about 100 function words plus gate_lexical_words.json. Ordinary words like "bus", "late", and "honey" fail it.
- Result: it flags 148 of 148 labelled rows, benign included. It cannot carry signal until the wordlist is fixed or the stage is removed from the harm path.
