import type { BrandProfile } from '@etk/core';
import {
  type EvalPiece, readability, repetition, seo, cta, brandVoice,
} from './analyze';

const pct = (x: number) => `${Math.round(x * 100)}%`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Builds the full Content Evaluation Report (Markdown) from generated pieces. */
export function buildReport(pieces: EvalPiece[], brand: BrandProfile, opts: { mock: boolean }): string {
  const rep = repetition(pieces);
  const seoR = pieces.map(seo);
  const ctaR = pieces.map(cta);
  const bvR = pieces.map((p) => brandVoice(p, brand));
  const readR = pieces.map((p) => readability(p.markdown));

  const passRate = avg(pieces.map((p) => (p.qaPassed ? 1 : 0)));
  const totalCost = pieces.reduce((a, p) => a + p.costCents, 0);
  const totalTokens = pieces.reduce((a, p) => a + p.tokens, 0);
  const fkAvg = avg(readR.map((r) => r.fkGrade));
  const easeAvg = avg(readR.map((r) => r.fleschReadingEase));
  const ctaCoverage = avg(ctaR.map((c) => (c.hasCta ? 1 : 0)));
  const discCoverage = avg(bvR.map((b) => (b.hasDisclosure ? 1 : 0)));
  const forbiddenTotal = bvR.reduce((a, b) => a + b.forbiddenHits.length, 0);
  const hypeTotal = bvR.reduce((a, b) => a + b.hypeHits.length, 0);
  const h2Avg = avg(seoR.map((s) => s.h2Count));
  const kwTitle = avg(seoR.map((s) => (s.keywordInTitle ? 1 : 0)));

  const L: string[] = [];
  L.push('# Golden Product — Content Evaluation Report');
  L.push('');
  L.push(`Pieces evaluated: **${pieces.length}** · Mode: **${opts.mock ? 'MOCK (placeholder text — run on host with a real API key for production-quality evaluation)' : 'REAL model output'}**`);
  L.push('');
  L.push('## 1. Summary scorecard');
  L.push('');
  L.push('| Metric | Value |');
  L.push('|---|---|');
  L.push(`| QA pass rate | ${pct(passRate)} |`);
  L.push(`| Avg readability (Flesch ease) | ${easeAvg.toFixed(1)} |`);
  L.push(`| Avg reading grade (FK) | ${fkAvg.toFixed(1)} |`);
  L.push(`| Avg cross-article similarity | ${pct(rep.avgPairwiseSimilarity)} |`);
  L.push(`| Max pair similarity | ${pct(rep.maxPairSimilarity)} (${rep.maxPair.join(' vs ')}) |`);
  L.push(`| CTA coverage | ${pct(ctaCoverage)} |`);
  L.push(`| Disclosure coverage | ${pct(discCoverage)} |`);
  L.push(`| Forbidden-term hits | ${forbiddenTotal} |`);
  L.push(`| Hype-term hits | ${hypeTotal} |`);
  L.push(`| Avg H2 sections | ${h2Avg.toFixed(1)} |`);
  L.push(`| Keyword-in-title rate | ${pct(kwTitle)} |`);
  L.push(`| Total tokens / cost | ${totalTokens} / $${(totalCost / 100).toFixed(2)} |`);
  L.push('');

  L.push('## 2. Content quality (per piece)');
  L.push('');
  L.push('| Angle | Type | Words | FK grade | QA | CTAs | Disclosure |');
  L.push('|---|---|---|---|---|---|---|');
  pieces.forEach((p, i) => {
    L.push(`| ${p.angleKey} | ${p.type} | ${seoR[i]!.wordCount} | ${readR[i]!.fkGrade} | ${p.qaPassed ? 'pass' : 'FLAG'} | ${ctaR[i]!.count} | ${bvR[i]!.hasDisclosure ? 'yes' : 'NO'} |`);
  });
  L.push('');

  L.push('## 3. Repetition analysis');
  L.push('');
  L.push(`Average pairwise trigram similarity across the ${pieces.length} pieces is **${pct(rep.avgPairwiseSimilarity)}**; the most similar pair is **${rep.maxPair.join(' vs ')}** at **${pct(rep.maxPairSimilarity)}**. Duplicate titles: **${rep.duplicateTitles}**.`);
  L.push('');
  L.push(rep.avgPairwiseSimilarity > 0.35
    ? '> ⚠️ Similarity is high — pieces likely share boilerplate intros/outros or repeat the same framing. Diversify structure per article type and vary intros.'
    : '> ✓ Similarity is within a healthy range for a single-product cluster.');
  L.push('');

  L.push('## 4. Brand voice consistency');
  L.push('');
  L.push(`Disclosure present in **${pct(discCoverage)}** of pieces. Forbidden terms (${brand.forbiddenTerms.join(', ') || 'none'}) appeared **${forbiddenTotal}** time(s); hype language appeared **${hypeTotal}** time(s). Reading level on-target (FK 5–10) in **${pct(avg(bvR.map((b) => (b.onReadingLevel ? 1 : 0))))}** of pieces.`);
  L.push('');

  L.push('## 5. CTA quality');
  L.push('');
  L.push(`CTA present in **${pct(ctaCoverage)}** of pieces; intro-placement in **${pct(avg(ctaR.map((c) => (c.inIntro ? 1 : 0))))}**, conclusion-placement in **${pct(avg(ctaR.map((c) => (c.inConclusion ? 1 : 0))))}**. Brand CTA policy: ${brand.ctaStyle}.`);
  L.push('');

  L.push('## 6. Readability');
  L.push('');
  L.push(`Average Flesch Reading Ease **${easeAvg.toFixed(1)}** (higher = easier; 60–70 is plain English) and FK grade **${fkAvg.toFixed(1)}** against a target of ~grade ${brand.readingLevel}. Avg sentence length **${avg(readR.map((r) => r.avgSentenceWords)).toFixed(1)}** words.`);
  L.push('');

  L.push('## 7. SEO structure quality');
  L.push('');
  L.push(`Meta title within 60 chars: **${pct(avg(seoR.map((s) => (s.metaTitleOk ? 1 : 0))))}**; meta description 50–160 chars: **${pct(avg(seoR.map((s) => (s.metaDescOk ? 1 : 0))))}**; ≥2 H2 sections: **${pct(avg(seoR.map((s) => (s.hasH2 ? 1 : 0))))}**; primary keyword in title: **${pct(kwTitle)}**; in meta description: **${pct(avg(seoR.map((s) => (s.keywordInMeta ? 1 : 0))))}**.`);
  L.push('');

  L.push('## 8. Prompt weaknesses (observed)');
  L.push('');
  const weaknesses: string[] = [];
  if (rep.avgPairwiseSimilarity > 0.35) weaknesses.push('Article prompt produces repetitive intros/outros across angles — add explicit per-type structure and forbid template phrasing.');
  if (ctaCoverage < 1) weaknesses.push('CTA not guaranteed — make the CTA an explicit required JSON section, not just prose guidance.');
  if (discCoverage < 1) weaknesses.push('Affiliate disclosure occasionally missing — enforce as a required field and a hard QA gate (already deterministic; consider failing build on absence).');
  if (fkAvg > 10) weaknesses.push('Reading grade above target — instruct shorter sentences and simpler words in the article prompt.');
  if (kwTitle < 0.8) weaknesses.push('Primary keyword not reliably in the title — require keyword placement in the title field.');
  if (weaknesses.length === 0) weaknesses.push('No major weaknesses detected at this sample size; re-run at higher volume to confirm.');
  weaknesses.forEach((w) => L.push(`- ${w}`));
  L.push('');

  L.push('## 9. Recommended prompt improvements (before scaling)');
  L.push('');
  [
    'Make CTA and affiliate disclosure **required JSON fields** (e.g. `cta`, `disclosure`) so the quality gate checks fields, not regex over prose.',
    'Add a per-article-type **structure spec** to the article prompt (distinct H2 skeletons for how_to vs comparison vs faq) to cut cross-article similarity.',
    'Add an explicit **anti-boilerplate** instruction: vary the opening sentence; never reuse a fixed intro template.',
    'Pin the **reading level** with concrete guidance (max ~20-word sentences, grade 7–8 vocabulary).',
    'Require **primary + 1 secondary keyword** in the first 100 words and the title; return them in a `keywordsUsed` field for verification.',
    'Bump prompt versions (e.g. `article_generation@2`) so the registry keeps the old version for A/B comparison.',
  ].forEach((r) => L.push(`- ${r}`));
  L.push('');

  L.push('## 10. Recommendations for scaling to multiple products');
  L.push('');
  [
    'Gate scaling on this report: only scale once QA pass rate ≥ 90%, similarity < 35%, and CTA/disclosure coverage = 100% on a real run.',
    'Run this evaluator automatically after each batch; store the scorecard on `generation-runs` and surface it on the dashboard (System Health).',
    'Introduce a per-day **token/cost budget guard** in the orchestrator using the cost ledger before fan-out across many products.',
    'Add embedding-based **near-duplicate detection** across the whole catalog (not just within one product) prior to publish.',
    'Process products by `priority`, in small batches with concurrency limits, and flag (never block) failures for later review.',
    'Promote prompt versions through the registry; keep a regression set of golden products to re-run on any prompt/model change.',
  ].forEach((r) => L.push(`- ${r}`));
  L.push('');
  return L.join('\n');
}
