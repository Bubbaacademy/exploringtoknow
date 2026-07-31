import { NextResponse, type NextRequest } from 'next/server';
import { hasSession, AUTH } from '@/lib/auth';

/**
 * Middleware — domain ownership, then auth.
 *
 * Phase 2Z establishes the route/ownership boundary the project runs on. ONE app
 * container serves BOTH domains (see the Caddyfile: two vhosts, both
 * `reverse_proxy app:3000`), so until now every operational route resolved on
 * BOTH hosts — `/app/product-requests/new`, `/dashboard`, `/admin`, `/login` and
 * `/signup` all answered on exploringtoknow.com. That is the violation this file
 * now closes, at the only layer that can see the Host header.
 *
 *   bubbaaffiliate.com — owns EVERY operational surface: seller/creator intake,
 *     product requests, products, offers, campaigns, the content engine,
 *     editorial/admin workflows, media uploads, analytics, auth, /app,
 *     /dashboard, /platform, /admin.
 *
 *   exploringtoknow.com — a reader-facing magazine and nothing else. It is a
 *     PUBLICATION TARGET for content BubbaAffiliate generates, not the owner of
 *     any engine. No login, no admin, no operational route, no write API.
 *
 * Nothing moved to achieve this: every operational route already answered on
 * bubbaaffiliate.com. This file only stops the magazine host from answering them.
 *
 * Three concerns, in order:
 *
 * 1) MAGAZINE HOST — reader surface only. Operational paths return a real 404,
 *    deliberately NOT a redirect to BubbaAffiliate: a redirect would still make
 *    the magazine advertise the operational system. They must simply not exist
 *    here.
 *
 * 2) AUTH GATE for the operator surfaces, on every non-magazine host. Fast
 *    presence check only — the AUTHORITATIVE gate (session + role/membership)
 *    stays server-side in each page (lib/tenant.ts). Behaviour unchanged.
 *
 * 3) BUBBAAFFILIATE CLEAN-DOMAIN ROUTING (Phase 1C) — the gateway is served at
 *    the apex root by internally rewriting the clean paths to `/bubbaaffiliate/*`
 *    without changing the browser URL. Unchanged, plus the reverse-leak fix
 *    below.
 */

const GATEWAY_HOST = 'bubbaaffiliate.com';

/** Caddy serves both names from the same vhost, so both must be treated alike. */
const MAGAZINE_HOSTS = new Set(['exploringtoknow.com', 'www.exploringtoknow.com']);

// Clean apex path -> internal gateway route (browser URL stays clean).
const CLEAN_TO_INTERNAL: Record<string, string> = {
  '/': '/bubbaaffiliate',
  '/sellers': '/bubbaaffiliate/sellers',
  '/creators': '/bubbaaffiliate/creators',
  '/pricing': '/bubbaaffiliate/pricing',
  '/how-it-works': '/bubbaaffiliate/how-it-works',
};

/**
 * Operational path prefixes that must not exist on the magazine host.
 * `/invite` (team invitations) and `/lp` (campaign landing pages) live under the
 * `(site)` route group for historical reasons but are BubbaAffiliate surfaces.
 */
const OPERATIONAL_PREFIXES = [
  '/app',
  '/dashboard',
  '/platform',
  '/admin',
  '/login',
  '/signup',
  '/invite',
  '/lp',
];

/**
 * The ONLY `/api/*` paths the public magazine needs. Everything else under
 * `/api` — auth, the operator API, Payload's collection REST, the retired
 * product-request intake — is operational and 404s on the magazine host.
 *
 * `/api/media` is on this list because it is READER surface: published article
 * images are served from `https://exploringtoknow.com/api/media/file/<name>`
 * (absolute URLs built from PAYLOAD_PUBLIC_SERVER_URL). Blocking it would break
 * every hero and inline image on the live magazine. It is restricted to
 * GET/HEAD below, so it stays a read path and never becomes a write path.
 *
 * `/api/health` is listed for completeness only — the container healthcheck hits
 * `http://127.0.0.1:3000/api/health`, whose Host is not a magazine host, so it
 * never reaches this branch.
 */
const MAGAZINE_API_PREFIXES = [
  '/api/health',
  '/api/media',
  '/api/newsletter',
  '/api/contact',
  '/api/track',
];

/** Segment-aware prefix match, so `/lpx` is not treated as `/lp`. */
const underPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * A plain, neutral 404. It names no other system — the point is that these paths
 * do not exist on the magazine, not that they live somewhere else.
 */
function notFound() {
  return new NextResponse(
    '<!doctype html><meta charset="utf-8"><title>404 — Not Found</title><h1>404 — Not Found</h1>',
    {
      status: 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-robots-tag': 'noindex, nofollow',
        'cache-control': 'no-store',
      },
    },
  );
}

function blockedOnMagazineHost(pathname: string, method: string): boolean {
  if (OPERATIONAL_PREFIXES.some((p) => underPrefix(pathname, p))) return true;

  if (underPrefix(pathname, '/api')) {
    if (!MAGAZINE_API_PREFIXES.some((p) => underPrefix(pathname, p))) return true;
    // Media is readable by the magazine, never writable through it.
    if (underPrefix(pathname, '/api/media') && method !== 'GET' && method !== 'HEAD') return true;
  }

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0] || '';

  // 1) Magazine host — reader surface only.
  if (MAGAZINE_HOSTS.has(host)) {
    if (blockedOnMagazineHost(pathname, req.method)) return notFound();
    return NextResponse.next();
  }

  // 2) Auth gate — internal operator surfaces (behaviour unchanged).
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

  // 3) BubbaAffiliate apex — clean host-aware rewrite. www -> apex is handled at Caddy.
  if (host === GATEWAY_HOST) {
    /**
     * Reverse leak: `sitemap.ts` builds every URL from SITE_URL, so this host was
     * serving a sitemap advertising 43 exploringtoknow.com URLs. The magazine's
     * sitemap belongs to the magazine's domain only. (Magazine pages rendered on
     * this host already carry `canonical` -> exploringtoknow.com, so the sitemap
     * was the remaining advertiser.)
     */
    if (pathname === '/sitemap.xml') return notFound();

    const internal = CLEAN_TO_INTERNAL[pathname];
    if (internal) {
      const url = req.nextUrl.clone();
      url.pathname = internal;
      return NextResponse.rewrite(url);
    }
    // /_next/*, /api/*, /bubbaaffiliate/*, favicon, etc. pass straight through.
    return NextResponse.next();
  }

  // 4) All other hosts (internal healthcheck, direct IP) — unchanged.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Operator surfaces — auth-gated off-magazine, 404 on the magazine host.
    '/dashboard/:path*',
    '/app/:path*',
    '/platform/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
    '/invite/:path*',
    '/lp/:path*',
    // Every API path, so the magazine host can be held to its reader allowlist.
    '/api/:path*',
    // Reverse leak — the magazine sitemap must not be served by the gateway host.
    '/sitemap.xml',
    // Gateway clean paths — middleware only rewrites when Host is bubbaaffiliate.com.
    '/',
    '/sellers',
    '/creators',
    '/pricing',
    '/how-it-works',
  ],
};
