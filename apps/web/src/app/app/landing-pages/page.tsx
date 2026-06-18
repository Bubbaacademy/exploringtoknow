import Link from 'next/link';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listWorkspaceLandingPages } from '@/lib/landing';
import { getBrandProfile } from '@/lib/brandkit';
import { LP_STATUS_LABELS, LP_PAGE_TYPE_LABELS, lpStatusVariant } from '@/lib/landing-constants';
import { TopBar, Section, Card, Empty, DataTable, WsLink, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function LandingPagesList() {
  const ws = await requireWorkspace();
  const editable = canWrite(ws.role);
  const [pages, brand] = await Promise.all([listWorkspaceLandingPages(ws.scope), getBrandProfile(ws.scope)]);

  return (
    <>
      <TopBar
        title="Landing Pages"
        sub="Reviewed and published manually — nothing is generated or published automatically."
        actions={editable ? <WsLink href="/app/landing-pages/new" primary>New landing page</WsLink> : undefined}
      />
      <div className="adm-content">
        {!brand ? (
          <div className="adm-panel" style={{ marginBottom: 16 }}>
            Tip: set up your <Link href="/app/brand">Brand Kit</Link> first — landing pages use your brand voice, colors, and disclosure notes.
          </div>
        ) : null}

        <Section title="Your landing pages">
          {pages.length ? (
            <Card>
              <DataTable
                head={['Title', 'Status', 'Purpose', 'Updated', '']}
                rows={pages.map((p) => [
                  <span key="t">{(p.title as string) || '(untitled)'}{p.slug ? <span className="adm-note"> · /{String(p.slug)}</span> : null}</span>,
                  <span key="s" className={`adm-badge ${lpStatusVariant(String(p.status))}`}>{LP_STATUS_LABELS[String(p.status)] || String(p.status)}</span>,
                  LP_PAGE_TYPE_LABELS[String(p.pageType)] || String(p.pageType),
                  fmtDate(p.updatedAt),
                  <Link key="e" href={`/app/landing-pages/${p.id}`}>{editable ? 'Edit' : 'View'}</Link>,
                ])}
                empty="No landing pages yet."
              />
            </Card>
          ) : (
            <Empty>
              No landing pages yet. {editable ? <>Create your first one — it starts as a private draft.</> : <>An owner, admin, or editor can create one.</>}
            </Empty>
          )}
        </Section>
      </div>
    </>
  );
}
