import { NextResponse, type NextRequest } from 'next/server';
import { hasSession, AUTH } from '@/lib/auth';

/**
 * Protects the internal dashboard. Public site routes and the Payload admin
 * (which has its own login) are left open here.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isDashboard = pathname.startsWith('/products')
    || pathname.startsWith('/content')
    || pathname.startsWith('/social')
    || pathname.startsWith('/tracking')
    || pathname.startsWith('/analytics')
    || pathname.startsWith('/health');

  if (isDashboard && !hasSession(req)) {
    const url = req.nextUrl.clone();
    url.pathname = AUTH.loginPath;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/products/:path*', '/content/:path*', '/social/:path*',
            '/tracking/:path*', '/analytics/:path*', '/health/:path*'],
};
