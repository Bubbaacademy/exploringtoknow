import { wsList, wsCount, type WorkspaceScope, type Id } from '@/lib/workspace';
import type { Doc } from '@/lib/tenant';

/**
 * BubbaAffiliate intake management (Phase 2B / 3A) — read + triage layer.
 *
 * Seller offer submissions and creator partner applications are stored in the
 * EXISTING `contact-messages` collection by the public gateway intake route
 * (`/api/bubbaaffiliate/intake`). They are discriminated by `source`:
 *   - seller  -> 'bubbaaffiliate-seller'
 *   - creator -> 'bubbaaffiliate-creator'
 * The structured details are composed into `message` as `Label: value` lines; the
 * website / profile URL is also stored directly in `productUrl`. This module reads
 * and parses those docs — it adds NO schema. Status triage reuses the existing
 * `status` field. There is no operator-notes field yet (deferred; see the Phase
 * 2B/3A report). All reads are workspace-scoped exactly like the Contact Inbox.
 */

export type IntakeKind = 'seller' | 'creator';

export const BUBBA_SOURCES: Record<IntakeKind, string> = {
  seller: 'bubbaaffiliate-seller',
  creator: 'bubbaaffiliate-creator',
};

/** Reverse lookup: source string -> kind (null if not a BubbaAffiliate intake). */
export function kindFromSource(source: unknown): IntakeKind | null {
  if (source === BUBBA_SOURCES.seller) return 'seller';
  if (source === BUBBA_SOURCES.creator) return 'creator';
  return null;
}

/** Human labels for the two intake surfaces. */
export const KIND_LABELS: Record<IntakeKind, { singular: string; plural: string }> = {
  seller: { singular: 'Seller submission', plural: 'Seller submissions' },
  creator: { singular: 'Creator application', plural: 'Creator applications' },
};

export const KIND_ROUTES: Record<IntakeKind, string> = {
  seller: '/app/bubbaaffiliate/seller-submissions',
  creator: '/app/bubbaaffiliate/creator-applications',
};

// ---- Status triage (reuses the EXISTING contact-messages `status` field) ----

/** Status values exposed for intake triage — a subset of the collection's options. */
export const INTAKE_STATUSES = ['new', 'reviewed', 'archived', 'spam'] as const;
export type IntakeStatus = (typeof INTAKE_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  archived: 'Archived',
  spam: 'Spam',
  read: 'Read (legacy)',
};

/** Filter options for the list views (status). */
export const STATUS_FILTERS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'archived', label: 'Archived' },
  { value: 'spam', label: 'Spam' },
];

/** Operator triage action -> target status (all existing status values). */
export const STATUS_ACTIONS: Record<string, IntakeStatus> = {
  review: 'reviewed',
  archive: 'archived',
  spam: 'spam',
  reopen: 'new',
};

// ---- Message parsing (the composed `Label: value` intake block) ----

export type ParsedIntake = {
  /** Labeled header fields in submission order (empty values dropped). */
  fields: Array<{ label: string; value: string }>;
  /** The free-text body header line (e.g. "What they want to promote:"). */
  bodyHeader: string;
  /** The free-text body (what they want to promote / about their audience). */
  body: string;
};

/**
 * Parse the composed intake `message` produced by /api/bubbaaffiliate/intake.
 * Tolerant: unknown labels are preserved, a "—" placeholder is treated as empty,
 * and a malformed/legacy message degrades to an empty header with the raw text as
 * the body. Split on the FIRST colon so URL values (with their own colons) survive.
 */
export function parseIntakeMessage(raw: unknown): ParsedIntake {
  const text = typeof raw === 'string' ? raw : '';
  const lines = text.split('\n');
  const fields: Array<{ label: string; value: string }> = [];
  let i = 0;

  // Skip the leading tag line, e.g. "[BubbaAffiliate — Seller / Offer intake]".
  if ((lines[i] ?? '').trimStart().startsWith('[')) i++;

  // Labeled header lines until the first blank line.
  for (; i < lines.length; i++) {
    const l = lines[i] ?? '';
    if (l.trim() === '') { i++; break; }
    const idx = l.indexOf(':');
    if (idx > 0) {
      const label = l.slice(0, idx).trim();
      const value = l.slice(idx + 1).trim();
      if (label && value && value !== '—') fields.push({ label, value });
    }
  }

  // Skip blank lines, then the next line is the body header; the rest is the body.
  while (i < lines.length && (lines[i] ?? '').trim() === '') i++;
  const bodyHeader = (lines[i] ?? '').trim();
  const body = lines.slice(i + 1).join('\n').trim();

  return { fields, bodyHeader, body };
}

/** Pull the first present value among the given labels (case-insensitive). */
function pick(parsed: ParsedIntake, labels: string[]): string {
  for (const want of labels) {
    const hit = parsed.fields.find((f) => f.label.toLowerCase() === want.toLowerCase());
    if (hit) return hit.value;
  }
  return '';
}

export type IntakeSummary = {
  id: Id;
  kind: IntakeKind;
  name: string;
  email: string;
  /** Business / brand (seller) or handle (creator). */
  entity: string;
  /** Offer type (seller) or primary platform (creator). */
  typeOrPlatform: string;
  url: string;
  status: string;
  createdAt: string;
};

/** Flatten a contact-messages doc into the fields the operator lists care about. */
export function intakeSummary(doc: Doc, kind: IntakeKind): IntakeSummary {
  const parsed = parseIntakeMessage(doc.message);
  const entity = kind === 'seller'
    ? pick(parsed, ['Business / brand', 'Business', 'Brand'])
    : pick(parsed, ['Handle', 'Name']);
  const typeOrPlatform = kind === 'seller'
    ? pick(parsed, ['Offer type'])
    : pick(parsed, ['Primary platform', 'Platform']);
  return {
    id: doc.id as Id,
    kind,
    name: (doc.name as string) || pick(parsed, ['Contact', 'Name']) || '',
    email: String(doc.email ?? ''),
    entity,
    typeOrPlatform,
    url: (doc.productUrl as string) || pick(parsed, ['Website', 'Profile URL']) || '',
    status: String(doc.status ?? 'new'),
    createdAt: String(doc.createdAt ?? ''),
  };
}

// ---- Workspace-scoped reads (same scoping contract as the Contact Inbox) ----

/** Build the `source` (+ optional `status`) Where for a kind, ANDed with scope. */
function intakeWhere(kind: IntakeKind, status?: string): Doc {
  const and: Doc[] = [{ source: { equals: BUBBA_SOURCES[kind] } }];
  if (status && status !== 'all') and.push({ status: { equals: status } });
  return { and };
}

export type IntakeListOpts = { status?: string; newestFirst?: boolean; limit?: number };

/** List intake docs of a kind, workspace-scoped. Newest-first by default. */
export async function listIntake(scope: WorkspaceScope, kind: IntakeKind, opts: IntakeListOpts = {}): Promise<Doc[]> {
  return wsList(scope, 'contact-messages', {
    sort: opts.newestFirst === false ? 'createdAt' : '-createdAt',
    limit: opts.limit ?? 300,
    extra: intakeWhere(kind, opts.status),
  });
}

export async function countIntake(scope: WorkspaceScope, kind: IntakeKind, status?: string): Promise<number> {
  return wsCount(scope, 'contact-messages', intakeWhere(kind, status));
}

export type IntakeOverview = {
  seller: { total: number; new: number };
  creator: { total: number; new: number };
};

/** Counts for the BubbaAffiliate command center. */
export async function intakeOverview(scope: WorkspaceScope): Promise<IntakeOverview> {
  const [sTotal, sNew, cTotal, cNew] = await Promise.all([
    countIntake(scope, 'seller'),
    countIntake(scope, 'seller', 'new'),
    countIntake(scope, 'creator'),
    countIntake(scope, 'creator', 'new'),
  ]);
  return { seller: { total: sTotal, new: sNew }, creator: { total: cTotal, new: cNew } };
}
