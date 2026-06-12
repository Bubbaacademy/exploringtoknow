import type { GeneratedArticle, QaResult } from '@etk/core';
import { registry, type BrandVoiceVars } from '@etk/prompts';
import { resolveProvider } from '@etk/providers';
import type { ContentState } from '../state';
import { JUDGE_SCHEMA } from '../schemas';

/** Deterministic, code-only checks (no model). Cheap and fast. */
function deterministicChecks(a: GeneratedArticle, forbidden: string[]): Record<string, boolean> {
  const md = a.markdown ?? '';
  const lower = `${a.title} ${md}`.toLowerCase();
  const noForbidden = forbidden.every((t) => !lower.includes(t.toLowerCase()));
  return {
    no_forbidden_terms: noForbidden,
    has_title: Boolean(a.title?.trim()),
    meta_title_len: a.metaTitle.length > 0 && a.metaTitle.length <= 60,
    meta_desc_len: a.metaDescription.length > 0 && a.metaDescription.length <= 160,
    has_affiliate_disclosure: /affiliate|commission|disclosure/i.test(md),
    has_cta: /price|compare|check|shop|buy/i.test(md),
    has_headings: /(^|\n)##\s/.test(md),
    min_length: md.length >= 300,
  };
}

/**
 * Automated Quality Gate (impl pkg §6). Deterministic rule checks PLUS a
 * brand-voice judge call (provider). No human approval. Returns pass/fail+reasons.
 */
export async function qualityGateNode(state: ContentState): Promise<Partial<ContentState>> {
  if (!state.article) throw new Error('quality gate requires an article');
  const checks = deterministicChecks(state.article, state.brand.forbiddenTerms);
  const failedChecks = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => `failed:${k}`);

  // brand-voice judge
  const def = registry.get<BrandVoiceVars>('brand_voice');
  const { system, prompt } = def.render({ article: state.article, brand: state.brand });
  const provider = resolveProvider(def.metadata.suggestedProvider, def.metadata.suggestedModel);
  const mockJudge = { passed: true, reasons: [] as string[] };
  const judge = await provider.completeStructured<{ passed: boolean; reasons: string[] }>(
    { system, prompt, schemaName: 'BrandVoiceJudgement', outputSchema: JUDGE_SCHEMA, mock: mockJudge },
  );

  const reasons = [...failedChecks, ...(judge.data.passed ? [] : judge.data.reasons)];
  const qa: QaResult = { passed: reasons.length === 0, reasons, checks: { ...checks, brand_voice: judge.data.passed } };

  return {
    qa,
    cost: [...state.cost, { label: 'brand_voice', model: judge.model, ...judge.usage }],
  };
}
