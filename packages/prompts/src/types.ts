/** Centralized Prompt Registry — types. No prompt text lives in nodes. */

export type PromptCategory =
  | 'product_intelligence'
  | 'content_brief'
  | 'article_generation'
  | 'brand_voice'      // used by the quality gate
  | 'regeneration';

export type SuggestedProvider = 'claude' | 'openai';

export interface PromptMetadata {
  author: string;
  createdAt: string;            // ISO date
  tags: string[];
  suggestedProvider: SuggestedProvider;
  suggestedModel: string;
  /** Free-form description of expected output (documentation only). */
  outputContract: string;
}

/** A single rendered prompt: a system preamble + the user message. */
export interface RenderedPrompt {
  system: string;
  prompt: string;
}

/**
 * A versioned prompt definition. `render` is pure: vars in → strings out.
 * `id` is stable and human-readable, e.g. "product_intelligence@1".
 */
export interface PromptDef<V = Record<string, unknown>> {
  id: string;
  category: PromptCategory;
  version: number;
  description: string;
  metadata: PromptMetadata;
  render: (vars: V) => RenderedPrompt;
}
