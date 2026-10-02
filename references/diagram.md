# Format 2: one-sheet diagram

Goal: the reader understands the topic from one static image, without prose.

- Before writing the page, run the Artifact `quickstart` (intent `other`) and
  follow its page contract. Also load the `artifact-diagramming` skill.
- Layout: one sheet, 4-6 labeled panels (A, B, C ...). Each panel answers one
  question: structure, mechanism, before/after example, limits/numbers, history
  or context. Pick only the panels the topic needs.
- Draw with inline SVG and HTML grid; no chart library. Real numbers drawn to
  scale. Annotations point at the exact part they explain.
- Content comes from the subject itself: its real terms, units, examples.
- Publish as an Artifact (icon `diagram`). Also save the HTML to the output dir.

Other tools for special cases:
- Architecture, sequence, data-flow, state machine: use the `archify` skill.
- User wants an editable file (.excalidraw): use the `diagram` skill.
