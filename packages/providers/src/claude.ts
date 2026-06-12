import Anthropic from '@anthropic-ai/sdk';
import type { Usage } from '@etk/core';
import type {
  AIProvider, CompletionRequest, CompletionResult, StructuredRequest, StructuredResult,
} from './types';
import { extractJson, approxTokens } from './util';

/** Claude provider. Falls back to MOCK output when ANTHROPIC_API_KEY is absent. */
export class ClaudeProvider implements AIProvider {
  readonly name = 'claude' as const;
  readonly isMock: boolean;
  private client?: Anthropic;

  constructor(readonly model = 'claude-sonnet-4-6') {
    const key = process.env.ANTHROPIC_API_KEY;
    this.isMock = !key;
    if (key) this.client = new Anthropic({ apiKey: key });
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    if (!this.client) {
      const text = `[[mock:claude]] ${req.prompt.slice(0, 80)}`;
      return { text, usage: approxTokens(req.prompt, text), model: this.model, provider: 'claude', mock: true };
    }
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: req.maxTokens ?? 2048,
      // `temperature` is omitted: the configured Claude model rejects it
      // (Anthropic 400 "temperature is deprecated for this model").
      system: req.system,
      messages: [{ role: 'user', content: req.prompt }],
    });
    const text = res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('');
    const usage: Usage = { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens };
    return { text, usage, model: this.model, provider: 'claude', mock: false };
  }

  async completeStructured<T>(req: StructuredRequest<T>): Promise<StructuredResult<T>> {
    if (!this.client) {
      if (req.mock === undefined) throw new Error(`mock provider needs req.mock for ${req.schemaName}`);
      return { data: req.mock, usage: approxTokens(req.prompt, JSON.stringify(req.mock)), model: this.model, provider: 'claude', mock: true };
    }

    // Structured output via forced tool use: the model must call `emit_result`
    // with input matching outputSchema, so the response is guaranteed-valid JSON
    // (the SDK 0.32.1 / configured model have no `output_config` API).
    if (req.outputSchema) {
      const res = await this.client.messages.create({
        model: this.model,
        max_tokens: req.maxTokens ?? 4096,
        system: req.system,
        messages: [{ role: 'user', content: req.prompt }],
        tools: [{
          name: 'emit_result',
          description: `Return the ${req.schemaName} as a single structured object.`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input_schema: req.outputSchema as any,
        }],
        tool_choice: { type: 'tool', name: 'emit_result' },
      });
      const usage: Usage = { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens };
      // Terminal conditions — never persist partial/fabricated data.
      if ((res.stop_reason as string) === 'refusal') {
        throw new Error(`anthropic refused to produce ${req.schemaName} (stop_reason=refusal)`);
      }
      if (res.stop_reason === 'max_tokens') {
        throw new Error(`anthropic response truncated for ${req.schemaName} (stop_reason=max_tokens)`);
      }
      const tool = res.content.find((b) => b.type === 'tool_use');
      if (tool && tool.type === 'tool_use') {
        return { data: tool.input as T, usage, model: this.model, provider: 'claude', mock: false };
      }
      // Defensive fallback only: a JSON text block if no tool_use was returned.
      const text = res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('');
      if (text.trim()) {
        return { data: extractJson<T>(text), usage, model: this.model, provider: 'claude', mock: false };
      }
      throw new Error(`anthropic returned no structured content for ${req.schemaName} (stop_reason=${res.stop_reason})`);
    }

    // Legacy path (no schema): parse JSON out of a plain completion.
    const r = await this.complete({ ...req });
    return { data: extractJson<T>(r.text), usage: r.usage, model: this.model, provider: 'claude', mock: false };
  }
}
