import { requireWorkspace, wsList } from '@/lib/workspace';
import { TopBar, Card, DataTable, StatusBadge, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const ws = await requireWorkspace();
  const docs = await wsList(ws.scope, 'contact-messages', { sort: '-createdAt', limit: 200 });
  const rows = docs.map((m) => [
    (m.subject as string) || (m.reason as string) || 'message',
    String(m.email ?? '—'),
    <StatusBadge key="s" status={String(m.status)} />,
    fmtDate(m.createdAt),
  ]);
  return (
    <>
      <TopBar title="Contact inbox" sub="Messages from your audience, scoped to your workspace." />
      <div className="adm-content">
        <Card title={`${docs.length} message${docs.length === 1 ? '' : 's'}`}>
          <DataTable head={['Subject', 'From', 'Status', 'Received']} rows={rows} empty="No messages yet. A contact form appears on your published site." />
        </Card>
      </div>
    </>
  );
}
