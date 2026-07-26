/**
 * Phase 2U — publish gate (PURE). No I/O, no deps, no Payload import.
 *
 * The single decision point for "may this article go public?". The caller
 * fetches the article plus its hero media / linked product and hands them in;
 * this module only decides. Every rule here exists because it already went
 * wrong in production at least once (Phases 2O, 2P, 2T).
 *
 * Returns { ok, blockers[], warnings[] }. `ok` is true ONLY when blockers is
 * empty — an article is never published on a partial pass.
 */

/** Minimum body length. P1 shipped with 0 chars; this is the floor that stops that. */
export const MARKDOWN_FLOOR = 1500;

/** Real Articles.type values (apps/web/src/collections/Articles.ts). */
export const ARTICLE_TYPES = [
  'how_to', 'buying_guide', 'review', 'comparison',
  'best_list', 'faq', 'problem_solution', 'educational',
];

/** Types whose hero may never be generic stock. */
const OWNED_IMAGE_TYPES = ['review'];

/** Accepted `media.source` provenance prefixes. */
const OWNED_PREFIXES = ['owned:', 'permission:'];
const LICENSED_PREFIXES = ['license:', 'licence:'];

/** Public CTA / SaaS / marketplace language that must never reach the magazine. */
const FORBIDDEN_PUBLIC_TERMS = [
  'Request a Review', 'Request Access', 'Start Free Trial', 'free trial',
  'Create workspace', 'Create a workspace', 'My Workspace', 'BubbaAffiliate',
  'Submit Your Offer', 'Become a Creator', 'content-commerce',
];

/**
 * Placeholder / internal markers. Word-boundaried on purpose: a bare substring
 * scan for "TEST" flags "greatest" and "contest" (noted in Phase 2Q).
 */
const PLACEHOLDER_PATTERNS = [
  { label: '[TEST]', re: /\[TEST\]/i },
  { label: 'TEST', re: /\bTEST\b/ },
  { label: 'zzz', re: /\bzzz/i },
  { label: 'lorem ipsum', re: /\blorem ipsum\b/i },
  { label: 'TODO', re: /\bTODO\b/ },
  { label: '{PRODUCT}', re: /\{PRODUCT\}/i },
  { label: 'VERIFY', re: /\bVERIFY\b/ },
];

const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const trimmed = (v) => str(v).trim();
const idOf = (rel) => (rel && typeof rel === 'object' ? (rel.id ?? null) : (rel ?? null));
const slugOf = (rel) => (rel && typeof rel === 'object' ? str(rel.slug) : '');
const startsWithAny = (s, prefixes) => prefixes.some((p) => s.toLowerCase().startsWith(p));

/** Raw marketplace alt text, e.g. anything ending "… – product image". */
export function heroAltLooksRaw(alt) {
  const a = trimmed(alt).toLowerCase();
  if (!a) return false;
  return /[-–—]\s*product image\.?$/.test(a) || /\bproduct image\b\.?$/.test(a);
}

/**
 * Decide publish-readiness.
 *
 * @param {object} b
 * @param {object} b.article  Payload article doc (depth >= 1 preferred)
 * @param {object|null} b.hero  resolved Media doc for images.hero, or null
 * @param {object|null} b.product  resolved Products doc for `product`, or null
 * @param {string[]} b.knownCategorySlugs  real category slugs from Payload
 * @param {number[]} [b.productMediaIds]  media ids belonging to the linked product
 */
export function evaluate(b) {
  const a = b?.article || {};
  const hero = b?.hero || null;
  const product = b?.product || null;
  const known = Array.isArray(b?.knownCategorySlugs) ? b.knownCategorySlugs : [];
  const productMediaIds = Array.isArray(b?.productMediaIds) ? b.productMediaIds : [];

  const blockers = [];
  const warnings = [];
  const block = (code, msg) => blockers.push({ code, message: msg });
  const warn = (code, msg) => warnings.push({ code, message: msg });

  const type = trimmed(a.type);
  const images = a.images || {};
  const heroId = idOf(images.hero);
  const heroAlt = trimmed(images.heroAlt);
  const markdown = str(a.markdown);
  const blocks = Array.isArray(a.bodyBlocks) ? a.bodyBlocks : [];

  // --- 1. body ---------------------------------------------------------------
  if (blocks.length === 0) {
    if (!markdown.trim()) block('BODY_EMPTY', 'Body is empty — nothing would render for a reader.');
    else if (markdown.length < MARKDOWN_FLOOR) {
      block('BODY_TOO_SHORT', `Body is ${markdown.length} chars, below the ${MARKDOWN_FLOOR} floor.`);
    }
  }

  // --- 2. category (also enforced by the Payload publish hook) ---------------
  const catId = idOf(a.category);
  const catSlug = slugOf(a.category);
  if (catId == null) block('NO_CATEGORY', 'No category — Payload rejects publication without one.');
  else if (catSlug && known.length && !known.includes(catSlug)) {
    block('CATEGORY_UNKNOWN', `Category "${catSlug}" is not an active category.`);
  }

  // --- 3. excerpt ------------------------------------------------------------
  if (!trimmed(a.excerpt)) block('NO_EXCERPT', 'No excerpt — cards and search results would render blank.');

  // --- 4. article type -------------------------------------------------------
  if (!type) block('NO_TYPE', 'No article type.');
  else if (!ARTICLE_TYPES.includes(type)) block('TYPE_INVALID', `Article type "${type}" is not a real Articles.type value.`);

  // --- 5. hero image + provenance -------------------------------------------
  const needsOwned = OWNED_IMAGE_TYPES.includes(type);
  if (heroId == null) {
    block('NO_HERO', needsOwned
      ? 'No hero image. A review requires a real owned or permissioned product photo.'
      : 'No hero image. Attach one and record its source before publishing.');
  } else if (!hero) {
    block('HERO_UNRESOLVED', `Hero media id ${heroId} could not be loaded.`);
  } else {
    const source = trimmed(hero.source);
    const belongsToProduct = productMediaIds.includes(Number(heroId));
    if (!source && !belongsToProduct) {
      block('HERO_NO_SOURCE', `Hero media ${heroId} ("${str(hero.filename)}") has no recorded source. Set Media.source to owned:… / permission:… / license:…`);
    } else if (needsOwned) {
      if (!belongsToProduct && !startsWithAny(source, OWNED_PREFIXES)) {
        block('HERO_STOCK_ON_REVIEW', `Reviews may not use stock imagery. Hero media ${heroId} source "${source || '(none)'}" is not owned:/permission: and does not belong to the linked product.`);
      }
    } else if (!belongsToProduct && !startsWithAny(source, [...OWNED_PREFIXES, ...LICENSED_PREFIXES])) {
      block('HERO_SOURCE_UNRECOGNIZED', `Hero media ${heroId} source "${source}" must start with owned:, permission:, or license:.`);
    }
  }

  // --- 6. hero alt text ------------------------------------------------------
  if (heroId != null) {
    if (!heroAlt) block('NO_HERO_ALT', 'Hero image has no alt text.');
    else if (heroAltLooksRaw(heroAlt)) block('HERO_ALT_RAW', `Hero alt text is raw marketplace copy: "${heroAlt}"`);
  } else if (heroAlt) {
    block('HERO_ALT_ORPHAN', 'Hero alt text is set but there is no hero image — the alt would describe nothing.');
  }

  // --- 7. placeholder / internal markers in public fields --------------------
  const publicFields = [
    ['title', str(a.title)], ['slug', str(a.slug)], ['excerpt', str(a.excerpt)],
    ['markdown', markdown], ['heroAlt', heroAlt],
    ['seo.metaTitle', str(a.seo?.metaTitle)], ['seo.metaDescription', str(a.seo?.metaDescription)],
    ['openGraph.title', str(a.openGraph?.title)], ['openGraph.description', str(a.openGraph?.description)],
  ];
  for (const [field, value] of publicFields) {
    if (!value) continue;
    for (const p of PLACEHOLDER_PATTERNS) {
      if (p.re.test(value)) block('PLACEHOLDER_TEXT', `Placeholder/internal marker "${p.label}" found in ${field}.`);
    }
  }

  // --- 8. review requires a linked product ----------------------------------
  if (needsOwned && idOf(a.product) == null) {
    block('REVIEW_NO_PRODUCT', 'A review must have a linked product (drives the affiliate link and disclosure).');
  }
  if (needsOwned && idOf(a.product) != null && !product) {
    warn('PRODUCT_UNRESOLVED', 'Linked product could not be loaded for verification.');
  }

  // --- 9. forbidden public CTA / SaaS language ------------------------------
  const prose = [str(a.title), str(a.excerpt), markdown].join('\n');
  for (const term of FORBIDDEN_PUBLIC_TERMS) {
    if (prose.toLowerCase().includes(term.toLowerCase())) {
      block('FORBIDDEN_CTA', `Forbidden public CTA/SaaS language: "${term}".`);
    }
  }

  // --- 10. status order ------------------------------------------------------
  const ed = trimmed(a.editorialStatus);
  const pipe = trimmed(a.status);
  if (ed !== 'published' && pipe === 'published') {
    block('STATUS_DIVERGENCE', 'Pipeline status is already "published" while editorial status is not. Editorial must lead — this is the Phase 2O divergence.');
  }
  if (ed === 'rejected') block('STATUS_REJECTED', 'Article is Rejected; publish is not appropriate.');

  return { ok: blockers.length === 0, blockers, warnings };
}

export function formatResult(slug, r) {
  const lines = [`gate: ${slug} → ${r.ok ? 'PASS' : 'BLOCKED'}`];
  for (const x of r.blockers) lines.push(`  BLOCK  [${x.code}] ${x.message}`);
  for (const x of r.warnings) lines.push(`  warn   [${x.code}] ${x.message}`);
  return lines.join('\n');
}
