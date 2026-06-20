/**
 * Google Ads REST callers (Phase 31) — server-only, READ-ONLY. Direct fetch (no SDK).
 * These are invoked ONLY when env is configured and a valid access token exists; the
 * route layer gates that. No mutate endpoints are ever called. Token values are never
 * logged. Errors throw generic codes (no secret/token leakage).
 */
import { googleAdsEnv } from './google-ads-auth';

const apiBase = (version: string) => `https://googleads.googleapis.com/${version}`;

/** GET customers:listAccessibleCustomers → array of customer ids (digits). Read-only. */
export async function listAccessibleCustomers(accessToken: string): Promise<string[]> {
  const e = googleAdsEnv();
  const res = await fetch(`${apiBase(e.apiVersion)}/customers:listAccessibleCustomers`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}`, 'developer-token': e.developerToken },
  });
  if (!res.ok) throw new Error(`list_customers_failed_${res.status}`);
  const j = (await res.json()) as { resourceNames?: string[] };
  return (j.resourceNames || []).map((r) => String(r).replace(/^customers\//, '').replace(/[^0-9]/g, '')).filter(Boolean);
}

/**
 * POST customers/{id}/googleAds:searchStream with a GAQL query. Returns the flattened
 * array of result rows. login-customer-id header is sent when a manager id is configured.
 * READ-ONLY (search only — never mutate).
 */
export async function searchStream(customerId: string, query: string, accessToken: string): Promise<Array<Record<string, any>>> {
  const e = googleAdsEnv();
  const cid = String(customerId).replace(/[^0-9]/g, '');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`, 'developer-token': e.developerToken, 'Content-Type': 'application/json',
  };
  if (e.loginCustomerId) headers['login-customer-id'] = e.loginCustomerId;
  const res = await fetch(`${apiBase(e.apiVersion)}/customers/${cid}/googleAds:searchStream`, {
    method: 'POST', headers, body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`search_failed_${res.status}`);
  const j = await res.json();
  // searchStream returns an array of response batches, each with `.results`.
  const batches: Array<{ results?: Array<Record<string, any>> }> = Array.isArray(j) ? j : [j];
  const out: Array<Record<string, any>> = [];
  for (const b of batches) for (const r of (b?.results || [])) out.push(r);
  return out;
}

export { googleAdsEnv };
