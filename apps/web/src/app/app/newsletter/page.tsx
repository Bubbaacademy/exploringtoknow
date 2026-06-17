import { requireWorkspace, wsList } from '@/lib/workspace';
import { TopBar, Card, DataTable, StatusBadge, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function NewsletterPage() {
  const ws = await requireWorkspace();
  const docs = await wsList(ws.scope, 'newsletter-subscribers', { sort: '-createdAt', limit: 200 });
  const rows = docs.map((s) => [
    String(s.email ?? '—'),
    <StatusBadge key="s" status={String(s.status)} />,
    String(s.source ?? '—'),
    fmtDate(s.createdAt),
  ]);
  return (
    <>
      <TopBar title="Newsletter" sub="Subscribers for your workspace. Sign-ups are captured safely; no email is sent until a provider is configured." />
      <div className="adm-content">
        <Card title={`${docs.length} subscriber${docs.length === 1 ? '' : 's'}`}>
          <DataTable head={['Email', 'Status', 'Source', 'Joined']} rows={rows} empty="No subscribers yet. A sign-up block appears on your published pages." />
        </Card>
      </div>
    </>
  );
}
