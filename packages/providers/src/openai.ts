import OpenAI from 'openai';
import type { Usage } from '@etk/core';
import type {
  AIProvider, CompletionRequest, CompletionResult, StructuredRequest, StructuredResult,
} from './types';
import { extractJson, approxTokens } from './util';

/** OpenAI provider. Falls back to MOCK output when OPENAI_API_KEY is absent. */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;
  readonly isMock: boolean;
  private client?: OpenAI;

  constructor(readonly model = 'gpt-4o-mini') {
    const key = process.env.OPENAI_API_KEY;
    this.isMock = !key;
    if (key) this.client = new OpenAI({ apiKey: key });
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    if (!this.client) {
      const text = `[[mock:openai]] ${req.prompt.slice(0, 80)}`;
      return { text, usage: approxTokens(req.prompt, text), model: this.model, provider: 'openai', mock: true };
    }
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2048,
      messages: [
        ...(req.system ? [{ role: 'system' as const, content: req.system }] : []),
        { role: 'user' as const, content: req.prompt },
      ],
    });
    const text = res.choices[0]?.message?.content ?? '';
    const usage: Usage = {
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
    };
    return { text, usage, model: this.model, provider: 'openai', mock: false };
  }

  async completeStructured<T>(req: StructuredRequest<T>): Promise<StructuredResult<T>> {
    if (!this.client) {
      if (req.mock === undefined) throw new Error(`mock provider needs req.mock for ${req.schemaName}`);
      return { data: req.mock, usage: approxTokens(req.prompt, JSON.stringify(req.mock)), model: this.model, provider: 'openai', mock: true };
    }
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: req.temperature ?? 0.4,
      response_format: { type: 'json_object' },
      messages: [
        ...(req.system ? [{ role: 'system' as const, content: req.system }] : []),
        { role: 'user' as const, content: req.prompt },
      ],
    });
    const text = res.choices[0]?.message?.content ?? '{}';
    const usage: Usage = {
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
    };
    return { data: extractJson<T>(text), usage, model: this.model, provider: 'openai', mock: false };
  }
}
