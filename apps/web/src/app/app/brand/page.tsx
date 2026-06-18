import { requireWorkspace } from '@/lib/workspace';
import { canManageBrand } from '@/lib/roles';
import { getBrandProfile, listBrandAssets, ASSET_TYPE_LABELS, ASSET_PERMISSION_LABELS } from '@/lib/brandkit';
import { TopBar, Section, Card, Empty } from '../_ui';
import { BrandKitClient } from '@/components/app/BrandKitClient';

export const dynamic = 'force-dynamic';

const PROFILE_ROWS: Array<[string, string]> = [
  ['brandName', 'Brand / business name'], ['publicationName', 'Publication name'], ['websiteUrl', 'Website'],
  ['description', 'Description'], ['targetAudience', 'Target audience'], ['brandVoice', 'Voice / tone'],
  ['editorialStyle', 'Editorial style'], ['focusNotes', 'Focus notes'], ['affiliateDisclosure', 'Affiliate disclosure'],
  ['socialLinks', 'Social links'], ['primaryColor', 'Primary color'], ['accentColor', 'Accent color'],
];

export default async function BrandKitPage() {
  const ws = await requireWorkspace();
  const canEdit = canManageBrand(ws.role);
  const profileDoc = await getBrandProfile(ws.scope);
  const assetsDocs = await listBrandAssets(ws.scope);

  const profile: Record<string, string> = {};
  for (const [k] of PROFILE_ROWS) profile[k] = (profileDoc?.[k] as string) || '';
  const assets = assetsDocs.map((a) => ({
    id: a.id as string | number,
    label: (a.label as string) || '(untitled)',
    assetType: String(a.assetType ?? 'other'),
    permission: String(a.permission ?? 'needs_review'),
    sourceUrl: (a.sourceUrl as string) || '',
    notes: (a.notes as string) || '',
  }));

  return (
    <>
      <TopBar
        title="Brand Kit & Assets"
        sub={`${(ws.workspace?.name as string) || 'Your workspace'} — the brand foundation for every output`}
      />
      <div className="adm-content">
        <div className="adm-panel" style={{ marginBottom: 16 }}>
          Your brand kit powers <strong>every future output</strong> in this workspace — magazine articles, landing
          pages, social posts, video creative, and ad campaigns. Fill it in once and future tools will draw on it.
          {canEdit ? null : ' Your role has read-only access here — ask an owner or admin to edit.'}
        </div>

        {canEdit ? (
          <BrandKitClient profile={profile} assets={assets} />
        ) : (
          <>
            <Section title="Brand profile">
              {profileDoc ? (
                <Card>
                  <table className="adm-table">
                    <tbody>
                      {PROFILE_ROWS.map(([k, label]) => (
                        <tr key={k}><td style={{ whiteSpace: 'nowrap' }}>{label}</td><td>{profile[k] ? <span style={{ whiteSpace: 'pre-wrap' }}>{profile[k]}</span> : '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ) : <Empty>No brand profile yet. An owner or admin can set it up.</Empty>}
            </Section>
            <Section title="Asset library">
              {assets.length ? (
                <Card>
                  <table className="adm-table">
                    <thead><tr><th>Label</th><th>Type</th><th>Permission</th><th>Source</th></tr></thead>
                    <tbody>
                      {assets.map((a) => (
                        <tr key={String(a.id)}>
                          <td>{a.label}</td><td>{ASSET_TYPE_LABELS[a.assetType] || a.assetType}</td>
                          <td>{ASSET_PERMISSION_LABELS[a.permission] || a.permission}</td>
                          <td>{a.sourceUrl ? <a href={a.sourceUrl} target="_blank" rel="noreferrer noopener">link</a> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ) : <Empty>No assets yet.</Empty>}
            </Section>
          </>
        )}
      </div>
    </>
  );
}
