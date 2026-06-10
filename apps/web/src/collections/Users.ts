import type { CollectionConfig } from 'payload';

/**
 * Internal operators only. No public sign-up, no customer accounts (single-tenant).
 * `auth: true` gives Payload-managed login backing the dashboard (impl pkg §4.1).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  access: {
    // Internal-only: any authenticated operator can read; tighten with roles later.
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'operator',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Operator', value: 'operator' },
      ],
    },
  ],
};
