import { requireWorkspace, listWorkspaceMembers, listWorkspaceInvites } from '@/lib/workspace';
import { canManageTeam } from '@/lib/roles';
import { TopBar, fmtDate } from '../_ui';
import { TeamManager, type Member, type Invite } from '@/components/app/TeamManager';

export const dynamic = 'force-dynamic';

const refId = (v: unknown) => (v == null ? null : typeof v === 'object' ? (v as { id?: unknown }).id : v);

export default async function TeamPage() {
  const ws = await requireWorkspace();
  const manage = canManageTeam(ws.role);
  const [mDocs, iDocs] = await Promise.all([listWorkspaceMembers(ws.scope), listWorkspaceInvites(ws.scope)]);
  const selfId = ws.ctx.user?.id;

  const members: Member[] = mDocs.map((m) => {
    const u = (m.user && typeof m.user === 'object' ? m.user : null) as { id?: unknown; email?: unknown; name?: unknown } | null;
    return {
      id: m.id as string | number,
      email: u?.email ? String(u.email) : '(unknown)',
      name: u?.name ? String(u.name) : '',
      role: String(m.role),
      joined: fmtDate(m.createdAt),
      isSelf: String(u?.id ?? refId(m.user)) === String(selfId),
    };
  });
  const invites: Invite[] = iDocs.map((i) => ({ id: i.id as string | number, email: String(i.email), role: String(i.role), created: fmtDate(i.createdAt) }));

  return (
    <>
      <TopBar
        title="Team"
        sub={`Members of ${(ws.workspace?.name as string) || 'your workspace'}. ${manage ? 'You can invite teammates and manage roles.' : 'Your role can view the team.'}`}
      />
      <div className="adm-content">
        <TeamManager members={members} invites={invites} canManage={manage} />
      </div>
    </>
  );
}
