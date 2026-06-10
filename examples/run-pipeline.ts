import type { ProductInput } from '../packages/core/src/index';
import { runContentPipeline } from '../packages/ai/src/index';
import { DEFAULT_BRAND } from '../packages/core/src/index';
import { registry } from '../packages/prompts/src/index';

async function main() {
  const product: ProductInput = {
    id: 'golden-001',
    title: 'Block LED Lights for Bedroom',
    offerType: 'owned_amazon',
    brand: 'Bubba',
    categories: ['sleep', 'lighting'],
    notes: 'Reduces blue light at night.',
  };

  console.log('Registered prompts:', registry.list().map((p) => p.id).join(', '));
  const result = await runContentPipeline(product, DEFAULT_BRAND, { maxAttempts: 2 });

  console.log(JSON.stringify({
    mock_mode: !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY,
    intelligence_personas: result.state.intelligence?.personas?.length,
    brief_title: result.state.brief?.chosenTitle,
    article_type: result.state.article?.type,
    article_sections: result.state.article?.sections,
    qa_passed: result.state.qa?.passed,
    qa_checks: result.state.qa?.checks,
    article_attempts: result.state.attempts.article,
    flagged: result.flagged,
    cost: result.cost,
  }, null, 2));
}
main().catch((e) => { console.error('PIPELINE_FAIL', e); process.exit(1); });
