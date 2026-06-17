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
    { name: 'plan', type: 'text', defaultValue: 'free', admin: { description: 'Plan id (trial/starter/pro/agency/enterprise; "free"/unknown = comped/unlimited). Limits in lib/plans.ts.' } },
    {
      name: 'subscriptionStatus', type: 'select', index: true,
      admin: { description: 'Billing status. trialing/active/past_due/canceled/unpaid/comped/manual.' },
      options: [
        { label: 'Trialing', value: 'trialing' },
        { label: 'Active', value: 'active' },
        { label: 'Past due', value: 'past_due' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Comped (internal)', value: 'comped' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    { name: 'trialStartedAt', type: 'date', admin: { description: 'When the free trial began (set at signup).' } },
    { name: 'trialEndsAt', type: 'date' },
    { name: 'billingSubscriptionId', type: 'text', admin: { readOnly: true, description: 'Provider subscription id (set by webhook).' } },
    { name: 'currentPeriodStart', type: 'date', admin: { readOnly: true } },
    { name: 'currentPeriodEnd', type: 'date', admin: { readOnly: true } },
    { name: 'cancelAtPeriodEnd', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
    {
      name: 'onboardingStatus', type: 'select', defaultValue: 'not_started', index: true,
      admin: { description: 'Self-serve onboarding progress for this account.' },
      options: [
        { label: 'Not started', value: 'not_started' },
        { label: 'In progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    { name: 'onboardingStep', type: 'number', defaultValue: 0, admin: { description: 'Furthest onboarding step reached (display/triage only).' } },
    { name: 'signupSource', type: 'text', admin: { readOnly: true, description: 'Where this account signed up from (e.g. public_signup, seed).' } },
    { name: 'billingCustomerId', type: 'text', admin: { readOnly: true, description: 'Reserved for the future billing provider customer id.' } },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal notes (never public).' } },
  ],
};
