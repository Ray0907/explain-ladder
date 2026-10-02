#!/usr/bin/env node
// Usage: ste-check.mjs [file ...]   (reads stdin when no file is given)
//        ste-check.mjs --json [file]
// Exit 1 when any error-level finding exists; warnings do not fail.
import { readFileSync } from 'node:fs'
import { check } from './ste-rules.mjs'

const args = process.argv.slice(2)
const is_json = args.includes('--json')
const files = args.filter((a) => a !== '--json')
const inputs = files.length
	? files.map((path) => ({ path, text: readFileSync(path, 'utf8') }))
	: [{ path: '<stdin>', text: readFileSync(0, 'utf8') }]

const findings = inputs.flatMap(({ path, text }) => check(text).map((f) => ({ path, ...f })))
const count_error = findings.filter((f) => f.severity === 'error').length

if (is_json) {
	console.log(JSON.stringify(findings, null, '\t'))
} else {
	for (const f of findings) {
		console.log(`${f.path}:${f.line}  ${f.severity}  ${f.rule}  ${f.message}`)
		console.log(`    > ${f.excerpt}`)
	}
	console.log(`${count_error} error(s), ${findings.length - count_error} warning(s)`)
}
process.exit(count_error ? 1 : 0)
