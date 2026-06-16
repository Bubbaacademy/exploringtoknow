import type { CollectionConfig } from 'payload';
import { usersRead, usersSelfOrSuper, superOnly, adminPanelAccess } from '@/lib/access';

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
    // Phase 14: the Payload admin panel is platform-super-admin-only (workspace
    // customers use /app). Users read = super sees all, others see only themselves;
    // mutate = super or self (account management); creation/deletion = super only.
    admin: adminPanelAccess,
    read: usersRead,
    create: superOnly,
    update: usersSelfOrSuper,
    delete: superOnly,
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
