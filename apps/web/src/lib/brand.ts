import { DEFAULT_BRAND, type BrandProfile } from '@etk/core';
import type { Payload } from 'payload';

/** Load the Brand Profile global and map it to the @etk/core BrandProfile shape. */
export async function loadBrandProfile(payload: Payload): Promise<BrandProfile> {
  try {
    const g = (await payload.findGlobal({ slug: 'brand-profile' })) as Record<string, unknown>;
    const forbidden = Array.isArray(g.forbiddenTerms)
      ? (g.forbiddenTerms as Array<{ term?: string }>).map((t) => t.term ?? '').filter(Boolean)
      : DEFAULT_BRAND.forbiddenTerms;
    return {
      name: (g.name as string) ?? DEFAULT_BRAND.name,
      tone: (g.tone as string) ?? DEFAULT_BRAND.tone,
      style: (g.style as string) ?? DEFAULT_BRAND.style,
      readingLevel: (g.readingLevel as string) ?? DEFAULT_BRAND.readingLevel,
      ctaStyle: (g.ctaStyle as string) ?? DEFAULT_BRAND.ctaStyle,
      disclosureStyle: (g.disclosureStyle as string) ?? DEFAULT_BRAND.disclosureStyle,
      forbiddenTerms: forbidden,
    };
  } catch {
    return DEFAULT_BRAND;
  }
}
