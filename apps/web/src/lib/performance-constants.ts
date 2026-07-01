/**
 * Pure, client-safe Performance constants + helpers (Phase 28). No server imports.
 * MANUAL measurement only: nothing here syncs from a platform, calls an API, or
 * invents numbers. Computed metrics are derived from raw user-entered values with
 * SAFE zero-denominator handling (null → shown as "—", never a fake 0).
 */
export const PERF_SOURCE_TYPES = ['manual_entry', 'csv_paste', 'internal_landing_page_views', 'placeholder'] as const;
export const PERF_SOURCE_LABELS: Record<string, string> = {
  manual_entry: 'Manual entry', csv_paste: 'CSV paste', internal_landing_page_views: 'Internal landing-page views', placeholder: 'Placeholder',
};

export const PERF_PLATFORMS = ['meta', 'google_search', 'google_display', 'youtube', 'tiktok', 'linkedin', 'pinterest', 'instagram', 'facebook', 'x_twitter', 'generic', 'unknown'] as const;
export const PERF_PLATFORM_LABELS: Record<string, string> = {
  meta: 'Meta Ads', google_search: 'Google Search', google_display: 'Google Display', youtube: 'YouTube', tiktok: 'TikTok',
  linkedin: 'LinkedIn', pinterest: 'Pinterest', instagram: 'Instagram', facebook: 'Facebook', x_twitter: 'X / Twitter', generic: 'Generic', unknown: 'Unknown',
};

export const PERF_CHANNEL_TYPES = ['ad', 'social', 'landing_page', 'article', 'product', 'email_placeholder', 'generic'] as const;
export const PERF_CHANNEL_LABELS: Record<string, string> = {
  ad: 'Ad', social: 'Social', landing_page: 'Landing page', article: 'Article', product: 'Product', email_placeholder: 'Email (placeholder)', generic: 'Generic',
};

/**
 * Unified Performance (Phase 33) — provider-agnostic labels. `synced_performance_daily`
 * rows are written with `source = 'api_synced'`; manual `performance-entries` are the
 * `manual_import` layer. These drive the source filter + badges on the dashboard.
 */
export const SYNC_PROVIDER_LABELS: Record<string, string> = { google_ads: 'Google Ads', meta_ads: 'Meta Ads' };
export const PERF_DATA_SOURCE_LABELS: Record<string, string> = { manual_import: 'Manual / imported', api_synced: 'API-synced', internal: 'Internal' };
/** Source-filter options for the unified dashboard (value → label). */
export const PERF_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'manual', label: 'Manual' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'meta_ads', label: 'Meta Ads' },
];

export const PERF_STATUSES = ['draft', 'recorded', 'archived'] as const;
export const PERF_STATUS_LABELS: Record<string, string> = { draft: 'Draft', recorded: 'Recorded', archived: 'Archived' };
export const perfStatusVariant = (s: string): 'good' | 'attn' | '' => (s === 'recorded' ? 'good' : s === 'draft' ? 'attn' : '');

export type RawMetrics = { impressions?: number; clicks?: number; spend?: number; conversions?: number; revenue?: number; leads?: number };
export type ComputedMetrics = {
  ctr: number | null; cpc: number | null; cpm: number | null; convRate: number | null; cpa: number | null; roas: number | null; rpc: number | null;
};

const div = (n: number, d: number): number | null => (d > 0 ? n / d : null);

/** Compute derived metrics with safe zero-denominator handling (null where undefined). */
export function computeMetrics(m: RawMetrics): ComputedMetrics {
  const impressions = Number(m.impressions || 0), clicks = Number(m.clicks || 0), spend = Number(m.spend || 0);
  const conversions = Number(m.conversions || 0), revenue = Number(m.revenue || 0);
  return {
    ctr: div(clicks, impressions),
    cpc: div(spend, clicks),
    cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
    convRate: div(conversions, clicks),
    cpa: div(spend, conversions),
    roas: div(revenue, spend),
    rpc: div(revenue, clicks),
  };
}

const round = (n: number, dp: number): number => Math.round(n * 10 ** dp) / 10 ** dp;
export const fmtPct = (v: number | null): string => (v == null ? '—' : `${round(v * 100, 2)}%`);
export const fmtMoney = (v: number | null, currency = 'USD'): string => (v == null ? '—' : `${currency} ${round(v, 2).toLocaleString()}`);
export const fmtNum = (v: number | null): string => (v == null ? '—' : round(v, 2).toLocaleString());
export const fmtX = (v: number | null): string => (v == null ? '—' : `${round(v, 2)}×`);

// ---- CSV paste import (Phase 28) — manual + transparent, no file upload, no API ----
export const PERF_CSV_COLUMNS = ['date', 'platform', 'channel', 'campaign', 'ad_set', 'creative', 'impressions', 'clicks', 'spend', 'conversions', 'revenue', 'leads', 'landing_page_slug', 'landing_page_url', 'notes'] as const;

/** Coerce a CSV/string cell to a non-negative number (strips $ , and spaces). Invalid → 0. */
export function coerceNumber(v: unknown): number {
  if (typeof v === 'number') return isFinite(v) && v >= 0 ? v : 0;
  if (typeof v !== 'string') return 0;
  const n = parseFloat(v.replace(/[$,\s]/g, ''));
  return isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Minimal, robust CSV parser (pure). Handles quoted fields, escaped quotes (""),
 * commas and newlines inside quotes, and CRLF. Returns rows of string cells. Caps at
 * 2000 rows for safety. No external calls.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const s = String(text ?? '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
      if (rows.length >= 2000) break;
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); if (row.some((x) => x.trim() !== '')) rows.push(row); }
  return rows;
}
