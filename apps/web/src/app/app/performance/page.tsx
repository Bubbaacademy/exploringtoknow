import Link from 'next/link';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listWorkspaceEntries, performanceOverview } from '@/lib/performance';
import { syncedProviderOverview, providerPerformanceStatus, type SyncedOverview, type ProviderPerfStatus } from '@/lib/providers';
import {
  PERF_PLATFORM_LABELS, PERF_CHANNEL_LABELS, PERF_STATUS_LABELS, perfStatusVariant,
  PERF_FILTERS, fmtPct, fmtMoney, fmtNum, fmtX, computeMetrics,
} from '@/lib/performance-constants';
import { CONNECTION_STATUS_LABELS, connStatusVariant, type ProviderId } from '@/lib/provider-constants';
import { TopBar, Section, Card, Empty, DataTable, WsLink } from '../_ui';
import { PerfNav, PerfDisclaimer } from './_nav';

export const dynamic = 'force-dynamic';

/** Providers that write to the shared synced_performance_daily schema (read-only sync). */
const SYNC_PROVIDERS: ProviderId[] = ['google_ads', 'meta_ads'];

const fmtTs = (v: string | null): string => {
  if (!v) return '—';
  try { return new Date(v).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'; } catch { return '—'; }
};
const runVariant = (s: string): string => (s === 'succeeded' ? 'ok' : s === 'failed' ? 'err' : s === 'running' ? '' : 'warn');

type Args = { searchParams: Promise<{ source?: string }> };

export default async function PerformanceOverview({ searchParams }: Args) {
  const { source: srcRaw } = await searchParams;
  const source = PERF_FILTERS.some((f) => f.value === srcRaw) ? srcRaw! : 'all';
  const showManual = source === 'all' || source === 'manual';
  const showProvider = (p: string) => source === 'all' || source === p;

  const ws = await requireWorkspace();
  const editable = canWrite(ws.role);

  // Workspace-scoped, parallel. Provider status/overview are sanitized (no tokens/secrets).
  const [entries, o, providerData] = await Promise.all([
    listWorkspaceEntries(ws.scope),
    performanceOverview(ws.scope),
    Promise.all(SYNC_PROVIDERS.map(async (p) => ({
      status: await providerPerformanceStatus(ws.scope, p),
      overview: await syncedProviderOverview(ws.scope, p),
    }))),
  ]);
  const t = o.totals, a = o.averages;

  const stat = (label: string, value: string) => (
    <span key={label} style={{ display: 'flex', flexDirection: 'column' }}>
      <strong style={{ fontSize: 20, lineHeight: 1.1 }}>{value}</strong>
      <span className="adm-note">{label}</span>
    </span>
  );

  const sourceBadge = (label: string, variant = '') => <span className={`adm-badge ${variant}`} style={{ marginLeft: 6 }}>{label}</span>;

  // One provider block: sanitized connection status + api-synced metrics (or an honest empty state).
  function providerBlock({ status: st, overview: ov }: { status: ProviderPerfStatus; overview: SyncedOverview }) {
    if (!st.configured && !st.status) return null; // not set up and never connected → nothing to show here
    const cur = ov.currency || (st.selectedAccount?.currency || 'USD');
    const avg = computeMetrics({ impressions: ov.totals.impressions, clicks: ov.totals.clicks, spend: ov.totals.cost, conversions: ov.totals.conversions, revenue: ov.totals.conversionValue });
    // A 0-row result is only an "honest empty result" when the latest sync SUCCEEDED. If the
    // latest run failed or there's a sanitized last error, it's a blocked/failed sync, not
    // a no-activity result (e.g. Google's DEVELOPER_TOKEN_NOT_APPROVED / Basic Access gate).
    const syncBlocked = st.lastRun?.status === 'failed' || Boolean(st.lastError);
    const devTokenBlocked = /DEVELOPER_TOKEN_NOT_APPROVED/i.test(st.lastError?.message || '');
    return (
      <Section key={st.provider} title={`${st.displayName} — API-synced (read-only)`}
        action={<span>{sourceBadge('api_synced', 'ok')}{sourceBadge(st.provider)}</span>}>
        <Card>
          {/* Connection status (sanitized) */}
          <div className="adm-row"><span className="t">Connection</span>
            <span className={`adm-badge ${connStatusVariant(st.status || 'not_configured')}`}>{CONNECTION_STATUS_LABELS[st.status || 'not_configured'] || (st.configured ? 'Ready to connect' : 'Setup pending')}</span>
          </div>
          {st.selectedAccount ? (
            <div className="adm-row"><span className="t">Selected account</span><strong>{st.selectedAccount.name || st.selectedAccount.id}{st.selectedAccount.id ? ` · ${st.selectedAccount.id}` : ''}{st.selectedAccount.currency ? ` · ${st.selectedAccount.currency}` : ''}</strong></div>
          ) : null}
          <div className="adm-row"><span className="t">Last sync</span><strong>{st.lastSyncAt ? fmtTs(st.lastSyncAt) : (st.connected ? 'Not synced yet' : '—')}</strong></div>
          {st.lastRun ? (
            <div className="adm-row"><span className="t">Latest sync run</span>
              <span><span className={`adm-badge ${runVariant(st.lastRun.status)}`}>{st.lastRun.status}</span>
                <span className="adm-note"> · read {fmtNum(st.lastRun.recordsRead)} · wrote {fmtNum(st.lastRun.recordsWritten)}{st.lastRun.windowStart ? ` · ${st.lastRun.windowStart} → ${st.lastRun.windowEnd}` : ''}</span></span>
            </div>
          ) : null}
          {st.lastError ? (
            <div className="adm-row"><span className="t">Last error</span><span className="adm-note">{st.lastError.code ? `${st.lastError.code} · ` : ''}{st.lastError.message}</span></div>
          ) : null}

          {/* Metrics or honest empty state */}
          {ov.rowCount > 0 ? (
            <>
              <p className="adm-note" style={{ margin: '12px 0 8px' }}>Synced from the {st.displayName} API (<code>api_synced</code>){ov.dateRange ? ` · ${ov.dateRange.min} → ${ov.dateRange.max}` : ''} — kept separate from manual entries and internal landing-page views. Nothing in {st.displayName} is changed.</p>
              <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 8 }}>
                {stat('Impressions', fmtNum(ov.totals.impressions))}
                {stat('Clicks', fmtNum(ov.totals.clicks))}
                {stat('Cost', fmtMoney(ov.totals.cost, cur))}
                {stat('Conversions', fmtNum(ov.totals.conversions))}
                {stat('Conv. value', fmtMoney(ov.totals.conversionValue, cur))}
                {stat('CTR', fmtPct(avg.ctr))}
                {stat('CPC', fmtMoney(avg.cpc, cur))}
                {stat('ROAS', fmtX(avg.roas))}
              </div>
              {ov.topCampaigns.length ? (
                <DataTable head={['Campaign', 'Clicks', 'Cost', 'Conv.', 'Conv. value', 'ROAS']}
                  rows={ov.topCampaigns.map((c) => [c.name, fmtNum(c.clicks), fmtMoney(c.cost, cur), fmtNum(c.conversions), fmtMoney(c.conversionValue, cur), fmtX(c.roas)])} empty="No campaigns." />
              ) : null}
            </>
          ) : st.connected && syncBlocked ? (
            <div className="adm-panel warn" style={{ marginTop: 12 }}>
              <strong>Connected, but sync is blocked by provider/API access approval.</strong> The account is connected{st.selectedAccount ? ` and selected (${st.selectedAccount.name || st.selectedAccount.id})` : ''}, but the latest sync run {st.lastRun?.status === 'failed' ? 'failed' : 'did not complete'} — no rows were written. This is a provider/API access issue, <strong>not</strong> a no-activity result.
              {devTokenBlocked ? (
                <> {st.displayName} returned <code>DEVELOPER_TOKEN_NOT_APPROVED</code>: real report sync requires <strong>Basic Access</strong> approval for the developer token (submitted, pending with the provider). The account stays connected and selected; data will sync once access is approved.</>
              ) : (
                <> See the sanitized reason in <strong>Last error</strong> above.</>
              )}
            </div>
          ) : st.connected ? (
            <div className="adm-panel" style={{ marginTop: 12 }}>
              <strong>Connected — no rows for the synced window yet.</strong> {st.selectedAccount ? `The selected account (${st.selectedAccount.name || st.selectedAccount.id}) ` : 'The selected account '}
              returned no data{st.lastRun?.windowStart ? ` for ${st.lastRun.windowStart} → ${st.lastRun.windowEnd}` : ''}. This usually means there was
              <strong> no ad activity or spend</strong> in that period — it’s an honest empty result, <strong>not an error</strong>. Metrics will appear
              here automatically once the account has activity and a sync runs. {editable ? <>Run a sync from <Link href={`/app/provider-connections/${st.provider}`}>Connections</Link>.</> : null}
            </div>
          ) : st.configured ? (
            <p className="adm-note" style={{ marginTop: 12 }}>Not connected yet. {editable ? <>Connect your own {st.displayName} account in <Link href={`/app/provider-connections/${st.provider}`}>Connections</Link> (read-only) to add API-synced metrics.</> : <>An owner or admin can connect it in Connections.</>}</p>
          ) : (
            <p className="adm-note" style={{ marginTop: 12 }}>{st.displayName} platform setup is pending — ExploringToKnow is finishing this provider’s API setup.</p>
          )}
        </Card>
      </Section>
    );
  }

  return (
    <>
      <TopBar
        title="Performance"
        sub="Unified — manual entries plus read-only API-synced metrics from connected providers, each labeled by source."
        actions={editable ? <><WsLink href="/app/performance/import">Import CSV</WsLink><WsLink href="/app/performance/new" primary>New entry</WsLink></> : undefined}
      />
      <div className="adm-content">
        <PerfNav active="/app/performance" />
        <PerfDisclaimer />

        {/* Source filter */}
        <nav aria-label="Filter by source" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {PERF_FILTERS.map((f) => (
            <Link key={f.value} href={f.value === 'all' ? '/app/performance' : `/app/performance?source=${f.value}`}
              className={`adm-btn${f.value === source ? '' : ' ghost'}`} aria-current={f.value === source ? 'page' : undefined}>{f.label}</Link>
          ))}
        </nav>

        <div className="adm-panel" style={{ marginBottom: 16 }}>
          <strong>Every number is labeled by source.</strong> <code>manual_import</code> (your entries, unverified) ·
          {' '}<code>api_synced</code> (read-only from a connected provider — Google Ads / Meta Ads) ·
          {' '}<code>internal</code> (first-party landing-page views). API-synced data is the long-term source of truth;
          manual import is the fallback / onboarding layer.
        </div>

        {/* Per-provider API-synced sections (sanitized status + metrics / honest empty state) */}
        {providerData.filter((d) => showProvider(d.status.provider)).map((d) => providerBlock(d))}

        {showManual ? (
          <>
            <Section title="Manual / imported — totals" action={sourceBadge('manual_import', 'warn')}>
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

            <Section title="Calculated averages (manual)">
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
              <Section title="Top campaigns — manual (by clicks)">
                <Card>
                  <DataTable head={['Campaign', 'Clicks', 'Spend', 'Revenue', 'ROAS']}
                    rows={o.topCampaigns.map((c) => [c.label, fmtNum(c.clicks), fmtMoney(c.spend), fmtMoney(c.revenue), fmtX(c.roas)])} empty="No campaign data yet." />
                </Card>
              </Section>
            ) : null}

            <Section title="Landing pages (internal views)">
              <Card>
                <p className="adm-note" style={{ marginBottom: 8 }}>
                  Internal landing-page views (Phase 24, real first-party tracking): <strong>{fmtNum(o.lpViewTotal)}</strong>.
                  Kept <strong>separate</strong> from manual ad clicks/spend and from provider API metrics — they are not the same thing.
                </p>
                {o.lpEntries.length ? (
                  <DataTable head={['Landing page', 'Manual clicks', 'Spend', 'Revenue', 'ROAS']}
                    rows={o.lpEntries.map((c) => [c.label, fmtNum(c.clicks), fmtMoney(c.spend), fmtMoney(c.revenue), fmtX(c.roas)])} empty="No landing-page performance entries yet." />
                ) : <p className="adm-note">No manual landing-page performance entries yet.</p>}
              </Card>
            </Section>

            <Section title="Entries (manual)">
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
                <Empty>No manual performance entries yet. {editable ? <>Add one manually or import a CSV — this is the fallback layer; connected providers sync automatically.</> : <>An owner, admin, or editor can add data.</>}</Empty>
              )}
            </Section>
          </>
        ) : null}
      </div>
    </>
  );
}
