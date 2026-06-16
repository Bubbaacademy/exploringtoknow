import Link from 'next/link';
import { getAdminOverview, listMostReadArticles, listTrendingArticles, type Doc } from '@/lib/public';

export const dynamic = 'force-dynamic';

// Internal editorial overview (auth enforced in middleware). Admin-only; no public data.
export default async function DashboardHome() {
  const { counts, recentContacts, recentRequests } = await getAdminOverview();
  const real = await listMostReadArticles(30, 5);
  const topViewed = real.length ? real : await listTrendingArticles(5);
  const topReal = real.length > 0;
  const c = (k: string): number => counts[k] ?? 0;

  const card: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: '#fff' };
  const stat: React.CSSProperties = { ...card, background: '#f9fafb' };
  const big: React.CSSProperties = { fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' };
  const lbl: React.CSSProperties = { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em' };
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 12, margin: '12px 0 24px' };
  const row: React.CSSProperties = { padding: '4px 0', display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f3f4f6' };

  const STATS: Array<[string, number]> = [
    ['Published', c('published')], ['Ready for review', c('review')], ['Drafts', c('drafts')],
    ['Requests waiting', c('requestsOpen')], ['Requests approved', c('requestsApproved')], ['Requests processing', c('requestsProcessing')],
    ['Runs ok', c('runsPublished')], ['Runs flagged', c('runsFlagged')], ['Runs failed', c('runsFailed')], ['Runs running', c('runsRunning')],
    ['New contacts', c('contactsNew')], ['Active subs', c('subsActive')], ['Total views', c('totalViews')],
  ];
  const WARN_ALL: Array<[string, number]> = [
    ['Published without category', c('warnPubNoCategory')],
    ['Published without author', c('warnPubNoAuthor')],
    ['Published without hero image', c('warnPubNoHero')],
    ['Ready-for-review without category (blocks publish)', c('warnReviewNoCategory')],
  ];
  const WARN = WARN_ALL.filter(([, n]) => n > 0);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Editorial overview</h1>
      <p style={{ color: '#6b7280', marginTop: 4 }}>
        Pipeline: Product Request → (manual approve) → Product → Intelligence/Brief → Article (lands at <strong>ready_for_review</strong>) → an editor sets <strong>editorialStatus=published</strong>. Nothing publishes automatically.
      </p>

      <div style={grid}>
        {STATS.map(([label, n]) => (
          <div key={label} style={stat}><div style={big}>{n}</div><div style={lbl}>{label}</div></div>
        ))}
      </div>

      {WARN.length ? (
        <div style={{ ...card, borderColor: '#f5c6c2', background: '#fef2f2', marginBottom: 24 }}>
          <strong style={{ color: '#b42318' }}>Pipeline warnings</strong>
          {WARN.map(([label, n]) => (
            <div key={label} style={{ ...row, borderColor: '#f7d7d4' }}><span>{label}</span><strong>{n}</strong></div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#066d3a', fontSize: 13, marginBottom: 24 }}>No pipeline warnings — published articles have category, author, and hero image.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 16 }}>
        <div style={card}>
          <h2 style={{ fontSize: 15, marginTop: 0 }}>{topReal ? 'Top viewed (last 30 days)' : 'Editor’s picks (no view data yet)'}</h2>
          {topViewed.length ? topViewed.map((a: Doc) => (
            <div key={String(a.id)} style={row}><span>{a.title as string}</span><span style={{ color: '#6b7280' }}>{a.editorialStatus as string}</span></div>
          )) : <p style={{ color: '#6b7280', fontSize: 13 }}>No published articles yet.</p>}
        </div>
        <div style={card}>
          <h2 style={{ fontSize: 15, marginTop: 0 }}>Recent product requests</h2>
          {recentRequests.length ? recentRequests.map((r: Doc) => (
            <div key={String(r.id)} style={row}><span>{(r.productName as string) || '(untitled)'}</span><strong>{r.status as string}</strong></div>
          )) : <p style={{ color: '#6b7280', fontSize: 13 }}>None yet.</p>}
        </div>
        <div style={card}>
          <h2 style={{ fontSize: 15, marginTop: 0 }}>Recent contact messages</h2>
          {recentContacts.length ? recentContacts.map((m: Doc) => (
            <div key={String(m.id)} style={row}><span>{(m.reason as string) || 'general'} · {m.email as string}</span><strong>{m.status as string}</strong></div>
          )) : <p style={{ color: '#6b7280', fontSize: 13 }}>None yet.</p>}
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 13 }}>
        <Link href="/dashboard/analytics">Analytics →</Link> &nbsp;·&nbsp; <Link href="/dashboard/health">System Health →</Link> &nbsp;·&nbsp; <Link href="/admin">Payload admin →</Link>
      </p>
    </div>
  );
}
