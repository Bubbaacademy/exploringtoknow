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

/**
 * Editorial phrasing per image role. Says only what the role already asserts —
 * no invented colours, settings, counts or visual detail.
 */
const ROLE_ALT: Record<string, (name: string) => string> = {
  hero: (n) => n,
  lifestyle: (n) => `${n} in everyday use`,
  'product-detail': (n) => `A closer view of ${n}`,
  packaging: (n) => `${n} in its packaging`,
  'in-use': (n) => `${n} being used`,
  comparison: (n) => `${n} shown alongside comparable options`,
};

/**
 * Deterministic, non-AI alt fallback — used ONLY when an image carries no alt
 * and no caption of its own.
 *
 * This previously emitted marketplace listing copy (`"<name> – product image"`),
 * which is exactly the raw alt text Phase 2P had to clean off the live magazine
 * by hand and which the Phase 2U publish gate rejects (`heroAltLooksRaw`). It now
 * produces plain editorial alt text tied to the product and the image's declared
 * role, and never fabricates visual detail it cannot know.
 */
export function altFallback(productName: string, role?: string): string {
  const name = String(productName || '').trim() || 'The product';
  const phrase = role ? ROLE_ALT[role] : undefined;
  return phrase ? phrase(name) : name;
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
 * Aspect ratio beyond which an image is treated as a marketing banner (A+ content)
 * rather than a product photo. Banners carry burned-in branding and sales copy and
 * must never become an article hero — a RØDE "PODMIC / DYNAMIC PODCASTING
 * MICROPHONE" banner (970×300) was auto-selected as one, because the previous
 * fallback preferred the WIDEST landscape image and banners are always widest.
 */
export const HERO_MAX_ASPECT = 2.2;

/** True for extreme wide/tall images. Unknown dimensions are never excluded. */
export function isBannerish(w: number, h: number): boolean {
  if (!w || !h) return false;
  const r = w / h;
  return r >= HERO_MAX_ASPECT || 1 / r >= HERO_MAX_ASPECT;
}

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

  // Hero: an explicit operator choice always wins (preferredHero, then role=hero).
  // Otherwise pick the LARGEST non-banner image by pixel area, tie-broken by order.
  // Area favours the real high-res product shot over thumbnails and comparison
  // strips, and the banner filter keeps marketing collateral out of the hero slot.
  // If every enabled image is banner-shaped there is no safe hero — return null so
  // the caller can report it rather than shipping branded sales art as the hero.
  const explicitHero = byOrder.find((i) => i.preferredHero) || byOrder.filter((i) => i.role === 'hero')[0];
  const safeForHero = byOrder.filter((i) => { const d = dims(i); return !isBannerish(d.w, d.h); });
  const largestSafe = [...safeForHero].sort((a, b) => {
    const da = dims(a); const db = dims(b);
    const byArea = (db.w * db.h) - (da.w * da.h);
    return byArea !== 0 ? byArea : ord(a) - ord(b);
  })[0];
  const hero = explicitHero || largestSafe || null;
  if (!hero) return { hero: null, inline: [] };

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
  if (!hero) {
    return { ok: false, reason: 'NO_SAFE_HERO: every enabled product image is banner-shaped marketing collateral; none is usable as a hero.' };
  }
  if (inline.length < 2) {
    return { ok: false, reason: 'could not select at least two distinct inline images.' };
  }
  const mid = (pi: any) => (typeof pi.image === 'object' ? pi.image?.id : pi.image);

  // Insert inline images at SAFE prose-block boundaries only. Drop any pre-existing
  // inlineImage blocks first → idempotent (no duplicate blocks on re-run).
  const blocks: any[] = (Array.isArray(input.bodyBlocks) ? input.bodyBlocks : []).filter((b: any) => b?.blockType !== 'inlineImage');
  const proseIdx = blocks.map((b: any, i: number) => (b?.blockType === 'prose' ? i : -1)).filter((x: number) => x >= 0);
  const inserts = inline.map((pi, k) => {
    const frac = (k + 1) / (inline.length + 1);
    const after = (proseIdx.length ? proseIdx[Math.min(proseIdx.length - 1, Math.max(0, Math.round(frac * proseIdx.length) - 1))] : blocks.length - 1) ?? (blocks.length - 1);
    return { after, block: { blockType: 'inlineImage', image: mid(pi), alt: pi.alt || pi.caption || altFallback(input.productTitle, pi.role), caption: pi.caption || undefined, align: 'wide', source: 'Manually uploaded product image' } };
  }).sort((a, b) => b.after - a.after);
  for (const ins of inserts) blocks.splice(ins.after + 1, 0, ins.block);

  let ii = 0;
  const imageSlots = (Array.isArray(input.imageSlots) ? input.imageSlots : []).map((s: any) => {
    if (s.position === 'hero') return { ...s, status: 'generated', media: mid(hero) };
    const pi = inline[ii]; ii += 1; return { ...s, status: 'generated', media: pi ? mid(pi) : s.media };
  });

  // alt → caption → editorial fallback. `Media.source` is deliberately NOT used
  // here: it records provenance/licence, not a description of the image.
  const images = { ...(input.currentImages || {}), hero: mid(hero), heroAlt: hero.alt || hero.caption || altFallback(input.productTitle, hero.role) };
  return { ok: true, heroId: mid(hero), inlineIds: inline.map(mid), images, bodyBlocks: blocks, imageSlots };
}
