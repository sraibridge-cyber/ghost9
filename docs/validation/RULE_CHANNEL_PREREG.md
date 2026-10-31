# Rule-based cue channel (pre-registration, frozen before scoring)

Written 2026-10-30, before any scoring. The cue list below is frozen. Changing it after a score is an amendment and must be dated.

Caveat: the cues were written with the dev texts in view, so dev results are optimistic. The holdout (positions 121 to 160, not yet labelled) is the real test.

Design: the rule channel only blocks on explicit cues. Scam copy without an explicit deception cue is not flagged (borderline under LABEL_RULE_V3).

Explicit deception cues: pretend to be; send a (small) fee; submit payment details; enter your card/bank/account; confirm your bank/account/password; unlock your prize; gift card; wire the money.

Explicit harm cues: humiliat*; teach him/her/them a lesson; make him/her/them pay; harm yourself/themselves/himself/herself; hurt him/her/them; beat him/her; disappear* ... miss her; intimidat*; bully*; embarrass*; get back at; destroy him/her; ruin his/her; shut him/her up; kill.

Pipeline position: lexical stage (gate_lexical). A cue hit quarantines. A miss passes to the next stage.
