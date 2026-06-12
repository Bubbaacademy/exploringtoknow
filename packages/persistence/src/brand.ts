import { DEFAULT_BRAND, type BrandProfile, type ProductInput, type OfferType } from '@etk/core';

/** Map a Brand Profile global doc to the @etk/core BrandProfile shape. */
export function mapBrandProfile(g: Record<string, unknown> | null | undefined): BrandProfile {
  if (!g) return DEFAULT_BRAND;
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
    forbiddenTerms: forbidden.length ? forbidden : DEFAULT_BRAND.forbiddenTerms,
  };
}

/** Build the minimal ProductInput the AI pipeline consumes from a product doc. */
export function toProductInput(doc: Record<string, unknown>): ProductInput {
  const rel = (v: unknown): string | undefined => {
    if (v == null) return undefined;
    return typeof v === 'object' ? String((v as { id?: unknown }).id ?? '') : String(v);
  };
  return {
    id: String(doc.id),
    title: String(doc.title ?? 'Untitled'),
    offerType: (doc.offerType as OfferType) ?? 'owned_amazon',
    brand: rel(doc.brand),
    price: typeof doc.price === 'number' ? doc.price : undefined,
    externalUrl: typeof doc.externalUrl === 'string' ? doc.externalUrl : undefined,
  };
}
