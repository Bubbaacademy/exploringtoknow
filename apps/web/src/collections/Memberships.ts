import type { CollectionConfig } from 'payload';
import { membershipsRead, superOnly } from '@/lib/access';

/**
 * Membership — connects a user to a tenant/workspace with a role. This is the
 * authoritative source for access decisions on the /app (workspace) and /platform
 * (super-admin) surfaces; those surfaces resolve the current user via payload.auth
 * and read memberships server-side (see lib/tenant.ts). Roles are NOT trusted from
 * the client. A platform_super_admin membership may have no tenant (platform-wide).
 */
export const Memberships: CollectionConfig = {
  slug: 'memberships',
  labels: { singular: 'Membership', plural: 'Memberships' },
  admin: { useAsTitle: 'role', group: 'Platform', defaultColumns: ['user', 'role', 'tenant', 'workspace', 'createdAt'] },
  access: {
    // Super admin → all; a user may read only their own memberships. Memberships are
    // granted/revoked by platform super admins only (the authority for access).
    read: membershipsRead,
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true, admin: { description: 'Empty for platform-wide (super admin) memberships.' } },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
    {
      name: 'role', type: 'select', required: true, defaultValue: 'viewer', index: true,
      options: [
        { label: 'Platform super admin', value: 'platform_super_admin' },
        { label: 'Workspace owner', value: 'workspace_owner' },
        { label: 'Workspace admin', value: 'workspace_admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer / Analyst', value: 'viewer' },
      ],
    },
  ],
};
