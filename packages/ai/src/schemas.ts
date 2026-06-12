/**
 * Smallest accurate JSON Schemas for each structured pipeline stage that calls
 * Claude. Field structure mirrors the @etk/core interfaces (Intelligence,
 * ContentBrief, GeneratedArticle) and the QA judge. Passed to the provider as
 * `outputSchema` so responses are guaranteed-valid structured JSON.
 */
const strArray = { type: 'array', items: { type: 'string' } } as const;

export const INTELLIGENCE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['personas', 'painPoints', 'benefits', 'features', 'useCases', 'competitorThemes', 'searchIntent', 'ctaRecommendations'],
  properties: {
    personas: strArray,
    painPoints: strArray,
    benefits: strArray,
    features: strArray,
    useCases: strArray,
    competitorThemes: strArray,
    searchIntent: { type: 'string' },
    ctaRecommendations: strArray,
  },
};

const ARTICLE_TYPES = ['how_to', 'buying_guide', 'review', 'comparison', 'best_list', 'faq', 'problem_solution', 'educational'];

export const BRIEF_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['titleOptions', 'chosenTitle', 'angle', 'primaryKeyword', 'secondaryKeywords', 'searchIntent', 'internalLinkPlan', 'ctaStrategy', 'affiliatePlacement', 'articleType'],
  properties: {
    titleOptions: strArray,
    chosenTitle: { type: 'string' },
    angle: { type: 'string' },
    primaryKeyword: { type: 'string' },
    secondaryKeywords: strArray,
    searchIntent: { type: 'string' },
    internalLinkPlan: strArray,
    ctaStrategy: { type: 'string' },
    affiliatePlacement: { type: 'string' },
    articleType: { type: 'string', enum: ARTICLE_TYPES },
  },
};

export const ARTICLE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'type', 'markdown', 'metaTitle', 'metaDescription', 'sections'],
  properties: {
    title: { type: 'string' },
    type: { type: 'string', enum: ARTICLE_TYPES },
    markdown: { type: 'string' },
    metaTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    sections: strArray,
  },
};

export const JUDGE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['passed', 'reasons'],
  properties: {
    passed: { type: 'boolean' },
    reasons: strArray,
  },
};
