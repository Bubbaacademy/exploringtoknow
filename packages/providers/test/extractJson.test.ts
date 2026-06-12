/* Focused tests for extractJson (run: pnpm --filter @etk/providers run test:json). */
import { extractJson } from '../src/util';

let fails = 0;
function ok(cond: boolean, msg: string) { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) fails += 1; }
function eq(a: unknown, b: unknown, msg: string) { ok(JSON.stringify(a) === JSON.stringify(b), msg); }

// 1) plain JSON
eq(extractJson('{"a":1,"b":"x"}'), { a: 1, b: 'x' }, 'plain JSON object');

// 2) ```json fenced
eq(extractJson('```json\n{"a":1}\n```'), { a: 1 }, 'json-fenced object');

// 3) generic ``` fenced
eq(extractJson('```\n{"a":2}\n```'), { a: 2 }, 'generic-fenced object');

// 4) short preamble + trailing prose
eq(extractJson('Here is the result:\n{"a":3,"nested":{"k":"}{"}}\nThanks!'), { a: 3, nested: { k: '}{' } }, 'preamble/suffix + braces inside string');

// 5) invalid non-JSON throws a concise error
let threw = false;
try { extractJson('I could not complete that.'); } catch (e) { threw = /no JSON object found/.test(String(e)); }
ok(threw, 'invalid non-JSON throws concise error');

console.log(fails ? `\nJSON_TEST=FAIL (${fails})` : '\nJSON_TEST=PASS');
process.exit(fails ? 1 : 0);
