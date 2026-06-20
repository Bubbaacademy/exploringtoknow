import Link from 'next/link';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listWorkspaceCampaigns } from '@/lib/ads';
import { listProductOptions, listRequestOptions } from '@/lib/landing';
import { getBrandProfile } from '@/lib/brandkit';
import { AD_PLATFORM_LABELS, AD_OBJECTIVE_LABELS, AD_STATUS_LABELS, adStatusVariant } from '@/lib/ads-constants';
import { TopBar, Section, Card, Empty, DataTable, WsLink, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

const refId = (v: unknown): string => (v == null ? '' : String(typeof v === 'object' ? (v as { id?: unknown }).id : v));

export default async function AdsList() {
  const ws = await requireWorkspace();
  const editable = canWrite(ws.role);
  const [campaigns, brand, products, requests] = await Promise.all([
    listWorkspaceCampaigns(ws.scope), getBrandProfile(ws.scope), listProductOptions(ws.scope), listRequestOptions(ws.scope),
  ]);
  const pMap = new Map(products.map((p) => [String(p.id), p.label]));
  const rMap = new Map(requests.map((r) => [String(r.id), r.label]));
  const related = (c: Record<string, unknown>): string => {
    const pid = refId(c.relatedProduct); if (pid && pMap.has(pid)) return `Product: ${pMap.get(pid)}`;
    const rid = refId(c.relatedRequest); if (rid && rMap.has(rid)) return `Request: ${rMap.get(rid)}`;
    if (refId(c.relatedLandingPage)) return 'Landing page';
    return '—';
  };

  return (
    <>
      <TopBar
        title="Ads Studio"
        sub="Manual ad planning only. Nothing launches automatically — no ad accounts are connected."
        actions={editable ? <WsLink href="/app/ads/new" primary>New campaign</WsLink> : undefined}
      />
      <div className="adm-content">
        <div className="adm-panel" style={{ marginBottom: 16 }}>Plan and export ad drafts manually. <strong>No ad accounts are connected yet</strong> — export copy for manual setup in your Ads Manager. Budget notes are planning notes only, not real spend.</div>
        {!brand ? (
          <div className="adm-panel" style={{ marginBottom: 16 }}>Tip: set up your <Link href="/app/brand">Brand Kit</Link> first — Ads Studio uses your brand voice, audience, and disclosure notes as helper context.</div>
        ) : null}

        <Section title="Your ad campaigns">
          {campaigns.length ? (
            <Card>
              <DataTable
                head={['Name', 'Platform', 'Objective', 'Status', 'Related', 'Exported', 'Updated', '']}
                rows={campaigns.map((c) => [
                  <span key="n">{(c.name as string) || '(untitled)'}</span>,
                  <span key="p" className="adm-badge">{AD_PLATFORM_LABELS[String(c.platform)] || String(c.platform)}</span>,
                  AD_OBJECTIVE_LABELS[String(c.objective)] || String(c.objective),
                  <span key="s" className={`adm-badge ${adStatusVariant(String(c.status))}`}>{AD_STATUS_LABELS[String(c.status)] || String(c.status)}</span>,
                  related(c),
                  String(c.exportCount || 0),
                  fmtDate(c.updatedAt),
                  <Link key="e" href={`/app/ads/${c.id}`}>{editable ? 'Edit' : 'View'}</Link>,
                ])}
                empty="No campaigns yet."
              />
            </Card>
          ) : (
            <Empty>
              No ad campaigns yet. {editable
                ? <>Create your first campaign draft — plan and export it manually. Nothing launches or spends automatically.</>
                : <>An owner, admin, or editor can create one.</>}
            </Empty>
          )}
        </Section>
      </div>
    </>
  );
}
