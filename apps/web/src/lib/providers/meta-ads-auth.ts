/**
 * Meta (Facebook/Instagram) Ads OAuth (Phase 32) — server-only. Direct REST (no SDK).
 * Reads platform app credentials from env; if any are missing the caller treats the
 * provider as `not_configured`. Token VALUES are never logged or returned to clients.
 * Tokens are persisted only via the Phase 30 AES-256-GCM vault by the route layer.
 *
 * Official (Meta for Developers): scope `ads_read` (minimum for Ads Insights read);
 * consent `https://www.facebook.com/{v}/dialog/oauth`; token exchange
 * `https://graph.facebook.com/{v}/oauth/access_token`. Meta has NO refresh token — a
 * long-lived user token (~60 days) is obtained via `grant_type=fb_exchange_token`.
 * Current Graph API version is v25.0 (override via META_API_VERSION).
 */

// Minimum read-only permission for the Ads Insights API. We deliberately do NOT request
// ads_management (write) in this read-first phase.
const ADS_READ_SCOPE = 'ads_read';

export const META_ADS_REQUIRED_ENV = ['META_APP_ID', 'META_APP_SECRET', 'META_REDIRECT_URI', 'PROVIDER_TOKEN_ENCRYPTION_KEY'] as const;

export type MetaAdsEnv = {
  configured: boolean;
  missingEnv: string[];
  appId: string; appSecret: string; redirectUri: string;
  apiVersion: string;          // env-overridable; default v25.0
  scope: string;               // read-only scope requested at consent
};

const env = (k: string) => String(process.env[k] ?? '').trim();

/** Resolve Meta Ads env (server-only). `missingEnv` lists NAMES only. */
export function metaAdsEnv(): MetaAdsEnv {
  const missingEnv = META_ADS_REQUIRED_ENV.filter((n) => !env(n));
  // Normalize version to the `v25.0` form whether the operator set `25.0` or `v25.0`.
  const raw = env('META_API_VERSION') || 'v25.0';
  const apiVersion = /^v/i.test(raw) ? raw : `v${raw}`;
  return {
    configured: missingEnv.length === 0,
    missingEnv,
    appId: env('META_APP_ID'), appSecret: env('META_APP_SECRET'), redirectUri: env('META_REDIRECT_URI'),
    apiVersion,
    scope: ADS_READ_SCOPE,
  };
}

export const graphBase = (version: string) => `https://graph.facebook.com/${version}`;

/** Build the Meta OAuth consent URL with our signed `state`. Requests read-only `ads_read`. */
export function buildConsentUrl(state: string): string {
  const e = metaAdsEnv();
  const params = new URLSearchParams({
    client_id: e.appId, redirect_uri: e.redirectUri, response_type: 'code', scope: e.scope, state,
  });
  return `https://www.facebook.com/${e.apiVersion}/dialog/oauth?${params.toString()}`;
}

/** Sanitized error from a failed Graph token response (no tokens/secrets/headers). */
async function tokenError(res: Response, prefix: string): Promise<Error> {
  let body = ''; try { body = await res.text(); } catch { /* ignore */ }
  let j: any; try { j = JSON.parse(body); } catch { /* non-JSON */ }
  const er = (j && j.error) || {};
  const code = er.code != null ? String(er.code) : '';
  const sub = er.error_subcode != null ? String(er.error_subcode) : '';
  const type = er.type ? String(er.type) : '';
  const msg = String(er.message || '').replace(/\s+/g, ' ').slice(0, 200);
  return new Error(`${prefix} http=${res.status}${type ? ` type=${type}` : ''}${code ? ` code=${code}` : ''}${sub ? ` sub=${sub}` : ''}${msg ? ` msg=${msg}` : ''}`);
}

export type MetaTokenSet = { accessToken: string; expiresInSec: number };

/**
 * Exchange an authorization code for a (short-lived) user access token. Throws a
 * sanitized error on failure. The route layer immediately upgrades this to a long-lived
 * token via {@link exchangeForLongLivedToken}.
 */
export async function exchangeCodeForToken(code: string): Promise<MetaTokenSet> {
  const e = metaAdsEnv();
  const params = new URLSearchParams({
    client_id: e.appId, client_secret: e.appSecret, redirect_uri: e.redirectUri, code,
  });
  const res = await fetch(`${graphBase(e.apiVersion)}/oauth/access_token?${params.toString()}`, { method: 'GET' });
  if (!res.ok) throw await tokenError(res, 'token_exchange_failed');
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) throw new Error('token_exchange_no_access_token');
  // Short-lived user tokens are ~1–2h; default to 1h when expires_in is absent.
  return { accessToken: j.access_token, expiresInSec: Number(j.expires_in || 3600) };
}

/**
 * Upgrade a short-lived user token to a long-lived (~60-day) user token. Meta does not
 * issue refresh tokens; this is the supported re-extension path while a token is valid.
 */
export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaTokenSet> {
  const e = metaAdsEnv();
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token', client_id: e.appId, client_secret: e.appSecret, fb_exchange_token: shortLivedToken,
  });
  const res = await fetch(`${graphBase(e.apiVersion)}/oauth/access_token?${params.toString()}`, { method: 'GET' });
  if (!res.ok) throw await tokenError(res, 'token_longlived_failed');
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) throw new Error('token_longlived_no_access_token');
  // Long-lived user tokens last ~60 days; default to that when expires_in is omitted.
  return { accessToken: j.access_token, expiresInSec: Number(j.expires_in || 60 * 86400) };
}
