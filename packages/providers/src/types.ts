import type { Usage } from '@etk/core';

/** Unified AI provider interface. ALL model calls go through this. */
export type ProviderName = 'claude' | 'openai';

export interface CompletionRequest {
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface StructuredRequest<T> extends CompletionRequest {
  /** Name for logging/telemetry. */
  schemaName: string;
  /**
   * JSON Schema for the expected object. When supplied, the Claude provider
   * requests a guaranteed-structured response (forced tool use) instead of
   * parsing JSON out of prose. Providers that don't support it ignore it.
   */
  outputSchema?: Record<string, unknown>;
  /** Returned verbatim in mock mode (no API key) so the pipeline runs offline. */
  mock?: T;
}

export interface CompletionResult {
  text: string;
  usage: Usage;
  model: string;
  provider: ProviderName;
  mock: boolean;
}

export interface StructuredResult<T> {
  data: T;
  usage: Usage;
  model: string;
  provider: ProviderName;
  mock: boolean;
}

export interface AIProvider {
  readonly name: ProviderName;
  readonly model: string;
  readonly isMock: boolean;
  complete(req: CompletionRequest): Promise<CompletionResult>;
  completeStructured<T>(req: StructuredRequest<T>): Promise<StructuredResult<T>>;
}
