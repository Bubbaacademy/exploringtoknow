import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/session';

/** Clears the Payload session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true, redirect: '/' });
  clearAuthCookie(res);
  return res;
}

export async function GET(req: Request) {
  // Redirect to the PUBLIC origin (never an internal/localhost host that a proxy
  // may put on req.url) so sign-out always lands on the real public homepage.
  const base = process.env.PAYLOAD_PUBLIC_SERVER_URL || new URL(req.url).origin;
  const res = NextResponse.redirect(new URL('/', base));
  clearAuthCookie(res);
  return res;
}
