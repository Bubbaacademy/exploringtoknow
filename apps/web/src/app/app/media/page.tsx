import { requireWorkspace, wsList } from '@/lib/workspace';
import { TopBar, Card, DataTable, ComingSoon, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const ws = await requireWorkspace();
  const docs = await wsList(ws.scope, 'media', { sort: '-createdAt', limit: 100 });
  const rows = docs.map((m) => [
    (m.alt as string) || '(no alt text)',
    String(m.filename ?? '—'),
    String(m.source ?? '—'),
    fmtDate(m.createdAt),
  ]);
  return (
    <>
      <TopBar title="Media" sub="Images in your workspace. Listing is scoped to you; uploads stay private to your workspace." />
      <div className="adm-content">
        <div style={{ marginBottom: 16 }}>
          <ComingSoon>Direct media upload is coming next. Images are added with offer submissions, with permission confirmation — no AI-generated imagery.</ComingSoon>
        </div>
        <Card title={`${docs.length} image${docs.length === 1 ? '' : 's'}`}>
          <DataTable head={['Alt text', 'Filename', 'Source', 'Added']} rows={rows} empty="No media yet. Images are added with your product submissions." />
        </Card>
      </div>
    </>
  );
}
