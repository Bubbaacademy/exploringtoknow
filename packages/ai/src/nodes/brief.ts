import type { ContentBrief } from '@etk/core';
import { registry, type BriefVars } from '@etk/prompts';
import { resolveProvider } from '@etk/providers';
import type { ContentState } from '../state';

/** Content Brief node. */
export async function briefNode(state: ContentState): Promise<Partial<ContentState>> {
  if (!state.intelligence) throw new Error('brief node requires intelligence');
  const def = registry.get<BriefVars>('content_brief');
  const { system, prompt } = def.render({ product: state.product, intelligence: state.intelligence, brand: state.brand });
  const provider = resolveProvider(def.metadata.suggestedProvider, def.metadata.suggestedModel);

  const mock: ContentBrief = {
    titleOptions: ['The Best X for Y (2026)', 'X Buying Guide', 'How to Choose X'],
    chosenTitle: `The Best ${state.product.title} Options`,
    angle: 'Practical, trustworthy buyer guidance',
    primaryKeyword: state.product.title.toLowerCase(),
    secondaryKeywords: ['best', 'review', 'guide'],
    searchIntent: state.intelligence.searchIntent,
    internalLinkPlan: ['related category guide', 'how-to setup'],
    ctaStrategy: 'One primary CTA above the fold, one in the conclusion',
    affiliatePlacement: 'After the top pick and in the comparison table',
    articleType: 'buying_guide',
  };

  const res = await provider.completeStructured<ContentBrief>({ system, prompt, schemaName: 'ContentBrief', mock });
  return {
    brief: res.data,
    cost: [...state.cost, { label: 'brief', model: res.model, ...res.usage }],
  };
}
