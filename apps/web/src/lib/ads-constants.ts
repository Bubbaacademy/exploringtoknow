/**
 * Pure, client-safe Ads Studio constants + helpers (Phase 27). No server imports —
 * safe in client components and server modules. MANUAL PLANNING ONLY: nothing here
 * connects an ad account, calls a platform/ad API, launches a campaign, or spends a
 * budget. The UTM builder just composes a query string; it does not shorten, track,
 * or call any external service.
 */
import { isSafeHttpUrl } from './social-constants';
export { isSafeHttpUrl };

export const AD_PLATFORMS = ['meta', 'google_search', 'google_display', 'youtube', 'tiktok', 'linkedin', 'pinterest', 'generic'] as const;
export type AdPlatform = (typeof AD_PLATFORMS)[number];
export const AD_PLATFORM_LABELS: Record<string, string> = {
  meta: 'Meta Ads', google_search: 'Google Search', google_display: 'Google Display', youtube: 'YouTube',
  tiktok: 'TikTok', linkedin: 'LinkedIn', pinterest: 'Pinterest', generic: 'Generic',
};

export const AD_OBJECTIVES = ['awareness', 'traffic', 'leads', 'sales', 'engagement', 'retargeting_placeholder', 'generic'] as const;
export type AdObjective = (typeof AD_OBJECTIVES)[number];
export const AD_OBJECTIVE_LABELS: Record<string, string> = {
  awareness: 'Awareness', traffic: 'Traffic', leads: 'Leads', sales: 'Sales',
  engagement: 'Engagement', retargeting_placeholder: 'Retargeting (placeholder)', generic: 'Generic',
};

export const AD_STATUSES = ['draft', 'ready_for_review', 'approved_to_export', 'archived'] as const;
export type AdStatus = (typeof AD_STATUSES)[number];
export const AD_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', ready_for_review: 'Ready for review', approved_to_export: 'Approved to export', archived: 'Archived',
};
export const adStatusVariant = (s: string): 'good' | 'attn' | '' =>
  s === 'approved_to_export' ? 'good' : s === 'ready_for_review' ? 'attn' : '';

export const AD_CREATIVE_FORMATS = ['text_ad', 'search_ad', 'image_ad_placeholder', 'carousel_placeholder', 'short_video_placeholder', 'display_ad_placeholder', 'generic'] as const;
export type AdCreativeFormat = (typeof AD_CREATIVE_FORMATS)[number];
export const AD_CREATIVE_FORMAT_LABELS: Record<string, string> = {
  text_ad: 'Text ad', search_ad: 'Search ad', image_ad_placeholder: 'Image ad (placeholder)',
  carousel_placeholder: 'Carousel (placeholder)', short_video_placeholder: 'Short video (placeholder)',
  display_ad_placeholder: 'Display ad (placeholder)', generic: 'Generic',
};

/** Honest, non-binding per-platform helper copy (no exact platform limits claimed). */
export const AD_PLATFORM_HELP: Record<string, string> = {
  meta: 'Meta Ads: primary text + headline + CTA, with an image or video (placeholder here). Keep the hook in the first line.',
  google_search: 'Google Search: multiple short headlines + descriptions + keyword notes. Lead with the benefit; match search intent.',
  google_display: 'Google Display: short headline + description + an asset (placeholder). Keep copy skimmable.',
  youtube: 'YouTube: a video/script idea + companion ad copy (placeholder). Front-load the hook.',
  tiktok: 'TikTok: short-form video script + caption (placeholder). Native, fast, hook-first.',
  linkedin: 'LinkedIn: professional ad copy + a clear audience note. A specific point-of-view reads best.',
  pinterest: 'Pinterest: pin title + description (placeholder). Descriptive, keyword-aware copy helps it surface.',
  generic: 'Channel-agnostic draft you can adapt later. Keep headline, primary text, and CTA reusable.',
};

const cleanSeg = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * Build a UTM-tagged tracking URL from a valid http(s) destination (pure). Returns ''
 * when the destination isn't a safe http(s) URL. Uses URL/URLSearchParams for safe
 * encoding; merges over any existing query. Does NOT shorten or call any service.
 */
export function buildTrackingUrl(dest: unknown, utm: { source?: string; medium?: string; campaign?: string; content?: string; term?: string }): string {
  if (!isSafeHttpUrl(dest)) return '';
  let url: URL;
  try { url = new URL(String(dest).trim()); } catch { return ''; }
  const map: Array<[string, string]> = [
    ['utm_source', cleanSeg(utm.source)], ['utm_medium', cleanSeg(utm.medium)], ['utm_campaign', cleanSeg(utm.campaign)],
    ['utm_content', cleanSeg(utm.content)], ['utm_term', cleanSeg(utm.term)],
  ];
  for (const [k, v] of map) { if (v) url.searchParams.set(k, v); else url.searchParams.delete(k); }
  return url.toString();
}

// ---- Export (Phase 27) — manual copy/export only, never a launch ----
export type AdCreativeRow = {
  name?: string; platform?: string; format?: string; status?: string;
  headline?: string; primaryText?: string; description?: string; ctaLabel?: string; ctaUrl?: string;
  displayPath?: string; keywords?: string; disclosureText?: string;
};
export type AdCampaignExport = {
  name?: string; platform?: string; objective?: string; status?: string;
  audienceName?: string; audienceNotes?: string; geographyNotes?: string; languageNotes?: string; placementNotes?: string;
  budgetNotes?: string; scheduleNotes?: string; primaryCTA?: string; destinationURL?: string; trackingURL?: string;
  disclosureText?: string; relatedLabel?: string; creatives: AdCreativeRow[];
};

const csvCell = (v: unknown): string => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const CAMPAIGN_HEAD = ['Campaign', 'Platform', 'Objective', 'Status', 'Audience', 'Budget notes', 'Destination URL', 'Final tracking URL', 'Related'];
const CREATIVE_HEAD = ['Creative', 'Creative format', 'Headline', 'Primary text', 'Description', 'CTA label', 'CTA URL', 'Disclosure'];

/** Build a CSV: one row per creative (campaign columns repeated); campaign-only row if none. */
export function campaignsToCsv(campaigns: AdCampaignExport[]): string {
  const header = [...CAMPAIGN_HEAD, ...CREATIVE_HEAD].map(csvCell).join(',');
  const lines: string[] = [];
  for (const c of campaigns) {
    const camp = [c.name, AD_PLATFORM_LABELS[c.platform || ''] || c.platform, AD_OBJECTIVE_LABELS[c.objective || ''] || c.objective, c.status, c.audienceName, c.budgetNotes, c.destinationURL, c.trackingURL, c.relatedLabel];
    if (c.creatives.length) {
      for (const cr of c.creatives) {
        lines.push([...camp, cr.name, AD_CREATIVE_FORMAT_LABELS[cr.format || ''] || cr.format, cr.headline, cr.primaryText, cr.description, cr.ctaLabel, cr.ctaUrl, cr.disclosureText].map(csvCell).join(','));
      }
    } else {
      lines.push([...camp, '', '', '', '', '', '', '', ''].map(csvCell).join(','));
    }
  }
  return [header, ...lines].join('\r\n');
}

/** Build a plain-text export of campaigns + their creatives. */
export function campaignsToText(campaigns: AdCampaignExport[]): string {
  const blocks: string[] = [];
  for (const c of campaigns) {
    const head: string[] = [
      `===== ${c.name || '(untitled campaign)'} =====`,
      `Platform: ${AD_PLATFORM_LABELS[c.platform || ''] || c.platform || '—'} · Objective: ${AD_OBJECTIVE_LABELS[c.objective || ''] || c.objective || '—'} · Status: ${AD_STATUS_LABELS[c.status || ''] || c.status || '—'}`,
    ];
    if (c.audienceName || c.audienceNotes) head.push(`Audience: ${[c.audienceName, c.audienceNotes].filter(Boolean).join(' — ')}`);
    if (c.geographyNotes) head.push(`Geography: ${c.geographyNotes}`);
    if (c.languageNotes) head.push(`Language: ${c.languageNotes}`);
    if (c.placementNotes) head.push(`Placements: ${c.placementNotes}`);
    if (c.budgetNotes) head.push(`Budget notes (planning only, not spend): ${c.budgetNotes}`);
    if (c.scheduleNotes) head.push(`Schedule notes (planning only): ${c.scheduleNotes}`);
    if (c.destinationURL) head.push(`Destination: ${c.destinationURL}`);
    if (c.trackingURL) head.push(`Final tracking URL: ${c.trackingURL}`);
    if (c.relatedLabel) head.push(`Related: ${c.relatedLabel}`);
    if (c.disclosureText) head.push(`Disclosure: ${c.disclosureText}`);
    blocks.push(head.join('\n'));
    for (const cr of c.creatives) {
      const lines: string[] = [`--- Creative: ${cr.name || '(untitled)'} (${AD_CREATIVE_FORMAT_LABELS[cr.format || ''] || cr.format || 'generic'}) ---`];
      if (cr.headline) lines.push(`Headlines:\n${cr.headline}`);
      if (cr.primaryText) lines.push(`Primary text:\n${cr.primaryText}`);
      if (cr.description) lines.push(`Description:\n${cr.description}`);
      const cta = [cr.ctaLabel, cr.ctaUrl].filter(Boolean).join(': '); if (cta) lines.push(`CTA: ${cta}`);
      if (cr.displayPath) lines.push(`Display path: ${cr.displayPath}`);
      if (cr.keywords) lines.push(`Keywords: ${cr.keywords}`);
      if (cr.disclosureText) lines.push(`Disclosure: ${cr.disclosureText}`);
      blocks.push(lines.join('\n'));
    }
  }
  return blocks.join('\n\n');
}
