/**
 * Magazine section mapping layer (Phase 2E).
 *
 * Public section routes are STABLE, human-readable URLs owned by the magazine
 * (`/home-living`, `/tech`, …). They are deliberately DECOUPLED from database
 * category slugs, which are operational taxonomy and may be renamed or extended
 * without breaking a published URL.
 *
 * Every `categorySlugs` entry below is a REAL seeded category slug, verified
 * against the committed seed migration `20260614_214148_product_request_category_and_seed`.
 * Every `types` entry is a real `Articles.type` option. Nothing here invents a
 * slug, and a slug that is missing at runtime simply contributes no articles —
 * the section still renders an honest empty state rather than 404-ing.
 *
 * The vertical groupings intentionally mirror `MAGAZINE_SECTIONS` on the Phase 2D
 * homepage so the front page and the section pages never disagree.
 *
 * This is a presentation map only: it performs no writes, defines no schema, and
 * never limits which categories exist. Categories not named here remain fully
 * reachable through the Topics menu, the category hub, and `/category/[slug]`.
 *
 * Sections are exported as named constants so each route imports its own section
 * directly — a typo is then a compile error rather than an undefined lookup that
 * only surfaces when the page renders.
 */

export type SectionKind = 'category' | 'type' | 'curated';

export type MagazineSection = {
  /** Public route segment — the canonical, stable public URL. */
  slug: string;
  /** Nav + hero label. */
  title: string;
  /** Small editorial kicker above the title. */
  eyebrow: string;
  /** Short section description shown under the hero and used as meta description. */
  description: string;
  kind: SectionKind;
  /** Real active category slugs backing a `category` section. */
  categorySlugs?: string[];
  /** Real `Articles.type` values backing a `type` section. */
  types?: string[];
};

export const SECTION_HOME_LIVING: MagazineSection = {
  slug: 'home-living',
  title: 'Home & Living',
  eyebrow: 'Live better at home',
  description:
    'Guides for the spaces you actually live in — cleaning, storage, decor, garden and the household tools worth owning.',
  kind: 'category',
  categorySlugs: ['home-kitchen', 'appliances', 'tools-home-improvement', 'outdoors-garden-patio', 'industrial-professional'],
};

export const SECTION_BEAUTY_STYLE: MagazineSection = {
  slug: 'beauty-style',
  title: 'Beauty & Style',
  eyebrow: 'Look and feel considered',
  description:
    'Beauty, personal care and everyday style — what works, what lasts, and what is simply well made.',
  kind: 'category',
  categorySlugs: ['beauty-personal-care', 'clothing-shoes-accessories', 'jewelry-watches', 'sleep-wellness'],
};

export const SECTION_TECH: MagazineSection = {
  slug: 'tech',
  title: 'Tech & Everyday Gear',
  eyebrow: 'Useful, not hyped',
  description:
    'Everyday electronics and gear judged on whether they earn their place — not on spec sheets or launch-day noise.',
  kind: 'category',
  categorySlugs: ['tech-electronics', 'office-school-business', 'automotive', 'books-media-entertainment'],
};

export const SECTION_FAMILY_PETS: MagazineSection = {
  slug: 'family-pets',
  title: 'Family & Pets',
  eyebrow: 'For the whole household',
  description:
    'Practical guides for family life — kids, play, wellbeing and the pets who run the place.',
  kind: 'category',
  categorySlugs: ['baby-kids', 'pet-supplies', 'toys-games', 'health-fitness'],
};

export const SECTION_FOOD_KITCHEN: MagazineSection = {
  slug: 'food-kitchen',
  title: 'Food & Kitchen',
  eyebrow: 'Cook, store, enjoy',
  description:
    'Kitchen tools, food prep and storage — the equipment that quietly makes cooking better.',
  kind: 'category',
  categorySlugs: ['food-grocery'],
};

export const SECTION_BUYING_GUIDES: MagazineSection = {
  slug: 'buying-guides',
  title: 'Buying Guides',
  eyebrow: 'Choose with confidence',
  description:
    'In-depth guides that compare the real options and explain what actually matters before you spend.',
  kind: 'type',
  types: ['buying_guide', 'best_list', 'comparison', 'how_to'],
};

export const SECTION_PRODUCT_REVIEWS: MagazineSection = {
  slug: 'product-reviews',
  title: 'Product Reviews',
  eyebrow: 'Considered, not sponsored',
  description:
    'Independent product reviews — researched and human-reviewed, with no sponsored rankings.',
  kind: 'type',
  types: ['review', 'comparison'],
};

export const SECTION_EXPLORE_PICKS: MagazineSection = {
  slug: 'explore-picks',
  title: 'Explore Picks',
  eyebrow: 'Editor-curated',
  description:
    'Curated editorial picks and shopping discovery — featured guides, the latest reviews, and topics worth exploring.',
  kind: 'curated',
};

/** Display/nav order for the magazine. */
export const MAGAZINE_SECTIONS: MagazineSection[] = [
  SECTION_HOME_LIVING,
  SECTION_BEAUTY_STYLE,
  SECTION_TECH,
  SECTION_FAMILY_PETS,
  SECTION_FOOD_KITCHEN,
  SECTION_BUYING_GUIDES,
  SECTION_PRODUCT_REVIEWS,
  SECTION_EXPLORE_PICKS,
];

/**
 * The editorial verticals (excludes the guide / review / picks entry points).
 * Public navigation is built from these — every href is a real file in the app
 * router, so a nav link can never 404 against an unverified category slug.
 */
export const VERTICAL_SECTIONS = MAGAZINE_SECTIONS.filter((s) => s.kind === 'category');

/**
 * Reader-facing labels for the existing `Articles.type` option set. Presentation
 * only — the values are the collection's own and are never modified here.
 */
export const PUBLIC_ARTICLE_TYPE_LABEL: Record<string, string> = {
  how_to: 'How-To',
  buying_guide: 'Buying Guide',
  review: 'Review',
  comparison: 'Comparison',
  best_list: 'Best List',
  faq: 'FAQ',
  problem_solution: 'Problem / Solution',
  educational: 'Explainer',
};

/**
 * The magazine listing an article of a given type belongs to, so a reader can
 * step from one article back up to the feed it came from. Mirrors the `types`
 * declared on the listing sections above; anything unmapped returns null and the
 * caller falls back to the category or topic hub — it never guesses a route.
 */
export function listingForArticleType(type: string): { label: string; href: string } | null {
  const t = String(type || '');
  if (SECTION_PRODUCT_REVIEWS.types?.includes(t)) return { label: SECTION_PRODUCT_REVIEWS.title, href: `/${SECTION_PRODUCT_REVIEWS.slug}` };
  if (SECTION_BUYING_GUIDES.types?.includes(t)) return { label: SECTION_BUYING_GUIDES.title, href: `/${SECTION_BUYING_GUIDES.slug}` };
  return null;
}
