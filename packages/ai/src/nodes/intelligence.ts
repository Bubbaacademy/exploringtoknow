import type { Intelligence } from '@etk/core';
import { registry, type IntelligenceVars } from '@etk/prompts';
import { resolveProvider } from '@etk/providers';
import type { ContentState } from '../state';
import { INTELLIGENCE_SCHEMA } from '../schemas';

/** Product Intelligence node. Prompt from registry; model call via provider. */
export async function intelligenceNode(state: ContentState): Promise<Partial<ContentState>> {
  const def = registry.get<IntelligenceVars>('product_intelligence');
  const { system, prompt } = def.render({ product: state.product, brand: state.brand });
  const provider = resolveProvider(def.metadata.suggestedProvider, def.metadata.suggestedModel);

  const mock: Intelligence = {
    personas: ['Value-seeking parent', 'First-time buyer'],
    painPoints: ['Unsure which option is safe', 'Too many confusing choices'],
    benefits: ['Saves time', 'Trustworthy guidance'],
    features: ['Clear comparisons', 'Expert-backed picks'],
    useCases: ['Bedroom setup', 'Gift purchase'],
    competitorThemes: ['Generic listicles', 'Thin affiliate pages'],
    searchIntent: 'commercial-investigation',
    ctaRecommendations: ['Compare top picks', 'Check current price'],
  };

  const res = await provider.completeStructured<Intelligence>({ system, prompt, schemaName: 'Intelligence', outputSchema: INTELLIGENCE_SCHEMA, mock });
  return {
    intelligence: res.data,
    cost: [...state.cost, { label: 'intelligence', model: res.model, ...res.usage }],
  };
}
