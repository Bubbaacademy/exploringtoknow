import type { CollectionConfig } from 'payload';
/** Finished articles + publish state (impl pkg §4). No manual approval status. */
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: { useAsTitle: 'title', group: 'Content', defaultColumns: ['title', 'type', 'status', 'publishedAt'] },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'brief', type: 'relationship', relationTo: 'content-briefs' },
    { name: 'product', type: 'relationship', relationTo: 'products', index: true },
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
    { name: 'markdown', type: 'textarea', admin: { description: 'Generated article source (markdown).' } },
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
    {
      name: 'status', type: 'select', required: true, defaultValue: 'generating', index: true,
      options: [
        { label: 'Generating', value: 'generating' },
        { label: 'QA', value: 'qa' },
        { label: 'Published', value: 'published' },
        { label: 'Flagged', value: 'flagged' },
        { label: 'Refresh', value: 'refresh' },
      ],
    },
    { name: 'publishedAt', type: 'date' },
  ],
};
