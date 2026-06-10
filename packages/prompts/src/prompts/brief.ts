import type { PromptDef } from '../types';
import type { ProductInput, Intelligence, BrandProfile } from '@etk/core';
import { brandPreamble } from '../brand';

export interface BriefVars { product: ProductInput; intelligence: Intelligence; brand: BrandProfile; }

export const briefV1: PromptDef<BriefVars> = {
  id: 'content_brief@1',
  category: 'content_brief',
  version: 1,
  description: 'Turn product intelligence into an SEO content brief that drives one article.',
  metadata: {
    author: 'etk', createdAt: '2026-06-10', tags: ['brief', 'seo', 'strategy'],
    suggestedProvider: 'claude', suggestedModel: 'claude-sonnet-4-6',
    outputContract: 'JSON ContentBrief: titleOptions[], chosenTitle, angle, primaryKeyword, secondaryKeywords[], searchIntent, internalLinkPlan[], ctaStrategy, affiliatePlacement, articleType',
  },
  render: ({ product, intelligence, brand }) => ({
    system:
      `${brandPreamble(brand)}\n\n` +
      'You are an SEO content strategist for an editorial review site. Return ONLY valid minified JSON. No prose.',
    prompt:
      `Create a content brief for an article about: ${product.title} (${product.offerType}).\n` +
      `INTELLIGENCE:\n` +
      `- searchIntent: ${intelligence.searchIntent}\n` +
      `- painPoints: ${intelligence.painPoints.join('; ')}\n` +
      `- benefits: ${intelligence.benefits.join('; ')}\n` +
      `- ctaRecommendations: ${intelligence.ctaRecommendations.join('; ')}\n` +
      `\nReturn JSON keys: titleOptions (3-5 strings), chosenTitle, angle, primaryKeyword, ` +
      `secondaryKeywords (string array), searchIntent, internalLinkPlan (string array of topics to link), ` +
      `ctaStrategy, affiliatePlacement, articleType (one of: how_to, buying_guide, review, comparison, ` +
      `best_list, faq, problem_solution, educational).`,
  }),
};
