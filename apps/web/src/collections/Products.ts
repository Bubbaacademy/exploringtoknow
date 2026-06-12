import type { CollectionConfig } from 'payload';
import { enqueue, QUEUES, type GenerateContentJob } from '@etk/queue';

const OFFER_TYPES = [
  { label: 'Owned Amazon', value: 'owned_amazon' },
  { label: 'Amazon Affiliate', value: 'amazon_affiliate' },
  { label: 'Non-Amazon Affiliate', value: 'non_amazon_affiliate' },
  { label: 'Bubba Logistics', value: 'bubba_logistics' },
  { label: 'Bubba China', value: 'bubba_china' },
  { label: 'Bubba Academy', value: 'bubba_academy' },
  { label: 'Digital Product', value: 'digital' },
  { label: 'Lead Generation', value: 'lead_gen' },
] as const;

/**
 * Catalog — single collection, discriminated by `offerType`, covering all 8
 * offer types (impl pkg §4). Type-specific fields live in `typeFields` and show
 * conditionally. Activating a product or checking `forceGenerate` enqueues the
 * content pipeline (force-generate workflow).
 */
export const Products: CollectionConfig = {
  slug: 'products',
  admin: { useAsTitle: 'title', group: 'Catalog', defaultColumns: ['title', 'offerType', 'status', 'priority'] },
  access: { read: ({ req }) => Boolean(req.user) },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'offerType', type: 'select', required: true, options: [...OFFER_TYPES], index: true },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'draft', index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'priority', type: 'number', defaultValue: 0, admin: { description: 'Higher = generated sooner.' } },
    { name: 'brand', type: 'relationship', relationTo: 'brands' },
    { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true },
    { name: 'price', type: 'number', admin: { description: 'Minor units (cents).' } },
    { name: 'priceText', type: 'text', admin: { description: 'Display price, e.g. "$12.99". Optional.' } },
    { name: 'externalUrl', type: 'text' },
    { name: 'affiliateUrl', type: 'text', admin: { description: 'MANUALLY entered affiliate link used by the public CTA. Never auto-discovered.' } },
    { name: 'merchantName', type: 'text', admin: { description: 'e.g. "Amazon". Shown on the affiliate CTA.' } },
    { name: 'amazonAsin', type: 'text', admin: { condition: (d) => ['owned_amazon', 'amazon_affiliate'].includes(d?.offerType) } },
    {
      name: 'typeFields', type: 'group', label: 'Type-specific details',
      fields: [
        { name: 'affiliateNetwork', type: 'text', admin: { condition: (d) => d?.offerType === 'non_amazon_affiliate' } },
        { name: 'serviceTerms', type: 'textarea', admin: { condition: (d) => ['bubba_logistics', 'bubba_china'].includes(d?.offerType) } },
        { name: 'programDetails', type: 'textarea', admin: { condition: (d) => d?.offerType === 'bubba_academy' } },
        { name: 'leadOffer', type: 'textarea', admin: { condition: (d) => d?.offerType === 'lead_gen' } },
        { name: 'digitalDelivery', type: 'text', admin: { condition: (d) => d?.offerType === 'digital' } },
      ],
    },
    {
      name: 'forceGenerate', type: 'checkbox', defaultValue: false,
      admin: { description: 'Check + Save to enqueue content generation now. Auto-resets.' },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const becameActive = doc.status === 'active' && previousDoc?.status !== 'active';
        const forced = doc.forceGenerate === true;
        if (!(forced || (doc.status === 'active' && (operation === 'create' || becameActive)))) return;

        const job: GenerateContentJob = {
          productId: String(doc.id),
          trigger: forced ? 'force_generate' : 'daily',
        };
        try {
          await enqueue(QUEUES.generateContent, job);
        } catch (e) {
          req.payload.logger.error(`force-generate enqueue failed: ${String(e)}`);
        }

        // reset the one-shot flag without re-triggering hooks
        if (forced) {
          await req.payload.update({
            collection: 'products', id: doc.id, data: { forceGenerate: false },
            context: { skipGenerate: true }, depth: 0,
          });
        }
      },
    ],
  },
};
