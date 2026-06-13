import type { CollectionConfig } from 'payload';
/**
 * Finished articles. `status` = AI pipeline/QA state (generating/qa/published/
 * flagged). `editorialStatus` = the editorial gate that controls PUBLIC
 * visibility — only `published` articles appear on the public site. A successful
 * generation lands at `ready_for_review`; an administrator publishes manually.
 */
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: { useAsTitle: 'title', group: 'Content', defaultColumns: ['title', 'editorialStatus', 'status', 'category', 'editorialPublishedAt'] },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'brief', type: 'relationship', relationTo: 'content-briefs' },
    { name: 'product', type: 'relationship', relationTo: 'products', index: true },
    { name: 'category', type: 'relationship', relationTo: 'categories', index: true },
    { name: 'excerpt', type: 'textarea', admin: { description: 'Short summary shown on cards/listings.' } },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { description: 'Feature on the homepage (only if editorially published).' } },
    {
      name: 'type', type: 'select', required: true, defaultValue: 'how_to',
      options: [
        { label: 'How-To', value: 'how_to' },
        { label: 'Buying Guide', value: 'buying_guide' },
        { label: 'Review', value: 'review' },
        { label: 'Comparison', value: 'comparison' },
        { label: 'Best List', value: 'best_list' },
        { label: 'FAQ', value: 'faq' },
        { label: 'Problem / Solution', value: 'problem_solution' },
        { label: 'Educational', value: 'educational' },
      ],
    },
    { name: 'body', type: 'richText' },
    { name: 'markdown', type: 'textarea', admin: { description: 'Generated article source (markdown). Renders when bodyBlocks is empty.' } },
    // ---- Rich body blocks (Slice B). If empty, the markdown above renders. ----
    {
      name: 'bodyBlocks', type: 'blocks', minRows: 0,
      admin: { description: 'Optional rich body: prose + inline images + callouts. If empty, the markdown field renders unchanged.' },
      blocks: [
        { slug: 'prose', labels: { singular: 'Prose', plural: 'Prose' }, fields: [
          { name: 'markdown', type: 'textarea', required: true, admin: { description: 'Markdown prose chunk.' } },
        ] },
        { slug: 'inlineImage', labels: { singular: 'Inline Image', plural: 'Inline Images' }, fields: [
          { name: 'image', type: 'relationship', relationTo: 'media' },
          { name: 'alt', type: 'text' },
          { name: 'caption', type: 'text' },
          { name: 'align', type: 'select', defaultValue: 'wide', options: [
            { label: 'Wide', value: 'wide' }, { label: 'Full', value: 'full' },
          ] },
          { name: 'source', type: 'text' },
        ] },
        { slug: 'callout', labels: { singular: 'Callout', plural: 'Callouts' }, fields: [
          { name: 'variant', type: 'select', defaultValue: 'tip', options: [
            { label: 'Pro tip', value: 'tip' }, { label: 'Key takeaway', value: 'key-takeaway' },
            { label: 'Warning', value: 'warning' }, { label: 'Info', value: 'info' },
          ] },
          { name: 'title', type: 'text' },
          { name: 'body', type: 'textarea', required: true, admin: { description: 'Markdown.' } },
        ] },
        { slug: 'pullQuote', labels: { singular: 'Pull Quote', plural: 'Pull Quotes' }, fields: [
          { name: 'text', type: 'textarea', required: true },
          { name: 'attribution', type: 'text' },
        ] },
      ],
    },
    // ---- Image slots: planning/automation guidance only (NOT required to publish) ----
    {
      name: 'imageSlots', type: 'array',
      admin: { description: 'Planning helper for hero/inline images (guidance + future automation). Not required to publish.' },
      fields: [
        { name: 'position', type: 'select', defaultValue: 'inline', options: [
          { label: 'Hero', value: 'hero' }, { label: 'Inline', value: 'inline' },
        ] },
        { name: 'prompt', type: 'textarea' },
        { name: 'status', type: 'select', defaultValue: 'needed', options: [
          { label: 'Needed', value: 'needed' }, { label: 'Uploaded', value: 'uploaded' }, { label: 'Generated', value: 'generated' },
        ] },
        { name: 'media', type: 'relationship', relationTo: 'media' },
      ],
    },
    // ---- Images (manual upload/select; UI degrades to a placeholder) ----
    {
      name: 'images', type: 'group', label: 'Images', fields: [
        { name: 'hero', type: 'relationship', relationTo: 'media' },
        { name: 'heroAlt', type: 'text', admin: { description: 'Accessible alt text for the hero image.' } },
        { name: 'product', type: 'relationship', relationTo: 'media' },
        { name: 'caption', type: 'text' },
        { name: 'og', type: 'relationship', relationTo: 'media', admin: { description: 'Social / Open Graph image.' } },
      ],
    },
    {
      name: 'seo', type: 'group', fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'canonical', type: 'text' },
      ],
    },
    {
      name: 'openGraph', type: 'group', fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'relationship', relationTo: 'media' },
      ],
    },
    { name: 'schema', type: 'json', admin: { description: 'JSON-LD structured data.' } },
    { name: 'ctaBlocks', type: 'json' },
    { name: 'relatedArticles', type: 'relationship', relationTo: 'articles', hasMany: true },
    {
      name: 'qaReport', type: 'group', fields: [
        { name: 'passed', type: 'checkbox', defaultValue: false },
        { name: 'reasons', type: 'json' },
        { name: 'promptVersion', type: 'text' },
      ],
    },
    // ---- AI pipeline / QA status (NOT public visibility) ----
    {
      name: 'status', type: 'select', required: true, defaultValue: 'generating', index: true,
      admin: { description: 'AI pipeline/QA state. Public visibility is controlled by editorialStatus.' },
      options: [
        { label: 'Generating', value: 'generating' },
        { label: 'QA', value: 'qa' },
        { label: 'Published (pipeline)', value: 'published' },
        { label: 'Flagged', value: 'flagged' },
        { label: 'Refresh', value: 'refresh' },
      ],
    },
    // ---- Editorial gate — the ONLY thing that controls public visibility ----
    {
      name: 'editorialStatus', type: 'select', required: true, defaultValue: 'draft', index: true,
      admin: { description: 'Editorial gate. Only "Published" appears on the public site.' },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Ready for review', value: 'ready_for_review' },
        { label: 'Published', value: 'published' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    { name: 'editorialPublishedAt', type: 'date', admin: { description: 'Set automatically when editorially published.' } },
    { name: 'publishedAt', type: 'date', admin: { description: 'AI pipeline timestamp (not the public publish date).' } },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Stamp the public publish date the first time it is editorially published.
        if (data?.editorialStatus === 'published' && !data?.editorialPublishedAt) {
          data.editorialPublishedAt = new Date().toISOString();
        }
        return data;
      },
    ],
  },
};
