import { getPayload } from 'payload';
import config from '@payload-config';
import { wsList, type WorkspaceScope } from './workspace';
import type { Doc } from './tenant';
import { PROVIDERS, PROVIDER_BY_ID, CONNECTION_SECRET_FIELDS, type ProviderDef, type ProviderId } from './provider-constants';
import { encryptionKeyStatus } from './provider-crypto';

/**
 * Provider connection data layer + setup-status evaluator (Phase 30). Reads env
 * PRESENCE (names only — never values) to decide whether a provider is configured.
 * All connection reads are workspace-scoped and token fields are ALWAYS stripped
 * before leaving the server. No provider API is called here.
 */
export type ProviderSetup = {
  configured: boolean;          // all required env present (incl. vault key)
  missingEnv: string[];         // names only
  vaultStatus: 'ready' | 'missing' | 'invalid';
  comingSoon: boolean;
  setupStatus: 'disabled' | 'not_configured' | 'ready_to_connect';
};

/** Evaluate provider readiness from env presence (names only; never values). */
export function providerSetup(def: ProviderDef): ProviderSetup {
  const vaultStatus = encryptionKeyStatus();
  const missingEnv = def.requiredEnv.filter((name) => !String(process.env[name] ?? '').trim());
  const configured = def.requiredEnv.length > 0 && missingEnv.length === 0;
  const comingSoon = def.comingSoon;
  const setupStatus: ProviderSetup['setupStatus'] = comingSoon ? 'disabled' : (configured ? 'ready_to_connect' : 'not_configured');
  return { configured, missingEnv, vaultStatus, comingSoon, setupStatus };
}

/** Strip encrypted token fields (and any secrets) from a connection doc before it leaves the server. */
export function sanitizeConnection(d: Doc): Doc {
  const out: Doc = { ...d };
  for (const f of CONNECTION_SECRET_FIELDS) delete out[f];
  // Expose only a boolean presence flag, never the ciphertext.
  out.hasStoredToken = Boolean(d.accessTokenEncrypted);
  return out;
}

export async function listWorkspaceConnections(scope: WorkspaceScope): Promise<Doc[]> {
  const docs = await wsList(scope, 'provider-connections', { sort: '-updatedAt', limit: 200, depth: 0 });
  return docs.map(sanitizeConnection);
}

export async function getWorkspaceConnection(scope: WorkspaceScope, id: string | number): Promise<Doc | null> {
  if (scope.tenantId == null || scope.workspaceId == null) return null;
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'provider-connections', limit: 1, depth: 0, overrideAccess: true,
    where: { and: [{ id: { equals: id as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.docs[0] ?? null; // RAW (may include token fields) — callers must sanitize before returning to clients.
}

/** Latest connection record for a provider in this workspace (raw). */
export async function connectionForProvider(scope: WorkspaceScope, provider: ProviderId): Promise<Doc | null> {
  const docs = await wsList(scope, 'provider-connections', { sort: '-updatedAt', limit: 1, depth: 0, extra: { provider: { equals: provider } } });
  return docs[0] ?? null;
}

export type ProviderCard = {
  def: ProviderDef;
  setup: ProviderSetup;
  connection: Doc | null;        // sanitized
  effectiveStatus: string;       // status badge value
  connectable: boolean;          // owner/admin may start connect
};

/** Build the per-provider card list for the workspace UI (registry + env + existing record). */
export async function providerCards(scope: WorkspaceScope): Promise<ProviderCard[]> {
  const existing = await listWorkspaceConnections(scope); // sanitized
  const byProvider = new Map<string, Doc>();
  for (const c of existing) if (!byProvider.has(String(c.provider))) byProvider.set(String(c.provider), c);

  return PROVIDERS.map((def) => {
    const setup = providerSetup(def);
    const connection = byProvider.get(def.id) ?? null;
    const recordStatus = connection ? String(connection.status) : null;
    const effectiveStatus = recordStatus && recordStatus !== 'not_configured' ? recordStatus : setup.setupStatus;
    const connectable = !setup.comingSoon && setup.configured && (!connection || ['not_configured', 'ready_to_connect', 'disconnected', 'error', 'expired'].includes(recordStatus || ''));
    return { def, setup, connection, effectiveStatus, connectable };
  });
}

export { PROVIDERS, PROVIDER_BY_ID };
