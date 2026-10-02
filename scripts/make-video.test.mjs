import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./make-video.mjs', import.meta.url))
const root = fileURLToPath(new URL('../', import.meta.url))
const dir = mkdtempSync(join(root, '.tts-check-'))
try {
	writeFileSync(join(dir, 'scenes.json'), JSON.stringify({
		lang: 'en', scenes: [{ id: 'check', narration: 'Check the cache.' }],
	}))
	mkdirSync(join(dir, 'bin'))
	writeFileSync(join(dir, 'bin', 'uv'), '#!/bin/sh\necho "Test: Kokoro unavailable" >&2\nexit 1\n')
	chmodSync(join(dir, 'bin', 'uv'), 0o755)
	const env = { ...process.env, ELEVENLABS_API_KEY: '', EXPLAIN_TTS: '',
		PATH: join(dir, 'bin') + delimiter + process.env.PATH }
	const call = (engine) => spawnSync(process.execPath, [script, 'voice', dir], {
		env: { ...env, EXPLAIN_TTS: engine }, encoding: 'utf8',
	})
	const fallback = call('')
	assert.equal(fallback.status, 0, fallback.stderr)
	assert.match(fallback.stdout, /\(say\)/)
	assert.match(fallback.stderr, /Test: Kokoro unavailable/)
	assert.equal(call('say').status, 0)
	assert.notEqual(call('kokoro').status, 0)
	assert.notEqual(call('elevenlabs').status, 0)
	assert.notEqual(call('invalid').status, 0)
	const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries',
		'format=duration', '-of', 'csv=p=0', join(dir, 'narration.wav')]))
	assert.ok(duration > 0.5)
	console.log('voice: auto fallback, forced say, forced failures, valid duration OK')
} finally {
	rmSync(dir, { recursive: true, force: true })
}
