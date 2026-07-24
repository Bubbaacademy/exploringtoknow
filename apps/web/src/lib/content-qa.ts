/**
 * Content QA / Publishing-readiness flags (Phase 2Q).
 *
 * PURE, READ-ONLY presentation logic. This module performs NO database access,
 * imports no Payload/schema, and mutates nothing — it takes already-fetched
 * article records and returns advisory quality flags for the internal Editorial
 * Ops dashboard. It never publishes, edits, or changes visibility; the operator
 * fixes content in Payload `/admin`.
 *
 * Public visibility is gated SOLELY by `editorialStatus === 'published'`
 * (mirrors `PUBLISHED_WHERE` in lib/public.ts). "Live problems" below are flags
 * on articles that are actually published (a reader sees them now); "readiness"
 * flags are advisory notes on not-yet-public articles.
 */

export type QaLevel = 'err' | 'warn' | 'info';

export type QaFlag = {
  level: QaLevel;
  /** Stable machine code (also used as a React key). */
  code: string;
  /** Short operator-facing label. */
  label: string;
  /** Optional extra context. */
  detail?: string;
};

/** Loose article shape — a depth-1 Payload doc. No field is required. */
export type QaArticle = {
  id?: string | number;
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  type?: unknown;
  editorialStatus?: unknown;
  /** Pipeline / AI-QA status — deliberately NOT public visibility. */
  status?: unknown;
  category?: unknown;
  images?: { hero?: unknown; heroAlt?: unknown } | null;
};

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const nonEmpty = (v: unknown): boolean => str(v).trim().length > 0;

/** A relationship is "present" when it is a non-null id or a populated object. */
export function relationPresent(rel: unknown): boolean {
  if (rel == null) return false;
  if (typeof rel === 'object') return (rel as { id?: unknown }).id != null;
  return true;
}

/**
 * Hero alt text that looks like a raw product-listing title rather than an
 * editorial description. Evidence-based on the exact pattern seen in production
 * (Phase 2P): auto-populated alts ended with "– product image" (any dash). Kept
 * deliberately narrow to avoid flagging legitimate descriptive alt text.
 */
export function heroAltLooksRaw(alt: unknown): boolean {
  const a = str(alt).trim();
  if (!a) return false;
  return /[-–—]\s*product image\s*$/i.test(a) || /\bproduct image\s*$/i.test(a);
}

/**
 * Test / mock / placeholder language in a title or slug. Word-boundaried so
 * everyday words are not caught (e.g. "greatest" does not match "test").
 * Advisory only — the operator judges borderline cases.
 */
export function hasTestLanguage(...values: unknown[]): boolean {
  const hay = values.map(str).join(' ');
  return /\[test\]|\btest\b|\bmock\b|smoke[\s-]?test|\bzzz|placeholder|lorem ipsum|\bsample\b|\bdemo\b/i.test(hay);
}

const isPublished = (a: QaArticle): boolean => str(a.editorialStatus).toLowerCase() === 'published';
const pipelineSaysPublished = (a: QaArticle): boolean => str(a.status).toLowerCase() === 'published';

/**
 * Editorial ↔ pipeline status divergence. The single most confusing case (and the
 * root of the Phase 2O incident): an article whose AI/QA "pipeline status" reads
 * Published while its Editorial status is NOT — which does NOT make it public.
 * Returns a flag only for that specific, confusing combination.
 */
export function divergenceFlag(a: QaArticle): QaFlag | null {
  if (!isPublished(a) && pipelineSaysPublished(a)) {
    return {
      level: 'info',
      code: 'status-divergence',
      label: 'Pipeline says “Published”, but NOT public',
      detail: 'Pipeline status does not control visibility. Only Editorial status = Published makes an article public.',
    };
  }
  return null;
}

/**
 * Quality flags for a PUBLISHED (live) article — things a reader is affected by
 * right now. Empty excerpt and test language are errors (they degrade or embarrass
 * the live magazine); a raw alt or a missing type/hero is a warning.
 */
export function publishedQualityFlags(a: QaArticle): QaFlag[] {
  const flags: QaFlag[] = [];
  if (!nonEmpty(a.excerpt)) {
    flags.push({ level: 'err', code: 'no-excerpt', label: 'Empty excerpt', detail: 'Cards, section pages and search show no summary.' });
  }
  if (hasTestLanguage(a.title, a.slug)) {
    flags.push({ level: 'err', code: 'test-language', label: 'Test/mock language in title or slug', detail: 'Looks like test content but is LIVE on the public magazine.' });
  }
  if (!relationPresent(a.category)) {
    flags.push({ level: 'err', code: 'no-category', label: 'No category', detail: 'A category is required to publish; a published article without one is a data problem.' });
  }
  if (!relationPresent(a.images?.hero)) {
    flags.push({ level: 'warn', code: 'no-hero', label: 'No hero image', detail: 'Cards and the article header fall back to a plain placeholder.' });
  } else if (heroAltLooksRaw(a.images?.heroAlt)) {
    flags.push({ level: 'warn', code: 'raw-alt', label: 'Hero alt looks like a product-listing title', detail: 'Ends with “product image”. Use an editorial description for accessibility.' });
  } else if (!nonEmpty(a.images?.heroAlt)) {
    flags.push({ level: 'warn', code: 'no-alt', label: 'Hero image has no alt text', detail: 'Add an editorial description for screen readers.' });
  }
  if (!nonEmpty(a.type)) {
    flags.push({ level: 'warn', code: 'no-type', label: 'No article type', detail: 'Type decides which magazine listings (e.g. Buying Guides, Reviews) the article feeds.' });
  }
  return flags;
}

/**
 * Advisory readiness flags for a NOT-yet-public article — what would need to be
 * filled before it could go live, plus test/clutter notes. All `info`: nothing
 * here is a live problem, and none of it publishes anything.
 */
export function readinessFlags(a: QaArticle): QaFlag[] {
  const flags: QaFlag[] = [];
  if (hasTestLanguage(a.title, a.slug)) {
    flags.push({ level: 'info', code: 'test-clutter', label: 'Test/mock content (non-public)', detail: 'Not visible to readers. Consider deleting in Payload to declutter the CMS.' });
  }
  if (!relationPresent(a.category)) {
    flags.push({ level: 'info', code: 'needs-category', label: 'No category — cannot publish yet', detail: 'A category is required before this article can be set to Published.' });
  }
  if (!nonEmpty(a.excerpt)) flags.push({ level: 'info', code: 'needs-excerpt', label: 'No excerpt yet' });
  if (!relationPresent(a.images?.hero)) flags.push({ level: 'info', code: 'needs-hero', label: 'No hero image yet' });
  return flags;
}

/** All flags for one article, dispatched on its public state. Divergence applies to both. */
export function getArticleFlags(a: QaArticle): QaFlag[] {
  const flags = isPublished(a) ? publishedQualityFlags(a) : readinessFlags(a);
  const div = divergenceFlag(a);
  return div ? [...flags, div] : flags;
}

/** Highest severity present in a flag list (for sorting / summary), or null. */
export function topLevel(flags: QaFlag[]): QaLevel | null {
  if (flags.some((f) => f.level === 'err')) return 'err';
  if (flags.some((f) => f.level === 'warn')) return 'warn';
  if (flags.some((f) => f.level === 'info')) return 'info';
  return null;
}
