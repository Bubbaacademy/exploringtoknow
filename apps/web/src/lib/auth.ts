import type { NextRequest } from 'next/server';

/**
 * Internal dashboard authentication (architecture, Phase 0).
 *
 * Strategy: Payload-issued session cookie is the single source of auth. The
 * dashboard route group `(dashboard)` is gated by middleware that checks for a
 * valid Payload session. There are NO customer accounts and NO public sign-up.
 *
 * Phase 0 ships the architecture + a cookie presence check. Phase 1 replaces
 * `hasSession` with a real Payload token verification (`payload.auth({ headers })`).
 */
const PAYLOAD_COOKIE = 'payload-token';

export function hasSession(req: NextRequest): boolean {
  // TODO(Phase 1): verify the token with Payload instead of presence-only.
  return Boolean(req.cookies.get(PAYLOAD_COOKIE)?.value);
}

export const AUTH = { cookieName: PAYLOAD_COOKIE, loginPath: '/admin/login' };
