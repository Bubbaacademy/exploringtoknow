/**
 * Pure, client-safe Social Studio constants + helpers (Phase 25). No server imports
 * — safe in client components and server modules. Keep data-layer functions (which
 * import the server-only workspace/tenant code) in lib/social.ts.
 *
 * Manual authoring + copy-export only: nothing here generates copy, calls a platform
 * API, schedules, or publishes.
 */
export const SS_CHANNELS = [
  'instagram', 'tiktok', 'youtube_shorts', 'linkedin', 'facebook', 'x_twitter', 'pinterest', 'generic',
] as const;
export type SocialChannel = (typeof SS_CHANNELS)[number];

export const SS_FORMATS = [
  'text', 'image_post', 'carousel_placeholder', 'short_video_placeholder', 'story_placeholder', 'reel_placeholder',
] as const;
export type SocialFormat = (typeof SS_FORMATS)[number];

export const SS_STATUSES = ['draft', 'ready_for_review', 'approved_to_copy', 'archived'] as const;
export type SocialStatus = (typeof SS_STATUSES)[number];

export const SS_CHANNEL_LABELS: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube_shorts: 'YouTube Shorts', linkedin: 'LinkedIn',
  facebook: 'Facebook', x_twitter: 'X / Twitter', pinterest: 'Pinterest', generic: 'Generic',
};
export const SS_FORMAT_LABELS: Record<string, string> = {
  text: 'Text', image_post: 'Image post', carousel_placeholder: 'Carousel (placeholder)',
  short_video_placeholder: 'Short video (placeholder)', story_placeholder: 'Story (placeholder)',
  reel_placeholder: 'Reel (placeholder)',
};
export const SS_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', ready_for_review: 'Ready for review', approved_to_copy: 'Approved to copy', archived: 'Archived',
};

/** Badge tone for the console status pill. */
export const ssStatusVariant = (s: string): 'good' | 'attn' | '' =>
  s === 'approved_to_copy' ? 'good' : s === 'ready_for_review' ? 'attn' : '';

/**
 * Light, HONEST per-channel helper copy. Guidance only — these are not enforced as
 * hard platform rules, and nothing here calls a platform API or fetches account data.
 */
export const SS_CHANNEL_HELP: Record<string, string> = {
  instagram: 'Caption + hashtags. Pair with an image or reel (placeholder here). Keep the first line strong — it shows before “more”.',
  tiktok: 'Short video caption / on-screen script idea (placeholder). Lead with the hook; keep it punchy.',
  youtube_shorts: 'Short title + caption / script idea (placeholder). A clear title helps discovery.',
  linkedin: 'Professional post. A clear point-of-view and a tidy CTA tend to read best; hashtags optional.',
  facebook: 'General social post. Conversational caption + a single clear CTA.',
  x_twitter: 'Short-form text. Tighten the hook; one idea per post reads best.',
  pinterest: 'Pin title + description (placeholder). Descriptive, keyword-aware copy helps the pin surface.',
  generic: 'Channel-agnostic draft you can adapt later. Keep the hook, caption, and CTA reusable.',
};

/** Only http(s) URLs are allowed for CTAs — blocks javascript:, data:, mailto:, file:, etc. */
export function isSafeHttpUrl(u: unknown): boolean {
  if (typeof u !== 'string') return false;
  const t = u.trim();
  return /^https?:\/\/[^\s]+$/i.test(t);
}

/**
 * Normalize hashtags from client input (pure — safe both sides). Accepts an array of
 * strings OR a single string (comma/space/newline separated). Each tag is stripped of
 * leading '#', lowercased only of whitespace (not the tag text), de-spaced, kept to
 * [A-Za-z0-9_], de-duplicated, capped. Returns at most 30 tags WITHOUT the leading '#'.
 */
export function normalizeHashtags(v: unknown): string[] {
  let parts: string[] = [];
  if (Array.isArray(v)) parts = v.filter((x) => typeof x === 'string') as string[];
  else if (typeof v === 'string') parts = v.split(/[\s,]+/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of parts) {
    const tag = String(raw).trim().replace(/^#+/, '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 60);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= 30) break;
  }
  return out;
}

/** Render hashtags as a display string ("#a #b #c"). */
export function hashtagsToString(tags: unknown): string {
  if (!Array.isArray(tags)) return '';
  return tags.filter((t) => typeof t === 'string').map((t) => `#${t}`).join(' ');
}

/**
 * Compose the copy-export text (pure). Hook → caption → CTA (label + url) → hashtags →
 * disclosure. Nothing is sent anywhere; this is the text the user copies to clipboard.
 */
export function composeSocialText(p: {
  hook?: string; caption?: string; ctaLabel?: string; ctaUrl?: string; hashtags?: unknown; disclosureText?: string;
}): string {
  const lines: string[] = [];
  if (p.hook && p.hook.trim()) lines.push(p.hook.trim());
  if (p.caption && p.caption.trim()) lines.push(p.caption.trim());
  const cta = [p.ctaLabel?.trim(), p.ctaUrl?.trim()].filter(Boolean).join(': ');
  if (cta) lines.push(cta);
  const tags = hashtagsToString(p.hashtags);
  if (tags) lines.push(tags);
  if (p.disclosureText && p.disclosureText.trim()) lines.push(p.disclosureText.trim());
  return lines.join('\n\n');
}
