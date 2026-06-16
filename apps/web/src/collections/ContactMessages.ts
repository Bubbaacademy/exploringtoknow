import type { CollectionConfig } from 'payload';

/**
 * Contact messages — additive, intake-only. Public submissions go through the
 * server route (`/api/contact`) via the Local API with overrideAccess; the public
 * can never read messages. No CRM integration — stored cleanly and provider-ready.
 */
export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: { singular: 'Contact Message', plural: 'Contact Messages' },
  admin: {
    useAsTitle: 'subject',
    group: 'Intake',
    defaultColumns: ['email', 'reason', 'subject', 'status', 'createdAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user), // public submissions use the server route
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'email', type: 'email', required: true },
    {
      name: 'reason', type: 'select', defaultValue: 'general',
      options: [
        { label: 'Suggest a product', value: 'suggest_product' },
        { label: 'Editorial correction', value: 'correction' },
        { label: 'Partnership / affiliate', value: 'partnership' },
        { label: 'General question', value: 'general' },
      ],
    },
    { name: 'subject', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    { name: 'productUrl', type: 'text', admin: { description: 'Optional product link supplied by the sender.' } },
    {
      name: 'status', type: 'select', defaultValue: 'new', index: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'Read', value: 'read' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
};
