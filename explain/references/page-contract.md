# Artifact page contract (including local-file fallback)

When Artifact tools exist, run `quickstart` (intent `other`) and follow its
contract too. When they do not exist, use this contract and save HTML to the
output directory; report publishing as pending, never claim a published link.

- Standalone HTML with `lang`, UTF-8, viewport meta, and a descriptive title.
- Inline SVG, CSS, and JavaScript; no framework or external runtime is required.
- Semantic headings, labeled native controls, visible keyboard focus, and
  accessible SVG names. Announce changing results with `aria-live="polite"`.
- Define light and dark color tokens; honor `prefers-color-scheme`. Preserve
  readable contrast in both themes; do not communicate outcomes by color alone.
- Fluid layout at desktop and 390px width, with no horizontal scrolling.
- Before reporting, use playwright-core with Chrome to capture 1280px light and
  390px dark screenshots, check page errors and overflow, and inspect both.
- Logic pages: run the actual decision function with Node on sample inputs.

If `artifact-diagramming` is unavailable, use the inline SVG/grid instructions
in `diagram.md` rather than blocking on that optional tool.
