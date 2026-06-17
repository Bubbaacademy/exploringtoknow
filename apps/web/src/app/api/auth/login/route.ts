import { NextResponse } from 'next/server';
import { payloadRestLogin, forwardCookies } from '@/lib/session';

/**
 * Public login for workspace users (and operators). Delegates to Payload's own
 * REST login so the session + session cookie are created exactly as Payload's
 * cookie strategy expects, then forwards the cookie and sends the client to /app.
 * Super admins can navigate on to /platform, /dashboard, /admin.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }

  const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Enter your email and password.' }, { status: 422 });
  }

  try {
    const { ok, cookies } = await payloadRestLogin(new URL(req.url).origin, email, password);
    if (!ok || !cookies.length) return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
    const res = NextResponse.json({ ok: true, redirect: '/app' });
    forwardCookies(res, cookies);
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
  }
}
