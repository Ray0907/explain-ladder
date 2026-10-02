// ASD-STE100 rule subset that a machine can check. Pure ES module: used by
// the CLI (ste-check.mjs) and the browser checker (checker.html).
// ponytail: regex heuristics, no POS tagger. Noun clusters are not checked;
// add a tagger only if false alarms from these regexes become a real cost.

export const LIMITS = { procedure: 20, descriptive: 25, paragraph: 6 }

// Unapproved word -> approved alternative. Subset of the STE dictionary plus
// plain-English swaps it implies. Extend when real output shows a new miss.
export const UNAPPROVED = {
	'approximately': 'about',
	'assist': 'help',
	'attempt': 'try',
	'commence': 'start',
	'due to': 'because of',
	'ensure': 'make sure',
	'facilitate': 'help',
	'in order to': 'to',
	'in the event of': 'if',
	'initiate': 'start',
	'numerous': 'many',
	'obtain': 'get',
	'perform': 'do',
	'prior to': 'before',
	'replenish': 'fill',
	'subsequently': 'then',
	'sufficient': 'enough',
	'terminate': 'stop',
	'utilise': 'use',
	'utilize': 'use',
}

// Imperative verbs that open a procedure sentence.
const IMPERATIVE = new Set((
	'add adjust apply attach check clean click close connect copy create cut '
	+ 'delete disconnect do drain enter examine fill find get give go hold '
	+ 'install keep let lift loosen lower make measure move open press pull push '
	+ 'put read record release remove replace reset restart run select send set '
	+ 'start stop tighten try turn type update use wait write'
).split(' '))

const IRREGULAR = 'done|made|given|taken|shown|written|seen|known|found|built|'
	+ 'sent|kept|held|told|broken|chosen|driven|hidden|worn|cut|set|put|run'
const BE = '(?:am|is|are|was|were|be|been|being)'
const ADVERB = '(?:\\w+ly\\s+)?'
// "-ed" participles, minus words like "need", "speed", "red".
const PARTICIPLE = `(?:(?!\\w*eed\\b)\\w{2,}ed|${IRREGULAR})`
const NOT_ING = 'thing|nothing|something|anything|everything|string|spring|'
	+ 'ring|king|morning|evening|ceiling|during'

const PATTERNS = [
	{
		rule: 'passive',
		re: new RegExp(`\\b${BE}\\s+${ADVERB}${PARTICIPLE}\\b`, 'i'),
		message: 'Passive voice. Use active voice (who does what).',
	},
	{
		rule: 'progressive',
		re: new RegExp(`\\b${BE}\\s+${ADVERB}(?!(?:${NOT_ING})\\b)\\w{3,}ing\\b`, 'i'),
		message: 'Progressive (-ing) tense is not approved. Use simple tense.',
	},
	{
		rule: 'perfect',
		re: new RegExp(`\\b(?:has|have|had)\\s+${ADVERB}${PARTICIPLE}\\b`, 'i'),
		message: 'Perfect tense is not approved. Use simple past.',
	},
]

const WORD_RES = Object.entries(UNAPPROVED).map(([word, alt]) => ({
	word,
	alt,
	// Drop a final "e" so "commence" also matches "commencing".
	re: new RegExp(`\\b${word.replace(/e$/, '').replace(/ /g, '\\s+')}\\w*\\b`, 'i'),
}))

const WARNING_PREFIX = /^(?:WARNING|CAUTION|NOTE):\s*/
const LIST_PREFIX = /^\s*(?:[-*+]|\d+[.)])\s+/

export function countWords(sentence) {
	return (sentence.match(/[A-Za-z0-9][A-Za-z0-9'’.-]*/g) ?? []).length
}

export function isProcedure(sentence) {
	const body = sentence.replace(LIST_PREFIX, '').replace(WARNING_PREFIX, '')
	const first_word = (body.match(/^[A-Za-z]+/)?.[0] ?? '').toLowerCase()
	return IMPERATIVE.has(first_word) || /^do not\b/i.test(body)
}

// Split on sentence end only when the next sentence starts upper-case,
// so "e.g. a brush" stays one sentence.
function splitSentences(text) {
	return text.split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/).map((s) => s.trim()).filter(Boolean)
}

// Yield { text, line, is_list } blocks; code is blanked out, headings dropped.
function toBlocks(text) {
	const lines = text.split('\n')
	const blocks = []
	let in_fence = false
	let current = null
	lines.forEach((line_raw, index) => {
		if (/^\s*```/.test(line_raw)) {
			in_fence = !in_fence
			current = null
			return
		}
		const raw = line_raw.replace(/`[^`]*`/g, '')
		const is_skip = in_fence || /^\s*#/.test(raw) || raw.trim() === ''
		const is_list = LIST_PREFIX.test(raw)
		if (is_skip || is_list) current = null
		if (is_skip) return
		if (is_list) {
			blocks.push({ text: raw.trim(), line: index + 1, is_list: true })
			return
		}
		if (!current) {
			current = { text: '', line: index + 1, is_list: false }
			blocks.push(current)
		}
		current.text = `${current.text} ${raw.trim()}`.trim()
	})
	return blocks
}

function checkSentence(sentence, line) {
	const is_procedure = isProcedure(sentence)
	const findings = []
	// match: the exact text that broke the rule, for highlighting.
	const add = (rule, severity, message, match = null) => findings.push({
		line, rule, severity, message, excerpt: sentence, match,
	})
	const kind = is_procedure ? 'procedure' : 'descriptive'
	const words = countWords(sentence)
	if (words > LIMITS[kind]) {
		add('length', 'error', `${words} words; ${kind} limit is ${LIMITS[kind]}.`)
	}
	for (const { rule, re, message } of PATTERNS) {
		// Passive is allowed in descriptive text when necessary: warn only.
		const severity = rule === 'passive' && !is_procedure ? 'warn' : 'error'
		const hit = sentence.match(re)
		if (hit) add(rule, severity, message, hit[0])
	}
	for (const { word, alt, re } of WORD_RES) {
		const hit = sentence.match(re)
		if (hit) add('word', 'error', `"${hit[0]}" is not approved. Use "${alt}".`, hit[0])
	}
	const verbs = [...IMPERATIVE].join('|')
	if (is_procedure && new RegExp(`(?:\\band|\\bthen|;)\\s+(?:${verbs})\\b`, 'i').test(sentence)) {
		add('one-instruction', 'warn', 'One instruction per sentence (unless simultaneous).')
	}
	return findings
}

export function check(text) {
	return toBlocks(text).flatMap((block) => {
		const sentences = splitSentences(block.text)
		const findings = sentences.flatMap((s) => checkSentence(s, block.line))
		if (!block.is_list && sentences.length > LIMITS.paragraph) {
			findings.push({
				line: block.line,
				rule: 'paragraph',
				severity: 'error',
				message: `${sentences.length} sentences; paragraph limit is ${LIMITS.paragraph}.`,
				excerpt: block.text.slice(0, 80),
			})
		}
		return findings
	})
}
