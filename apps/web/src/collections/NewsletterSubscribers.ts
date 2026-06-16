import type { CollectionConfig } from 'payload';
import { scopedRead, scopedCreate, scopedMutate, stampTenantWorkspace } from '@/lib/access';

/**
 * Newsletter subscribers — additive, intake-only. Public sign-ups go through the
 * server route (`/api/newsletter`) using the Local API with overrideAccess; the
 * public can never read or list subscribers. No subscriber records are ever
 * deleted by public routes — unsubscribe flips status only. Dedupe is enforced by
 * the unique email index plus an explicit check in the route.
 */
export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  labels: { singular: 'Newsletter Subscriber', plural: 'Newsletter Subscribers' },
  admin: {
    useAsTitle: 'email',
    group: 'Intake',
    description: 'Subscribers. Status: active (subscribed) · pending (awaiting double-opt-in confirm) · unsubscribed · bounced · complained · subscribed (legacy). Provider "local" + lastEmailStatus "local_no_send" = no external email is being sent (provider not configured). Records are never deleted by public routes.',
    defaultColumns: ['email', 'status', 'source', 'provider', 'lastEmailStatus', 'createdAt'],
  },
  access: {
    read: scopedRead('deny'),
    create: scopedCreate(), // public sign-ups use the server route (Local API, overrideAccess)
    update: scopedMutate(),
    delete: scopedMutate(),
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true, admin: { description: 'Owning tenant (ExploringToKnow for existing records; set by backfill).' } },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true, admin: { description: 'Owning workspace/publication (ETK Magazine for existing records; set by backfill).' } },
    {
      name: 'status', type: 'select', defaultValue: 'active', index: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Pending confirmation', value: 'pending' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
        { label: 'Bounced', value: 'bounced' },
        { label: 'Complained', value: 'complained' },
        { label: 'Subscribed (legacy)', value: 'subscribed' },
      ],
    },
    { name: 'source', type: 'text', admin: { description: 'Where the sign-up came from (homepage, article, footer).' } },
    { name: 'provider', type: 'text', admin: { description: 'Email provider used, or "local" when no provider is configured.' } },
    { name: 'confirmedAt', type: 'date', admin: { readOnly: true, description: 'Set when a pending subscriber confirms (double opt-in).' } },
    { name: 'unsubscribedAt', type: 'date', admin: { readOnly: true } },
    { name: 'tokenHash', type: 'text', admin: { readOnly: true, hidden: true, description: 'SHA-256 of the confirm/unsubscribe token (never stores the raw token).' } },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
