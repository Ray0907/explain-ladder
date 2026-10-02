# Format 4: narrated explainer video

Audio sets the clock; the animation follows it. Never time the animation first.

Working example: `examples/ste-video/` (scenes.json, index.html, video.mp4).
Read its `index.html` before writing a new one.

## Steps

1. Output dir `D` = `${EXPLAIN_OUT:-$HOME/Documents/explainers}/<slug>/`.
2. Write `D/scenes.json`: 4-8 scenes, one idea each, narration 1-3 short
   sentences per scene. Format is in the header of `scripts/make-video.mjs`.
3. Voice: `node scripts/make-video.mjs voice D`
   -> `D/timeline.json` with the start and duration of each scene.
   Uses ElevenLabs when `ELEVENLABS_API_KEY` is set (voice from
   `ELEVENLABS_VOICE_ID`), else macOS `say` (zh: Meijia).
4. Write `D/index.html` (1280x720 frame, 3b1b style: dark ground, one idea on
   screen, motion that shows the mechanism). Contract:
   - Read `window.TIMELINE` (injected) and set `--s` / `--d` on each scene,
     with a fallback timeline so the page plays in a normal tab.
   - All motion is CSS animation (or WAAPI) with `animation-delay` from the
     scene start. No `setTimeout`, no `requestAnimationFrame`, no
     `display: none` toggles: render seeks animations, it does not wait.
   - Time each visual beat to the word in the narration it shows.
5. Render: `node scripts/make-video.mjs render D`
   -> `D/video.mp4` and `D/poster.jpg`. It must print `verify: ... OK`.
6. Look at 3-4 frames before reporting
   (`ffmpeg -ss <t> -i D/video.mp4 -frames:v 1 <out>.jpg`, then Read).
   A blank or wrong frame means the page broke the contract.

Options: `EXPLAIN_FPS` (default 30), `EXPLAIN_SIZE` (default 1280x720).
Report the mp4 path and suggest `open D/video.mp4`.
