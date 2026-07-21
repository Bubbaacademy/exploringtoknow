import type { CollectionConfig } from 'payload';
import { APIError } from 'payload';
import { buildArticleImagePopulation } from '@/lib/images';
import { scopedRead, scopedCreate, scopedMutate, stampTenantWorkspace } from '@/lib/access';
/**
 * Finished articles. `status` = AI pipeline/QA state (generating/qa/published/
 * flagged). `editorialStatus` = the editorial gate that controls PUBLIC
 * visibility — only `published` articles appear on the public site. A successful
 * generation lands at `ready_for_review`; an administrator publishes manually.
 *
 * Phase 2I — editor UX only. Fields are wrapped in `collapsible` sections, which
 * are PRESENTATIONAL in Payload: a collapsible has no `name`, and its subfields
 * are stored flat on the parent exactly as if it were not there. No field `name`,
 * `type`, `required`, `unique`, `index`, `defaultValue`, `relationTo`, or select
 * option `value` was changed — only `label`, `admin.description`, section
 * grouping and field order. The `editorialStatus` values in particular are the
 * Postgres enum `enum_articles_editorial_status` and are load-bearing for
 * `PUBLISHED_WHERE` in lib/public.ts, so they are untouched. Verified against a
 * throwaway database: no schema drift, no migration.
 */
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'PUBLISH GATE: only Editorial status = "Published" is visible on the public magazine, it requires a category, and it never happens automatically — a human sets it. "Pipeline status" is the AI/QA state and does NOT control visibility. Editorial standards: no hype, no fabricated testing/medical/performance claims; product images must be manually uploaded with permission; the affiliate disclosure renders automatically.',
    defaultColumns: ['title', 'editorialStatus', 'status', 'category', 'author', 'publishPriority', 'editorialPublishedAt'],
  },
  // Public published reads come through the Local API (overrideAccess) — unaffected.
  // The native REST/admin surface is scoped: anon sees only published; members see
  // only their tenant; super admins see all.
  access: {
    read: scopedRead('published'),
    create: scopedCreate(),
    update: scopedMutate(),
    delete: scopedMutate(),
  },
  fields: [
    // ================================================================
    // 1. PUBLICATION CONTROL — the only thing that decides what is public
    // ================================================================
    {
      type: 'collapsible',
      label: 'Publication control',
      admin: {
        initCollapsed: false,
        description: 'This section decides whether readers can see this article. Nothing else does.',
      },
      fields: [
        // ---- Editorial gate — the ONLY thing that controls public visibility ----
        {
          name: 'editorialStatus', type: 'select', required: true, defaultValue: 'draft', index: true,
          label: 'Editorial status (controls public visibility)',
          admin: { description: 'The publish gate. ONLY "Published" is live on the public magazine — Draft, In review and Rejected are all NOT public. Publishing requires a category and is always set by a human; nothing here happens automatically.' },
          options: [
            { label: 'Draft — not public', value: 'draft' },
            { label: 'In review — not public', value: 'ready_for_review' },
            { label: 'Published — LIVE on the public magazine', value: 'published' },
            { label: 'Rejected — not public', value: 'rejected' },
          ],
        },
        {
          name: 'editorialPublishedAt', type: 'date',
          label: 'Published date (public)',
          admin: { description: 'Stamped automatically the first time this article is set to Published. It is NOT cleared if the article later returns to Draft or Rejected — so a date here does not by itself mean the article is public. Only Editorial status decides that.' },
        },
        {
          name: 'featured', type: 'checkbox', defaultValue: false,
          label: 'Feature on the homepage',
          admin: { description: 'Promotes this article on the magazine front page. Only takes effect once Editorial status is Published.' },
        },
        {
          name: 'publishPriority', type: 'number',
          label: 'Publishing queue priority',
          admin: { description: 'Optional editorial ordering for the publishing queue (lower = sooner). Display/triage only — it never publishes anything.' },
        },
      ],
    },

    // ================================================================
    // 2. ARTICLE IDENTITY — what this piece is and how it is addressed
    // ================================================================
    {
      type: 'collapsible',
      label: 'Article identity',
      admin: { initCollapsed: false, description: 'Headline, public URL, format and byline.' },
      fields: [
        {
          name: 'title', type: 'text', required: true,
          label: 'Title',
          admin: { description: 'The headline readers see. Write it plainly — no hype, no fabricated claims.' },
        },
        {
          name: 'slug', type: 'text', required: true, unique: true, index: true,
          label: 'Slug (public URL)',
          admin: { description: 'The public address: exploringtoknow.com/<slug>. Must be unique. Changing it after publication breaks existing links and shares. Avoid the reserved magazine section slugs: home-living, beauty-style, tech, family-pets, food-kitchen, buying-guides, product-reviews, explore-picks.' },
        },
        {
          name: 'type', type: 'select', required: true, defaultValue: 'how_to',
          label: 'Article type',
          admin: { description: 'The editorial format. This drives which magazine listings the article appears in: Buying Guide / Best List / Comparison / How-To feed /buying-guides, and Review / Comparison feed /product-reviews.' },
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
        {
          name: 'excerpt', type: 'textarea',
          label: 'Excerpt (card summary)',
          admin: { description: 'Short summary shown on homepage cards, section pages and search results. Aim for one or two clear sentences — this is often the only text a reader sees before clicking.' },
        },
        {
          name: 'author', type: 'relationship', relationTo: 'authors', index: true,
          label: 'Author / byline',
          admin: { description: 'Editorial author. Falls back to the ExploringToKnow Editorial Team byline when left empty.' },
        },
      ],
    },

    // ================================================================
    // 3. CATEGORY & MEDIA — required for publication, and the visuals
    // ================================================================
    {
      type: 'collapsible',
      label: 'Category & media',
      admin: { initCollapsed: false, description: 'A category is REQUIRED before this article can be published. The hero image is what appears on cards and at the top of the article.' },
      fields: [
        {
          name: 'category', type: 'relationship', relationTo: 'categories', index: true,
          label: 'Category (required to publish)',
          admin: { description: 'REQUIRED before publication — saving as Published without one is rejected with an error. The category also determines which magazine section and /category page this article appears under.' },
        },
        {
          name: 'images', type: 'group', label: 'Images', fields: [
            { name: 'hero', type: 'relationship', relationTo: 'media', label: 'Hero image', admin: { description: 'Main image, shown at the top of the article and on listing cards. Real photographs used with permission only — no AI-generated product imagery.' } },
            { name: 'heroAlt', type: 'text', label: 'Hero alt text', admin: { description: 'Accessible description of the hero image, for screen readers and when the image fails to load. Please fill this in before publishing.' } },
            { name: 'product', type: 'relationship', relationTo: 'media', label: 'Product image' },
            { name: 'caption', type: 'text', label: 'Hero caption', admin: { description: 'Optional caption displayed under the hero image.' } },
            { name: 'og', type: 'relationship', relationTo: 'media', label: 'Social share image', admin: { description: 'Open Graph image used when the article is shared. Falls back to the hero image when empty.' } },
          ],
        },
        {
          name: 'imageSlots', type: 'array',
          label: 'Image planning slots',
          admin: { description: 'Planning helper for hero/inline images (guidance + future automation). NOT required to publish.' },
          fields: [
            { name: 'position', type: 'select', defaultValue: 'inline', label: 'Position', options: [
              { label: 'Hero', value: 'hero' }, { label: 'Inline', value: 'inline' },
            ] },
            { name: 'prompt', type: 'textarea', label: 'Image brief' },
            { name: 'status', type: 'select', defaultValue: 'needed', label: 'Slot status', options: [
              { label: 'Needed', value: 'needed' }, { label: 'Uploaded', value: 'uploaded' }, { label: 'Generated', value: 'generated' },
            ] },
            { name: 'media', type: 'relationship', relationTo: 'media', label: 'Image' },
          ],
        },
        {
          name: 'populateImagesFromProduct', type: 'checkbox', defaultValue: false,
          label: 'Populate images from linked product',
          admin: { description: 'Check this box and Save to (re)populate the hero + inline images from the linked product\'s already-uploaded images. Manual, deterministic, one-shot: it only references existing media, never uploads, and never publishes or changes Editorial status.' },
        },
      ],
    },

    // ================================================================
    // 4. CONTENT — the article body
    // ================================================================
    {
      type: 'collapsible',
      label: 'Content',
      admin: { initCollapsed: false, description: 'The article body. If Rich body blocks are empty, the Markdown source below is what renders.' },
      fields: [
        { name: 'body', type: 'richText', label: 'Rich text body' },
        {
          name: 'markdown', type: 'textarea',
          label: 'Markdown source',
          admin: { description: 'Article source in markdown. This is what renders on the public site when Rich body blocks is empty.' },
        },
        // ---- Rich body blocks (Slice B). If empty, the markdown above renders. ----
        {
          name: 'bodyBlocks', type: 'blocks', minRows: 0,
          label: 'Rich body blocks',
          admin: { description: 'Optional structured body: prose + inline images + callouts + pull quotes. When this has any blocks it REPLACES the markdown source above in rendering; leave it empty to keep using markdown.' },
          blocks: [
            { slug: 'prose', labels: { singular: 'Prose', plural: 'Prose' }, fields: [
              { name: 'markdown', type: 'textarea', required: true, admin: { description: 'Markdown prose chunk.' } },
            ] },
            { slug: 'inlineImage', labels: { singular: 'Inline Image', plural: 'Inline Images' }, fields: [
              { name: 'image', type: 'relationship', relationTo: 'media' },
              { name: 'alt', type: 'text', admin: { description: 'Accessible alt text — please fill this in.' } },
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
      ],
    },

    // ================================================================
    // 5. SEO & SOCIAL
    // ================================================================
    {
      type: 'collapsible',
      label: 'SEO & social',
      admin: { initCollapsed: true, description: 'All optional — sensible defaults are derived from the title, excerpt and hero image when these are empty.' },
      fields: [
        {
          name: 'seo', type: 'group', label: 'SEO', fields: [
            { name: 'metaTitle', type: 'text', label: 'Meta title', admin: { description: 'Search-result headline. Falls back to the article title when empty.' } },
            { name: 'metaDescription', type: 'textarea', label: 'Meta description', admin: { description: 'Search-result summary. Falls back to the excerpt when empty.' } },
            { name: 'canonical', type: 'text', label: 'Canonical URL', admin: { description: 'Only set this if the piece was published elsewhere first. Leave empty otherwise — the correct canonical is generated automatically.' } },
          ],
        },
        {
          name: 'openGraph', type: 'group', label: 'Social sharing (Open Graph)', fields: [
            { name: 'title', type: 'text', label: 'Share title', admin: { description: 'Falls back to the article title.' } },
            { name: 'description', type: 'textarea', label: 'Share description', admin: { description: 'Falls back to the excerpt.' } },
            { name: 'image', type: 'relationship', relationTo: 'media', label: 'Share image', admin: { description: 'Falls back to the social share image, then the hero image.' } },
          ],
        },
        { name: 'schema', type: 'json', label: 'Structured data (JSON-LD)', admin: { description: 'Advanced. Article and breadcrumb JSON-LD are already generated automatically — only use this to add extra structured data.' } },
      ],
    },

    // ================================================================
    // 6. INTERNAL — editor notes, pipeline state, linkage. Never public copy.
    // ================================================================
    {
      type: 'collapsible',
      label: 'Internal & pipeline',
      admin: { initCollapsed: true, description: 'Internal editorial and AI-pipeline fields. None of this is shown to readers, and none of it controls public visibility.' },
      fields: [
        {
          name: 'editorialNotes', type: 'textarea',
          label: 'Internal editor notes',
          admin: { description: 'Notes for the publishing queue. Never shown publicly.' },
        },
        // ---- AI pipeline / QA status (NOT public visibility) ----
        {
          name: 'status', type: 'select', required: true, defaultValue: 'generating', index: true,
          label: 'Pipeline status (NOT public visibility)',
          admin: { description: 'AI pipeline / QA state only. This does NOT control whether readers see the article — Editorial status does. "Published (pipeline)" here does not mean the article is live.' },
          options: [
            { label: 'Generating', value: 'generating' },
            { label: 'QA', value: 'qa' },
            { label: 'Published (pipeline)', value: 'published' },
            { label: 'Flagged', value: 'flagged' },
            { label: 'Refresh', value: 'refresh' },
          ],
        },
        {
          name: 'publishedAt', type: 'date',
          label: 'Pipeline timestamp (not the public date)',
          admin: { description: 'AI pipeline timestamp. The public publish date is "Published date (public)" under Publication control.' },
        },
        { name: 'brief', type: 'relationship', relationTo: 'content-briefs', label: 'Source brief' },
        { name: 'product', type: 'relationship', relationTo: 'products', index: true, label: 'Linked product', admin: { description: 'Drives the affiliate link and the "Populate images from linked product" helper.' } },
        { name: 'relatedArticles', type: 'relationship', relationTo: 'articles', hasMany: true, label: 'Related articles', admin: { description: 'Optional manual overrides. Related guides are otherwise chosen automatically by category.' } },
        { name: 'ctaBlocks', type: 'json', label: 'CTA blocks (advanced)' },
        {
          name: 'qaReport', type: 'group', label: 'QA report', fields: [
            { name: 'passed', type: 'checkbox', defaultValue: false, label: 'QA passed' },
            { name: 'reasons', type: 'json', label: 'QA findings' },
            { name: 'promptVersion', type: 'text', label: 'Prompt version' },
          ],
        },
        { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true, label: 'Tenant', admin: { description: 'Owning tenant (ExploringToKnow for existing records; set by backfill).' } },
        { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true, label: 'Workspace', admin: { description: 'Owning workspace/publication (ETK Magazine for existing records; set by backfill).' } },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      stampTenantWorkspace,
      // Editorial gate: an article may not be published without a category.
      // Uses the merged final state so it holds for partial REST/admin updates.
      ({ data, originalDoc }) => {
        const cur: any = { ...(originalDoc || {}), ...(data || {}) };
        const cat = cur.category;
        const hasCategory = cat != null && (typeof cat !== 'object' || (cat as any).id != null);
        if (cur.editorialStatus === 'published' && !hasCategory) {
          throw new APIError('Category required before publication.', 400);
        }
        return data;
      },
      ({ data }) => {
        // Stamp the public publish date the first time it is editorially published.
        if (data?.editorialStatus === 'published' && !data?.editorialPublishedAt) {
          data.editorialPublishedAt = new Date().toISOString();
        }
        return data;
      },
      // One-shot "Populate Images From Product". Runs INLINE in the same atomic
      // write (no nested payload.update → no self-deadlock, no recursion). It only
      // references existing Product Media records — never uploads/copies media,
      // never publishes, never changes editorialStatus, never enqueues generation.
      // The trigger is always reset in this same write; on failure it throws a
      // visible admin error (the save aborts, so the flag is never persisted true).
      async ({ data, originalDoc, req }) => {
        if (data?.populateImagesFromProduct !== true) return data;
        const cur: any = { ...(originalDoc || {}), ...data };
        const productId = typeof cur.product === 'object' ? cur.product?.id : cur.product;
        if (!productId) {
          throw new APIError('Populate Images From Product: this article has no linked product.', 400);
        }
        let product: any;
        try {
          // Read in the SAME transaction (req) — different table, no self-lock.
          product = await req.payload.findByID({ collection: 'products', id: productId, depth: 2, req });
        } catch {
          throw new APIError('Populate Images From Product: linked product could not be loaded.', 400);
        }
        const result = buildArticleImagePopulation({
          productImages: Array.isArray(product?.productImages) ? product.productImages : [],
          productTitle: product?.title || '',
          articleKey: String(cur.slug || cur.id || (originalDoc as any)?.id || ''),
          markdownLen: String(cur.markdown || '').length,
          bodyBlocks: Array.isArray(cur.bodyBlocks) ? cur.bodyBlocks : [],
          imageSlots: Array.isArray(cur.imageSlots) ? cur.imageSlots : [],
          currentImages: cur.images,
        });
        if (!result.ok) {
          throw new APIError(`Populate Images From Product failed: ${result.reason}`, 400);
        }
        data.images = result.images;
        data.bodyBlocks = result.bodyBlocks;
        data.imageSlots = result.imageSlots;
        data.populateImagesFromProduct = false; // reset one-shot atomically
        req.payload.logger.info(`populate_images: article ${(originalDoc as any)?.id ?? 'new'} hero ${result.heroId} + ${result.inlineIds.length} inline from product ${productId}`);
        return data;
      },
    ],
  },
};
