# Format 3: interactive explainer page

Goal: the reader learns by doing. Static reading belongs in format 1 or 2.

- Before writing the page, run the Artifact `quickstart` (intent `other`) and
  follow its page contract.
- Find the one or two knobs that drive the topic (a parameter, an input, a step
  control) and let the reader turn them. The page shows the effect live.
- Structure: short intro (2-3 sentences) -> interactive core -> 3-5 key points
  that the reader can confirm with the controls.
- Open in a working state: sample input loaded, controls at meaningful values.
- Logic pages (math, parsing, scoring): run the core function once on a sample
  input before publishing.
- Publish as an Artifact (icon one generic word for the topic). Also save the
  HTML to the output dir.

Example of a page made this way: `checker.html` in this skill (STE checker,
paste text and see rule hits live).
