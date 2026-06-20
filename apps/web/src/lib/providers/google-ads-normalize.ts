/**
 * Google Ads GAQL → normalized synced_performance_daily rows (Phase 31). Pure. REST
 * returns camelCase JSON. Raw metrics are kept verbatim; `cost` is derived from
 * `cost_micros` (÷1e6) for display only. No numbers are invented — missing fields → 0/''.
 */
const n = (v: unknown): number => { const x = Number(v); return isFinite(x) ? x : 0; };
const s = (v: unknown): string => (v == null ? '' : String(v));

export type SyncedRow = {
  metricDate: string; customerId: string;
  campaignId: string; campaignName: string; campaignStatus: string; campaignChannelType: string;
  impressions: number; clicks: number; costMicros: number; cost: number; conversions: number; conversionValue: number;
  currencyCode: string;
};

/** Normalize one GAQL campaign-daily result row (camelCase REST shape). */
export function normalizeCampaignRow(row: Record<string, any>): SyncedRow | null {
  const seg = row?.segments ?? {}, cust = row?.customer ?? {}, camp = row?.campaign ?? {}, met = row?.metrics ?? {};
  const metricDate = s(seg.date);
  if (!metricDate) return null;
  const costMicros = n(met.costMicros);
  return {
    metricDate,
    customerId: s(cust.id),
    campaignId: s(camp.id), campaignName: s(camp.name), campaignStatus: s(camp.status), campaignChannelType: s(camp.advertisingChannelType),
    impressions: n(met.impressions), clicks: n(met.clicks),
    costMicros, cost: Math.round((costMicros / 1_000_000) * 100) / 100,
    conversions: n(met.conversions), conversionValue: n(met.conversionsValue),
    currencyCode: s(cust.currencyCode),
  };
}
