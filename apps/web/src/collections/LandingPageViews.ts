import type { CollectionConfig } from 'payload';
import { scopedRead, scopedCreate, scopedMutate, stampTenantWorkspace } from '@/lib/access';

/**
 * First-party, privacy-light landing-page analytics (Phase 24) — mirrors
 * article-views. One row per (landing page, UTC day) with an incrementing count;
 * no IPs, no personal data, no third-party scripts. Public view pings go through
 * the server route (/api/lp-track) via the Local API with overrideAccess; the
 * public can never read analytics. Only PUBLISHED landing-page views are recorded.
 */
export const LandingPageViews: CollectionConfig = {
  slug: 'landing-page-views',
  labels: { singular: 'Landing Page View', plural: 'Landing Page Views' },
  admin: { useAsTitle: 'viewDate', group: 'Analytics', defaultColumns: ['landingPage', 'viewDate', 'count'] },
  access: {
    read: scopedRead('deny'),
    create: scopedCreate(),
    update: scopedMutate(),
    delete: scopedMutate(),
  },
  fields: [
    { name: 'landingPage', type: 'relationship', relationTo: 'landing-pages', required: true, index: true },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
    { name: 'viewDate', type: 'text', required: true, index: true, admin: { description: 'UTC day bucket (YYYY-MM-DD).' } },
    { name: 'count', type: 'number', defaultValue: 0 },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
