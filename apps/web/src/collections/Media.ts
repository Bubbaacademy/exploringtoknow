import type { CollectionConfig } from 'payload';

/**
 * All images (article heroes, AI-generated/social images) live on S3 in later
 * phases via @payloadcms/storage-s3. Phase 0 keeps local upload to prove the
 * collection; S3 adapter is wired in Phase 1.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  upload: true,
  access: { read: () => true },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'source', type: 'text' },
  ],
};
