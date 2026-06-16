import type { CollectionConfig } from 'payload';

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
    defaultColumns: ['email', 'status', 'source', 'provider', 'confirmedAt', 'createdAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user), // public sign-ups use the server route (Local API)
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
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
};
