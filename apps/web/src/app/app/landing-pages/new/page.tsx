import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { TopBar } from '../../_ui';
import { LandingPageEditor } from '@/components/app/LandingPageEditor';

export const dynamic = 'force-dynamic';

export default async function NewLandingPage() {
  const ws = await requireWorkspace();
  if (!canWrite(ws.role)) {
    return (
      <>
        <TopBar title="New landing page" />
        <div className="adm-content"><div className="adm-panel warn">You don’t have permission to create landing pages.</div></div>
      </>
    );
  }
  return (
    <>
      <TopBar title="New landing page" sub="Starts as a private draft. Publishing is a separate, explicit step." />
      <div className="adm-content">
        <LandingPageEditor workspaceSlug={(ws.workspace?.slug as string) || undefined} />
      </div>
    </>
  );
}
