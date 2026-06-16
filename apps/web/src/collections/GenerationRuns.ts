import type { CollectionConfig } from 'payload';
import { scopedRead, scopedCreate, scopedMutate, stampTenantWorkspace } from '@/lib/access';
/**
 * Audit + cost ledger for each AI pipeline execution (AI Core milestone).
 * Written by the worker after a run; read by the dashboard for cost/visibility.
 */
export const GenerationRuns: CollectionConfig = {
  slug: 'generation-runs',
  admin: {
    useAsTitle: 'id',
    group: 'AI Pipeline',
    description: 'Audit + cost ledger per AI run. Pipeline chain: Product Request → (approve) → Product → Intelligence/Brief → Article (lands at ready_for_review, NOT published) → Generation Run. "published" here means pipeline-ready, NOT publicly published — an editor still sets the article editorialStatus.',
    defaultColumns: ['product', 'status', 'articleAttempts', 'costUsdCents', 'finishedAt'],
  },
  access: {
    read: scopedRead('deny'),
    create: scopedCreate(), // worker writes via the Local API (overrideAccess)
    update: scopedMutate(),
    delete: scopedMutate(),
  },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', index: true },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true, admin: { description: 'Owning tenant (ExploringToKnow for existing records; set by backfill).' } },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true, admin: { description: 'Owning workspace/publication (ETK Magazine for existing records; set by backfill).' } },
    {
      name: 'status', type: 'select', defaultValue: 'running', index: true,
      options: [
        { label: 'Running', value: 'running' },
        { label: 'Published-ready', value: 'published' },
        { label: 'Flagged', value: 'flagged' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    { name: 'articleAttempts', type: 'number', defaultValue: 0 },
    { name: 'totalTokens', type: 'number', defaultValue: 0 },
    { name: 'costUsdCents', type: 'number', defaultValue: 0, admin: { description: 'Estimated USD cents.' } },
    { name: 'promptVersions', type: 'json', admin: { description: 'Prompt ids/versions used per step.' } },
    { name: 'steps', type: 'json', admin: { description: 'Per-node model + token usage.' } },
    { name: 'error', type: 'text' },
    { name: 'startedAt', type: 'date' },
    { name: 'finishedAt', type: 'date' },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
