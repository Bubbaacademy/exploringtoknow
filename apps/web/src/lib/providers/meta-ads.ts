/**
 * Meta (Facebook/Instagram) Ads REST callers (Phase 32) — server-only, READ-ONLY.
 * Direct fetch against the Graph API (no SDK). Invoked ONLY when env is configured and a
 * valid access token exists; the route layer gates that. No publish/create/budget
 * endpoints are ever called. Token values are never logged. Errors throw SANITIZED codes
 * (Graph error.type/code/subcode/message — never the access token or app secret).
 */
import { metaAdsEnv, graphBase } from './meta-ads-auth';

/**
 * Build a SANITIZED error from a failed Graph response. Graph returns `{error:{message,
 * type,code,error_subcode,fbtrace_id}}`. Reads the body, never the request — so the
 * access token (passed as a query param by callers) is never echoed. Truncated.
 */
async function metaError(res: Response, prefix: string): Promise<Error> {
  let body = ''; try { body = await res.text(); } catch { /* ignore */ }
  let j: any; try { j = JSON.parse(body); } catch { /* non-JSON */ }
  const er = (j && j.error) || {};
  const type = er.type ? String(er.type) : '';
  const code = er.code != null ? String(er.code) : '';
  const sub = er.error_subcode != null ? String(er.error_subcode) : '';
  const msg = String(er.message || '').replace(/\s+/g, ' ').slice(0, 240);
  return new Error(`${prefix} http=${res.status}${type ? ` type=${type}` : ''}${code ? ` code=${code}` : ''}${sub ? ` sub=${sub}` : ''}${msg ? ` msg=${msg}` : ''}`);
}

export type MetaAdAccount = {
  accountId: string;           // numeric, no `act_` prefix (parallels Google customer id digits)
  actId: string;               // `act_<numeric>` — the form Graph endpoints require
  name: string;
  currency: string;
  timeZone: string;
  accountStatus: number;       // 1 = ACTIVE
};

const digits = (v: unknown) => String(v ?? '').replace(/[^0-9]/g, '');

/**
 * GET /me/adaccounts → the ad accounts this user token can read. Read-only. Follows
 * pagination up to a sane cap. `account_status` is kept verbatim (1 = ACTIVE).
 */
export async function listAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const e = metaAdsEnv();
  const params = new URLSearchParams({
    fields: 'account_id,name,currency,timezone_name,account_status', limit: '200', access_token: accessToken,
  });
  let url = `${graphBase(e.apiVersion)}/me/adaccounts?${params.toString()}`;
  const out: MetaAdAccount[] = [];
  for (let page = 0; page < 25 && url; page++) {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw await metaError(res, 'list_adaccounts_failed');
    const j = (await res.json()) as { data?: Array<Record<string, any>>; paging?: { next?: string } };
    for (const a of (j.data || [])) {
      const accountId = digits(a.account_id || a.id);
      if (!accountId) continue;
      out.push({
        accountId, actId: `act_${accountId}`,
        name: String(a.name ?? ''), currency: String(a.currency ?? ''),
        timeZone: String(a.timezone_name ?? ''), accountStatus: Number(a.account_status ?? 0) || 0,
      });
    }
    url = (j.paging && j.paging.next) ? j.paging.next : '';
  }
  return out;
}

/**
 * GET /act_{id}/insights at campaign + daily grain over [since,until]. READ-ONLY. Returns
 * the raw insight rows (camelCase preserved as Graph returns snake-ish keys). Follows
 * pagination up to a cap. The normalizer maps these to synced_performance_daily rows.
 */
export async function getCampaignDailyInsights(actId: string, accessToken: string, since: string, until: string): Promise<Array<Record<string, any>>> {
  const e = metaAdsEnv();
  const act = /^act_/.test(actId) ? actId : `act_${digits(actId)}`;
  const params = new URLSearchParams({
    level: 'campaign', time_increment: '1',
    fields: 'campaign_id,campaign_name,impressions,clicks,spend,actions,action_values,date_start,date_stop',
    time_range: JSON.stringify({ since, until }), limit: '500', access_token: accessToken,
  });
  let url = `${graphBase(e.apiVersion)}/${act}/insights?${params.toString()}`;
  const out: Array<Record<string, any>> = [];
  for (let page = 0; page < 50 && url; page++) {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw await metaError(res, 'insights_failed');
    const j = (await res.json()) as { data?: Array<Record<string, any>>; paging?: { next?: string } };
    for (const r of (j.data || [])) out.push(r);
    url = (j.paging && j.paging.next) ? j.paging.next : '';
  }
  return out;
}

export { metaAdsEnv };
