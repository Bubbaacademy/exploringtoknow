import type { Metadata } from 'next';
import { getPayload } from 'payload';
import config from '@payload-config';
import { hashToken } from '@/lib/newsletter';
import { getTenantContext } from '@/lib/tenant';
import { ROLE_LABELS } from '@/lib/roles';
import { SITE_NAME } from '@/lib/public';
import { AcceptInvite } from '@/components/site/AcceptInvite';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: `Team invitation — ${SITE_NAME}`, robots: { index: false, follow: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await getPayload({ config });
  const found = await payload.find({ collection: 'workspace-invitations', where: { tokenHash: { equals: hashToken(token) } }, limit: 1, depth: 1, overrideAccess: true });
  const inv = found.docs[0] as Record<string, any> | undefined;
  const ctx = await getTenantContext();
  const loggedInEmail = ctx.user?.email ? String(ctx.user.email) : null;

  if (!inv) {
    return (
      <section className="section"><div className="container" style={{ maxWidth: 520 }}>
        <div className="empty-panel" role="status">
          <span className="eyebrow">Invitation</span>
          <h2>This invitation link is invalid</h2>
          <p>The link may be mistyped or the invitation was withdrawn. Please ask the workspace owner to send a new one.</p>
          <div className="empty-panel-actions"><a href="/" className="btn btn-ghost">Go home</a></div>
        </div>
      </div></section>
    );
  }

  const wsName = inv.workspace && typeof inv.workspace === 'object' ? String(inv.workspace.name ?? '') : '';
  const expired = Boolean(inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now());

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="request-head">
          <span className="eyebrow">Team invitation</span>
          <h1>Join {wsName || 'a workspace'}</h1>
          <p className="request-lede">You’ve been invited as <strong>{ROLE_LABELS[String(inv.role)] ?? String(inv.role)}</strong> for <strong>{String(inv.email)}</strong>. You’ll review and approve everything — nothing publishes automatically.</p>
        </div>
        <AcceptInvite
          token={token}
          inviteEmail={String(inv.email)}
          role={String(inv.role)}
          workspaceName={wsName}
          status={String(inv.status)}
          expired={expired}
          loggedInEmail={loggedInEmail}
        />
      </div>
    </section>
  );
}
