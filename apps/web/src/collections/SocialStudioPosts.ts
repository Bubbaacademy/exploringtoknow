import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Social Studio posts (Phase 25). A NEW, workspace-scoped collection — deliberately
 * separate from the legacy `social-posts` collection, which is wired into the
 * AI/worker FB+IG publish pipeline and must stay untouched.
 *
 * These posts are MANUALLY authored and copy-exported only. NOTHING is generated,
 * scheduled, or published to any social network in this phase: there are no platform
 * API calls, no OAuth, no scheduling execution. Tenant/workspace are stamped
 * server-side from the actor's membership (never client input). Writes go through the
 * workspace server routes (Local API, overrideAccess) with a canWrite role check; the
 * native REST surface is read-scoped to the actor's tenant and mutated only by super
 * admins (mirrors Landing Pages).
 */
export const SocialStudioPosts: CollectionConfig = {
  slug: 'social-studio-posts',
  labels: { singular: 'Social Studio Post', plural: 'Social Studio Posts' },
  admin: {
    useAsTitle: 'name',
    group: 'Platform',
    defaultColumns: ['name', 'channel', 'format', 'status', 'workspace', 'updatedAt'],
  },
  access: {
    read: scopedRead('deny'),
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'Internal name for this post (not published anywhere).' } },
    {
      name: 'channel', type: 'select', required: true, defaultValue: 'generic', index: true,
      options: [
        { label: 'Instagram', value: 'instagram' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'YouTube Shorts', value: 'youtube_shorts' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Facebook', value: 'facebook' },
        { label: 'X / Twitter', value: 'x_twitter' },
        { label: 'Pinterest', value: 'pinterest' },
        { label: 'Generic', value: 'generic' },
      ],
    },
    {
      name: 'format', type: 'select', required: true, defaultValue: 'text', index: true,
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Image post', value: 'image_post' },
        { label: 'Carousel (placeholder)', value: 'carousel_placeholder' },
        { label: 'Short video (placeholder)', value: 'short_video_placeholder' },
        { label: 'Story (placeholder)', value: 'story_placeholder' },
        { label: 'Reel (placeholder)', value: 'reel_placeholder' },
      ],
    },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'draft', index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Ready for review', value: 'ready_for_review' },
        { label: 'Approved to copy', value: 'approved_to_copy' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'hook', type: 'textarea', admin: { description: 'Opening hook / first line.' } },
    { name: 'caption', type: 'textarea', admin: { description: 'Caption / body copy. Manually authored — never generated.' } },
    { name: 'hashtags', type: 'json', admin: { description: 'Array of hashtag strings (without spaces). Whitelisted/normalized server-side.' } },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaUrl', type: 'text', admin: { description: 'http(s) only. Unsafe protocols are rejected server-side.' } },
    { name: 'disclosureText', type: 'textarea', admin: { description: 'Affiliate / disclosure note (surfaced when the CTA points at an affiliate/landing destination).' } },
    { name: 'platformNotes', type: 'textarea', admin: { description: 'Platform-specific notes / constraints for whoever publishes later. Manual only.' } },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal editorial guidance / notes.' } },
    { name: 'relatedProduct', type: 'relationship', relationTo: 'products', index: true },
    { name: 'relatedRequest', type: 'relationship', relationTo: 'product-requests', index: true },
    { name: 'relatedLandingPage', type: 'relationship', relationTo: 'landing-pages', index: true },
    { name: 'relatedBrandProfile', type: 'relationship', relationTo: 'brand-profiles', index: true },
    { name: 'approvedAt', type: 'date', admin: { readOnly: true, description: 'Set when status becomes approved_to_copy.' } },
    { name: 'copyCount', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'How many times the composed text was copied (first-party, no external call).' } },
    { name: 'copiedAt', type: 'date', admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'updatedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
