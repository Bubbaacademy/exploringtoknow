import type { CollectionConfig } from 'payload';

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
    // Admin/REST surface is internal-operator only today (single super-admin user).
    // Per-tenant tightening + a real second tenant to verify isolation is the next phase.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
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
