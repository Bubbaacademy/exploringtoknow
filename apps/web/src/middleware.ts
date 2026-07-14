import { NextResponse, type NextRequest } from 'next/server';
import { hasSession, AUTH } from '@/lib/auth';

/**
 * Middleware — two concerns:
 *
 * 1) Auth gate for the internal operator surfaces (editorial dashboard + the /app
 *    workspace and /platform super-admin consoles). Fast presence check only — the
 *    AUTHORITATIVE gate (session + role/membership) lives server-side in each page
 *    (lib/tenant.ts). Applies on every host.
 *
 * 2) BubbaAffiliate clean-domain routing (Phase 1C). On the `bubbaaffiliate.com`
 *    apex, the gateway is served at the site root: the clean public paths are
 *    internally rewritten to the existing `/bubbaaffiliate/*` routes WITHOUT changing
 *    the browser URL (NextResponse.rewrite keeps client routing/RSC consistent).
 *    `www.bubbaaffiliate.com` is canonicalized to the apex at the Caddy layer.
 *    On every other host (e.g. exploringtoknow.com) nothing changes — the gateway
 *    keeps working at `/bubbaaffiliate`.
 */

const GATEWAY_HOST = 'bubbaaffiliate.com';

// Clean apex path -> internal gateway route (browser URL stays clean).
const CLEAN_TO_INTERNAL: Record<string, string> = {
  '/': '/bubbaaffiliate',
  '/sellers': '/bubbaaffiliate/sellers',
  '/creators': '/bubbaaffiliate/creators',
  '/pricing': '/bubbaaffiliate/pricing',
  '/how-it-works': '/bubbaaffiliate/how-it-works',
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Auth gate — internal operator surfaces, any host (behavior unchanged).
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/platform');
  if (isProtected) {
    if (!hasSession(req)) {
      const url = req.nextUrl.clone();
      url.pathname = AUTH.loginPath;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2) BubbaAffiliate apex — clean host-aware rewrite. www -> apex is handled at Caddy.
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0] || '';
  if (host === GATEWAY_HOST) {
    const internal = CLEAN_TO_INTERNAL[pathname];
    if (internal) {
      const url = req.nextUrl.clone();
      url.pathname = internal;
      return NextResponse.rewrite(url);
    }
    // /_next/*, /api/*, /bubbaaffiliate/*, favicon, etc. pass straight through.
    return NextResponse.next();
  }

  // 3) All other hosts — unchanged.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/app/:path*',
    '/platform/:path*',
    // Gateway clean paths — middleware only acts when Host is bubbaaffiliate.com.
    '/',
    '/sellers',
    '/creators',
    '/pricing',
    '/how-it-works',
  ],
};
