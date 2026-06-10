import type { CollectionConfig } from 'payload';
/**
 * Audit + cost ledger for each AI pipeline execution (AI Core milestone).
 * Written by the worker after a run; read by the dashboard for cost/visibility.
 */
export const GenerationRuns: CollectionConfig = {
  slug: 'generation-runs',
  admin: { useAsTitle: 'id', group: 'AI Pipeline', defaultColumns: ['product', 'status', 'costUsdCents', 'finishedAt'] },
  access: { read: ({ req }) => Boolean(req.user) },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', index: true },
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
};
