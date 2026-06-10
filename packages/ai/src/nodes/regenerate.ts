import { registry, type RegenerationVars } from '@etk/prompts';
import { resolveProvider } from '@etk/providers';
import type { ContentState } from '../state';

/**
 * Regeneration node. On QA failure, converts the failure reasons into concrete
 * revision instructions, then the graph routes back to the article node (bounded
 * by attempts.max). Never a human approval step.
 */
export async function regenerateNode(state: ContentState): Promise<Partial<ContentState>> {
  if (!state.article || !state.qa) throw new Error('regenerate requires article + qa');
  const def = registry.get<RegenerationVars>('regeneration');
  const { system, prompt } = def.render({ article: state.article, qa: state.qa, brand: state.brand });
  const provider = resolveProvider(def.metadata.suggestedProvider, def.metadata.suggestedModel);

  const mock = { feedback: state.qa.reasons.map((r) => `Fix: ${r}`) };
  const res = await provider.completeStructured<{ feedback: string[] }>(
    { system, prompt, schemaName: 'Regeneration', mock },
  );
  return {
    feedback: res.data.feedback,
    cost: [...state.cost, { label: 'regeneration', model: res.model, ...res.usage }],
  };
}
