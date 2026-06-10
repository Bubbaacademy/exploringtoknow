import type { PromptDef } from '../types';
import type { GeneratedArticle, QaResult, BrandProfile } from '@etk/core';
import { brandPreamble } from '../brand';

export interface RegenerationVars { article: GeneratedArticle; qa: QaResult; brand: BrandProfile; }

export const regenerationV1: PromptDef<RegenerationVars> = {
  id: 'regeneration@1',
  category: 'regeneration',
  version: 1,
  description: 'Turn quality-gate failures into concrete, actionable revision instructions.',
  metadata: {
    author: 'etk', createdAt: '2026-06-10', tags: ['regeneration', 'repair'],
    suggestedProvider: 'claude', suggestedModel: 'claude-haiku-4-5',
    outputContract: 'JSON { feedback: string[] }',
  },
  render: ({ article, qa, brand }) => ({
    system:
      `${brandPreamble(brand)}\n\n` +
      'You convert QA failures into a short list of concrete revision instructions that restore brand voice. ' +
      'Return ONLY JSON { "feedback": string[] }.',
    prompt:
      `The article "${article.title}" failed QA for:\n- ${qa.reasons.join('\n- ')}\n` +
      `Produce JSON { "feedback": [ specific fixes the writer should apply ] }. ` +
      `Reference the affected sections: ${article.sections.join(', ')}.`,
  }),
};
