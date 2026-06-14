import type { CollectionConfig } from 'payload';
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'name', group: 'Catalog', defaultColumns: ['name', 'slug', 'active'] },
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
    { name: 'image', type: 'relationship', relationTo: 'media' },
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
