import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listProductOptions, listRequestOptions } from '@/lib/landing';
import { getBrandProfile } from '@/lib/brandkit';
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
  const [products, requests, brandDoc] = await Promise.all([listProductOptions(ws.scope), listRequestOptions(ws.scope), getBrandProfile(ws.scope)]);
  const brand = brandDoc ? {
    publicationName: (brandDoc.publicationName as string) || '', brandVoice: (brandDoc.brandVoice as string) || '',
    accentColor: (brandDoc.accentColor as string) || '', affiliateDisclosure: (brandDoc.affiliateDisclosure as string) || '',
  } : null;

  return (
    <>
      <TopBar title="New landing page" sub="Starts as a private draft. Publishing is a separate, explicit step." />
      <div className="adm-content">
        <LandingPageEditor workspaceSlug={(ws.workspace?.slug as string) || undefined} products={products} requests={requests} brand={brand} />
      </div>
    </>
  );
}
