import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = fileURLToPath(new URL('../', import.meta.url))
const server = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], {
	cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
})
let browser
try {
	for (let attempt = 0; attempt < 50; attempt++) {
		try {
			await fetch('http://127.0.0.1:8765/checker.html')
			break
		} catch { await new Promise((resolve) => setTimeout(resolve, 100)) }
	}
	browser = await chromium.launch({ channel: 'chrome' })
	for (const fallback of [false, true]) {
		const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
		const errors = []
		page.on('pageerror', (error) => errors.push(error.message))
		if (fallback) await page.addInitScript(() => {
			const supports = CSS.supports.bind(CSS)
			CSS.supports = (...args) => args[0] === 'field-sizing' ? false : supports(...args)
		})
		await page.goto('http://127.0.0.1:8765/checker.html')
		await page.locator('#summary .pill').first().waitFor()
		await page.locator('#input').fill('Short text.')
		if (fallback) {
			assert.equal(await page.locator('#input').evaluate((el) => el.style.height), '320px')
			await page.locator('#input').fill('Long text.\n'.repeat(80))
			assert.equal(await page.locator('#input').evaluate((el) => el.style.height), '560px')
		}
		assert.deepEqual(errors, [])
		await page.close()
	}
	console.log('checker: Chrome native + forced Safari fallback, 320..560px, no page errors OK')
} finally {
	await browser?.close()
	server.kill()
}
