import { NextResponse, type NextRequest } from 'next/server';
import { hasSession, AUTH } from '@/lib/auth';

/**
 * First-line gate for the internal operator surfaces: the editorial dashboard and
 * the SaaS consoles (/app workspace, /platform super-admin). This is a fast
 * presence check only — the AUTHORITATIVE gate (real session verification + role/
 * membership checks) lives server-side in each page via lib/tenant.ts
 * (requireWorkspaceMember / requireSuperAdmin). Public site routes and the Payload
 * admin (which has its own login) are left open here.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/platform');

  if (isProtected && !hasSession(req)) {
    const url = req.nextUrl.clone();
    url.pathname = AUTH.loginPath;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/app/:path*', '/platform/:path*'],
};
