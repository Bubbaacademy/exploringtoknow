import type { CollectionConfig } from 'payload';
export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: { useAsTitle: 'name', group: 'Catalog' },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'description', type: 'textarea' },
    { name: 'website', type: 'text' },
  ],
};
