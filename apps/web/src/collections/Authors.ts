import type { CollectionConfig } from 'payload';

/**
 * Editorial authors. Public may READ (for author pages); only authenticated
 * admins may write. Articles relate to an author; unassigned articles fall back
 * to the seeded "ExploringToKnow Editorial Team" author.
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    description: 'Editorial authors/contributors. Fields: role, bio + longBio, expertise (comma-separated), image, sortOrder, active. Public author pages show PUBLISHED work only and are noindex until an author has published content. Unassigned articles fall back to "ExploringToKnow Editorial Team".',
    defaultColumns: ['name', 'role', 'sortOrder', 'active'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true, admin: { description: 'Owning tenant (ExploringToKnow for existing records; set by backfill).' } },
    { name: 'role', type: 'text', admin: { description: 'e.g. "Senior Editor", "Editorial Team".' } },
    { name: 'bio', type: 'textarea', admin: { description: 'Short bio shown on the byline/author header.' } },
    { name: 'longBio', type: 'textarea', admin: { description: 'Optional longer bio shown on the author page.' } },
    { name: 'expertise', type: 'text', admin: { description: 'Comma-separated topics/areas of expertise (e.g. "Sleep, Home tech, Wellness").' } },
    { name: 'image', type: 'relationship', relationTo: 'media', admin: { description: 'Optional author photo (manual upload only).' } },
    { name: 'websiteUrl', type: 'text' },
    { name: 'sortOrder', type: 'number', admin: { description: 'Lower shows first where author ordering applies.' } },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true, admin: { description: 'Inactive authors are hidden from public author pages.' } },
    {
      name: 'seo', type: 'group', fields: [
        { name: 'seoTitle', type: 'text' },
        { name: 'seoDescription', type: 'textarea' },
      ],
    },
  ],
};
