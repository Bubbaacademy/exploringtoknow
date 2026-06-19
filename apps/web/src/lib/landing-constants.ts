/**
 * Pure, client-safe Landing Page constants + helpers (Phase 23). No server imports
 * — safe in client components and server modules. Keep data-layer functions (which
 * import the server-only workspace/tenant code) in lib/landing.ts.
 */
export const LP_STATUSES = ['draft', 'ready_for_review', 'published', 'archived'] as const;
export const LP_PAGE_TYPES = ['affiliate_bridge', 'product_promo', 'lead_capture_placeholder', 'general'] as const;

export const LP_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', ready_for_review: 'Ready for review', published: 'Published', archived: 'Archived',
};
export const LP_PAGE_TYPE_LABELS: Record<string, string> = {
  affiliate_bridge: 'Affiliate bridge', product_promo: 'Product promo',
  lead_capture_placeholder: 'Lead capture (placeholder)', general: 'General',
};

/** Badge tone for the console status pill. */
export const lpStatusVariant = (s: string): 'good' | 'attn' | '' =>
  s === 'published' ? 'good' : s === 'ready_for_review' ? 'attn' : '';

/** Slugify a title to [a-z0-9-], collapsed, trimmed, capped. */
export function slugify(s: string): string {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

/** Only http(s) URLs are allowed for CTAs — blocks javascript:, data:, mailto:, file:, etc. */
export function isSafeHttpUrl(u: unknown): boolean {
  if (typeof u !== 'string') return false;
  const t = u.trim();
  return /^https?:\/\/[^\s]+$/i.test(t);
}

// ---- Structured sections (Phase 24) — manual authoring only ----
export const SECTION_TYPES = ['text', 'feature_list', 'pros_cons', 'product_highlight', 'disclosure', 'faq_placeholder', 'cta_block'] as const;
export type SectionType = (typeof SECTION_TYPES)[number];
export const SECTION_TYPE_LABELS: Record<string, string> = {
  text: 'Text', feature_list: 'Feature list', pros_cons: 'Pros & cons',
  product_highlight: 'Product highlight', disclosure: 'Disclosure', faq_placeholder: 'FAQ (placeholder)', cta_block: 'CTA block',
};

export type Section = {
  type: string; heading?: string; text?: string;
  items?: string[]; pros?: string[]; cons?: string[]; ctaLabel?: string; ctaUrl?: string;
};

const clampStr = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim().slice(0, max);
  return t || undefined;
};
const clampList = (v: unknown, maxItems: number, maxLen: number): string[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x) => typeof x === 'string').map((x) => (x as string).trim()).filter(Boolean).slice(0, maxItems).map((x) => x.slice(0, maxLen));
  return out.length ? out : undefined;
};

/**
 * Normalize/whitelist sections from client input (pure — safe both sides). Unknown
 * types collapse to 'text'; every field is trimmed/capped; only http(s) CTA URLs
 * survive. Returns at most 30 sections. Never executes or stores raw HTML.
 */
export function normalizeSections(v: unknown): Section[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 30).map((raw): Section => {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const type = (SECTION_TYPES as readonly string[]).includes(String(r.type)) ? String(r.type) : 'text';
    const s: Section = { type };
    const heading = clampStr(r.heading, 200); if (heading) s.heading = heading;
    const text = clampStr(r.text, 5000); if (text) s.text = text;
    const items = clampList(r.items, 30, 300); if (items) s.items = items;
    const pros = clampList(r.pros, 30, 300); if (pros) s.pros = pros;
    const cons = clampList(r.cons, 30, 300); if (cons) s.cons = cons;
    if (type === 'cta_block') {
      const label = clampStr(r.ctaLabel, 120); if (label) s.ctaLabel = label;
      const url = clampStr(r.ctaUrl, 500); if (url && isSafeHttpUrl(url)) s.ctaUrl = url;
    }
    return s;
  });
}
