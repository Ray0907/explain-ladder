// Self-check for ste-rules.mjs. Run: node scripts/ste-check.test.mjs
//
// Ways the checker can fail (written before the code):
// 1. Miss: procedure sentence > 20 words passes.
// 2. Miss: descriptive sentence > 25 words passes.
// 3. False alarm: 21-24 word descriptive sentence treated as procedure.
// 4. Miss: passive "must be closed" in a procedure.
// 5. Miss: progressive "is closing" / perfect "has closed".
// 6. False alarm: "is nothing" / "has need" read as progressive / perfect.
// 7. Miss: unapproved word inside mixed case ("Utilize", "Prior to").
// 8. False alarm: unapproved word as substring ("ensured" ok to flag, "insure" not).
// 9. Miss: two instructions joined by "and" in one procedure sentence.
// 10. False alarm: words inside code fences or `inline code` are checked.
// 11. Miss: paragraph with > 6 sentences.
// 12. Wrong line number reported for a finding.
// 13. Abbreviation "e.g." splits a sentence in two.
import assert from 'node:assert/strict'
import { check } from './ste-rules.mjs'

const rulesOf = (text) => check(text).map((f) => f.rule)

const long_procedure = 'Remove the four bolts from the cover plate of the pump '
	+ 'with the special torque wrench that is in the tool kit box.'
assert.ok(rulesOf(long_procedure).includes('length'), 'case 1')

const long_descriptive = Array(26).fill('word').join(' ') + '.'
assert.ok(rulesOf(long_descriptive).includes('length'), 'case 2')

const mid_descriptive = 'The pump supplies fuel to the engine when the switch '
	+ 'is on and the main valve in the left tank is open now.'
assert.ok(!rulesOf(mid_descriptive).includes('length'), 'case 3')

assert.ok(rulesOf('The valve must be closed.').includes('passive'), 'case 4')
assert.ok(rulesOf('The valve is closing.').includes('progressive'), 'case 5a')
assert.ok(rulesOf('The valve has closed.').includes('perfect'), 'case 5b')

assert.deepEqual(rulesOf('There is nothing here.'), [], 'case 6a')
assert.deepEqual(rulesOf('The team has need of it.'), [], 'case 6b')

assert.ok(rulesOf('Utilize a torque wrench.').includes('word'), 'case 7a')
assert.ok(rulesOf('Prior to the test, stop.').includes('word'), 'case 7b')
assert.deepEqual(rulesOf('Insure the car.'), [], 'case 8')
assert.ok(rulesOf('Stop before commencing.').includes('word'), 'case 7c')

assert.ok(
	rulesOf('Open the valve and remove the cap.').includes('one-instruction'),
	'case 9',
)

const code_text = 'Run `utilize --prior-to`.\n\n```\nensure commence prior to\n```'
assert.deepEqual(rulesOf(code_text), [], 'case 10')

const seven = Array(7).fill('The pump is on.').join(' ')
assert.ok(rulesOf(seven).includes('paragraph'), 'case 11')

const finding = check('First line.\n\nUtilize the tool.')[0]
assert.equal(finding.line, 3, 'case 12')

assert.equal(
	check('Use a soft tool, e.g. a brush, to clean the part.').length,
	0,
	'case 13',
)

console.log('ste-check self-test: 14 cases OK')
