'use server';

import { getPayload } from 'payload';
import config from '@payload-config';
import { revalidatePath } from 'next/cache';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { STATUS_ACTIONS, kindFromSource } from '@/lib/bubbaaffiliate-intake';

/**
 * Triage a BubbaAffiliate intake submission's status (Phase 2B / 3A).
 *
 * Reuses the EXISTING `contact-messages.status` field — NO schema change. The doc is
 * re-verified to belong to the actor's workspace AND to be a BubbaAffiliate intake
 * (`source` is `bubbaaffiliate-*`), so this action can never mutate an editorial
 * contact message. Writes only `status`, `reviewedBy`, `reviewedAt`. No email, no
 * external call. Editors+ only (canWrite); viewers never see the controls.
 */

const refId = (v: unknown): unknown => (v == null ? null : typeof v === 'object' ? (v as { id?: unknown }).id : v);

export async function updateIntakeStatus(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim();
  const action = String(formData.get('action') ?? '').trim();
  const status = STATUS_ACTIONS[action];
  if (!id || !status) return;

  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return;
  if (!canWrite(ws.role)) return;

  const payload = await getPayload({ config });

  // Re-verify ownership + that this is a BubbaAffiliate intake doc before writing.
  let doc: Record<string, unknown> | null = null;
  try {
    doc = (await payload.findByID({ collection: 'contact-messages', id, depth: 0, overrideAccess: true })) as Record<string, unknown>;
  } catch {
    doc = null;
  }
  if (!doc) return;
  if (String(refId(doc.tenant)) !== String(ws.scope.tenantId)) return;
  if (ws.scope.workspaceId != null && String(refId(doc.workspace)) !== String(ws.scope.workspaceId)) return;
  if (!kindFromSource(doc.source)) return; // source-guard: intake docs only

  try {
    await payload.update({
      collection: 'contact-messages',
      id,
      overrideAccess: true,
      data: { status, reviewedBy: ws.ctx.user.id, reviewedAt: new Date().toISOString() },
    });
  } catch {
    return;
  }

  // Refresh the intake surfaces (lists, detail, command-center counts).
  revalidatePath('/app/bubbaaffiliate', 'layout');
}
