import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { TopBar } from '../../_ui';
import { PerfNav, PerfDisclaimer } from '../_nav';
import { PerformanceImport } from '@/components/app/PerformanceImport';

export const dynamic = 'force-dynamic';

export default async function PerformanceImportPage() {
  const ws = await requireWorkspace();
  if (!canWrite(ws.role)) {
    return (<><TopBar title="Import CSV" /><div className="adm-content"><div className="adm-panel warn">You don’t have permission to import performance.</div></div></>);
  }
  return (
    <>
      <TopBar title="Import performance CSV" sub="Paste-only, manual. Nothing is uploaded or synced from a platform." />
      <div className="adm-content">
        <PerfNav active="/app/performance/import" />
        <PerfDisclaimer />
        <PerformanceImport />
      </div>
    </>
  );
}
