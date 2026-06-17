import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { getTenantContext } from '@/lib/tenant';
import { hashToken } from '@/lib/newsletter';
import { payloadRestLogin, forwardCookies } from '@/lib/session';

/**
 * Accept a workspace invitation. Two paths:
 *  - logged-in user whose email matches the invite → create their membership;
 *  - new user (token + name + password) → create the user + membership in the
 *    INVITED workspace (no new tenant/workspace) and log them in.
 * The invite must be pending + unexpired; it is marked accepted (single-use).
 * Tenant/workspace/role come from the invite — never from the client.
 */
const refId = (v: unknown) => (v == null ? null : typeof v === 'object' ? (v as { id?: unknown }).id : v);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }
  const token = typeof body.token === 'string' ? body.token : '';
  const fullName = (typeof body.fullName === 'string' ? body.fullName : '').trim().slice(0, 120);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!token) return NextResponse.json({ ok: false, error: 'Missing invitation token.' }, { status: 400 });

  try {
    const payload = await getPayload({ config });
    const found = await payload.find({ collection: 'workspace-invitations', where: { tokenHash: { equals: hashToken(token) } }, limit: 1, depth: 0, overrideAccess: true });
    const inv = found.docs[0] as Record<string, any> | undefined;
    if (!inv) return NextResponse.json({ ok: false, error: 'This invitation link is invalid.' }, { status: 404 });
    if (inv.status !== 'pending') return NextResponse.json({ ok: false, error: 'This invitation is no longer valid.' }, { status: 410 });
    if (inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()) {
      await payload.update({ collection: 'workspace-invitations', id: inv.id, overrideAccess: true, data: { status: 'expired' } });
      return NextResponse.json({ ok: false, error: 'This invitation has expired. Ask the workspace owner to send a new one.' }, { status: 410 });
    }

    const inviteEmail = String(inv.email).toLowerCase();
    const ctx = await getTenantContext();
    let userId: number | string;
    let newCookies: string[] = [];

    if (ctx.user) {
      // Logged-in accept — must match the invited email.
      if (String(ctx.user.email).toLowerCase() !== inviteEmail) {
        return NextResponse.json({ ok: false, error: `This invitation is for ${inv.email}. Please sign in with that email to accept.` }, { status: 403 });
      }
      userId = ctx.user.id;
    } else {
      // New-account accept — needs name + password; never if an account already exists.
      if (!fullName || password.length < 8) {
        return NextResponse.json({ ok: false, error: 'Create your account: enter your name and a password (min 8 characters).', needsAccount: true, email: inv.email }, { status: 422 });
      }
      const existing = await payload.find({ collection: 'users', where: { email: { equals: inviteEmail } }, limit: 1, depth: 0, overrideAccess: true });
      if (existing.docs.length) {
        return NextResponse.json({ ok: false, error: 'An account with this email already exists — please sign in to accept.', needsLogin: true }, { status: 409 });
      }
      const user = await payload.create({ collection: 'users', overrideAccess: true, data: { email: inviteEmail, password, name: fullName, role: 'operator' } });
      userId = user.id;
      const login = await payloadRestLogin(new URL(req.url).origin, inviteEmail, password);
      newCookies = login.ok ? login.cookies : [];
    }

    // Create the membership once (idempotent if already a member).
    const already = await payload.find({ collection: 'memberships', where: { and: [{ user: { equals: userId } }, { workspace: { equals: refId(inv.workspace) } }] }, limit: 1, depth: 0, overrideAccess: true });
    if (!already.docs.length) {
      await payload.create({
        collection: 'memberships', overrideAccess: true,
        data: { user: userId as never, tenant: refId(inv.tenant) as never, workspace: refId(inv.workspace) as never, role: inv.role },
      });
    }
    await payload.update({ collection: 'workspace-invitations', id: inv.id, overrideAccess: true, data: { status: 'accepted', acceptedAt: new Date().toISOString() } });

    const res = NextResponse.json({ ok: true, redirect: '/app' });
    if (newCookies.length) forwardCookies(res, newCookies);
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not accept the invitation. Please try again.' }, { status: 500 });
  }
}
