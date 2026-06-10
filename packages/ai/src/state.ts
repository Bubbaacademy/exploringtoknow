import type {
  ProductInput, Intelligence, ContentBrief, GeneratedArticle, QaResult, BrandProfile,
} from '@etk/core';

/**
 * State threaded through the content pipeline graph. The worker seeds `product`;
 * each node fills its slice. `cost` accumulates token usage across the run.
 */
export interface ContentState {
  product: ProductInput;
  brand: BrandProfile;
  intelligence?: Intelligence;
  brief?: ContentBrief;
  article?: GeneratedArticle;
  qa?: QaResult;
  feedback?: string[];                 // revision instructions from regeneration
  attempts: { article: number; max: number };
  flagged?: boolean;
  cost: Array<{ label: string; model: string; inputTokens: number; outputTokens: number }>;
}
