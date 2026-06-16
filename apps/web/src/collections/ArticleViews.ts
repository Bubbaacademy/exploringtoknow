import type { CollectionConfig } from 'payload';

/**
 * First-party, privacy-light pageview analytics. One row per (article, day) with
 * an incrementing count — no IPs, no personal data, no third-party scripts. Public
 * view pings go through the server route (`/api/track`) using the Local API with
 * overrideAccess; the public can never read analytics. Only PUBLISHED article
 * views are recorded (enforced in the route).
 */
export const ArticleViews: CollectionConfig = {
  slug: 'article-views',
  labels: { singular: 'Article View', plural: 'Article Views' },
  admin: { useAsTitle: 'viewDate', group: 'Analytics', defaultColumns: ['article', 'viewDate', 'count'] },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user), // public pings use the server route (Local API)
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'article', type: 'relationship', relationTo: 'articles', required: true, index: true },
    { name: 'viewDate', type: 'text', required: true, index: true, admin: { description: 'UTC day bucket (YYYY-MM-DD).' } },
    { name: 'count', type: 'number', defaultValue: 0 },
  ],
};
