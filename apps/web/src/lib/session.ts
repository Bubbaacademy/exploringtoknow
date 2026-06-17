import type { NextResponse } from 'next/server';

/**
 * Payload session cookie helpers. Payload authenticates via the `payload-token`
 * cookie (a signed JWT); setting it with the token returned by `payload.login`
 * makes `payload.auth({ headers })` (used by /app and /platform) recognise the user.
 * We only set transport attributes — verification is the JWT signature, done by Payload.
 */
export const AUTH_COOKIE = 'payload-token';

export function setAuthCookie(res: NextResponse, token: string, exp?: number): void {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(exp ? { expires: new Date(exp * 1000) } : {}),
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}

/**
 * Authenticate via Payload's OWN REST login so Payload creates the server-side
 * session and emits the session cookie exactly as its cookie strategy expects.
 * (A manually-set JWT cookie is NOT accepted by Payload v3's session-based cookie
 * auth — it only validates via Authorization/bearer.) Returns the Set-Cookie
 * header(s) to forward to the browser.
 */
export async function payloadRestLogin(
  origin: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; cookies: string[]; status: number }> {
  // Payload's REST login is served by THIS same Next app, so call it over loopback
  // (no external DNS / hairpin-NAT). The forwarded Set-Cookie is host-only, so it
  // binds to whatever public host the browser used. Falls back to the public URL
  // / request origin if an explicit internal URL is configured.
  const base = process.env.PAYLOAD_INTERNAL_URL
    || `http://127.0.0.1:${process.env.PORT || '3000'}`
    || process.env.PAYLOAD_PUBLIC_SERVER_URL
    || origin;
  const r = await fetch(`${base}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    redirect: 'manual',
  });
  const h = r.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = typeof h.getSetCookie === 'function' ? h.getSetCookie() : [];
  return { ok: r.ok, cookies, status: r.status };
}

/** Copy forwarded Set-Cookie header(s) onto our response. */
export function forwardCookies(res: NextResponse, cookies: string[]): void {
  for (const c of cookies) res.headers.append('set-cookie', c);
}
