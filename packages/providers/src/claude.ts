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
    const r = await this.complete({ ...req, temperature: req.temperature ?? 0.4 });
    return { data: extractJson<T>(r.text), usage: r.usage, model: this.model, provider: 'claude', mock: false };
  }
}
