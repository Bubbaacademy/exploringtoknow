/**
 * Golden Product Validation — batch runner (NO database).
 * Generates 10 distinct pieces (one product, 10 angles) through the real
 * pipeline (mock fallback when no API key), evaluates them, and writes
 * CONTENT_EVALUATION_REPORT.md. Run on host with ANTHROPIC_API_KEY for real text.
 *
 *   pnpm --filter @etk/web exec tsx ../../examples/golden-batch.ts   (or via tsx)
 */
import { writeFileSync } from 'node:fs';
import type { ProductInput } from '../packages/core/src/index';
import { DEFAULT_BRAND } from '../packages/core/src/index';
import { runContentPipeline } from '../packages/ai/src/index';
import { GOLDEN_ANGLES, buildReport, type EvalPiece } from '../packages/eval/src/index';

async function main() {
  const base: ProductInput = {
    id: 'golden-001',
    title: 'Block LED Lights for Bedroom',
    offerType: 'owned_amazon',
    brand: 'Bubba',
    categories: ['sleep', 'lighting'],
  };
  const brand = DEFAULT_BRAND;
  const pieces: EvalPiece[] = [];

  for (const angle of GOLDEN_ANGLES) {
    // one product → distinct angle per piece (drives variety in real mode)
    const product: ProductInput = { ...base, notes: `Focus: ${angle.focus}.` };
    const r = await runContentPipeline(product, brand, { maxAttempts: 2 });
    const a = r.state.article;
    pieces.push({
      angleKey: angle.key,
      title: a?.title ?? '(none)',
      type: a?.type ?? angle.type,
      markdown: a?.markdown ?? '',
      metaTitle: a?.metaTitle ?? '',
      metaDescription: a?.metaDescription ?? '',
      primaryKeyword: r.state.brief?.primaryKeyword ?? '',
      qaPassed: Boolean(r.state.qa?.passed),
      costCents: r.cost.totalCents,
      tokens: r.cost.totalTokens,
    });
    console.log(`generated ${angle.key}: qa=${r.state.qa?.passed} tokens=${r.cost.totalTokens}`);
  }

  const mock = !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY;
  const report = buildReport(pieces, brand, { mock });
  writeFileSync('CONTENT_EVALUATION_REPORT.md', report);
  console.log(`\nWrote CONTENT_EVALUATION_REPORT.md (${pieces.length} pieces, mock=${mock})`);
}
main().catch((e) => { console.error(e); process.exit(1); });
