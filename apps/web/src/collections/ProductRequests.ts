import type { CollectionConfig } from 'payload';
import { enqueue, QUEUES, type GenerateContentJob } from '@etk/queue';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80).replace(/(^-|-$)/g, '') || 'product';

/**
 * Manual product intake. A request is ALWAYS created manually (public form or
 * admin). Nothing is approved or generated automatically. When an administrator
 * sets status = `approved`, the afterChange hook creates a Product (as `draft`
 * so the Products hook does NOT also enqueue) and enqueues ONE generate-content
 * job, then moves the request to `processing` and stores the job id. The guard
 * (`generationJobId` already set) makes re-saving an approved request a no-op —
 * no duplicate jobs. There is NO automatic product selection anywhere.
 */
export const ProductRequests: CollectionConfig = {
  slug: 'product-requests',
  labels: { singular: 'Product Request', plural: 'Product Requests' },
  admin: { useAsTitle: 'productName', group: 'Intake', defaultColumns: ['productName', 'status', 'requesterEmail', 'submittedAt'] },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user), // public submissions go through the server route (Local API)
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'requesterName', type: 'text' },
    { name: 'requesterEmail', type: 'email', required: true },
    { name: 'productName', type: 'text', required: true },
    { name: 'brand', type: 'text' },
    { name: 'productUrl', type: 'text', admin: { description: 'Source/product page URL.' } },
    { name: 'affiliateUrl', type: 'text', admin: { description: 'Manually provided affiliate link (optional).' } },
    { name: 'asin', type: 'text', label: 'ASIN / external id', admin: { description: 'Optional.' } },
    { name: 'requestedCategory', type: 'relationship', relationTo: 'categories' },
    { name: 'notes', type: 'textarea' },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'submitted', index: true,
      options: [
        { label: 'Submitted', value: 'submitted' },
        { label: 'Under review', value: 'under_review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    { name: 'linkedProduct', type: 'relationship', relationTo: 'products', admin: { readOnly: true } },
    { name: 'linkedArticle', type: 'relationship', relationTo: 'articles', admin: { readOnly: true } },
    { name: 'generationJobId', type: 'text', admin: { readOnly: true, description: 'pg-boss job id of the single enqueued generation.' } },
    { name: 'submittedAt', type: 'date', admin: { readOnly: true } },
    { name: 'reviewedAt', type: 'date', admin: { readOnly: true } },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.submittedAt) data.submittedAt = new Date().toISOString();
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (context?.skipApproval) return;
        const becameApproved = doc.status === 'approved' && previousDoc?.status !== 'approved';
        // Only act on the explicit transition to approved, and never twice.
        if (!becameApproved || doc.generationJobId) return;

        // Create a Product as `draft` so the Products afterChange hook does NOT
        // also enqueue — this request is the single source of the generation job.
        const product = await req.payload.create({
          collection: 'products',
          data: {
            title: doc.productName,
            slug: `${slugify(doc.productName)}-${String(doc.id).slice(-6)}`,
            offerType: 'amazon_affiliate',
            status: 'draft',
            priority: 50,
            externalUrl: doc.productUrl || undefined,
            affiliateUrl: doc.affiliateUrl || undefined,
            amazonAsin: doc.asin || undefined,
            categories: doc.requestedCategory ? [doc.requestedCategory] : undefined,
          },
          context: { skipGenerate: true },
        });

        let jobId: string | null = null;
        try {
          const job: GenerateContentJob = { productId: String(product.id), trigger: 'force_generate' };
          jobId = await enqueue(QUEUES.generateContent, job);
        } catch (e) {
          req.payload.logger.error(`product-request approval enqueue failed: ${String(e)}`);
        }

        await req.payload.update({
          collection: 'product-requests',
          id: doc.id,
          data: {
            status: jobId ? 'processing' : 'approved',
            linkedProduct: product.id,
            generationJobId: jobId || undefined,
            reviewedAt: new Date().toISOString(),
          },
          context: { skipApproval: true },
          depth: 0,
        });
      },
    ],
  },
};
