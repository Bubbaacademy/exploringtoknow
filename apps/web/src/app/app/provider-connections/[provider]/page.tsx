import { notFound } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { providerSetup, connectionForProvider, sanitizeConnection, listProviderAccounts } from '@/lib/providers';
import { PROVIDER_BY_ID, isProviderId, CONNECTION_STATUS_LABELS, connStatusVariant } from '@/lib/provider-constants';
import { TopBar, Card, WsLink } from '../../_ui';
import { ProviderConnectionControls } from '@/components/app/ProviderConnectionControls';
import { GoogleAdsSyncPanel } from '@/components/app/GoogleAdsSyncPanel';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ provider: string }>; searchParams: Promise<{ connected?: string; error?: string }> };

export default async function ProviderDetail({ params, searchParams }: Args) {
  const { provider } = await params;
  const { connected, error } = await searchParams;
  if (!isProviderId(provider)) notFound();
  const def = PROVIDER_BY_ID[provider]!;
  const ws = await requireWorkspace();
  const canManage = canManageConnections(ws.role);
  const setup = providerSetup(def);
  const raw = await connectionForProvider(ws.scope, def.id);
  const connection = raw ? sanitizeConnection(raw) : null;
  const recordStatus = connection ? String(connection.status) : null;
  const effectiveStatus = recordStatus && recordStatus !== 'not_configured' ? recordStatus : setup.setupStatus;
  const isConnected = recordStatus === 'connected';
  const accountsRaw = (def.id === 'google_ads' && connection) ? await listProviderAccounts(ws.scope, connection.id as never) : [];
  const accounts = accountsRaw.map((a) => ({ id: a.id as string | number, providerAccountId: String(a.providerAccountId ?? ''), providerAccountName: String(a.providerAccountName ?? ''), selected: Boolean(a.selected) }));

  return (
    <>
      <TopBar
        title={def.displayName}
        sub={<>{def.type} provider · {def.comingSoon ? 'Coming soon' : (CONNECTION_STATUS_LABELS[effectiveStatus] || effectiveStatus)} · Planned: {def.plannedPhase}</>}
        actions={<WsLink href="/app/provider-connections">Back to connections</WsLink>}
      />
      <div className="adm-content">
        {connected ? <div className="adm-panel ok" style={{ marginBottom: 12 }}>Connected. Read-only access only — nothing in Google Ads is changed.</div> : null}
        {error ? <div className="adm-panel warn" style={{ marginBottom: 12 }}>Authorization didn’t complete ({String(error).slice(0, 40)}). You can try connecting again.</div> : null}
        <div className="adm-panel" style={{ marginBottom: 16 }}>
          <strong>Foundation only.</strong> No provider data is synced yet · no campaigns launch from this page · no budget is spent.
          Tokens (when connected in a later phase) are encrypted at rest and never shown. Manual performance import remains a fallback.
        </div>

        <Card>
          <div className="adm-row"><span className="t">Status</span><span className={`adm-badge ${connStatusVariant(effectiveStatus)}`}>{def.comingSoon ? 'Coming soon' : (CONNECTION_STATUS_LABELS[effectiveStatus] || effectiveStatus)}</span></div>
          <div className="adm-row"><span className="t">Token vault</span><strong>{setup.vaultStatus === 'ready' ? 'ready' : setup.vaultStatus === 'invalid' ? 'invalid key' : 'not configured'}</strong></div>
          <div className="adm-row"><span className="t">OAuth scopes</span><span className="adm-note">{def.scopes.length ? def.scopes.join('  ·  ') : '—'}</span></div>
          <div className="adm-row"><span className="t">Capabilities</span><span className="adm-note">
            {[def.capabilities.readMetrics && 'Read metrics', def.capabilities.createCampaigns && 'Create campaigns', def.capabilities.socialPublish && 'Social publish', def.capabilities.conversionTracking && 'Conversion tracking'].filter(Boolean).join('  ·  ')}
          </span></div>
          <div className="adm-row"><span className="t">Required env (names only)</span><span className="adm-note"><code>{def.requiredEnv.join(', ')}</code></span></div>
          {def.optionalEnv.length ? <div className="adm-row"><span className="t">Optional env</span><span className="adm-note"><code>{def.optionalEnv.join(', ')}</code></span></div> : null}
          <div className="adm-row"><span className="t">Last sync</span><strong>—</strong></div>
          {def.notes ? <p className="adm-note" style={{ marginTop: 8 }}>{def.notes}</p> : null}

          <ProviderConnectionControls
            provider={def.id}
            canManage={canManage}
            configured={setup.configured}
            comingSoon={def.comingSoon}
            connectionId={(connection?.id as string | number) ?? null}
            connectionStatus={recordStatus}
            missingEnv={setup.missingEnv}
          />

          {def.id === 'google_ads' ? (
            <GoogleAdsSyncPanel
              connectionId={(connection?.id as string | number) ?? ''}
              connected={isConnected}
              canManage={canManage}
              accounts={accounts}
              lastSync={(connection?.lastSyncAt as string) ?? null}
              lastError={(connection?.lastErrorMessage as string) ?? null}
            />
          ) : null}
        </Card>
      </div>
    </>
  );
}
