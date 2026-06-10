import { StateGraph, START, END, Annotation } from '@langchain/langgraph';

/**
 * Refresh-workflow SUGGESTION graph (impl pkg §11). Given decay/ranking/CTR
 * signals, proposes a refresh action. Phase 4 fills nodes; Phase 0 reserves the
 * graph. Executing a refresh reuses the content pipeline above.
 */
const State = Annotation.Root({
  articleId: Annotation<string>(),
  reason: Annotation<string>(),
  suggestion: Annotation<unknown>(),
});

export function buildRefreshGraph() {
  const g = new StateGraph(State)
    .addNode('suggest', async () => ({ suggestion: { __stub: true } }))
    .addEdge(START, 'suggest')
    .addEdge('suggest', END);
  return g.compile();
}
