import Link from 'next/link';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listWorkspaceSocialPosts, socialOverview } from '@/lib/social';
import { listProductOptions, listRequestOptions } from '@/lib/landing';
import { getBrandProfile } from '@/lib/brandkit';
import { SS_CHANNEL_LABELS, SS_FORMAT_LABELS, SS_STATUS_LABELS, ssStatusVariant } from '@/lib/social-constants';
import { TopBar, Section, Card, Empty, DataTable, WsLink, fmtDate } from '../_ui';
import { SocialNav, SocialOverview } from './_nav';

export const dynamic = 'force-dynamic';

const refId = (v: unknown): string => (v == null ? '' : String(typeof v === 'object' ? (v as { id?: unknown }).id : v));

export default async function SocialPostsList() {
  const ws = await requireWorkspace();
  const editable = canWrite(ws.role);
  const [posts, overview, brand, products, requests] = await Promise.all([
    listWorkspaceSocialPosts(ws.scope), socialOverview(ws.scope), getBrandProfile(ws.scope),
    listProductOptions(ws.scope), listRequestOptions(ws.scope),
  ]);
  const pMap = new Map(products.map((p) => [String(p.id), p.label]));
  const rMap = new Map(requests.map((r) => [String(r.id), r.label]));
  const related = (p: Record<string, unknown>): string => {
    const pid = refId(p.relatedProduct); if (pid && pMap.has(pid)) return `Product: ${pMap.get(pid)}`;
    const rid = refId(p.relatedRequest); if (rid && rMap.has(rid)) return `Request: ${rMap.get(rid)}`;
    if (refId(p.relatedLandingPage)) return 'Landing page';
    return '—';
  };

  return (
    <>
      <TopBar
        title="Social Studio"
        sub="Plan and export posts manually. Nothing is generated, scheduled, or posted automatically."
        actions={editable ? <WsLink href="/app/social-posts/new" primary>New social post</WsLink> : undefined}
      />
      <div className="adm-content">
        <SocialNav active="/app/social-posts" />
        <SocialOverview o={overview} />
        {!brand ? (
          <div className="adm-panel" style={{ marginBottom: 16 }}>
            Tip: set up your <Link href="/app/brand">Brand Kit</Link> first — Social Studio uses your brand voice, audience, and disclosure notes as helper context.
          </div>
        ) : null}

        <Section title="Your social posts">
          {posts.length ? (
            <Card>
              <DataTable
                head={['Name', 'Channel', 'Format', 'Status', 'Planned', 'Campaign', 'Related', 'Updated', '']}
                rows={posts.map((p) => [
                  <span key="n">{(p.name as string) || '(untitled)'}</span>,
                  <span key="c" className="adm-badge">{SS_CHANNEL_LABELS[String(p.channel)] || String(p.channel)}</span>,
                  SS_FORMAT_LABELS[String(p.format)] || String(p.format),
                  <span key="s" className={`adm-badge ${ssStatusVariant(String(p.status))}`}>{SS_STATUS_LABELS[String(p.status)] || String(p.status)}</span>,
                  (p.plannedDate as string) || '—',
                  (p.campaignLabel as string) || '—',
                  related(p),
                  fmtDate(p.updatedAt),
                  <Link key="e" href={`/app/social-posts/${p.id}`}>{editable ? 'Edit' : 'View'}</Link>,
                ])}
                empty="No social posts yet."
              />
            </Card>
          ) : (
            <Empty>
              No social posts yet. {editable
                ? <>Create your first one — posts are authored by hand and can later be connected to publishing and ad workflows. Nothing posts automatically.</>
                : <>An owner, admin, or editor can create one.</>}
            </Empty>
          )}
        </Section>
      </div>
    </>
  );
}
