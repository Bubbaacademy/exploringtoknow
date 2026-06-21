import Link from 'next/link';
import { requireWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { providerCards } from '@/lib/providers';
import { CONNECTION_STATUS_LABELS, connStatusVariant } from '@/lib/provider-constants';
import { TopBar, Section } from '../_ui';

export const dynamic = 'force-dynamic';

const cap = (on: boolean, label: string) => (
  <span style={{ opacity: on ? 1 : 0.45 }}>{on ? '✓' : '·'} {label}</span>
);

export default async function ProviderConnectionsPage() {
  const ws = await requireWorkspace();
  const canManage = canManageConnections(ws.role);
  const cards = await providerCards(ws.scope);

  return (
    <>
      <TopBar title="Connections" sub="Provider connections are the foundation for API-synced metrics. No provider data is synced yet." />
      <div className="adm-content">
        <div className="adm-panel" style={{ marginBottom: 16 }}>
          <strong>Connect your own ad &amp; social accounts.</strong> Each workspace stores its <strong>own</strong> encrypted
          connection — your tokens are never shared across workspaces or shown to anyone. ExploringToKnow configures each
          provider’s API once; then you connect your account here with one click (read-only to start). No campaigns launch
          from this page and no budget is spent. Manual performance import remains available as a fallback.
        </div>

        <Section title="Ad &amp; social providers">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, alignItems: 'start' }}>
            {cards.map(({ def, setup, connection, effectiveStatus }) => (
              <div key={def.id} className="adm-card">
                <div className="adm-row" style={{ marginBottom: 6 }}>
                  <span className="t">{def.displayName}</span>
                  <span className={`adm-badge ${connStatusVariant(effectiveStatus)}`}>{def.comingSoon ? 'Coming soon' : (CONNECTION_STATUS_LABELS[effectiveStatus] || effectiveStatus)}</span>
                </div>
                <p className="adm-note" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  {cap(def.capabilities.readMetrics, 'Read metrics')}
                  {cap(def.capabilities.createCampaigns, 'Create campaigns')}
                  {cap(def.capabilities.socialPublish, 'Social publish')}
                  {cap(def.capabilities.conversionTracking, 'Conversions')}
                </p>
                <p className="adm-note" style={{ marginBottom: 4 }}>Planned: {def.plannedPhase}</p>
                <p className="adm-note" style={{ marginBottom: 4 }}>Last sync: <strong>—</strong> (no sync yet)</p>
                {!setup.configured && !def.comingSoon ? (
                  <p className="adm-note">Setup pending — ExploringToKnow is finishing this provider’s API setup. You’ll connect your own account here once it’s ready.</p>
                ) : null}
                <div style={{ marginTop: 8 }}>
                  <Link href={`/app/provider-connections/${def.id}`} className="adm-btn ghost">{canManage ? 'Manage' : 'View'}</Link>
                </div>
                {connection ? <p className="adm-note" style={{ marginTop: 6 }}>Token stored: {connection.hasStoredToken ? 'yes (encrypted)' : 'no'}</p> : null}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
