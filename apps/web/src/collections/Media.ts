import type { CollectionConfig } from 'payload';
import path from 'path';
import { scopedRead, scopedCreate, scopedMutate, stampTenantWorkspace } from '@/lib/access';

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
  // Read stays PUBLIC so published-article images render everywhere (files are served
  // statically anyway). Listing/management is still scoped: an authed member sees only
  // their tenant's media; super admins see all. Create/update/delete are scoped too.
  access: {
    read: scopedRead('public'),
    create: scopedCreate(),
    update: scopedMutate(),
    delete: scopedMutate(),
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'source', type: 'text' },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true, admin: { description: 'Owning tenant (ExploringToKnow for existing media; set by backfill). Read stays public so published-article images render.' } },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true, admin: { description: 'Owning workspace/publication (ETK Magazine for existing media; set by backfill).' } },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
