'use client';
import { useState } from 'react';
import { ROLE_LABELS, INVITABLE_ROLES } from '@/lib/roles';

export type Member = { id: string | number; email: string; name: string; role: string; joined: string; isSelf: boolean };
export type Invite = { id: string | number; email: string; role: string; created: string };

const ASSIGNABLE = ['workspace_owner', 'workspace_admin', 'editor', 'viewer'];

export function TeamManager({ members, invites, canManage }: { members: Member[]; invites: Invite[]; canManage: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  async function post(url: string, body: unknown): Promise<any> {
    setErr(''); setBusy(true);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) { setErr(j.error || 'Action failed.'); return null; }
      return j;
    } catch { setErr('Network error.'); return null; }
    finally { setBusy(false); }
  }

  async function onInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const j = await post('/api/app/team/invite', { email: fd.get('email'), role: fd.get('role'), message: fd.get('message') });
    if (j?.inviteLink) { setInviteLink(j.inviteLink); setCopied(false); (e.currentTarget as HTMLFormElement).reset(); }
  }
  async function changeRole(id: Member['id'], role: string) { if (await post('/api/app/team/manage', { action: 'role', membershipId: id, role })) location.reload(); }
  async function removeMember(id: Member['id']) { if (confirm('Remove this member from the workspace?') && await post('/api/app/team/manage', { action: 'remove', membershipId: id })) location.reload(); }
  async function revokeInvite(id: Invite['id']) { if (await post('/api/app/team/manage', { action: 'revoke', invitationId: id })) location.reload(); }
  async function copyLink() { try { await navigator.clipboard.writeText(inviteLink); setCopied(true); } catch { setCopied(false); } }

  return (
    <>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 14 }}>{err}</div> : null}

      <section className="adm-section">
        <div className="adm-section-head"><h2>Members</h2></div>
        <div className="adm-card">
          {members.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead><tr><th>Member</th><th>Role</th><th>Joined</th>{canManage ? <th /> : null}</tr></thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={String(m.id)}>
                      <td>{m.email}{m.name && m.name !== m.email ? <span className="adm-note"> · {m.name}</span> : null}{m.isSelf ? <span className="adm-note"> (you)</span> : null}</td>
                      <td>
                        {canManage && !m.isSelf ? (
                          <select className="adm-select" defaultValue={m.role} disabled={busy} onChange={(e) => changeRole(m.id, e.target.value)} aria-label="Change role">
                            {ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                          </select>
                        ) : <span className="adm-badge">{ROLE_LABELS[m.role] ?? m.role}</span>}
                      </td>
                      <td>{m.joined}</td>
                      {canManage ? <td>{!m.isSelf ? <button className="adm-btn ghost" disabled={busy} onClick={() => removeMember(m.id)}>Remove</button> : null}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="adm-empty">You are currently the only member of this workspace. Invite teammates when you’re ready.</p>}
        </div>
      </section>

      {canManage ? (
        <section className="adm-section">
          <div className="adm-section-head"><h2>Invite a teammate</h2></div>
          <div className="adm-card">
            <form className="form" onSubmit={onInvite}>
              <div className="field"><label htmlFor="invEmail">Email <span className="req">*</span></label><input id="invEmail" name="email" type="email" required placeholder="teammate@company.com" /></div>
              <div className="field"><label htmlFor="invRole">Role <span className="req">*</span></label>
                <select id="invRole" name="role" className="adm-select" defaultValue="editor">
                  {INVITABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                </select>
              </div>
              <div className="field"><label htmlFor="invMsg">Message <span className="opt">(optional)</span></label><textarea id="invMsg" name="message" maxLength={1000} /></div>
              <button className="adm-btn" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create invitation'}</button>
            </form>
            {inviteLink ? (
              <div className="adm-panel ok" style={{ marginTop: 14 }}>
                <strong>Invitation created.</strong> Email isn’t configured yet, so copy this secure link and share it with your teammate:
                <div className="adm-row" style={{ marginTop: 8 }}>
                  <code className="t" style={{ fontSize: 12 }}>{inviteLink}</code>
                  <button className="adm-btn" onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy link'}</button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="adm-section">
        <div className="adm-section-head"><h2>Pending invitations</h2></div>
        <div className="adm-card">
          {invites.length ? invites.map((i) => (
            <div key={String(i.id)} className="adm-row">
              <span className="t">{i.email} · <span className="adm-badge">{ROLE_LABELS[i.role] ?? i.role}</span> <span className="adm-note">invited {i.created}</span></span>
              {canManage ? <button className="adm-btn ghost" disabled={busy} onClick={() => revokeInvite(i.id)}>Revoke</button> : null}
            </div>
          )) : <p className="adm-empty">No pending invitations.</p>}
        </div>
      </section>
    </>
  );
}
