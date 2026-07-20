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
      <TopBar title="Media" sub="Images available to the magazine. An article's hero image is set on the article itself in Payload /admin." />
      <div className="adm-content">
        <div style={{ marginBottom: 16 }}>
          <ComingSoon>Direct upload from this console is coming next; images are uploaded in Payload <b>/admin</b> today. Every image is a real photograph used with permission — no AI-generated product imagery. Alt text is required for accessibility and is worth filling in before an article goes live.</ComingSoon>
        </div>
        <Card title={`${docs.length} image${docs.length === 1 ? '' : 's'}`}>
          <DataTable
            head={['Alt text', 'Filename', 'Source', 'Added']}
            rows={rows}
            empty="No media yet. Images are uploaded in Payload /admin, or arrive with a product submission."
          />
        </Card>
      </div>
    </>
  );
}
