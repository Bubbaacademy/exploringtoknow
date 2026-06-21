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
          <strong>Connect your own {def.displayName} account.</strong> This workspace stores its <strong>own</strong> encrypted
          connection — never shared across workspaces or shown to anyone. To start it’s <strong>read-only</strong>: no campaigns
          launch and no budget is spent. You don’t need any Google API keys — ExploringToKnow configures the API once; you just
          authorize your account. Manual performance import remains a fallback.
        </div>

        <Card>
          <div className="adm-row"><span className="t">Status</span><span className={`adm-badge ${connStatusVariant(effectiveStatus)}`}>{def.comingSoon ? 'Coming soon' : (CONNECTION_STATUS_LABELS[effectiveStatus] || effectiveStatus)}</span></div>
          <div className="adm-row"><span className="t">Platform setup</span><strong>{setup.configured ? 'Ready — configured by ExploringToKnow' : 'Pending — ExploringToKnow is finishing this provider’s API setup'}</strong></div>
          <div className="adm-row"><span className="t">Access</span><span className="adm-note">{def.scopes.length ? `${def.scopes.join('  ·  ')} (read-only to start)` : '—'}</span></div>
          <div className="adm-row"><span className="t">Capabilities</span><span className="adm-note">
            {[def.capabilities.readMetrics && 'Read metrics', def.capabilities.createCampaigns && 'Create campaigns (future)', def.capabilities.socialPublish && 'Social publish (future)', def.capabilities.conversionTracking && 'Conversion tracking'].filter(Boolean).join('  ·  ')}
          </span></div>
          <div className="adm-row"><span className="t">Your token storage</span><strong>encrypted at rest · never shown</strong></div>
          <div className="adm-row"><span className="t">Last sync</span><strong>{(connection?.lastSyncAt as string) ? new Date(String(connection!.lastSyncAt)).toISOString().slice(0, 16).replace('T', ' ') : '—'}</strong></div>
          {def.notes ? <p className="adm-note" style={{ marginTop: 8 }}>{def.notes}</p> : null}

          <ProviderConnectionControls
            provider={def.id}
            canManage={canManage}
            configured={setup.configured}
            comingSoon={def.comingSoon}
            connectionId={(connection?.id as string | number) ?? null}
            connectionStatus={recordStatus}
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
