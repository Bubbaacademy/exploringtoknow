import { generateTopicArticle, type TopicSpec } from '@etk/ai';
import type { BrandProfile } from '@etk/core';
import { mapBrandProfile } from './brand';
import { slugify, freeSlug } from './persist';
import type { PersistenceClient, Doc } from './types';

/**
 * Phase 2U — topic-driven generate-and-persist.
 *
 * The product-driven path (`generateAndPersist`) requires a Products record and
 * derives the article's category from it. Most of the magazine's seed set has no
 * product behind it, and inventing catalog rows to drive a how-to would pollute
 * the product catalog and mis-derive categories.
 *
 * This function generates from an operator-supplied topic spec and persists a
 * DRAFT article. It deliberately does far less than `persistGeneration`: no
 * generation-runs ledger, no product-intelligence, no content-brief — those
 * exist to trace a product pipeline and have nothing to record here.
 *
 * It NEVER publishes. The article lands at editorialStatus 'draft' with pipeline
 * status 'qa', and `tools/etk/publish-article.mjs` is the only thing that can
 * move it public, and only after every gate passes.
 */
export interface TopicArticleInput extends TopicSpec {
  /** Category id or slug. Required — Payload rejects publication without one. */
  category: string | number;
  /** Optional explicit slug; otherwise derived from the generated title. */
  slug?: string;
  /** Optional queue-ordering hint. Display only. */
  publishPriority?: number;
  /** Existing Media id to use as hero. Publishing stays blocked until its `source` is set. */
  heroMediaId?: string | number;
  /** Alt text for that hero. Only set it together with a real image. */
  heroAlt?: string;
  /** Linked product — required by the gate for `review` articles. */
  productId?: string | number;
  /** Byline. Falls back to the site's editorial-team default when omitted. */
  authorId?: string | number;
  /** Internal note recorded on the draft. */
  editorialNotes?: string;
}

export interface TopicPersistResult {
  articleId: string | number;
  articleSlug: string;
  title: string;
  markdownLength: number;
  editorialStatus: 'draft';
  costCents: number;
  /** True when an existing article with the same slug was updated instead of created. */
  updated: boolean;
}

/** Resolve a category slug to its id; passes numeric/`id` values straight through. */
async function resolveCategory(client: PersistenceClient, category: string | number): Promise<string | number> {
  if (typeof category === 'number') return category;
  const asNum = Number(category);
  if (!Number.isNaN(asNum) && String(asNum) === String(category)) return asNum;
  const found = await client.find('categories', { slug: { equals: String(category) } });
  const doc = found.docs[0];
  if (!doc) throw new Error(`category "${category}" not found`);
  return doc.id;
}

export async function generateAndPersistTopic(
  client: PersistenceClient,
  input: TopicArticleInput,
): Promise<TopicPersistResult> {
  const categoryId = await resolveCategory(client, input.category);

  // Phase 2X — when the piece is about a real product, its hero must come from
  // that product's OWN uploaded images. Same guard and same one-shot flag the
  // product path uses; the Articles beforeChange hook does the selection.
  let populateImages = false;
  let productName: string | undefined;
  if (input.productId != null && input.heroMediaId == null) {
    const product = await client.findById('products', input.productId);
    productName = typeof product?.title === 'string' ? product.title : undefined;
    const imgs = (product as { productImages?: unknown } | null)?.productImages;
    const usable = Array.isArray(imgs)
      ? imgs.filter((i) => {
          const img = i as { enabled?: boolean; image?: unknown } | null;
          return Boolean(img) && img?.enabled !== false && img?.image != null;
        }).length
      : 0;
    populateImages = usable >= 3; // mirrors PRODUCT_IMAGES_MIN in apps/web/src/lib/images.ts
  }

  let brand: BrandProfile | undefined;
  try {
    brand = mapBrandProfile(await client.findGlobal('brand-profile'));
  } catch {
    brand = undefined; // generateTopicArticle falls back to DEFAULT_BRAND
  }

  const { article, cost } = await generateTopicArticle(
    { ...input, productName: input.productName ?? productName },
    brand,
  );

  // Idempotency: an explicit slug updates in place; a derived slug never
  // collides (freeSlug appends -2, -3, …) so reruns cannot clobber a live post.
  const explicit = input.slug ? slugify(input.slug) : null;
  let existing: Doc | null = null;
  if (explicit) {
    const found = await client.find('articles', { slug: { equals: explicit } });
    existing = found.docs[0] ?? null;
  }
  const slug = explicit ?? (await freeSlug(client, slugify(article.title)));

  const data: Record<string, unknown> = {
    title: article.title,
    slug,
    type: article.type,
    category: categoryId,
    markdown: article.markdown,
    excerpt: article.metaDescription,
    seo: { metaTitle: article.metaTitle, metaDescription: article.metaDescription },
    openGraph: { title: article.title, description: article.metaDescription },
    // Generation NEVER publishes and never claims a pipeline state it has not
    // reached. Editorial leads; the publish tool moves both, in order.
    editorialStatus: 'draft',
    status: 'qa',
    ...(input.authorId != null ? { author: input.authorId } : {}),
    ...(input.productId != null ? { product: input.productId } : {}),
    ...(input.publishPriority != null ? { publishPriority: input.publishPriority } : {}),
    ...(input.editorialNotes ? { editorialNotes: input.editorialNotes } : {}),
    // Hero and alt are written together or not at all — an alt without an image
    // is what produced the misleading alt text on the Phase 2T cover.
    ...(input.heroMediaId != null
      ? { images: { hero: input.heroMediaId, heroAlt: input.heroAlt ?? '' } }
      : {}),
    // Product-owned hero + inline images, selected by the existing hook.
    ...(populateImages ? { populateImagesFromProduct: true } : {}),
  };

  const doc = existing
    ? await client.update('articles', existing.id, data)
    : await client.create('articles', data);

  return {
    articleId: doc.id,
    articleSlug: slug,
    title: article.title,
    markdownLength: String(article.markdown || '').length,
    editorialStatus: 'draft',
    costCents: cost.totalCents,
    updated: Boolean(existing),
  };
}
