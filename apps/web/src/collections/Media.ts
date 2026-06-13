import type { CollectionConfig } from 'payload';
import path from 'path';

/**
 * Uploaded images (article heroes, etc.). Stored on local disk in an explicit,
 * writable directory (`PAYLOAD_MEDIA_DIR`, default `<cwd>/media`). In the
 * production container `/app/media` is created writable by the runtime user and
 * bind-mounted to a host volume so uploads persist across redeploys. (S3 can be
 * wired later via @payloadcms/storage-s3 without changing this collection.)
 */
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: process.env.PAYLOAD_MEDIA_DIR || path.resolve(process.cwd(), 'media'),
  },
  access: { read: () => true },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'source', type: 'text' },
  ],
};
