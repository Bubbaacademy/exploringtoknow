import { notFound } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { providerSetup, connectionForProvider, sanitizeConnection } from '@/lib/providers';
import { PROVIDER_BY_ID, isProviderId, CONNECTION_STATUS_LABELS, connStatusVariant } from '@/lib/provider-constants';
import { TopBar, Card, WsLink } from '../../_ui';
import { ProviderConnectionControls } from '@/components/app/ProviderConnectionControls';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ provider: string }> };

export default async function ProviderDetail({ params }: Args) {
  const { provider } = await params;
  if (!isProviderId(provider)) notFound();
  const def = PROVIDER_BY_ID[provider]!;
  const ws = await requireWorkspace();
  const canManage = canManageConnections(ws.role);
  const setup = providerSetup(def);
  const raw = await connectionForProvider(ws.scope, def.id);
  const connection = raw ? sanitizeConnection(raw) : null;
  const recordStatus = connection ? String(connection.status) : null;
  const effectiveStatus = recordStatus && recordStatus !== 'not_configured' ? recordStatus : setup.setupStatus;

  return (
    <>
      <TopBar
        title={def.displayName}
        sub={<>{def.type} provider · {def.comingSoon ? 'Coming soon' : (CONNECTION_STATUS_LABELS[effectiveStatus] || effectiveStatus)} · Planned: {def.plannedPhase}</>}
        actions={<WsLink href="/app/provider-connections">Back to connections</WsLink>}
      />
      <div className="adm-content">
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
        </Card>
      </div>
    </>
  );
}
