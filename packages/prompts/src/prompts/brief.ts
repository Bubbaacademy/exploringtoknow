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

export const briefV2: PromptDef<BriefVars> = {
  id: 'content_brief@2',
  category: 'content_brief',
  version: 2,
  description: 'Problem-first SEO brief: frames angle around solving real reader problems, picks fitting articleType.',
  metadata: {
    author: 'etk', createdAt: '2026-06-11', tags: ['brief', 'seo', 'problem-first'],
    suggestedProvider: 'claude', suggestedModel: 'claude-sonnet-4-6',
    outputContract: 'JSON ContentBrief: titleOptions[], chosenTitle, angle, primaryKeyword, secondaryKeywords[], searchIntent, internalLinkPlan[], ctaStrategy, affiliatePlacement, articleType',
  },
  render: ({ product, intelligence, brand }) => ({
    system:
      `${brandPreamble(brand)}\n\n` +
      'You are an SEO content strategist for a trusted review site. Frame the brief around solving the ' +
      'reader’s real problems (search intent), NOT a generic product review. Return ONLY minified JSON.',
    prompt:
      `Create a problem-first content brief for: ${product.title} (${product.offerType}).\n` +
      `INTELLIGENCE:\n- searchIntent: ${intelligence.searchIntent}\n` +
      `- painPoints: ${intelligence.painPoints.join('; ')}\n` +
      `- benefits: ${intelligence.benefits.join('; ')}\n` +
      `- useCases: ${intelligence.useCases.join('; ')}\n` +
      `- ctaRecommendations: ${intelligence.ctaRecommendations.join('; ')}\n` +
      `\nReturn JSON keys: titleOptions (3-5, human/non-spammy), chosenTitle, angle (problem-solving framing), ` +
      `primaryKeyword, secondaryKeywords (related problem terms), searchIntent, internalLinkPlan ` +
      `(related topics to link), ctaStrategy, affiliatePlacement, articleType (pick the best of: how_to, ` +
      `buying_guide, review, comparison, best_list, faq, problem_solution, educational — prefer ` +
      `problem_solution / how_to / buying_guide for problem-led topics).`,
  }),
};
