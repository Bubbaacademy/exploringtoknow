import type { GeneratedArticle } from '@etk/core';
import { registry, type ArticleVars } from '@etk/prompts';
import { resolveProvider } from '@etk/providers';
import type { ContentState } from '../state';
import { ARTICLE_SCHEMA } from '../schemas';

/** Article Generation node. Uses feedback from regeneration on retries. */
export async function articleNode(state: ContentState): Promise<Partial<ContentState>> {
  if (!state.brief) throw new Error('article node requires a brief');
  const def = registry.get<ArticleVars>('article_generation');
  const { system, prompt } = def.render({ product: state.product, brief: state.brief, brand: state.brand, feedback: state.feedback });
  const provider = resolveProvider(def.metadata.suggestedProvider, def.metadata.suggestedModel);

  const mock: GeneratedArticle = {
    title: state.brief.chosenTitle,
    type: state.brief.articleType,
    markdown:
      `# ${state.brief.chosenTitle}\n\n` +
      `_Affiliate disclosure: we may earn a commission when you buy through our links._\n\n` +
      `## Overview\nA practical guide to choosing the right option for your needs, based on hands-on testing and trusted criteria.\n\n` +
      `## Top Pick\nOur top pick balances quality and value. Check current price before you buy.\n\n` +
      `## How to Choose\nCompare the key features, then shop with confidence using the checklist below.\n\n` +
      `## FAQ\nCommon questions answered clearly so you can decide quickly.\n`,
    metaTitle: state.brief.chosenTitle.slice(0, 60),
    metaDescription: `${state.brief.angle}. Compare top options and pick with confidence.`.slice(0, 155),
    sections: ['Overview', 'Top Pick', 'How to Choose', 'FAQ'],
  };

  // Long-form article needs headroom so the markdown isn't truncated (QA flags
  // mid-word cutoffs). Higher limit applies ONLY to this stage.
  const res = await provider.completeStructured<GeneratedArticle>({ system, prompt, schemaName: 'GeneratedArticle', outputSchema: ARTICLE_SCHEMA, maxTokens: 8192, mock });
  return {
    article: res.data,
    attempts: { ...state.attempts, article: state.attempts.article + 1 },
    cost: [...state.cost, { label: 'article', model: res.model, ...res.usage }],
  };
}
