import type { CollectionConfig } from 'payload';
import { APIError } from 'payload';
import { enqueue, QUEUES, type GenerateContentJob } from '@etk/queue';
import { productImagesField } from '@/lib/images';

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
  admin: {
    useAsTitle: 'productName',
    group: 'Intake',
    description: 'Request queue. Approval is MANUAL: set a Requested category, then set Status = Approved to create the product + enqueue one generation job. A category is required; image permission and 3–30 images are enforced. Nothing publishes automatically.',
    defaultColumns: ['productName', 'status', 'requestedCategory', 'requesterEmail', 'submittedAt'],
  },
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
    { name: 'notes', type: 'textarea' },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    productImagesField(),
    { name: 'imagePermissionConfirmed', type: 'checkbox', defaultValue: false, admin: { description: 'Requester confirmed they have permission to use the uploaded images.' } },
    // --- Category (shown next to Status; REQUIRED before approval) ---
    {
      name: 'requestedCategory', type: 'relationship', relationTo: 'categories',
      admin: { description: 'REQUIRED before approval. The article inherits this category. Approving with no category is rejected.' },
    },
    {
      name: 'suggestedCategory', type: 'text',
      admin: { description: 'Free-text suggestion submitted when the requester chose "Other / Not Sure". An admin must map it to a real category in "Requested category" before approving — it never auto-creates a category.' },
    },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'submitted', index: true,
      admin: { description: '⚠ Setting "Approved" creates a Product and ENQUEUES ONE generation job (then moves to Processing). Confirm a Requested category + 3–30 permission-confirmed images first. This is the only manual approval step — do not set Approved unless you intend to start generation.' },
      options: [
        { label: 'Submitted', value: 'submitted' },
        { label: 'Under review', value: 'under_review' },
        { label: 'Approved (triggers generation)', value: 'approved' },
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
      // ---- Approval workflow (bounded, atomic, idempotent, no nested self-update) ----
      // Runs INLINE in the same write that flips status -> approved. It validates
      // the category, creates ONE Product in the SAME transaction (req), enqueues
      // ONE generation job, and writes linkedProduct/generationJobId/status onto
      // `data` — so there is no second transaction to deadlock against. The admin
      // request returns as soon as this commits; it never waits for generation.
      async ({ data, originalDoc, req }) => {
        if (data?.status !== 'approved') return data;
        // Idempotent: only the first transition into approved does work.
        if (originalDoc?.status === 'approved' || originalDoc?.generationJobId) return data;

        const cur: any = { ...(originalDoc || {}), ...data };
        const categoryId = typeof cur.requestedCategory === 'object' ? cur.requestedCategory?.id : cur.requestedCategory;
        if (categoryId == null) {
          throw new APIError('Select a category before approving this product request.', 400);
        }

        // Reuse the SAME manually-uploaded Media records (never duplicate binaries).
        const productImages = (Array.isArray(cur.productImages) ? cur.productImages : [])
          .map((pi: any) => ({
            image: typeof pi.image === 'object' ? pi.image?.id : pi.image,
            role: pi.role, order: pi.order, alt: pi.alt, caption: pi.caption,
            enabled: pi.enabled !== false, preferredHero: pi.preferredHero === true,
          }))
          .filter((pi: any) => pi.image != null);

        const reqId = cur.id ?? originalDoc?.id;
        // Create the Product as `draft` (Products hook will NOT enqueue) in the
        // SAME transaction — atomic with this request update.
        const product = await req.payload.create({
          collection: 'products',
          req,
          context: { skipGenerate: true },
          data: {
            title: cur.productName,
            slug: `${slugify(cur.productName)}-${String(reqId).slice(-6)}`,
            offerType: 'amazon_affiliate',
            status: 'draft',
            priority: 50,
            externalUrl: cur.productUrl || undefined,
            affiliateUrl: cur.affiliateUrl || undefined,
            amazonAsin: cur.asin || undefined,
            categories: [categoryId],
            productImages: productImages.length ? productImages : undefined,
          },
        });

        // Enqueue exactly one job. On failure, throw -> the whole transaction
        // (including the Product create) rolls back: no half-approved state, no
        // orphan Product, and the admin can retry.
        let jobId: string;
        try {
          const job: GenerateContentJob = { productId: String(product.id), trigger: 'force_generate', requestId: String(reqId) };
          jobId = await enqueue(QUEUES.generateContent, job);
        } catch (e) {
          req.payload.logger.error(`product-request approval enqueue failed: ${String(e)}`);
          throw new APIError('Could not queue generation for this approval. Nothing was changed — please retry.', 503);
        }

        // Single atomic write of the result onto this same document.
        data.status = 'processing';
        data.linkedProduct = product.id;
        data.generationJobId = jobId;
        data.reviewedAt = new Date().toISOString();
        return data;
      },
    ],
  },
};
