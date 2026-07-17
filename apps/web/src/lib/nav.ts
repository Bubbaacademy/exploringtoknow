/**
 * Shared navigation configuration for the public site.
 *
 * - Primary nav links + the single standardized CTA ("Request a Review").
 * - Topic (category) grouping for the Topics mega menu. The grouping is ONLY a
 *   presentation map keyed by category slug — the categories themselves always
 *   come from the real database (see `listActiveCategories`). Any active category
 *   not named in a group still renders under "More Topics", so new DB categories
 *   are never dropped and no second, disconnected category list is hardcoded.
 */

export type NavLink = { label: string; href: string };

/** Standardized primary navigation (excluding Topics + Search, which are special). */
export const PRIMARY_NAV: NavLink[] = [
  { label: 'Buying Guides', href: '/buying-guides' },
  { label: 'Product Reviews', href: '/reviews' },
  { label: 'Explore Picks', href: '/explore' },
];

/** The ONE primary call-to-action. Label is standardized everywhere. */
export const CTA: NavLink = { label: 'Request a Review', href: '/request-product' };

/**
 * Internal/staff login entry point. The public magazine chrome intentionally does
 * NOT surface any SaaS signup / free-trial / workspace CTA — ExploringToKnow reads
 * as an independent buying-guide & review publication. `/login` stays available for
 * operator/editorial/admin users via a low-visibility footer link; all access
 * control remains server-side. (Signup/workspace routes still exist but are unlinked
 * from public chrome.)
 */
export const LOGIN_HREF = '/login';

/** Trust / editorial pages (footer). */
export const ABOUT_NAV: NavLink[] = [
  { label: 'About', href: '/about' },
  { label: 'Editorial Policy', href: '/editorial-policy' },
  { label: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
  { label: 'Contact', href: '/contact' },
];

/** Legal / policy pages (footer). */
export const LEGAL_NAV: NavLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Data Deletion', href: '/data-deletion' },
];

export const TOPICS_HREF = '/categories';
export const SEARCH_HREF = '/search';

/** Editorial groupings for the Topics mega menu (ordering + labels only). */
export const TOPIC_GROUPS: { title: string; slugs: string[] }[] = [
  {
    title: 'Home & Kitchen',
    slugs: ['home-kitchen', 'appliances', 'tools-home-improvement', 'outdoors-garden-patio', 'food-grocery', 'industrial-professional'],
  },
  {
    title: 'Tech & Auto',
    slugs: ['tech-electronics', 'office-school-business', 'automotive', 'books-media-entertainment'],
  },
  {
    title: 'Health & Family',
    slugs: ['health-fitness', 'beauty-personal-care', 'sleep-wellness', 'baby-kids', 'pet-supplies', 'toys-games'],
  },
  {
    title: 'Style & Leisure',
    slugs: ['clothing-shoes-accessories', 'jewelry-watches', 'travel-luggage', 'sports-recreation', 'arts-crafts-hobbies', 'gifts-seasonal', 'other-not-sure'],
  },
];

export type NavCategory = { id: string | number; name: string; slug: string };
export type TopicGroup = { title: string; items: NavCategory[] };

/**
 * Group the REAL active categories into editorial columns. Unknown/new categories
 * fall through to a final "More Topics" column so nothing is ever hidden.
 */
export function groupCategories(categories: NavCategory[]): TopicGroup[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const used = new Set<string>();
  const groups: TopicGroup[] = [];
  for (const g of TOPIC_GROUPS) {
    const items: NavCategory[] = [];
    for (const slug of g.slugs) {
      const c = bySlug.get(slug);
      if (c) {
        items.push(c);
        used.add(slug);
      }
    }
    if (items.length) groups.push({ title: g.title, items });
  }
  const leftover = categories.filter((c) => !used.has(c.slug));
  if (leftover.length) groups.push({ title: 'More Topics', items: leftover });
  return groups;
}
