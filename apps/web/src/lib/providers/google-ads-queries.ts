/**
 * Google Ads GAQL queries (Phase 31) — READ-ONLY reporting only. No mutate. Dates are
 * YYYY-MM-DD (validated by the caller). Campaign-daily grain for v1.
 */

/** Customer (account) info — read-only identity for account discovery. */
export function customerInfoGaql(): string {
  return 'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager FROM customer LIMIT 1';
}

/** Campaign daily performance GAQL (segments.date over [start,end]). */
export function campaignDailyGaql(startDate: string, endDate: string): string {
  return [
    'SELECT',
    '  segments.date,',
    '  customer.id,',
    '  customer.descriptive_name,',
    '  customer.currency_code,',
    '  campaign.id,',
    '  campaign.name,',
    '  campaign.status,',
    '  campaign.advertising_channel_type,',
    '  metrics.impressions,',
    '  metrics.clicks,',
    '  metrics.cost_micros,',
    '  metrics.conversions,',
    '  metrics.conversions_value',
    'FROM campaign',
    `WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'`,
    'ORDER BY segments.date',
  ].join('\n');
}
