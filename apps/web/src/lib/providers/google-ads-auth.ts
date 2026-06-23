/**
 * Google Ads OAuth (Phase 31) — server-only. Direct REST (no SDK). Reads client
 * credentials from env; if any are missing the caller treats the provider as
 * `not_configured`. Token VALUES are never logged or returned to clients. Tokens are
 * persisted only via the Phase 30 AES-256-GCM vault by the route layer.
 *
 * Official: scope https://www.googleapis.com/auth/adwords ; consent
 * https://accounts.google.com/o/oauth2/v2/auth ; token https://oauth2.googleapis.com/token .
 */
const ADWORDS_SCOPE = 'https://www.googleapis.com/auth/adwords';
const CONSENT_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const GOOGLE_ADS_REQUIRED_ENV = ['GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_REDIRECT_URI', 'PROVIDER_TOKEN_ENCRYPTION_KEY'] as const;

export type GoogleAdsEnv = {
  configured: boolean;
  missingEnv: string[];
  clientId: string; clientSecret: string; developerToken: string; redirectUri: string;
  loginCustomerId: string;     // optional, '' if unset
  apiVersion: string;          // env-overridable; default v20
};

const env = (k: string) => String(process.env[k] ?? '').trim();

/** Resolve Google Ads env (server-only). `missingEnv` lists NAMES only. */
export function googleAdsEnv(): GoogleAdsEnv {
  const missingEnv = GOOGLE_ADS_REQUIRED_ENV.filter((n) => !env(n));
  return {
    configured: missingEnv.length === 0,
    missingEnv,
    clientId: env('GOOGLE_ADS_CLIENT_ID'), clientSecret: env('GOOGLE_ADS_CLIENT_SECRET'),
    developerToken: env('GOOGLE_ADS_DEVELOPER_TOKEN'), redirectUri: env('GOOGLE_ADS_REDIRECT_URI'),
    loginCustomerId: env('GOOGLE_ADS_LOGIN_CUSTOMER_ID').replace(/[^0-9]/g, ''),
    // Current Google Ads API major version (only the 3 most recent are maintained;
    // v20/v21 are sunset → UNSUPPORTED_VERSION). Override via GOOGLE_ADS_API_VERSION.
    apiVersion: env('GOOGLE_ADS_API_VERSION') || 'v24',
  };
}

/** Build the Google OAuth consent URL with our signed `state`. */
export function buildConsentUrl(state: string): string {
  const e = googleAdsEnv();
  const params = new URLSearchParams({
    client_id: e.clientId, redirect_uri: e.redirectUri, response_type: 'code',
    scope: ADWORDS_SCOPE, access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state,
  });
  return `${CONSENT_URL}?${params.toString()}`;
}

export type TokenSet = { accessToken: string; refreshToken: string; expiresInSec: number };

/** Exchange an authorization code for tokens. Throws a generic error (no secret leakage). */
export async function exchangeCodeForTokens(code: string): Promise<TokenSet> {
  const e = googleAdsEnv();
  const body = new URLSearchParams({
    code, client_id: e.clientId, client_secret: e.clientSecret, redirect_uri: e.redirectUri, grant_type: 'authorization_code',
  });
  const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!res.ok) throw new Error(`token_exchange_failed_${res.status}`);
  const j = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!j.access_token) throw new Error('token_exchange_no_access_token');
  return { accessToken: j.access_token, refreshToken: j.refresh_token || '', expiresInSec: Number(j.expires_in || 3600) };
}

/** Refresh an access token from a stored refresh token. Throws a generic error on failure. */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresInSec: number }> {
  const e = googleAdsEnv();
  const body = new URLSearchParams({
    client_id: e.clientId, client_secret: e.clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!res.ok) throw new Error(`token_refresh_failed_${res.status}`);
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) throw new Error('token_refresh_no_access_token');
  return { accessToken: j.access_token, expiresInSec: Number(j.expires_in || 3600) };
}
