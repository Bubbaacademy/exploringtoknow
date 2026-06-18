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

/** Only http(s) URLs are allowed for CTAs — blocks javascript:, data:, etc. */
export function isSafeHttpUrl(u: unknown): boolean {
  if (typeof u !== 'string') return false;
  const t = u.trim();
  return /^https?:\/\/[^\s]+$/i.test(t);
}
