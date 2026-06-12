/* Focused mocked tests for Claude structured output (forced tool use).
 * No real API calls — the Anthropic client is stubbed. */
import { ClaudeProvider } from '../src/claude';

process.env.ANTHROPIC_API_KEY = 'test-key'; // so the provider builds a (stubbed) client

let fails = 0;
function ok(c: boolean, m: string) { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails += 1; }

function providerWith(resp: unknown) {
  const p = new ClaudeProvider();
  const captured: { params?: any } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (p as any).client = { messages: { create: async (params: any) => { captured.params = params; return resp; } } };
  return { p, captured };
}

const SCHEMA = { type: 'object', additionalProperties: false, required: ['a'], properties: { a: { type: 'number' } } };
const usage = { input_tokens: 10, output_tokens: 5 };

async function main() {
  // 1) request includes the supplied JSON Schema via a forced tool, and valid JSON is returned
  {
    const { p, captured } = providerWith({ stop_reason: 'tool_use', usage, content: [{ type: 'tool_use', name: 'emit_result', input: { a: 7 } }] });
    const res = await p.completeStructured<{ a: number }>({ prompt: 'x', schemaName: 'T', outputSchema: SCHEMA });
    ok(captured.params?.tools?.[0]?.input_schema === SCHEMA, 'request sends outputSchema as tool input_schema');
    ok(captured.params?.tool_choice?.type === 'tool' && captured.params?.tool_choice?.name === 'emit_result', 'request forces tool_choice');
    ok(captured.params?.temperature === undefined, 'no temperature sent');
    ok(res.data && res.data.a === 7, 'valid structured JSON returned normally');
    ok(res.usage.inputTokens === 10 && res.usage.outputTokens === 5, 'usage mapped');
  }
  // 2) refusal rejected
  {
    const { p } = providerWith({ stop_reason: 'refusal', usage, content: [] });
    let threw = false;
    try { await p.completeStructured({ prompt: 'x', schemaName: 'T', outputSchema: SCHEMA }); } catch (e) { threw = /refus/i.test(String(e)); }
    ok(threw, 'refusal stop_reason is rejected');
  }
  // 3) max_tokens rejected
  {
    const { p } = providerWith({ stop_reason: 'max_tokens', usage, content: [] });
    let threw = false;
    try { await p.completeStructured({ prompt: 'x', schemaName: 'T', outputSchema: SCHEMA }); } catch (e) { threw = /truncat|max_tokens/i.test(String(e)); }
    ok(threw, 'max_tokens stop_reason is rejected');
  }
  // 4) missing content rejected
  {
    const { p } = providerWith({ stop_reason: 'tool_use', usage, content: [] });
    let threw = false;
    try { await p.completeStructured({ prompt: 'x', schemaName: 'T', outputSchema: SCHEMA }); } catch (e) { threw = /no structured content/i.test(String(e)); }
    ok(threw, 'missing text/tool content is rejected');
  }

  console.log(fails ? `\nSTRUCTURED_TEST=FAIL (${fails})` : '\nSTRUCTURED_TEST=PASS');
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { console.error('STRUCTURED_ERR', e?.stack || e); process.exit(1); });
