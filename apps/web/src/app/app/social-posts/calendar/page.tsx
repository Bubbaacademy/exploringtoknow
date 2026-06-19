import Link from 'next/link';
import { requireWorkspace } from '@/lib/workspace';
import { listWorkspaceSocialPosts } from '@/lib/social';
import { SS_CHANNEL_LABELS, SS_STATUS_LABELS, ssStatusVariant } from '@/lib/social-constants';
import { TopBar, Card, WsLink } from '../../_ui';
import { SocialNav } from '../_nav';
import type { Doc } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export default async function SocialCalendar() {
  const ws = await requireWorkspace();
  const posts = await listWorkspaceSocialPosts(ws.scope);

  const dated: Doc[] = [];
  const unscheduled: Doc[] = [];
  for (const p of posts) (typeof p.plannedDate === 'string' && p.plannedDate ? dated : unscheduled).push(p);
  dated.sort((a, b) => String(a.plannedDate).localeCompare(String(b.plannedDate)));

  const groups = new Map<string, Doc[]>();
  for (const p of dated) {
    const k = String(p.plannedDate);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(p);
  }

  const row = (p: Doc) => (
    <Link key={String(p.id)} href={`/app/social-posts/${p.id}`} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', textDecoration: 'none', color: 'inherit', padding: '6px 0' }}>
      <span className="adm-badge">{SS_CHANNEL_LABELS[String(p.channel)] || String(p.channel)}</span>
      <strong>{String(p.name || '(untitled)')}</strong>
      <span className={`adm-badge ${ssStatusVariant(String(p.status))}`}>{SS_STATUS_LABELS[String(p.status)] || String(p.status)}</span>
      {p.campaignLabel ? <span className="adm-note">#{String(p.campaignLabel)}</span> : null}
    </Link>
  );

  return (
    <>
      <TopBar title="Social Studio — Calendar" sub="Planning dates only. Nothing is posted or scheduled to run on these dates — this is a manual plan." actions={<WsLink href="/app/social-posts/new" primary>New social post</WsLink>} />
      <div className="adm-content">
        <SocialNav active="/app/social-posts/calendar" />
        {dated.length ? (
          [...groups.entries()].map(([date, list]) => (
            <Card key={date}>
              <div className="adm-row" style={{ marginBottom: 4 }}><span className="t">📅 {date}</span><strong>{list.length}</strong></div>
              {list.map(row)}
            </Card>
          ))
        ) : (
          <div className="adm-panel" style={{ marginBottom: 16 }}>No posts have a planned date yet. Add a planned date (YYYY-MM-DD) on a post to place it on the calendar — it’s a manual plan, nothing is scheduled to run.</div>
        )}

        {unscheduled.length ? (
          <Card>
            <div className="adm-row" style={{ marginBottom: 4 }}><span className="t">Unscheduled</span><strong>{unscheduled.length}</strong></div>
            {unscheduled.map(row)}
          </Card>
        ) : null}
      </div>
    </>
  );
}
