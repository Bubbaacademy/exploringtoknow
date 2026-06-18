import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageTeam, isInvitableRole } from '@/lib/roles';
import { workspaceCapability } from '@/lib/billing';
import { makeToken } from '@/lib/newsletter';
import { sendInviteEmail } from '@/lib/email-templates';

/**
 * Owner-only workspace invite. Tenant/workspace/inviter are derived from the
 * session (never client input). Token is random; only its SHA-256 hash is stored.
 * Local-safe: no email is sent — the owner copies the returned invite link.
 */
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }
  if (!canManageTeam(ws.role)) {
    return NextResponse.json({ ok: false, error: 'Only the workspace owner can invite teammates.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }
  const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase().slice(0, 200);
  const role = typeof body.role === 'string' ? body.role : '';
  const message = (typeof body.message === 'string' ? body.message : '').trim().slice(0, 1000);

  if (!isEmail(email)) return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 422 });
  if (!isInvitableRole(role)) return NextResponse.json({ ok: false, error: 'Choose a valid role (admin, editor, or viewer).' }, { status: 422 });

  try {
    const payload = await getPayload({ config });

    // Already a member of THIS workspace?
    const existingUser = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true });
    const existingUserId = existingUser.docs[0]?.id;
    if (existingUserId != null) {
      const m = await payload.find({
        collection: 'memberships',
        where: { and: [{ user: { equals: existingUserId } }, { workspace: { equals: ws.scope.workspaceId } }] },
        limit: 1, depth: 0, overrideAccess: true,
      });
      if (m.docs.length) return NextResponse.json({ ok: false, error: 'That person is already a member of this workspace.' }, { status: 409 });
    }

    // Duplicate pending invite for the same email + workspace?
    const dup = await payload.find({
      collection: 'workspace-invitations',
      where: { and: [{ email: { equals: email } }, { workspace: { equals: ws.scope.workspaceId } }, { status: { equals: 'pending' } }] },
      limit: 1, depth: 0, overrideAccess: true,
    });
    if (dup.docs.length) return NextResponse.json({ ok: false, error: 'There is already a pending invitation for that email.' }, { status: 409 });

    // Plan seat limit (members + pending invites).
    const cap = await workspaceCapability(ws, 'invite');
    if (!cap.ok) return NextResponse.json({ ok: false, error: cap.reason, code: 'LIMIT', upgrade: true }, { status: 402 });

    const { token, hash } = makeToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const base = process.env.PAYLOAD_PUBLIC_SERVER_URL || new URL(req.url).origin;
    const inviteLink = `${base}/invite/${token}`;

    // Best-effort invite email (local-safe no-op if no provider). The copyable
    // link is always returned so the owner can share it either way.
    let emailStatus = 'local_no_send';
    try {
      const r = await sendInviteEmail(email, {
        workspaceName: (ws.workspace?.name as string) || undefined,
        role,
        acceptUrl: inviteLink,
        inviterName: (ws.ctx.user.name as string) || undefined,
      });
      emailStatus = r.status;
    } catch { emailStatus = 'error_network'; }

    const doc = await payload.create({
      collection: 'workspace-invitations',
      overrideAccess: true,
      data: {
        email, role: role as never, message: message || undefined,
        tenant: ws.scope.tenantId as never, workspace: ws.scope.workspaceId as never,
        invitedBy: ws.ctx.user.id as never, tokenHash: hash, status: 'pending',
        expiresAt, emailStatus,
      },
    });
    return NextResponse.json({ ok: true, id: doc.id, inviteLink, emailStatus, emailed: emailStatus === 'sent' });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not create the invitation. Please try again.' }, { status: 500 });
  }
}
