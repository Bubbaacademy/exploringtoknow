import type { CollectionConfig } from 'payload';

/**
 * Newsletter subscribers — additive, intake-only. Public sign-ups go through the
 * server route (`/api/newsletter`) using the Local API with overrideAccess; the
 * public can never read or list subscribers. No external email provider, no
 * marketing automation — this only collects addresses safely. Dedupe is enforced
 * by the unique email index plus an explicit check in the route.
 */
export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  labels: { singular: 'Newsletter Subscriber', plural: 'Newsletter Subscribers' },
  admin: { useAsTitle: 'email', group: 'Intake', defaultColumns: ['email', 'source', 'status', 'createdAt'] },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user), // public sign-ups use the server route (Local API)
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    { name: 'source', type: 'text', admin: { description: 'Where the sign-up came from (homepage, article, footer).' } },
    {
      name: 'status', type: 'select', defaultValue: 'subscribed',
      options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
  ],
};
