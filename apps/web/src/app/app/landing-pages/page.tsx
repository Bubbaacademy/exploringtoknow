import Link from 'next/link';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listWorkspaceLandingPages, landingViewTotals, listProductOptions, listRequestOptions } from '@/lib/landing';
import { getBrandProfile } from '@/lib/brandkit';
import { LP_STATUS_LABELS, LP_PAGE_TYPE_LABELS, lpStatusVariant } from '@/lib/landing-constants';
import { TopBar, Section, Card, Empty, DataTable, WsLink, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

const refId = (v: unknown): string => (v == null ? '' : String(typeof v === 'object' ? (v as { id?: unknown }).id : v));

export default async function LandingPagesList() {
  const ws = await requireWorkspace();
  const editable = canWrite(ws.role);
  const [pages, brand, totals, products, requests] = await Promise.all([
    listWorkspaceLandingPages(ws.scope), getBrandProfile(ws.scope), landingViewTotals(ws.scope),
    listProductOptions(ws.scope), listRequestOptions(ws.scope),
  ]);
  const pMap = new Map(products.map((p) => [String(p.id), p.label]));
  const rMap = new Map(requests.map((r) => [String(r.id), r.label]));
  const related = (p: Record<string, unknown>): string => {
    const pid = refId(p.relatedProduct); if (pid && pMap.has(pid)) return `Product: ${pMap.get(pid)}`;
    const rid = refId(p.relatedRequest); if (rid && rMap.has(rid)) return `Request: ${rMap.get(rid)}`;
    return '—';
  };

  return (
    <>
      <TopBar
        title="Offer Pages"
        sub="Offer and campaign landing pages — the tracking destinations for campaigns. Reviewed and published manually; nothing is generated or published automatically."
        actions={editable ? <WsLink href="/app/landing-pages/new" primary>New landing page</WsLink> : undefined}
      />
      <div className="adm-content">
        {!brand ? (
          <div className="adm-panel" style={{ marginBottom: 16 }}>
            Tip: set up your <Link href="/app/brand">Brand Kit</Link> first — offer pages use your brand voice, colors, and disclosure notes.
          </div>
        ) : null}

        <Section title="Your offer pages">
          {pages.length ? (
            <Card>
              <DataTable
                head={['Title', 'Status', 'Purpose', 'Related', 'Views', 'Updated', '']}
                rows={pages.map((p) => [
                  <span key="t">{(p.title as string) || '(untitled)'}{p.slug ? <span className="adm-note"> · /{String(p.slug)}</span> : null}</span>,
                  <span key="s" className={`adm-badge ${lpStatusVariant(String(p.status))}`}>{LP_STATUS_LABELS[String(p.status)] || String(p.status)}</span>,
                  LP_PAGE_TYPE_LABELS[String(p.pageType)] || String(p.pageType),
                  related(p),
                  String(totals[String(p.id)] || 0),
                  fmtDate(p.updatedAt),
                  <Link key="e" href={`/app/landing-pages/${p.id}`}>{editable ? 'Edit' : 'View'}</Link>,
                ])}
                empty="No offer pages yet."
              />
            </Card>
          ) : (
            <Empty>
              No offer pages yet. {editable ? <>Create your first one — it starts as a private draft.</> : <>An owner, admin, or editor can create one.</>}
            </Empty>
          )}
        </Section>
      </div>
    </>
  );
}
