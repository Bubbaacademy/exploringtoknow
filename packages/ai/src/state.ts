import type {
  ProductInput, Intelligence, ContentBrief, GeneratedArticle, QaResult, BrandProfile, ArticleType,
} from '@etk/core';

/**
 * State threaded through the content pipeline graph. The worker seeds `product`;
 * each node fills its slice. `cost` accumulates token usage across the run.
 */
export interface ContentState {
  product: ProductInput;
  brand: BrandProfile;
  /**
   * Editorially requested article format. When set, the brief node adopts it
   * instead of the format the model would have chosen, so an operator can ask
   * for a `review` of a product that already has a problem/solution piece.
   * Left undefined, the pipeline behaves exactly as before.
   */
  requestedType?: ArticleType;
  intelligence?: Intelligence;
  brief?: ContentBrief;
  article?: GeneratedArticle;
  qa?: QaResult;
  feedback?: string[];                 // revision instructions from regeneration
  attempts: { article: number; max: number };
  flagged?: boolean;
  cost: Array<{ label: string; model: string; inputTokens: number; outputTokens: number }>;
}
