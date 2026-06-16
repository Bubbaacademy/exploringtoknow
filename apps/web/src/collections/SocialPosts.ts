import type { CollectionConfig } from 'payload';
import { scopedRead, scopedCreate, scopedMutate, stampTenantWorkspace } from '@/lib/access';
/** Composed FB/IG posts + publish state (impl pkg §4). Phase 1 platforms only. */
export const SocialPosts: CollectionConfig = {
  slug: 'social-posts',
  admin: { useAsTitle: 'id', group: 'Content', defaultColumns: ['platform', 'status', 'scheduledFor'] },
  access: {
    read: scopedRead('deny'),
    create: scopedCreate(),
    update: scopedMutate(),
    delete: scopedMutate(),
  },
  fields: [
    { name: 'article', type: 'relationship', relationTo: 'articles', index: true },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true, admin: { description: 'Owning tenant (ExploringToKnow for existing records; set by backfill).' } },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true, admin: { description: 'Owning workspace/publication (ETK Magazine for existing records; set by backfill).' } },
    {
      name: 'platform', type: 'select', required: true,
      options: [
        { label: 'Facebook', value: 'facebook' },
        { label: 'Instagram', value: 'instagram' },
      ],
    },
    { name: 'caption', type: 'textarea' },
    { name: 'hashtags', type: 'json' },
    { name: 'imageMedia', type: 'relationship', relationTo: 'media' },
    { name: 'trackingCode', type: 'text', admin: { description: 'Code of the /go/<code> link used in the CTA.' } },
    {
      name: 'status', type: 'select', defaultValue: 'draft', index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Published', value: 'published' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    { name: 'scheduledFor', type: 'date' },
    { name: 'externalId', type: 'text', admin: { description: 'Meta post/media id after publish.' } },
    { name: 'publishedAt', type: 'date' },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
