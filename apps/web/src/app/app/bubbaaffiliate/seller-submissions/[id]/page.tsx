import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@payload-config';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { BUBBA_SOURCES } from '@/lib/bubbaaffiliate-intake';
import { SubmissionDetail } from '../../_detail';

export const dynamic = 'force-dynamic';

const refId = (v: unknown): unknown => (v == null ? null : typeof v === 'object' ? (v as { id?: unknown }).id : v);

export default async function SellerSubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ws = await requireWorkspace();
  const { id } = await params;
  const payload = await getPayload({ config });

  let doc: Record<string, any> | null = null;
  try { doc = (await payload.findByID({ collection: 'contact-messages', id, depth: 0, overrideAccess: true })) as Record<string, any>; } catch { doc = null; }

  // Ownership + kind guard — never expose another workspace's or a non-seller doc.
  if (!doc) notFound();
  if (String(refId(doc.tenant)) !== String(ws.scope.tenantId)) notFound();
  if (ws.scope.workspaceId != null && String(refId(doc.workspace)) !== String(ws.scope.workspaceId)) notFound();
  if (doc.source !== BUBBA_SOURCES.seller) notFound();

  return <SubmissionDetail doc={doc} kind="seller" editable={canWrite(ws.role)} />;
}
