import { sendEmail, emailEnabled, type SendResult } from './email';
import { SITE_NAME, SITE_URL } from './public';

/**
 * Shared, brand-consistent email templates (Phase 20). Plain inline-styled HTML +
 * text fallback. Honest copy (no hype, no fake claims). All senders no-op in
 * local-safe mode (return `local_no_send`) so callers never branch on env.
 */
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type EmailContent = { heading: string; intro: string; bodyLines?: string[]; ctaText?: string; ctaUrl?: string; footnote?: string };

export function renderEmail(c: EmailContent): { html: string; text: string } {
  const para = (t: string) => `<p style="margin:0 0 12px;color:#3c4654;font-size:15px;line-height:1.55">${esc(t)}</p>`;
  const lines = (c.bodyLines || []).map(para).join('');
  const cta = c.ctaText && c.ctaUrl
    ? `<p style="margin:22px 0 6px"><a href="${c.ctaUrl}" style="display:inline-block;background:#14543f;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:15px">${esc(c.ctaText)}</a></p>`
    : '';
  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">`
    + `<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e6e9ee;border-radius:12px;overflow:hidden">`
    + `<tr><td style="background:#0e3a2b;padding:16px 24px;color:#ffffff;font-weight:700;font-size:16px">${esc(SITE_NAME)}</td></tr>`
    + `<tr><td style="padding:24px">`
    + `<h1 style="margin:0 0 10px;font-size:20px;color:#1b2430">${esc(c.heading)}</h1>`
    + para(c.intro) + lines + cta
    + (c.footnote ? `<p style="margin:18px 0 0;color:#6b7480;font-size:13px">${esc(c.footnote)}</p>` : '')
    + `</td></tr>`
    + `<tr><td style="padding:14px 24px;border-top:1px solid #e6e9ee;color:#9aa3af;font-size:12px">${esc(SITE_NAME)} · ${SITE_URL}</td></tr>`
    + `</table></td></tr></table></body></html>`;
  const text = [
    c.heading, '', c.intro, ...(c.bodyLines || []),
    c.ctaText && c.ctaUrl ? `\n${c.ctaText}: ${c.ctaUrl}` : '',
    c.footnote ? `\n${c.footnote}` : '',
    `\n— ${SITE_NAME} · ${SITE_URL}`,
  ].filter((l) => l !== '').join('\n');
  return { html, text };
}

/** New-owner welcome. */
export async function sendWelcomeEmail(to: string, opts: { workspaceName?: string; trialDays?: number; appUrl?: string }): Promise<SendResult> {
  if (!emailEnabled()) return { ok: false, status: 'local_no_send' };
  const ws = opts.workspaceName || 'your workspace';
  const { html, text } = renderEmail({
    heading: `Welcome to ${SITE_NAME}`,
    intro: `Your workspace “${ws}” is ready.`,
    bodyLines: [
      opts.trialDays ? `You’re on a ${opts.trialDays}-day free trial — no credit card required.` : 'You’re all set to get started.',
      'Add a product, request an article, and review every draft before anything goes live.',
      'Nothing is generated or published automatically — you stay in control.',
    ],
    ctaText: 'Open your workspace', ctaUrl: opts.appUrl || `${SITE_URL}/app`,
    footnote: `Questions? Reply to this email or visit ${SITE_URL}/contact.`,
  });
  return sendEmail({ to, subject: `Welcome to ${SITE_NAME} — your workspace is ready`, html, text });
}

const ROLE_WORD: Record<string, string> = { workspace_admin: 'an admin', editor: 'an editor', viewer: 'a viewer' };

/** Team invitation. */
export async function sendInviteEmail(to: string, opts: { workspaceName?: string; role: string; acceptUrl: string; inviterName?: string }): Promise<SendResult> {
  if (!emailEnabled()) return { ok: false, status: 'local_no_send' };
  const ws = opts.workspaceName || 'a workspace';
  const roleWord = ROLE_WORD[opts.role] || `a ${opts.role}`;
  const { html, text } = renderEmail({
    heading: `You’re invited to ${ws}`,
    intro: `${opts.inviterName ? `${opts.inviterName} invited you` : 'You’ve been invited'} to join “${ws}” on ${SITE_NAME} as ${roleWord}.`,
    bodyLines: [
      `${SITE_NAME} is an owned-media operating system for content-commerce brands — every output is reviewed and approved by a human before it goes live.`,
      'Accept the invitation to set up your account and join the workspace.',
    ],
    ctaText: 'Accept invitation', ctaUrl: opts.acceptUrl,
    footnote: 'If you didn’t expect this, you can ignore this email — the invitation only works for your address.',
  });
  return sendEmail({ to, subject: `You’re invited to ${ws} on ${SITE_NAME}`, html, text });
}

/** Newsletter double opt-in confirmation (branded). */
export async function sendNewsletterConfirm(to: string, confirmUrl: string): Promise<SendResult> {
  if (!emailEnabled()) return { ok: false, status: 'local_no_send' };
  const { html, text } = renderEmail({
    heading: `Confirm your ${SITE_NAME} subscription`,
    intro: `Thanks for subscribing to ${SITE_NAME}.`,
    bodyLines: ['Please confirm your email to start receiving practical buying guides and reviews.'],
    ctaText: 'Confirm subscription', ctaUrl: confirmUrl,
    footnote: 'If you didn’t request this, you can safely ignore this email.',
  });
  return sendEmail({ to, subject: `Confirm your ${SITE_NAME} subscription`, html, text });
}
