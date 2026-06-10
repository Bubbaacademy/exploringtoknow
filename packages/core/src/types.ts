// Shared cross-package types.

export type OfferType =
  | 'owned_amazon' | 'amazon_affiliate' | 'non_amazon_affiliate'
  | 'bubba_logistics' | 'bubba_china' | 'bubba_academy'
  | 'digital' | 'lead_gen';

export type JobType =
  | 'product_intelligence' | 'content_brief' | 'generate_article'
  | 'quality_gate' | 'generate_social' | 'publish_article'
  | 'publish_social' | 'refresh_suggestion';

export type ArticleType =
  | 'how_to' | 'buying_guide' | 'review' | 'comparison'
  | 'best_list' | 'faq' | 'problem_solution' | 'educational';

/** Minimal product snapshot the AI pipeline consumes (loaded from catalog). */
export interface ProductInput {
  id: string;
  title: string;
  offerType: OfferType;
  brand?: string;
  categories?: string[];
  price?: number;          // minor units (cents)
  externalUrl?: string;
  notes?: string;
}

export interface Intelligence {
  personas: string[];
  painPoints: string[];
  benefits: string[];
  features: string[];
  useCases: string[];
  competitorThemes: string[];
  searchIntent: string;
  ctaRecommendations: string[];
}

export interface ContentBrief {
  titleOptions: string[];
  chosenTitle: string;
  angle: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  internalLinkPlan: string[];
  ctaStrategy: string;
  affiliatePlacement: string;
  articleType: ArticleType;
}

export interface GeneratedArticle {
  title: string;
  type: ArticleType;
  markdown: string;
  metaTitle: string;
  metaDescription: string;
  sections: string[];      // section headings, for targeted regeneration
}

export interface QaResult {
  passed: boolean;
  reasons: string[];       // failure reasons (empty when passed)
  checks: Record<string, boolean>;
}

/** Token usage returned by a provider call. */
export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

/** Centralized brand voice/rules injected into every generation prompt. */
export interface BrandProfile {
  name: string;
  tone: string;            // e.g. "warm, authoritative, plainspoken"
  style: string;           // e.g. "Wirecutter/LoveToKnow editorial"
  readingLevel: string;    // e.g. "US grade 7-8"
  ctaStyle: string;        // e.g. "one clear CTA, no pressure"
  disclosureStyle: string; // e.g. "FTC affiliate disclosure near the top"
  forbiddenTerms: string[];// hard-blocked words (also enforced by the quality gate)
}
