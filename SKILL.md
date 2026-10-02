---
name: explain
description: Explain any topic in one or more output formats from Karpathy's ladder - (1) text in ASD-STE100 Simplified Technical English, machine-checked; (2) one-sheet diagram; (3) interactive web page; (4) narrated explainer video (3b1b style, HTML animation + TTS). Use when the user types /explain, asks to "explain X as a diagram / web page / video", wants an explainer, or asks for STE / Simplified Technical English output.
---

# explain

Topic and options: $ARGUMENTS

## 1. Pick formats

Args may start with format numbers, e.g. `/explain 1,4 how TCP handshakes work`.
If no number is given, ask with AskUserQuestion, two questions in one call:

- "要產生哪些格式？" multiSelect: true. Options:
  `1 文字 (STE)`, `2 示意圖`, `3 互動網頁`, `4 影片`.
- "語言？" options: `繁體中文`, `English`. Format 1 is always English (STE is
  a controlled English); the language applies to formats 2-4.

## 2. Build each chosen format

Read only the reference for each chosen format, then follow it:

| # | Reference | Output |
|---|-----------|--------|
| 1 | `references/text.md` | STE text in the reply, passed by `scripts/ste-check.mjs` |
| 2 | `references/diagram.md` | One-sheet SVG diagram, published as an Artifact |
| 3 | `references/web.md` | Interactive explainer page, published as an Artifact |
| 4 | `references/video.md` | `video.mp4` with narration, verified by ffprobe |

Paths are relative to this skill directory: `~/.claude/skills/explain/`.
Files for formats 2-4 go to `${EXPLAIN_OUT:-$HOME/Documents/explainers}/<topic-slug>/`.

When several formats are chosen, write one outline first (5-7 key points, in
order) and build every format from it, so they tell the same story.

## 3. Report

One line per format: what was made and where (path or Artifact link), plus the
check result (`ste-check` exit 0, `verify: ... OK`). If a check failed and
you could not fix it, say so.
