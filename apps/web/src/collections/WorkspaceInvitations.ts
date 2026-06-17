import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly } from '@/lib/access';

/**
 * Workspace team invitations (Phase 18). An owner invites a teammate by email +
 * workspace role; a hashed token backs the accept link. Tenant/workspace are set
 * server-side from the inviter's membership (never client input). Writes go through
 * the workspace server routes (Local API, overrideAccess); the native REST surface
 * is read-scoped to the actor's tenant and mutated only by platform super admins.
 */
export const WorkspaceInvitations: CollectionConfig = {
  slug: 'workspace-invitations',
  labels: { singular: 'Workspace Invitation', plural: 'Workspace Invitations' },
  admin: { useAsTitle: 'email', group: 'Platform', defaultColumns: ['email', 'role', 'status', 'workspace', 'createdAt'] },
  access: {
    read: scopedRead('deny'),
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    { name: 'email', type: 'email', required: true, index: true },
    {
      name: 'role', type: 'select', required: true, defaultValue: 'viewer', index: true,
      options: [
        { label: 'Workspace admin', value: 'workspace_admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer / Analyst', value: 'viewer' },
      ],
    },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
    { name: 'invitedBy', type: 'relationship', relationTo: 'users' },
    { name: 'message', type: 'textarea' },
    { name: 'tokenHash', type: 'text', index: true, admin: { readOnly: true, hidden: true, description: 'SHA-256 of the invite token (never stores the raw token).' } },
    {
      name: 'status', type: 'select', defaultValue: 'pending', index: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Revoked', value: 'revoked' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    { name: 'expiresAt', type: 'date', admin: { readOnly: true } },
    { name: 'acceptedAt', type: 'date', admin: { readOnly: true } },
    { name: 'emailStatus', type: 'text', admin: { readOnly: true, description: 'local_no_send when no provider is configured; sent/failed otherwise.' } },
  ],
};
