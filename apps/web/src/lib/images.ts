import type { Field } from 'payload';

/**
 * MANUAL-ONLY image mode. AI/OpenAI image generation is DISABLED for the MVP.
 * All article images come from images manually uploaded for the product. Nothing
 * in the app may call an image-generation or image-analysis API.
 */
export const MANUAL_IMAGE_MODE = true as const;
export const PRODUCT_IMAGES_MIN = 3;
export const PRODUCT_IMAGES_MAX = 30;
export const ARTICLE_IMAGES_MAX = 6; // hero + up to 5 inline

export const IMAGE_ROLES = ['hero', 'lifestyle', 'product-detail', 'packaging', 'in-use', 'comparison', 'other'] as const;

/** Deterministic, non-AI alt fallback. */
export function altFallback(productName: string, role?: string, position?: number): string {
  return `${productName} – ${role && role !== 'other' ? role : 'product image'}${position ? ' ' + position : ''}`;
}

/** Shared productImages array field (used on products + product-requests). */
export function productImagesField(): Field {
  return {
    name: 'productImages', type: 'array', label: 'Product Images', maxRows: PRODUCT_IMAGES_MAX,
    admin: { description: `Manually uploaded images (${PRODUCT_IMAGES_MIN}–${PRODUCT_IMAGES_MAX}). Drag to reorder.` },
    fields: [
      { name: 'image', type: 'relationship', relationTo: 'media', required: true },
      { name: 'role', type: 'select', defaultValue: 'other', options: IMAGE_ROLES.map((r) => ({ label: r, value: r })) },
      { name: 'order', type: 'number', admin: { description: 'Lower shows first.' } },
      { name: 'alt', type: 'text', admin: { description: 'Optional; a deterministic fallback is used when blank.' } },
      { name: 'caption', type: 'text' },
      { name: 'enabled', type: 'checkbox', defaultValue: true },
      { name: 'preferredHero', type: 'checkbox', defaultValue: false, admin: { description: 'Mark exactly one image as the preferred hero.' } },
    ],
  };
}

export type PImg = {
  id?: string; image: any; role?: string; order?: number | null; enabled?: boolean;
  preferredHero?: boolean; alt?: string | null; caption?: string | null;
};

function mediaId(img: any): string | number | null {
  if (img == null) return null;
  return typeof img === 'object' ? (img.id ?? null) : img;
}
function dims(i: PImg): { w: number; h: number } {
  const m = typeof i.image === 'object' ? i.image : null;
  return { w: Number(m?.width) || 0, h: Number(m?.height) || 0 };
}
function hashStr(s: string): number { let h = 2166136261; for (let k = 0; k < s.length; k += 1) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); } return h >>> 0; }

/**
 * Deterministic article image selection from a product's enabled images.
 * No AI / no content recognition. Stable across reloads/deploys (seeded by
 * articleKey). Returns one hero + diverse, non-repeating inline images.
 */
export function selectArticleImages(images: PImg[], articleKey: string, inlineCount = 2): { hero: PImg | null; inline: PImg[] } {
  const enabled = (images || []).filter((i) => i && i.enabled !== false && mediaId(i.image) != null);
  if (!enabled.length) return { hero: null, inline: [] };
  const ord = (i: PImg) => (i.order ?? 999);
  const byOrder = [...enabled].sort((a, b) => ord(a) - ord(b));

  // Hero: preferredHero -> role=hero (by order) -> best landscape -> first
  const hero = byOrder.find((i) => i.preferredHero)
    || byOrder.filter((i) => i.role === 'hero')[0]
    || [...byOrder].filter((i) => { const d = dims(i); return d.w >= d.h && d.w > 0; }).sort((a, b) => (dims(b).w / (dims(b).h || 1)) - (dims(a).w / (dims(a).h || 1)))[0]
    || byOrder[0];

  const heroMid = mediaId(hero?.image);
  const rest = byOrder.filter((i) => mediaId(i.image) !== heroMid);
  if (!rest.length) return { hero: hero ?? null, inline: [] };

  // Stable rotation offset from the article key (no Math.random).
  const offset = hashStr(articleKey) % rest.length;
  const rotated = [...rest.slice(offset), ...rest.slice(0, offset)];

  const want = Math.min(Math.max(inlineCount, 0), ARTICLE_IMAGES_MAX - 1, rest.length);
  const picked: PImg[] = [];
  const usedMedia = new Set<string | number>();
  let lastRole: string | undefined;
  // Pass 1: prefer role diversity and avoid adjacent same-role.
  for (const cand of rotated) {
    if (picked.length >= want) break;
    const mid = mediaId(cand.image)!;
    if (usedMedia.has(mid)) continue;
    if (cand.role && cand.role === lastRole) continue; // avoid consecutive same role
    picked.push(cand); usedMedia.add(mid); lastRole = cand.role;
  }
  // Pass 2: fill remaining slots ignoring the role-adjacency constraint (still no repeats).
  if (picked.length < want) {
    for (const cand of rotated) {
      if (picked.length >= want) break;
      const mid = mediaId(cand.image)!;
      if (usedMedia.has(mid)) continue;
      picked.push(cand); usedMedia.add(mid);
    }
  }
  return { hero: hero ?? null, inline: picked };
}

/** Inline image count from article length (simple rule). */
export function inlineCountForLength(markdownLen: number): number {
  return Math.min(ARTICLE_IMAGES_MAX - 1, Math.max(2, 2 + Math.floor((markdownLen || 0) / 3500)));
}

export type PopulateInput = {
  productImages: PImg[];
  productTitle: string;
  articleKey: string; // slug or id — seeds deterministic rotation
  markdownLen: number;
  bodyBlocks: any[];
  imageSlots: any[];
  currentImages?: any;
};
export type PopulateResult =
  | { ok: true; heroId: string | number; inlineIds: (string | number)[]; images: any; bodyBlocks: any[]; imageSlots: any[] }
  | { ok: false; reason: string };

/**
 * Pure, deterministic, side-effect-free computation of an article's hero + inline
 * images from a product's MANUALLY-uploaded images. No DB, no AI, no media creation —
 * it only references existing Media ids. Idempotent: existing inlineImage blocks are
 * dropped before re-inserting, so re-running never duplicates blocks or relationships.
 * Returns {ok:false,reason} for insufficient images so callers can surface a clear error.
 */
export function buildArticleImagePopulation(input: PopulateInput): PopulateResult {
  const imgs = Array.isArray(input.productImages) ? input.productImages : [];
  const enabledCount = imgs.filter((i: any) => i?.enabled !== false && i?.image).length;
  if (enabledCount < PRODUCT_IMAGES_MIN) {
    return { ok: false, reason: `linked product has ${enabledCount} usable image(s); at least ${PRODUCT_IMAGES_MIN} manually-uploaded images are required.` };
  }
  const inlineN = inlineCountForLength(input.markdownLen || 0);
  const { hero, inline } = selectArticleImages(imgs, input.articleKey, inlineN);
  if (!hero || inline.length < 2) {
    return { ok: false, reason: 'could not select one hero plus at least two distinct inline images.' };
  }
  const mid = (pi: any) => (typeof pi.image === 'object' ? pi.image?.id : pi.image);

  // Insert inline images at SAFE prose-block boundaries only. Drop any pre-existing
  // inlineImage blocks first → idempotent (no duplicate blocks on re-run).
  const blocks: any[] = (Array.isArray(input.bodyBlocks) ? input.bodyBlocks : []).filter((b: any) => b?.blockType !== 'inlineImage');
  const proseIdx = blocks.map((b: any, i: number) => (b?.blockType === 'prose' ? i : -1)).filter((x: number) => x >= 0);
  const inserts = inline.map((pi, k) => {
    const frac = (k + 1) / (inline.length + 1);
    const after = (proseIdx.length ? proseIdx[Math.min(proseIdx.length - 1, Math.max(0, Math.round(frac * proseIdx.length) - 1))] : blocks.length - 1) ?? (blocks.length - 1);
    return { after, block: { blockType: 'inlineImage', image: mid(pi), alt: pi.alt || altFallback(input.productTitle, pi.role, k + 1), caption: pi.caption || undefined, align: 'wide', source: 'Manually uploaded product image' } };
  }).sort((a, b) => b.after - a.after);
  for (const ins of inserts) blocks.splice(ins.after + 1, 0, ins.block);

  let ii = 0;
  const imageSlots = (Array.isArray(input.imageSlots) ? input.imageSlots : []).map((s: any) => {
    if (s.position === 'hero') return { ...s, status: 'generated', media: mid(hero) };
    const pi = inline[ii]; ii += 1; return { ...s, status: 'generated', media: pi ? mid(pi) : s.media };
  });

  const images = { ...(input.currentImages || {}), hero: mid(hero), heroAlt: hero.alt || altFallback(input.productTitle, hero.role, 0) };
  return { ok: true, heroId: mid(hero), inlineIds: inline.map(mid), images, bodyBlocks: blocks, imageSlots };
}
