import type { PromptDef } from '../types';
import type { ProductInput, ContentBrief, BrandProfile } from '@etk/core';
import { brandPreamble } from '../brand';

export interface ArticleVars {
  product: ProductInput;
  brief: ContentBrief;
  brand: BrandProfile;
  feedback?: string[];
}

export const articleV1: PromptDef<ArticleVars> = {
  id: 'article_generation@1',
  category: 'article_generation',
  version: 1,
  description: 'Write a full editorial article from a brief, in a trustworthy review-site voice.',
  metadata: {
    author: 'etk', createdAt: '2026-06-10', tags: ['article', 'longform'],
    suggestedProvider: 'claude', suggestedModel: 'claude-opus-4-8',
    outputContract: 'JSON GeneratedArticle: title, type, markdown, metaTitle, metaDescription, sections[]',
  },
  render: ({ product, brief, brand, feedback }) => ({
    system:
      `${brandPreamble(brand)}\n\n` +
      'You are a senior editorial writer for a high-trust product review site. Write helpful, specific, ' +
      'non-hyperbolic content. Include the affiliate disclosure as instructed. Return ONLY valid minified JSON.',
    prompt:
      `Write a ${brief.articleType} article.\n` +
      `TITLE: ${brief.chosenTitle}\n` +
      `ANGLE: ${brief.angle}\n` +
      `PRIMARY KEYWORD: ${brief.primaryKeyword}\n` +
      `SECONDARY: ${brief.secondaryKeywords.join(', ')}\n` +
      `CTA STRATEGY: ${brief.ctaStrategy}\n` +
      `AFFILIATE PLACEMENT: ${brief.affiliatePlacement}\n` +
      `PRODUCT: ${product.title} (${product.offerType})\n` +
      (feedback?.length ? `\nREVISE PER FEEDBACK:\n- ${feedback.join('\n- ')}\n` : '') +
      `\nReturn JSON keys: title, type (=${brief.articleType}), markdown (full article, H2/H3 + ` +
      `affiliate disclosure + CTA), metaTitle (<=60 chars), metaDescription (<=155 chars), ` +
      `sections (array of the H2 headings used).`,
  }),
};
