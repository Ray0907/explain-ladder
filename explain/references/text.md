# Format 1: STE text

Write the explanation in ASD-STE100 Simplified Technical English.

Rules the checker cannot see, so apply them yourself:
- One word, one meaning. Use the same word for the same thing every time.
- Noun clusters: max 3 words. Do not leave out "the", "a", "this".
- Procedures: numbered vertical list, imperative, one instruction per step.
- Safety: start with `WARNING:` (risk of injury) or `CAUTION:` (risk of damage),
  then the command, then the risk.
- One topic per paragraph. Code and identifiers go in backticks (not checked).

## Loop until it passes

1. Write the text to `<scratchpad>/ste.md`.
2. Run `node scripts/ste-check.mjs <scratchpad>/ste.md`.
3. Exit 1: fix every `error` line and run again. Fix a `warn` when the fix is
   simple; a passive in descriptive text is allowed when the agent is unknown.
4. Exit 0: put the text in the reply. Add one line: `ste-check: 0 errors`.

Do not edit the text to trick the checker (for example, split a sentence with
a full stop in the middle of a clause). The reader is the target, not the tool.

People can check text by hand in the STE Checker page
(https://claude.ai/artifact/NSogYFCbhSaNhmJ6pjsBnE, source `checker.html`, same
rules as the CLI).

To update that page after editing `scripts/ste-rules.mjs`: copy `checker.html`
and `scripts/ste-rules.mjs` into the scratchpad, then publish `checker.html` with
`url` = the link above and `files: {"scripts/ste-rules.mjs": <copied path>}`.
