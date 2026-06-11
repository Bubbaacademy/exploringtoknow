import { writeFileSync } from 'node:fs';
import type { ProductInput, BrandProfile } from '@etk/core';
import { runContentPipeline } from '@etk/ai';
import { registry } from '@etk/prompts';
import {
  readability, seo, cta, brandVoice, type EvalPiece,
} from '@etk/eval';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80).replace(/(^-|-$)/g, '');

async function findOrCreate(payload: any, collection: string, where: any, data: any) {
  const found = await payload.find({ collection, where, limit: 1 });
  return found.docs[0] ?? (await payload.create({ collection, data }));
}

/**
 * Validate ONE real (or mock) AI article end-to-end and emit the three Phase-C
 * reports with REAL measured numbers (tokens, cost, generation time, quality).
 * Real numbers require ANTHROPIC_API_KEY; without it, runs in mock mode and the
 * reports are clearly labelled MOCK.
 */
export async function validateOneArticle(payload: any, opts: {
  brand: { name: string; slug: string; website?: string };
  product: ProductInput & { slug: string; offerType: ProductInput['offerType'] };
  brandProfile: BrandProfile;
  outDir?: string;
}) {
  const outDir = opts.outDir ?? process.cwd();
  const mock = !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY;

  const brandDoc = await findOrCreate(payload, 'brands', { slug: { equals: opts.brand.slug } },
    { name: opts.brand.name, slug: opts.brand.slug, website: opts.brand.website });
  const productDoc = await findOrCreate(payload, 'products', { slug: { equals: opts.product.slug } },
    { title: opts.product.title, slug: opts.product.slug, offerType: opts.product.offerType,
      status: 'active', priority: 100, brand: brandDoc.id });

  const run = await payload.create({ collection: 'generation-runs',
    data: { product: productDoc.id, status: 'running', startedAt: new Date().toISOString(),
            promptVersions: registry.list().map((p) => p.id) } });

  // ---- timed generation ----
  const t0 = Date.now();
  const result = await runContentPipeline(
    { ...opts.product, id: String(productDoc.id) }, opts.brandProfile, { maxAttempts: 2 });
  const genMs = Date.now() - t0;
  const s = result.state;
  const passed = Boolean(s.qa?.passed);
  if (!s.article) throw new Error('no article produced');

  // ---- persist ----
  const intel = await payload.create({ collection: 'product-intelligence',
    data: { product: productDoc.id, ...s.intelligence,
            model: result.cost.steps.find((x) => x.label === 'intelligence')?.model,
            generatedAt: new Date().toISOString() } });
  const brief = await payload.create({ collection: 'content-briefs',
    data: { product: productDoc.id, intelligence: intel.id, ...s.brief, status: 'ready' } });
  const articleSlug = slugify(s.article.title);
  const article = await payload.create({ collection: 'articles',
    data: { title: s.article.title, slug: articleSlug, brief: brief.id, product: productDoc.id,
      type: s.article.type, markdown: s.article.markdown,
      seo: { metaTitle: s.article.metaTitle, metaDescription: s.article.metaDescription },
      openGraph: { title: s.article.title, description: s.article.metaDescription },
      qaReport: { passed, reasons: s.qa?.reasons ?? [] },
      status: passed ? 'published' : 'flagged',
      publishedAt: passed ? new Date().toISOString() : undefined } });

  await payload.update({ collection: 'generation-runs', id: run.id,
    data: { status: result.flagged ? 'flagged' : (passed ? 'published' : 'failed'),
            articleAttempts: s.attempts.article, totalTokens: result.cost.totalTokens,
            costUsdCents: result.cost.totalCents, steps: result.cost.steps,
            finishedAt: new Date().toISOString() } });

  // ---- evaluate the REAL article ----
  const piece: EvalPiece = {
    angleKey: 'single', title: s.article.title, type: s.article.type,
    markdown: s.article.markdown, metaTitle: s.article.metaTitle,
    metaDescription: s.article.metaDescription, primaryKeyword: s.brief?.primaryKeyword ?? '',
    qaPassed: passed, costCents: result.cost.totalCents, tokens: result.cost.totalTokens,
  };
  const read = readability(piece.markdown);
  const seoR = seo(piece); const ctaR = cta(piece); const bvR = brandVoice(piece, opts.brandProfile);

  const base = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000';
  const adminUrl = `${base}/admin/collections/articles/${article.id}`;
  const publicUrl = `${base}/${articleSlug}`;
  const modeLine = mock
    ? '**MODE: MOCK** (no ANTHROPIC_API_KEY in this environment — numbers are placeholders; re-run on the VPS with the key for REAL values).'
    : '**MODE: REAL (Anthropic API)**';
  const stamp = new Date().toISOString();

  // ---- REPORT 1 ----
  writeFileSync(`${outDir}/REAL_AI_VALIDATION_REPORT.md`, [
    '# REAL_AI_VALIDATION_REPORT.md', '', modeLine, `Generated: ${stamp}`, '',
    `Product: **${opts.product.title}** · Brand: **${opts.brand.name}**`, '',
    '## Steps', '| Step | Result |', '|---|---|',
    `| 2. Content brief | "${s.brief?.chosenTitle}" (${s.brief?.articleType}) |`,
    `| 3. Article | "${s.article.title}" — ${piece.markdown.length} chars |`,
    `| 4. Saved to Payload | article id ${article.id} |`,
    `| 5. Published | status=${article.status}${passed ? ' (QA passed)' : ' (flagged)'} |`,
    `| 6. Public render | ${publicUrl} |`,
    `| Admin | ${adminUrl} |`, '',
    '## Generation metrics',
    `- Generation time: **${(genMs / 1000).toFixed(2)} s**`,
    `- Total tokens: **${result.cost.totalTokens}**`,
    `- Estimated cost: **$${(result.cost.totalCents / 100).toFixed(4)}**`,
    `- QA: **${passed ? 'PASSED' : 'FLAGGED'}**`, '',
    'See TOKEN_COST_REPORT.md and QUALITY_EVALUATION_REPORT.md for detail.', '',
  ].join('\n'));

  // ---- REPORT 2 ----
  const stepRows = result.cost.steps.map((x) =>
    `| ${x.label} | ${x.model} | ${x.usage.inputTokens} | ${x.usage.outputTokens} | $${(x.cents / 100).toFixed(4)} |`);
  writeFileSync(`${outDir}/TOKEN_COST_REPORT.md`, [
    '# TOKEN_COST_REPORT.md', '', modeLine, `Generated: ${stamp}`, '',
    '## Per-step usage', '| Step | Model | Input tok | Output tok | Cost |', '|---|---|---|---|---|',
    ...stepRows,
    `| **TOTAL** | — | — | — | **$${(result.cost.totalCents / 100).toFixed(4)}** |`, '',
    `Total tokens: **${result.cost.totalTokens}** · Generation time: **${(genMs / 1000).toFixed(2)} s**`, '',
    '> Costs are estimated from the model price table in `@etk/providers` (cost.ts).',
    '> Confirm against current Anthropic pricing before scaling.', '',
  ].join('\n'));

  // ---- REPORT 3 ----
  const pf = (b: boolean) => (b ? 'PASS' : 'FAIL');
  writeFileSync(`${outDir}/QUALITY_EVALUATION_REPORT.md`, [
    '# QUALITY_EVALUATION_REPORT.md', '', modeLine, `Generated: ${stamp}`, '',
    `Article: **${s.article.title}** (${s.article.type})`, '',
    '## Readability',
    `- Flesch Reading Ease: **${read.fleschReadingEase}** (60–70 = plain English)`,
    `- FK grade: **${read.fkGrade}** (target ~${opts.brandProfile.readingLevel})`,
    `- Avg sentence length: ${read.avgSentenceWords} words`, '',
    '## SEO structure',
    `- Word count: ${seoR.wordCount}`,
    `- Meta title ≤60 chars: ${pf(seoR.metaTitleOk)} · Meta desc 50–160: ${pf(seoR.metaDescOk)}`,
    `- H2 sections: ${seoR.h2Count} (${pf(seoR.hasH2)}) · keyword in title: ${pf(seoR.keywordInTitle)}`, '',
    '## CTA',
    `- CTAs present: ${ctaR.count} (${pf(ctaR.hasCta)}) · intro: ${pf(ctaR.inIntro)} · conclusion: ${pf(ctaR.inConclusion)}`, '',
    '## Brand voice & compliance',
    `- Affiliate disclosure present: ${pf(bvR.hasDisclosure)}`,
    `- Forbidden terms: ${bvR.forbiddenHits.length === 0 ? 'none' : bvR.forbiddenHits.join(', ')}`,
    `- Hype language: ${bvR.hypeHits.length === 0 ? 'none' : bvR.hypeHits.join(', ')}`,
    `- Reading level on target: ${pf(bvR.onReadingLevel)}`, '',
    `## Quality-gate verdict: **${passed ? 'PASSED' : 'FLAGGED'}**`,
    passed ? '' : `Reasons: ${s.qa?.reasons.join('; ')}`, '',
  ].join('\n'));

  return { mock, brandId: brandDoc.id, productId: productDoc.id, articleId: article.id,
    articleStatus: article.status, passed, genMs, tokens: result.cost.totalTokens,
    cents: result.cost.totalCents, adminUrl, publicUrl };
}
