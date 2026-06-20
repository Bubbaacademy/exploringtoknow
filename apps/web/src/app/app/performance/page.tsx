import Link from 'next/link';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listWorkspaceEntries, performanceOverview } from '@/lib/performance';
import { syncedGoogleAdsOverview } from '@/lib/providers';
import { PERF_PLATFORM_LABELS, PERF_CHANNEL_LABELS, PERF_STATUS_LABELS, perfStatusVariant, fmtPct, fmtMoney, fmtNum, fmtX } from '@/lib/performance-constants';
import { computeMetrics } from '@/lib/performance-constants';
import { TopBar, Section, Card, Empty, DataTable, WsLink, fmtDate } from '../_ui';
import { PerfNav, PerfDisclaimer } from './_nav';

export const dynamic = 'force-dynamic';

export default async function PerformanceOverview() {
  const ws = await requireWorkspace();
  const editable = canWrite(ws.role);
  const [entries, o, gads] = await Promise.all([listWorkspaceEntries(ws.scope), performanceOverview(ws.scope), syncedGoogleAdsOverview(ws.scope)]);
  const t = o.totals, a = o.averages;
  const gAvg = computeMetrics({ impressions: gads.totals.impressions, clicks: gads.totals.clicks, spend: gads.totals.cost, conversions: gads.totals.conversions, revenue: gads.totals.conversionValue });

  const stat = (label: string, value: string) => (
    <span key={label} style={{ display: 'flex', flexDirection: 'column' }}>
      <strong style={{ fontSize: 20, lineHeight: 1.1 }}>{value}</strong>
      <span className="adm-note">{label}</span>
    </span>
  );

  return (
    <>
      <TopBar
        title="Performance"
        sub="Manual measurement — calculated from entered/imported data. Nothing is synced automatically."
        actions={editable ? <><WsLink href="/app/performance/import">Import CSV</WsLink><WsLink href="/app/performance/new" primary>New entry</WsLink></> : undefined}
      />
      <div className="adm-content">
        <PerfNav active="/app/performance" />
        <PerfDisclaimer />

        <div className="adm-panel" style={{ marginBottom: 16 }}>
          <strong>Data sources are labeled and kept separate:</strong> <code>manual / imported</code> (your entries, unverified) ·
          <code>api-synced</code> (from a connected provider, e.g. Google Ads) · <code>internal</code> (first-party landing-page views).
          {gads.rowCount ? null : <> Connect Google Ads in <a href="/app/provider-connections/google_ads">Connections</a> to add API-synced metrics (read-only).</>}
        </div>

        {gads.rowCount ? (
          <Section title="Google Ads — API-synced (read-only)">
            <Card>
              <p className="adm-note" style={{ marginBottom: 8 }}>Synced from the Google Ads API (<code>api_synced</code>) — kept separate from manual entries and from internal landing-page views. Nothing in Google Ads is changed.</p>
              <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 8 }}>
                {stat('Impressions', fmtNum(gads.totals.impressions))}
                {stat('Clicks', fmtNum(gads.totals.clicks))}
                {stat('Cost', fmtMoney(gads.totals.cost, gads.currency || 'USD'))}
                {stat('Conversions', fmtNum(gads.totals.conversions))}
                {stat('Conv. value', fmtMoney(gads.totals.conversionValue, gads.currency || 'USD'))}
                {stat('CTR', fmtPct(gAvg.ctr))}
                {stat('CPC', fmtMoney(gAvg.cpc, gads.currency || 'USD'))}
                {stat('ROAS', fmtX(gAvg.roas))}
              </div>
              {gads.topCampaigns.length ? (
                <DataTable head={['Campaign', 'Clicks', 'Cost', 'Conv.', 'Conv. value', 'ROAS']}
                  rows={gads.topCampaigns.map((c) => [c.name, fmtNum(c.clicks), fmtMoney(c.cost, gads.currency || 'USD'), fmtNum(c.conversions), fmtMoney(c.conversionValue, gads.currency || 'USD'), fmtX(c.roas)])} empty="No campaigns." />
              ) : null}
            </Card>
          </Section>
        ) : null}

        <Section title="Manual / imported — totals">
          <Card>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              {stat('Impressions', fmtNum(t.impressions))}
              {stat('Clicks', fmtNum(t.clicks))}
              {stat('Spend', fmtMoney(t.spend))}
              {stat('Conversions', fmtNum(t.conversions))}
              {stat('Leads', fmtNum(t.leads))}
              {stat('Revenue', fmtMoney(t.revenue))}
            </div>
          </Card>
        </Section>

        <Section title="Calculated averages">
          <Card>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              {stat('CTR', fmtPct(a.ctr))}
              {stat('CPC', fmtMoney(a.cpc))}
              {stat('CPM', fmtMoney(a.cpm))}
              {stat('Conv. rate', fmtPct(a.convRate))}
              {stat('CPA', fmtMoney(a.cpa))}
              {stat('ROAS', fmtX(a.roas))}
              {stat('Rev / click', fmtMoney(a.rpc))}
            </div>
            <p className="adm-note" style={{ marginTop: 10 }}>Calculated from manually entered/imported data. “—” means there isn’t enough data to compute (e.g. zero clicks or spend). No numbers are invented.</p>
          </Card>
        </Section>

        {o.topCampaigns.length ? (
          <Section title="Top campaigns (by clicks)">
            <Card>
              <DataTable head={['Campaign', 'Clicks', 'Spend', 'Revenue', 'ROAS']}
                rows={o.topCampaigns.map((c) => [c.label, fmtNum(c.clicks), fmtMoney(c.spend), fmtMoney(c.revenue), fmtX(c.roas)])} empty="No campaign data yet." />
            </Card>
          </Section>
        ) : null}

        <Section title="Landing pages">
          <Card>
            <p className="adm-note" style={{ marginBottom: 8 }}>
              Internal landing-page views (Phase 24, real first-party tracking): <strong>{fmtNum(o.lpViewTotal)}</strong>.
              These are kept <strong>separate</strong> from manual ad clicks/spend below — they are not the same thing.
            </p>
            {o.lpEntries.length ? (
              <DataTable head={['Landing page', 'Manual clicks', 'Spend', 'Revenue', 'ROAS']}
                rows={o.lpEntries.map((c) => [c.label, fmtNum(c.clicks), fmtMoney(c.spend), fmtMoney(c.revenue), fmtX(c.roas)])} empty="No landing-page performance entries yet." />
            ) : <p className="adm-note">No manual landing-page performance entries yet.</p>}
          </Card>
        </Section>

        <Section title="Entries">
          {entries.length ? (
            <Card>
              <DataTable
                head={['Date', 'Platform', 'Channel', 'Campaign', 'Impr.', 'Clicks', 'Spend', 'Rev.', 'Status', '']}
                rows={entries.map((e) => [
                  (e.entryDate as string) || '—',
                  PERF_PLATFORM_LABELS[String(e.platform)] || String(e.platform),
                  PERF_CHANNEL_LABELS[String(e.channelType)] || String(e.channelType),
                  (e.campaignName as string) || '—',
                  fmtNum(Number(e.impressions || 0)), fmtNum(Number(e.clicks || 0)), fmtMoney(Number(e.spend || 0)), fmtMoney(Number(e.revenue || 0)),
                  <span key="s" className={`adm-badge ${perfStatusVariant(String(e.status))}`}>{PERF_STATUS_LABELS[String(e.status)] || String(e.status)}</span>,
                  <Link key="e" href={`/app/performance/${e.id}`}>{editable ? 'Edit' : 'View'}</Link>,
                ])}
                empty="No entries yet."
              />
            </Card>
          ) : (
            <Empty>No performance entries yet. {editable ? <>Add one manually or import a CSV — nothing is synced from platforms.</> : <>An owner, admin, or editor can add data.</>}</Empty>
          )}
        </Section>
      </div>
    </>
  );
}
