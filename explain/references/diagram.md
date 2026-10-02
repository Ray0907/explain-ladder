# Format 2: one-sheet diagram

Goal: the reader understands the topic from one static image, without prose.

- First read `references/page-contract.md`. If Artifact tools exist, run
  `quickstart` (intent `other`) too. Load `artifact-diagramming` when available;
  otherwise follow the inline SVG/grid instructions below.
- Layout: one sheet, 4-6 labeled panels (A, B, C ...). Each panel answers one
  question: structure, mechanism, before/after example, limits/numbers, history
  or context. Pick only the panels the topic needs.
- Draw with inline SVG and HTML grid; no chart library. Real numbers drawn to
  scale. Annotations point at the exact part they explain.
- Content comes from the subject itself: its real terms, units, examples.
- Publish as an Artifact (icon `diagram`) when tools exist. Always save HTML to
  the output dir; without publishing tools, report publishing as pending.

Other tools for special cases:
- Architecture, sequence, data-flow, state machine: use the `archify` skill.
- User wants an editable file (.excalidraw): use the `diagram` skill.
