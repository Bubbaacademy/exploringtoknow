import type { CollectionConfig } from 'payload';
import { scopedRead, scopedCreate, scopedMutate, stampTenantWorkspace } from '@/lib/access';

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
    read: scopedRead('deny'),
    create: scopedCreate(), // public pings use the server route (Local API, overrideAccess)
    update: scopedMutate(),
    delete: scopedMutate(),
  },
  fields: [
    { name: 'article', type: 'relationship', relationTo: 'articles', required: true, index: true },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true, admin: { description: 'Owning tenant (ExploringToKnow for existing records; set by backfill).' } },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true, admin: { description: 'Owning workspace/publication (ETK Magazine for existing records; set by backfill).' } },
    { name: 'viewDate', type: 'text', required: true, index: true, admin: { description: 'UTC day bucket (YYYY-MM-DD).' } },
    { name: 'count', type: 'number', defaultValue: 0 },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
