#!/usr/bin/env node
// Narrated explainer video: audio sets the clock, HTML animation follows it.
//
//   make-video.mjs voice  <dir>   scenes.json -> audio/*.wav, narration.wav, timeline.json
//   make-video.mjs render <dir>   index.html + timeline.json -> video.mp4 (+ poster.jpg)
//
// scenes.json: { "lang": "zh-TW" | "en", "voice"?: string,
//                "scenes": [{ "id": "intro", "narration": "..." }] }
// Page contract: render injects window.TIMELINE = { total, scenes: [{ id, start, duration }] }
// (seconds) before load. All motion must be CSS animations or WAAPI with t=0 = video start;
// render seeks every animation per frame, so the output is deterministic.
// Voice: ElevenLabs (with key) -> local Kokoro -> macOS say; EXPLAIN_TTS forces an engine.
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'

const GAP_SECONDS = 0.5
const FPS = Number(process.env.EXPLAIN_FPS ?? 30)
const [WIDTH, HEIGHT] = (process.env.EXPLAIN_SIZE ?? '1280x720').split('x').map(Number)
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb'

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

function probeDuration(path) {
	const out = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
		'-of', 'csv=p=0', path])
	return Number(out.toString().trim())
}

async function speakEleven(text, path_out) {
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`
		+ '?output_format=mp3_44100_128'
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
		body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
	})
	if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`)
	writeFileSync(path_out, Buffer.from(await response.arrayBuffer()))
}

function speakSay(text, path_out, lang, voice) {
	const name_voice = voice ?? (lang.startsWith('zh') ? 'Meijia' : null)
	run('say', [...(name_voice ? ['-v', name_voice] : []), '-o', path_out, text])
}

function speakKokoro(text, path_out, lang) {
	const script = fileURLToPath(new URL('./kokoro-say.py', import.meta.url))
	const output = run('uv', ['run', '--script', script, text, path_out, lang])
	console.error(output.toString().trim())
}

async function voice(dir) {
	const config = readJson(join(dir, 'scenes.json'))
	const dir_audio = join(dir, 'audio')
	mkdirSync(dir_audio, { recursive: true })
	const forced = process.env.EXPLAIN_TTS
	if (forced && !['elevenlabs', 'kokoro', 'say'].includes(forced)) {
		throw new Error('EXPLAIN_TTS must be elevenlabs, kokoro, or say')
	}
	const engines = forced ? [forced] : [
		...(process.env.ELEVENLABS_API_KEY ? ['elevenlabs'] : []), 'kokoro', 'say',
	]
	const scenes = []
	let time_cursor = 0
	for (const [index, scene] of config.scenes.entries()) {
		let path_raw
		const path_wav = join(dir_audio, `${index}-${scene.id}.wav`)
		while (engines.length) {
			const engine = engines[0]
			const extension = { elevenlabs: 'mp3', kokoro: 'raw.wav', say: 'aiff' }[engine]
			path_raw = join(dir_audio, `${index}-${scene.id}.${extension}`)
			try {
				if (engine === 'elevenlabs') {
					if (!process.env.ELEVENLABS_API_KEY) throw new Error('Missing ELEVENLABS_API_KEY')
					await speakEleven(scene.narration, path_raw)
				} else if (engine === 'kokoro') {
					speakKokoro(scene.narration, path_raw, config.lang ?? 'en')
				} else speakSay(scene.narration, path_raw, config.lang ?? 'en', config.voice)
				break
			} catch (error) {
				if (forced || engines.length === 1) throw error
				console.error(`${engine} failed: ${error.message}; trying ${engines[1]}`)
				engines.shift()
			}
		}
		run('ffmpeg', ['-y', '-i', path_raw, '-af', `apad=pad_dur=${GAP_SECONDS}`,
			'-ar', '44100', '-ac', '1', path_wav])
		const duration = probeDuration(path_wav)
		scenes.push({ id: scene.id, start: time_cursor, duration })
		time_cursor += duration
	}
	const list = scenes.map((s, i) => `file '${join(dir_audio, `${i}-${s.id}.wav`)}'`)
	writeFileSync(join(dir_audio, 'list.txt'), list.join('\n'))
	run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', join(dir_audio, 'list.txt'),
		'-c', 'copy', join(dir, 'narration.wav')])
	const timeline = { total: time_cursor, scenes }
	writeFileSync(join(dir, 'timeline.json'), JSON.stringify(timeline, null, '\t'))
	console.log(`voice: ${scenes.length} scenes, ${time_cursor.toFixed(1)}s`
		+ ` (${engines[0]}) -> timeline.json`)
}

function startEncoder(dir) {
	const encoder = spawn('ffmpeg', ['-y', '-loglevel', 'error',
		'-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
		'-i', join(dir, 'narration.wav'),
		'-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
		'-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart',
		join(dir, 'video.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] })
	const done = new Promise((ok, fail) => encoder.on('close', (code) => (
		code === 0 ? ok() : fail(new Error(`ffmpeg exit ${code}`)))))
	return { stdin: encoder.stdin, done }
}

async function openPage(dir, timeline) {
	const browser = await chromium.launch({ channel: 'chrome' })
	const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } })
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.addInitScript((data) => { window.TIMELINE = data }, timeline)
	await page.goto(pathToFileURL(join(dir, 'index.html')).href, { waitUntil: 'load' })
	await page.evaluate(() => document.fonts.ready)
	if (errors.length) throw new Error(`page error: ${errors.join('; ')}`)
	return { browser, page }
}

async function render(dir) {
	const timeline = readJson(join(dir, 'timeline.json'))
	const { browser, page } = await openPage(dir, timeline)
	const count_frame = Math.ceil(timeline.total * FPS)
	const index_poster = Math.floor(count_frame * 0.4)
	const encoder = startEncoder(dir)
	for (let index = 0; index < count_frame; index++) {
		await page.evaluate((ms) => {
			for (const animation of document.getAnimations()) {
				animation.pause()
				animation.currentTime = ms
			}
		}, (index / FPS) * 1000)
		const frame = await page.screenshot({ type: 'jpeg', quality: 92 })
		if (index === index_poster) writeFileSync(join(dir, 'poster.jpg'), frame)
		if (!encoder.stdin.write(frame)) await new Promise((ok) => encoder.stdin.once('drain', ok))
		if (index % (FPS * 10) === 0) console.error(`render: ${index}/${count_frame} frames`)
	}
	encoder.stdin.end()
	await encoder.done
	await browser.close()
	verify(dir, timeline.total)
}

// Deterministic acceptance: both streams exist, length matches narration.
function verify(dir, total_expected) {
	const out = run('ffprobe', ['-v', 'error', '-show_entries',
		'stream=codec_type:format=duration', '-of', 'json', join(dir, 'video.mp4')])
	const info = JSON.parse(out.toString())
	const types = info.streams.map((s) => s.codec_type).sort().join(',')
	const duration = Number(info.format.duration)
	const is_ok = types === 'audio,video' && Math.abs(duration - total_expected) < 0.5
	console.log(`verify: streams=${types} duration=${duration.toFixed(2)}s`
		+ ` expected=${total_expected.toFixed(2)}s ${is_ok ? 'OK' : 'FAIL'}`)
	if (!is_ok) process.exit(1)
}

const [command, dir_arg] = process.argv.slice(2)
const commands = { voice, render }
if (!commands[command] || !dir_arg) {
	console.error('usage: make-video.mjs voice|render <dir>')
	process.exit(2)
}
await commands[command](resolve(dir_arg))
