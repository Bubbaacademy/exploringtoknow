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

/** Types that must be tied to a real product record. */
const PRODUCT_REQUIRED_TYPES = ['review'];

/**
 * Accepted `media.source` provenance prefixes.
 * OWNED proves the seller owns or was granted use of the image.
 * LICENSED is acceptable ONLY for general editorial articles with no linked
 * product — a licensed stock photo can never be a product article's hero.
 */
const OWNED_PREFIXES = ['owned:', 'permission:'];
const LICENSED_PREFIXES = ['license:', 'licence:'];

/**
 * Internal permission markers already written by the product-request approval
 * flow. A request cannot be approved without `imagePermissionConfirmed`, and
 * approval stamps this string onto the media it carries across — so the marker
 * is itself the trace back to a confirmed permission.
 *
 * This matters because `/api/product-requests` is not readable over REST (405),
 * so a REST-based caller cannot check the request directly. Callers that CAN
 * read it (Local API) may still pass `productPermissionConfirmed` instead.
 */
const INTERNAL_PERMISSION_MARKERS = ['manual upload (product request)'];

/** Public CTA / SaaS / marketplace language that must never reach the magazine. */
const FORBIDDEN_PUBLIC_TERMS = [
  'Request a Review', 'Request Access', 'Start Free Trial', 'free trial',
  'Create workspace', 'Create a workspace', 'My Workspace', 'BubbaAffiliate',
  'Submit Your Offer', 'Become a Creator', 'content-commerce',
];

/**
 * Health / sleep / medical claims. The magazine's promise is "independently
 * researched, human-reviewed" — it is not qualified to assert physiological
 * effects. Phase 2W generated a "review" claiming LEDs "nudge your brain toward
 * awake" and "make falling asleep harder"; none of that is supportable.
 */
const HEALTH_CLAIM_PATTERNS = [
  /\bmelatonin\b/i, /\bcircadian\b/i, /\binsomnia\b/i,
  /\bfall(?:ing)? asleep\b/i, /\bstay(?:ing)? awake\b/i,
  /\bsleep quality\b/i, /\bsleep better\b/i, /\bhelps? you sleep\b/i,
  /\b(?:disrupt|disrupts|disrupting|wreck|wrecks|wrecking|ruin|ruins|ruining|harm|harms|harming)\s+(?:your\s+)?sleep\b/i,
  /\bbrain toward\b/i, /\bclinically\b/i, /\bmedically\b/i, /\bdoctor[- ]recommended\b/i,
];

/**
 * Performance / durability assertions that require a manufacturer or product
 * source. Pass `allowSourcedClaims: true` only when the copy actually attributes
 * them.
 */
const UNSUPPORTED_CLAIM_PATTERNS = [
  /\bno[- ]residue\b/i, /\bresidue[- ]free\b/i, /\bleaves no residue\b/i,
  /\b(?:will not|won'?t|does not|doesn'?t)\s+(?:damage|peel|fade|yellow|fall off)\b/i,
  /\blong[- ]term\b/i, /\blasts? (?:for )?years\b/i, /\bpermanently\b/i,
  /\bblocks?\s+\d+\s*%/i, /\breduces?\s+[^.]{0,24}\d+\s*%/i, /\bup to \d+\s*%/i,
];

/** A review must say what it is and is not based on. */
const RESEARCH_BASIS_PATTERNS = [
  /\bresearch[- ]based\b/i, /\bdid not (?:run|test|measure)\b/i,
  /\b(?:have|has) not (?:been )?tested\b/i, /\bnot a hands[- ]on\b/i,
  /\bwe did not\b/i, /\bbased on (?:the )?(?:manufacturer|published|product)[^.]{0,40}(?:information|documentation|specification|listing)/i,
  /\bnot lab[- ]tested\b/i,
];

/** Disclosure is rendered by the site when a product is linked — never in prose. */
const MANUAL_DISCLOSURE_PATTERNS = [
  /this (?:article|post|page) contains affiliate links/i,
  /we may earn a (?:small )?commission/i,
  /at no extra cost to you/i,
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

const norm = (s) => trimmed(s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Alt text that is really the marketplace listing title rather than a
 * description. Catches the Phase 2W failure, where the alt was the full Amazon
 * title — which escaped `heroAltLooksRaw` only because it lacked the suffix.
 */
export function altLooksLikeListingTitle(alt, productTitle) {
  const a = trimmed(alt);
  if (!a) return false;
  if (productTitle && norm(a) === norm(productTitle)) return true;
  if (a.length > 120) return true;
  if ((a.match(/,/g) || []).length >= 3) return true;
  return false;
}

const STOP = new Set(['a','an','the','and','or','of','for','to','in','on','with','your','you','what','how','is','are','it','that','this','here','s','was','do','does']);
const tokens = (s) => norm(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w));

/** Jaccard overlap of significant title words. */
export function titleSimilarity(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter += 1;
  return inter / (A.size + B.size - inter);
}

/**
 * Decide publish-readiness.
 *
 * @param {object} b
 * @param {object} b.article  Payload article doc (depth >= 1 preferred)
 * @param {object|null} b.hero  resolved Media doc for images.hero, or null
 * @param {object|null} b.product  resolved Products doc for `product`, or null
 * @param {string[]} b.knownCategorySlugs  real category slugs from Payload
 * @param {number[]} [b.productMediaIds]  media ids in the linked product's productImages
 * @param {boolean} [b.productPermissionConfirmed]  a product-request for this
 *        product has imagePermissionConfirmed = true
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
  // Two regimes. A PRODUCT-LINKED article is monetizable: its hero must be one
  // of that product's own uploaded images, and stock is refused outright no
  // matter how well licensed. A GENERAL editorial article with no product may
  // use owned or licensed imagery, provided the provenance is recorded.
  const productLinked = idOf(a.product) != null;
  const permissionConfirmed = b?.productPermissionConfirmed === true;

  if (heroId == null) {
    block('NO_HERO', productLinked
      ? 'No hero image. A product article must use one of the linked product\'s own uploaded images.'
      : 'No hero image. Attach one and record its source before publishing.');
  } else if (!hero) {
    block('HERO_UNRESOLVED', `Hero media id ${heroId} could not be loaded.`);
  } else {
    const source = trimmed(hero.source);
    const belongsToProduct = productMediaIds.includes(Number(heroId));

    if (productLinked) {
      if (!belongsToProduct) {
        block('HERO_NOT_PRODUCT_MEDIA', `Hero media ${heroId} ("${str(hero.filename)}") is not one of the linked product's images. A product article's hero must come from the product's own uploaded media — licensed stock is not acceptable here.`);
      } else if (
        !permissionConfirmed &&
        !startsWithAny(source, OWNED_PREFIXES) &&
        !startsWithAny(source, INTERNAL_PERMISSION_MARKERS)
      ) {
        block('HERO_PERMISSION_UNPROVEN', `Hero media ${heroId} belongs to the linked product, but permission is not proven (Media.source is "${source || '(empty)'}"). Bring it in through a product request with "image permission confirmed", or set Media.source to owned:… / permission:…`);
      }
    } else if (!source) {
      block('HERO_NO_SOURCE', `Hero media ${heroId} ("${str(hero.filename)}") has no recorded source. Set Media.source to owned:… / permission:… / license:…`);
    } else if (!startsWithAny(source, [...OWNED_PREFIXES, ...LICENSED_PREFIXES])) {
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
  if (PRODUCT_REQUIRED_TYPES.includes(type) && !productLinked) {
    block('REVIEW_NO_PRODUCT', 'A review must have a linked product (drives the affiliate link and disclosure, and supplies the hero image).');
  }
  if (productLinked && !product) {
    warn('PRODUCT_UNRESOLVED', 'Linked product could not be loaded for verification.');
  }

  // --- 9. forbidden public CTA / SaaS language ------------------------------
  const prose = [str(a.title), str(a.excerpt), markdown].join('\n');
  for (const term of FORBIDDEN_PUBLIC_TERMS) {
    if (prose.toLowerCase().includes(term.toLowerCase())) {
      block('FORBIDDEN_CTA', `Forbidden public CTA/SaaS language: "${term}".`);
    }
  }

  // --- 9b. editorial quality (Phase 2X) --------------------------------------
  // Everything below exists because Phase 2W produced a technically valid but
  // unpublishable "review": a re-skin of an existing article, with sleep claims,
  // an unsourced durability claim, marketplace alt text, no stated basis, and a
  // hand-written disclosure the site already renders.
  const bodyAndMeta = [str(a.title), str(a.excerpt), markdown].join('\n');

  for (const re of HEALTH_CLAIM_PATTERNS) {
    const m = bodyAndMeta.match(re);
    if (m && b?.allowHealthClaims !== true) {
      block('HEALTH_CLAIM', `Health/sleep/medical claim "${m[0]}" — the magazine cannot assert physiological effects.`);
      break;
    }
  }

  for (const re of UNSUPPORTED_CLAIM_PATTERNS) {
    const m = bodyAndMeta.match(re);
    if (m && b?.allowSourcedClaims !== true) {
      block('UNSUPPORTED_CLAIM', `Unsourced performance/durability claim "${m[0]}" — attribute it to the manufacturer or remove it.`);
      break;
    }
  }

  if (type === 'review' && !RESEARCH_BASIS_PATTERNS.some((re) => re.test(markdown))) {
    block('NO_RESEARCH_BASIS', 'A review must state what it is based on (e.g. research-based from manufacturer documentation, and that nothing was hands-on tested).');
  }

  if (productLinked) {
    for (const re of MANUAL_DISCLOSURE_PATTERNS) {
      if (re.test(markdown)) {
        block('MANUAL_DISCLOSURE', 'The body hand-writes an affiliate disclosure; the site renders one automatically for product-linked articles. Remove it.');
        break;
      }
    }
  }

  if (heroId != null && altLooksLikeListingTitle(heroAlt, str(product?.title))) {
    block('HERO_ALT_LISTING_TITLE', `Hero alt is marketplace listing text, not a description: "${heroAlt.slice(0, 90)}${heroAlt.length > 90 ? '…' : ''}"`);
  }

  // Near-duplicate of something already published on the same product+category.
  const siblings = Array.isArray(b?.publishedSiblings) ? b.publishedSiblings : [];
  for (const s of siblings) {
    if (String(s.id) === String(a.id)) continue;
    const sameProduct = idOf(s.product) != null && String(idOf(s.product)) === String(idOf(a.product));
    const sameCategory = String(idOf(s.category)) === String(catId);
    if (!sameProduct || !sameCategory) continue;
    const sim = titleSimilarity(a.title, s.title);
    if (sim >= 0.5) {
      block('DUPLICATE_TOPIC', `Near-duplicate of published "${s.title}" (${s.slug}) — same product and category, title overlap ${(sim * 100).toFixed(0)}%.`);
      break;
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
