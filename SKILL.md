---
name: explain
description: Explain any topic in one or more output formats from Karpathy's ladder - (1) text in ASD-STE100 Simplified Technical English, machine-checked; (2) one-sheet diagram; (3) interactive web page; (4) narrated explainer video (3b1b style, HTML animation + TTS). Use when the user types /explain, asks to "explain X as a diagram / web page / video", wants an explainer, or asks for STE / Simplified Technical English output.
---

# explain

Topic and options: $ARGUMENTS

## Requirements

- Node >= 22. Run `pnpm install` once in the skill directory (installs `playwright-core`).
- Google Chrome (playwright-core drives it for screenshots and video render).
- Format 4: `ffmpeg` (with `ffprobe`). Voice order: ElevenLabs (if
  `ELEVENLABS_API_KEY` is set), local Kokoro via `uv`, then macOS `say`.
  Kokoro supports Mandarin (`zh-TW`) and English (`en`), with no global Python
  install. First use downloads models to `${XDG_CACHE_HOME:-$HOME/.cache}/explain-kokoro/`.
  Set `EXPLAIN_TTS=elevenlabs|kokoro|say` to force one engine (errors do not fall back).
- Claude Code tools: AskUserQuestion and Artifact. Other agents: ask the same
  questions in plain text, and write the HTML file to the output dir instead of
  publishing an Artifact.

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

All paths in this skill are relative to the directory that holds this SKILL.md
(run scripts as `node <that dir>/scripts/...`).
Files for formats 2-4 go to `${EXPLAIN_OUT:-$HOME/Documents/explainers}/<topic-slug>/`.

When several formats are chosen, write one outline first (5-7 key points, in
order) and build every format from it, so they tell the same story.

## 3. Report

One line per format: what was made and where (path or Artifact link), plus the
check result (`ste-check` exit 0, `verify: ... OK`). If a check failed and
you could not fix it, say so.
