import type { CollectionConfig } from 'payload';
import { workspacesRead, superOnly } from '@/lib/access';

/**
 * Workspace / Publication / Site under a Tenant. ExploringToKnow Magazine is
 * workspace #1 (mode: exploring_network). Hosted + custom-domain modes are
 * readiness placeholders for later phases (no DNS/SSL activation yet).
 */
export const Workspaces: CollectionConfig = {
  slug: 'workspaces',
  labels: { singular: 'Workspace', plural: 'Workspaces' },
  admin: { useAsTitle: 'name', group: 'Platform', defaultColumns: ['name', 'slug', 'tenant', 'mode', 'status'] },
  access: {
    // Super admin → all; workspace member → workspaces under their tenant only.
    // Workspaces are created/edited by platform super admins only.
    read: workspacesRead,
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'mode', type: 'select', defaultValue: 'exploring_network', index: true,
      options: [
        { label: 'ExploringToKnow network', value: 'exploring_network' },
        { label: 'Hosted publication', value: 'hosted' },
        { label: 'Custom-domain ready', value: 'custom_domain_ready' },
      ],
    },
    { name: 'primaryDomain', type: 'text', admin: { description: 'Domain placeholder — no DNS/SSL activation in this phase.' } },
    {
      name: 'status', type: 'select', defaultValue: 'active', index: true,
      options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }],
    },
    { name: 'displayName', type: 'text', admin: { description: 'Public brand/display name placeholder.' } },
  ],
};
