import type { PromptDef } from '../types';
import type { GeneratedArticle, BrandProfile } from '@etk/core';
import { brandPreamble } from '../brand';

export interface BrandVoiceVars { article: GeneratedArticle; brand: BrandProfile; }

export const brandVoiceV1: PromptDef<BrandVoiceVars> = {
  id: 'brand_voice@1',
  category: 'brand_voice',
  version: 1,
  description: 'Quality-gate brand-voice judge: is the article on-voice and trustworthy?',
  metadata: {
    author: 'etk', createdAt: '2026-06-10', tags: ['qa', 'brand-voice', 'judge'],
    suggestedProvider: 'claude', suggestedModel: 'claude-haiku-4-5',
    outputContract: 'JSON { passed: boolean, reasons: string[] }',
  },
  render: ({ article, brand }) => ({
    system:
      `${brandPreamble(brand)}\n\n` +
      'You are a strict editorial QA reviewer. Judge whether the article matches the brand voice above ' +
      '(helpful, specific, non-hypey, trustworthy, correct reading level). ' +
      'Return ONLY JSON { "passed": boolean, "reasons": string[] }.',
    prompt:
      `Evaluate this article against the brand voice. Fail if hypey, vague, off-voice, or untrustworthy.\n` +
      `TITLE: ${article.title}\n` +
      `EXCERPT:\n${article.markdown.slice(0, 1200)}\n` +
      `\nReturn JSON: { "passed": true|false, "reasons": [ ... ] }. reasons empty when passed.`,
  }),
};
