import type { CollectionConfig } from 'payload';
import { tenantsRead, superOnly } from '@/lib/access';

/**
 * Tenant / Organization — a customer/business account on the platform.
 * ExploringToKnow is tenant #1 (the live showcase + first internal workspace).
 * Multi-tenant data scoping for the new /app + /platform surfaces is derived from
 * the authenticated user's memberships (see lib/tenant.ts) — never from client input.
 */
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: { singular: 'Tenant', plural: 'Tenants' },
  admin: { useAsTitle: 'name', group: 'Platform', defaultColumns: ['name', 'slug', 'status', 'plan', 'createdAt'] },
  access: {
    // Phase 14: super admin sees/manages all tenants; a workspace member may read
    // only their own tenant; nobody else. Tenants are created/edited by platform
    // super admins only.
    read: tenantsRead,
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'status', type: 'select', defaultValue: 'active', index: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Trial', value: 'trial' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'contactName', type: 'text' },
    { name: 'contactEmail', type: 'email' },
    { name: 'plan', type: 'text', defaultValue: 'free', admin: { description: 'Plan placeholder (billing wired in a later phase).' } },
    { name: 'trialEndsAt', type: 'date' },
    { name: 'billingCustomerId', type: 'text', admin: { readOnly: true, description: 'Reserved for the future billing provider customer id.' } },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal notes (never public).' } },
  ],
};
