/**
 * Meta Ads insights → normalized synced_performance_daily rows (Phase 32). Pure. The
 * Graph API returns numeric metrics as STRINGS and `spend` in CURRENCY UNITS (not micros).
 * Raw metrics are kept verbatim; `costMicros` is derived from `spend` (×1e6) only to fit
 * the shared schema. No numbers are invented — missing fields → 0/''.
 *
 * Conversions (v1, honest mapping): Meta's `actions` array contains many event types
 * (link_click, landing_page_view, purchase, …) — most are NOT conversions. We report only
 * PURCHASE conversions: `omni_purchase` when present (Meta's de-duplicated total),
 * otherwise `purchase`. Lead/other objectives report 0 conversions here until a later
 * phase adds objective-aware mapping. Impressions/clicks/spend are always exact.
 */
const n = (v: unknown): number => { const x = Number(v); return isFinite(x) ? x : 0; };
const s = (v: unknown): string => (v == null ? '' : String(v));

export type MetaSyncedRow = {
  metricDate: string; customerId: string;
  campaignId: string; campaignName: string;
  impressions: number; clicks: number; costMicros: number; cost: number; conversions: number; conversionValue: number;
  currencyCode: string;
};

/** Sum the `value` of the preferred purchase action_type from a Meta actions/action_values array. */
function purchaseTotal(arr: unknown): number {
  if (!Array.isArray(arr)) return 0;
  const byType = new Map<string, number>();
  for (const it of arr) {
    const t = s((it as Record<string, unknown>)?.action_type);
    if (!t) continue;
    byType.set(t, (byType.get(t) || 0) + n((it as Record<string, unknown>)?.value));
  }
  // Prefer the de-duplicated omni_purchase; fall back to pixel/standard purchase.
  if (byType.has('omni_purchase')) return byType.get('omni_purchase')!;
  if (byType.has('purchase')) return byType.get('purchase')!;
  if (byType.has('offsite_conversion.fb_pixel_purchase')) return byType.get('offsite_conversion.fb_pixel_purchase')!;
  return 0;
}

/** Normalize one Meta campaign-daily insight row. `accountId`/`currency` come from the selected account. */
export function normalizeInsightRow(row: Record<string, any>, accountId: string, currency: string): MetaSyncedRow | null {
  const metricDate = s(row?.date_start);
  if (!metricDate) return null;
  const spend = n(row?.spend);
  return {
    metricDate,
    customerId: accountId,
    campaignId: s(row?.campaign_id), campaignName: s(row?.campaign_name),
    impressions: n(row?.impressions), clicks: n(row?.clicks),
    cost: Math.round(spend * 100) / 100, costMicros: Math.round(spend * 1_000_000),
    conversions: purchaseTotal(row?.actions), conversionValue: purchaseTotal(row?.action_values),
    currencyCode: currency || '',
  };
}
