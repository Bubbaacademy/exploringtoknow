import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listProductOptions, listRequestOptions } from '@/lib/landing';
import { listLandingPageOptions, listAssigneeOptions } from '@/lib/social';
import { getBrandProfile } from '@/lib/brandkit';
import { TopBar } from '../../_ui';
import { SocialPostEditor } from '@/components/app/SocialPostEditor';

export const dynamic = 'force-dynamic';
type Args = { searchParams: Promise<{ fromLanding?: string }> };

export default async function NewSocialPost({ searchParams }: Args) {
  const ws = await requireWorkspace();
  if (!canWrite(ws.role)) {
    return (
      <>
        <TopBar title="New social post" />
        <div className="adm-content"><div className="adm-panel warn">You don’t have permission to create social posts.</div></div>
      </>
    );
  }
  const { fromLanding } = await searchParams;
  const wsSlug = (ws.workspace?.slug as string) || undefined;
  const [products, requests, landingPages, assignees, brandDoc] = await Promise.all([
    listProductOptions(ws.scope), listRequestOptions(ws.scope), listLandingPageOptions(ws.scope, wsSlug), listAssigneeOptions(ws.scope), getBrandProfile(ws.scope),
  ]);
  const brand = brandDoc ? {
    publicationName: (brandDoc.publicationName as string) || '', brandVoice: (brandDoc.brandVoice as string) || '',
    targetAudience: (brandDoc.targetAudience as string) || '', accentColor: (brandDoc.accentColor as string) || '',
    affiliateDisclosure: (brandDoc.affiliateDisclosure as string) || '',
  } : null;

  // Optional "create from landing page" prefill — draft only, manual, no generation/publish.
  let initial: { relatedLandingPage?: string | number; ctaUrl?: string; name?: string } | undefined;
  if (fromLanding) {
    const lp = landingPages.find((p) => String(p.id) === String(fromLanding));
    if (lp) initial = { relatedLandingPage: lp.id, ctaUrl: lp.url || '', name: `Social post — ${lp.label.replace(/ \(not published\)$/, '')}` };
  }

  return (
    <>
      <TopBar title="New social post" sub="Starts as a private draft. Authoring is manual — nothing is generated or posted." />
      <div className="adm-content">
        <SocialPostEditor
          post={initial}
          products={products} requests={requests} landingPages={landingPages} assignees={assignees}
          brand={brand} brandProfileId={brandDoc?.id ?? null}
        />
      </div>
    </>
  );
}
