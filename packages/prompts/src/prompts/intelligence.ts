import type { PromptDef } from '../types';
import type { ProductInput, BrandProfile } from '@etk/core';
import { brandPreamble } from '../brand';

export interface IntelligenceVars { product: ProductInput; brand: BrandProfile; }

export const intelligenceV1: PromptDef<IntelligenceVars> = {
  id: 'product_intelligence@1',
  category: 'product_intelligence',
  version: 1,
  description: 'Derive buyer intelligence (personas, pains, benefits, intent, CTAs) for a catalog product/offer.',
  metadata: {
    author: 'etk', createdAt: '2026-06-10', tags: ['intelligence', 'structured'],
    suggestedProvider: 'openai', suggestedModel: 'gpt-4o-mini',
    outputContract: 'JSON Intelligence: personas[], painPoints[], benefits[], features[], useCases[], competitorThemes[], searchIntent, ctaRecommendations[]',
  },
  render: ({ product, brand }) => ({
    system:
      `${brandPreamble(brand)}\n\n` +
      'You are a commerce market analyst. Return ONLY valid minified JSON matching the requested schema. No prose.',
    prompt:
      `Analyze this offer and produce buyer intelligence.\n` +
      `OFFER:\n` +
      `- title: ${product.title}\n` +
      `- offerType: ${product.offerType}\n` +
      (product.brand ? `- brand: ${product.brand}\n` : '') +
      (product.categories?.length ? `- categories: ${product.categories.join(', ')}\n` : '') +
      (product.notes ? `- notes: ${product.notes}\n` : '') +
      `\nReturn JSON with keys: personas, painPoints, benefits, features, useCases, ` +
      `competitorThemes (all string arrays), searchIntent (string), ctaRecommendations (string array). ` +
      `Be specific and grounded in the offer; 3-6 items per array.`,
  }),
};
