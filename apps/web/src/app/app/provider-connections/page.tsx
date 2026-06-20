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
          <strong>Connection foundation only.</strong> No provider data is synced yet · no campaigns launch from this page ·
          manual performance import remains available as a fallback. Tokens are encrypted at rest and never shown. API-synced
          provider data will become the primary source of truth, starting with <strong>Google Ads (Phase 31)</strong>.
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
                  <p className="adm-note">Setup needs: <code>{setup.missingEnv.join(', ')}</code></p>
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
