import type { CollectionConfig } from 'payload';
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    description: 'Topics powering navigation + category pages. Merchandising: heroImage (premium masthead; elegant fallback if empty), longDescription (intro copy), featured + sortOrder (ordering/curation), SEO title/description. Public pages list PUBLISHED articles only. Inactive categories are hidden from the public site.',
    defaultColumns: ['name', 'slug', 'featured', 'sortOrder', 'active'],
  },
  // Public may READ categories (for the request form); only authenticated admins
  // may create/update/delete — public users can never create arbitrary categories.
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'description', type: 'textarea', admin: { description: 'Short description shown on category cards/pages.' } },
    { name: 'longDescription', type: 'textarea', admin: { description: 'Optional longer intro shown on the category masthead.' } },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    { name: 'heroImage', type: 'relationship', relationTo: 'media', admin: { description: 'Optional category hero (manual upload only). Falls back to an elegant gradient when empty.' } },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { description: 'Surface this topic first in discovery.' } },
    { name: 'sortOrder', type: 'number', admin: { description: 'Lower shows first where ordering applies.' } },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true, admin: { description: 'Inactive categories are hidden from the public site.' } },
    {
      name: 'seo', type: 'group', fields: [
        { name: 'seoTitle', type: 'text' },
        { name: 'seoDescription', type: 'textarea' },
      ],
    },
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
  ],
};
