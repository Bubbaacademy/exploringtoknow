import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listWorkspaceSocialPosts } from '@/lib/social';
import { SS_CHANNEL_LABELS } from '@/lib/social-constants';
import { TopBar } from '../../_ui';
import { SocialNav } from '../_nav';
import { SocialExportPanel } from '@/components/app/SocialExportPanel';

export const dynamic = 'force-dynamic';

export default async function SocialExport() {
  const ws = await requireWorkspace();
  const editable = canWrite(ws.role);
  const all = await listWorkspaceSocialPosts(ws.scope);
  const approved = all
    .filter((p) => String(p.status) === 'approved_to_copy')
    .map((p) => ({
      id: p.id as string | number, name: String(p.name || '(untitled)'),
      channel: SS_CHANNEL_LABELS[String(p.channel)] || String(p.channel),
      plannedDate: (p.plannedDate as string) || '', campaignLabel: (p.campaignLabel as string) || '',
    }));

  return (
    <>
      <TopBar title="Creator Studio — Export" sub="Manually copy/export approved campaign assets for creators. This is not publishing — nothing is sent to any network." />
      <div className="adm-content">
        <SocialNav active="/app/social-posts/export" />
        {!editable ? (
          <div className="adm-panel warn">Your role has read-only access. Ask an owner, admin, or editor to export.</div>
        ) : approved.length ? (
          <SocialExportPanel posts={approved} />
        ) : (
          <div className="adm-panel">No approved posts to export yet. Move a post to <strong>Approved to copy</strong> from its detail page, then it’ll appear here for bulk copy/export.</div>
        )}
      </div>
    </>
  );
}
