import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import type {
  ProductInput, Intelligence, ContentBrief, GeneratedArticle, QaResult, BrandProfile,
} from '@etk/core';
import type { ContentState } from '../state';
import { intelligenceNode } from '../nodes/intelligence';
import { briefNode } from '../nodes/brief';
import { articleNode } from '../nodes/article';
import { qualityGateNode } from '../nodes/qualityGate';
import { regenerateNode } from '../nodes/regenerate';

/**
 * LangGraph content pipeline (AI Core milestone). Flow:
 *   Product → Intelligence → Brief → Article → Quality Gate → (Regeneration loop)
 * Prompts come from @etk/prompts; all model calls go through @etk/providers.
 * Nodes contain NO prompt text. Node ids are `gen_*`/`quality_gate`/`regenerate`
 * to avoid colliding with state-channel keys.
 */
const State = Annotation.Root({
  product: Annotation<ProductInput>(),
  brand: Annotation<BrandProfile>(),
  intelligence: Annotation<Intelligence | undefined>(),
  brief: Annotation<ContentBrief | undefined>(),
  article: Annotation<GeneratedArticle | undefined>(),
  qa: Annotation<QaResult | undefined>(),
  feedback: Annotation<string[] | undefined>(),
  attempts: Annotation<ContentState['attempts']>(),
  flagged: Annotation<boolean | undefined>(),
  cost: Annotation<ContentState['cost']>(),
});

function afterQa(state: ContentState): 'regenerate' | 'flag' | typeof END {
  if (state.qa?.passed) return END;
  if (state.attempts.article < state.attempts.max) return 'regenerate';
  return 'flag';
}

export function buildContentGraph() {
  return new StateGraph(State)
    .addNode('gen_intelligence', intelligenceNode)
    .addNode('gen_brief', briefNode)
    .addNode('gen_article', articleNode)
    .addNode('quality_gate', qualityGateNode)
    .addNode('regenerate', regenerateNode)
    .addNode('flag', async () => ({ flagged: true }))
    .addEdge(START, 'gen_intelligence')
    .addEdge('gen_intelligence', 'gen_brief')
    .addEdge('gen_brief', 'gen_article')
    .addEdge('gen_article', 'quality_gate')
    .addConditionalEdges('quality_gate', afterQa, {
      regenerate: 'regenerate',
      flag: 'flag',
      [END]: END,
    })
    .addEdge('regenerate', 'gen_article')
    .addEdge('flag', END)
    .compile();
}
