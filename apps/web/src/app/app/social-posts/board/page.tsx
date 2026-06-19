import Link from 'next/link';
import { requireWorkspace } from '@/lib/workspace';
import { listWorkspaceSocialPosts } from '@/lib/social';
import { SS_STATUSES, SS_STATUS_LABELS, SS_CHANNEL_LABELS, SS_PRIORITY_LABELS, ssStatusVariant } from '@/lib/social-constants';
import { TopBar, WsLink } from '../../_ui';
import { SocialNav } from '../_nav';
import type { Doc } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

const refId = (v: unknown): string => (v == null ? '' : String(typeof v === 'object' ? (v as { id?: unknown }).id : v));

export default async function SocialBoard() {
  const ws = await requireWorkspace();
  const posts = await listWorkspaceSocialPosts(ws.scope);
  const byStatus: Record<string, Doc[]> = { draft: [], ready_for_review: [], approved_to_copy: [], archived: [] };
  for (const p of posts) (byStatus[String(p.status)] ||= []).push(p);

  const related = (p: Doc): string => {
    if (refId(p.relatedLandingPage)) return 'Landing page';
    if (refId(p.relatedProduct)) return 'Product';
    if (refId(p.relatedRequest)) return 'Request';
    return '';
  };

  return (
    <>
      <TopBar title="Social Studio — Board" sub="Posts grouped by status. Move them manually via each post’s status controls — nothing posts automatically." actions={<WsLink href="/app/social-posts/new" primary>New social post</WsLink>} />
      <div className="adm-content">
        <SocialNav active="/app/social-posts/board" />
        {posts.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'start' }}>
            {SS_STATUSES.map((st) => {
              const col = byStatus[st] || [];
              return (
                <div key={st} className="adm-card">
                  <div className="adm-row" style={{ marginBottom: 8 }}>
                    <span className="t"><span className={`adm-badge ${ssStatusVariant(st)}`}>{SS_STATUS_LABELS[st]}</span></span>
                    <strong>{col.length}</strong>
                  </div>
                  {col.length ? col.map((p) => (
                    <Link key={String(p.id)} href={`/app/social-posts/${p.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', border: '1px solid var(--adm-line, #e5e0d6)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>{String(p.name || '(untitled)')}</div>
                      <div className="adm-note" style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className="adm-badge">{SS_CHANNEL_LABELS[String(p.channel)] || String(p.channel)}</span>
                        {p.plannedDate ? <span>📅 {String(p.plannedDate)}</span> : null}
                        {p.campaignLabel ? <span>#{String(p.campaignLabel)}</span> : null}
                        {p.priority && p.priority !== 'normal' ? <span>{SS_PRIORITY_LABELS[String(p.priority)]}</span> : null}
                        {related(p) ? <span>· {related(p)}</span> : null}
                      </div>
                    </Link>
                  )) : <p className="adm-note">Empty.</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="adm-panel">No social posts yet. <Link href="/app/social-posts/new">Create your first draft</Link> — it starts in the Draft column.</div>
        )}
      </div>
    </>
  );
}
