import type { SuggestedProvider } from '@etk/prompts';
import type { AIProvider, ProviderName } from './types';
import { ClaudeProvider } from './claude';
import { OpenAIProvider } from './openai';

function hasKey(p: ProviderName): boolean {
  return p === 'claude' ? Boolean(process.env.ANTHROPIC_API_KEY) : Boolean(process.env.OPENAI_API_KEY);
}

export function makeProvider(name: ProviderName, model?: string): AIProvider {
  return name === 'claude' ? new ClaudeProvider(model) : new OpenAIProvider(model);
}

/**
 * Resolve the provider for a prompt's suggested provider/model, applying
 * fallback: if the suggested provider has no key but the other does, use the
 * other. If neither has a key, use the suggested one in MOCK mode. This keeps
 * model routing centralized and resilient (impl pkg §6.1).
 */
export function resolveProvider(suggested: SuggestedProvider, model: string): AIProvider {
  if (hasKey(suggested)) return makeProvider(suggested, model);
  const other: ProviderName = suggested === 'claude' ? 'openai' : 'claude';
  if (hasKey(other)) return makeProvider(other); // default model for fallback provider
  return makeProvider(suggested, model); // mock mode
}
