import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@payload-config';
import { requireWorkspace } from '@/lib/workspace';
import { TopBar, Section, Card, StatusBadge, fmtDate, refName } from '../../_ui';

export const dynamic = 'force-dynamic';

const refId = (v: unknown) => (v == null ? null : typeof v === 'object' ? (v as { id?: unknown }).id : v);

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ws = await requireWorkspace();
  const { id } = await params;
  const payload = await getPayload({ config });
  let doc: Record<string, any> | null = null;
  try { doc = (await payload.findByID({ collection: 'product-requests', id, depth: 1, overrideAccess: true })) as Record<string, any>; } catch { doc = null; }
  // Server-side ownership check — never expose another tenant's request.
  if (!doc || String(refId(doc.tenant)) !== String(ws.scope.tenantId)) notFound();

  const images = Array.isArray(doc.productImages) ? doc.productImages : [];
  const row = (label: string, value: ReactNode) => (<div className="adm-row"><span className="t">{label}</span><strong>{value}</strong></div>);

  return (
    <>
      <TopBar title={(doc.productName as string) || 'Seller submission'} sub={<>Status: <StatusBadge status={String(doc.status)} /> · submitted {fmtDate(doc.submittedAt || doc.createdAt)}</>} />
      <div className="adm-content">
        <Section title="Request details">
          <Card>
            {row('Product', String(doc.productName ?? '—'))}
            {row('Brand', String(doc.brand ?? '—'))}
            {row('Product URL', doc.productUrl ? <a href={String(doc.productUrl)} target="_blank" rel="noopener noreferrer nofollow">{String(doc.productUrl)}</a> : '—')}
            {row('Category', refName(doc.requestedCategory))}
            {doc.suggestedCategory ? row('Suggested category', String(doc.suggestedCategory)) : null}
            {row('Images', `${images.length} attached`)}
            {row('Image permission', doc.imagePermissionConfirmed ? 'confirmed' : 'not confirmed')}
            {doc.notes ? row('Notes', String(doc.notes)) : null}
          </Card>
        </Section>
        <Section title="What happens next">
          <div className="adm-panel">An editor reviews this request, then it moves through product → researched brief → article draft → your review → published. You’ll see status updates here. Nothing is generated or published without review.</div>
        </Section>
      </div>
    </>
  );
}
