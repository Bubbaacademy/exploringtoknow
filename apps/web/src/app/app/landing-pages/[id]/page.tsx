import { notFound } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceLandingPage } from '@/lib/landing';
import { LP_STATUS_LABELS, LP_PAGE_TYPE_LABELS, lpStatusVariant } from '@/lib/landing-constants';
import { TopBar, Card, WsLink } from '../../_ui';
import { LandingPageEditor } from '@/components/app/LandingPageEditor';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ id: string }> };

export default async function EditLandingPage({ params }: Args) {
  const { id } = await params;
  const ws = await requireWorkspace();
  const doc = await getWorkspaceLandingPage(ws.scope, id);
  if (!doc) notFound();
  const d = doc!;
  const editable = canWrite(ws.role);
  const wsSlug = (ws.workspace?.slug as string) || undefined;

  const page = {
    id: d.id as string | number,
    title: (d.title as string) || '', slug: (d.slug as string) || '', status: String(d.status || 'draft'),
    pageType: String(d.pageType || 'general'), headline: (d.headline as string) || '', subheadline: (d.subheadline as string) || '',
    body: (d.body as string) || '', ctaLabel: (d.ctaLabel as string) || '', ctaUrl: (d.ctaUrl as string) || '',
    disclosureText: (d.disclosureText as string) || '', seoTitle: (d.seoTitle as string) || '', seoDescription: (d.seoDescription as string) || '',
    noindex: d.noindex !== false, publishedAt: (d.publishedAt as string) || '',
  };

  return (
    <>
      <TopBar
        title={page.title || 'Landing page'}
        sub={<>Status: {LP_STATUS_LABELS[page.status] || page.status} · {LP_PAGE_TYPE_LABELS[page.pageType] || page.pageType}</>}
        actions={<WsLink href="/app/landing-pages">Back to list</WsLink>}
      />
      <div className="adm-content">
        {editable ? (
          <LandingPageEditor page={page} workspaceSlug={wsSlug} />
        ) : (
          <Card>
            <div className="adm-row"><span className="t">Status</span><span className={`adm-badge ${lpStatusVariant(page.status)}`}>{LP_STATUS_LABELS[page.status] || page.status}</span></div>
            <div className="adm-row"><span className="t">Headline</span><strong>{page.headline || '—'}</strong></div>
            <div className="adm-row"><span className="t">Body</span><span style={{ whiteSpace: 'pre-wrap' }}>{page.body || '—'}</span></div>
            <div className="adm-row"><span className="t">CTA</span><span>{page.ctaLabel || '—'} {page.ctaUrl ? <a href={page.ctaUrl} target="_blank" rel="noreferrer noopener">{page.ctaUrl}</a> : null}</span></div>
            <p className="adm-note" style={{ marginTop: 8 }}>Your role has read-only access. Ask an owner, admin, or editor to make changes.</p>
          </Card>
        )}
      </div>
    </>
  );
}
