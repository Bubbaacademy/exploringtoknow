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
