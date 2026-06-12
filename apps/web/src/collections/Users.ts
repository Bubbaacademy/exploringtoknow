import type { CollectionConfig } from 'payload';

/**
 * Internal operators only. No public sign-up, no customer accounts (single-tenant).
 * Payload-managed login backs the dashboard (impl pkg §4.1). `useAPIKey` also
 * issues per-user API keys so the worker can authenticate to the Payload REST API
 * when persisting generation output (Approach B: worker → app over REST).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: { useAPIKey: true },
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
