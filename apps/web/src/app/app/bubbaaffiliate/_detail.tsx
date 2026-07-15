import type { ReactNode } from 'react';
import Link from 'next/link';
import { TopBar, Section, Card, StatusBadge, fmtDate } from '../_ui';
import { updateIntakeStatus } from './actions';
import {
  parseIntakeMessage, intakeSummary, KIND_LABELS, KIND_ROUTES, type IntakeKind,
} from '@/lib/bubbaaffiliate-intake';
import type { Doc } from '@/lib/tenant';

/**
 * Shared read + triage detail for a single BubbaAffiliate intake submission.
 * Server component: the triage controls are submit buttons on a `<form>` bound to
 * the source-guarded `updateIntakeStatus` server action (no client JS). Reused by
 * both the seller and creator detail routes.
 */

// Labels already surfaced as dedicated rows — skip them in the generic field list.
const SHOWN_LABELS = new Set(['website', 'profile url', 'contact', 'name']);

export function SubmissionDetail({ doc, kind, editable }: { doc: Doc; kind: IntakeKind; editable: boolean }) {
  const s = intakeSummary(doc, kind);
  const parsed = parseIntakeMessage(doc.message);
  const isSeller = kind === 'seller';

  const row = (label: string, value: ReactNode) => (
    <div className="adm-row"><span className="t">{label}</span><strong>{value}</strong></div>
  );
  const urlCell = s.url
    ? <a href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.url}</a>
    : '—';
  const extraFields = parsed.fields.filter((f) => !SHOWN_LABELS.has(f.label.toLowerCase()));

  return (
    <>
      <TopBar
        title={s.entity || s.name || s.email || KIND_LABELS[kind].singular}
        sub={<>{KIND_LABELS[kind].singular} · status <StatusBadge status={s.status} /> · received {fmtDate(s.createdAt)}</>}
        actions={<Link href={KIND_ROUTES[kind]} className="adm-btn ghost">← All {KIND_LABELS[kind].plural.toLowerCase()}</Link>}
      />
      <div className="adm-content">
        <Section title="Submission">
          <Card>
            {row('Name', s.name || '—')}
            {row('Email', s.email ? <a href={`mailto:${s.email}`}>{s.email}</a> : '—')}
            {row(isSeller ? 'Website' : 'Profile URL', urlCell)}
            {extraFields.map((f) => row(f.label, f.value))}
          </Card>
        </Section>

        {parsed.body ? (
          <Section title={parsed.bodyHeader.replace(/:$/, '') || (isSeller ? 'What they want to promote' : 'About their audience and content')}>
            <Card><p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{parsed.body}</p></Card>
          </Section>
        ) : null}

        <Section title="Triage">
          {editable ? (
            <form action={updateIntakeStatus} className="adm-panel" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="hidden" name="id" value={String(s.id)} />
              <span className="adm-note" style={{ marginRight: 4 }}>Current: <StatusBadge status={s.status} /></span>
              <button className="adm-btn" name="action" value="review" disabled={s.status === 'reviewed'}>Mark reviewed</button>
              <button className="adm-btn ghost" name="action" value="archive" disabled={s.status === 'archived'}>Archive</button>
              <button className="adm-btn ghost" name="action" value="spam" disabled={s.status === 'spam'}>Mark spam</button>
              <button className="adm-btn ghost" name="action" value="reopen" disabled={s.status === 'new'}>Reopen</button>
            </form>
          ) : (
            <div className="adm-panel">Status: <StatusBadge status={s.status} />. You have read-only access to this workspace.</div>
          )}
          {doc.reviewedAt ? <p className="adm-note" style={{ marginTop: 8 }}>Last triaged {fmtDate(doc.reviewedAt)}.</p> : null}
        </Section>
      </div>
    </>
  );
}
