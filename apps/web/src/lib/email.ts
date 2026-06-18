/**
 * Provider-ready email layer. Default is safe LOCAL mode: no external calls, no
 * sends. A real provider activates purely via env (no secrets in code):
 *   NEWSLETTER_PROVIDER=resend|smtp|local   (default local)
 *   NEWSLETTER_FROM="ExploringToKnow <hello@exploringtoknow.com>"
 *   NEWSLETTER_REPLY_TO=...                  (optional)
 *   RESEND_API_KEY=...                       (required for the resend provider)
 *   CONTACT_NOTIFY_TO=...                    (optional editorial inbox for contact pings)
 * The resend provider uses Resend's HTTP API via fetch (no SDK dependency).
 */
export type EmailMessage = { to: string; subject: string; html: string; text?: string };
export type SendResult = { ok: boolean; status: string };

export function emailProvider(): string {
  return (process.env.NEWSLETTER_PROVIDER || 'local').toLowerCase();
}

export function emailFrom(): string {
  return process.env.NEWSLETTER_FROM || 'ExploringToKnow <noreply@exploringtoknow.com>';
}

/** True only when a provider is configured AND its required secret is present. */
export function emailEnabled(): boolean {
  const p = emailProvider();
  if (p === 'resend') return Boolean(process.env.RESEND_API_KEY);
  // smtp and others are not wired yet — treated as disabled (local).
  return false;
}

/** Reply-to presence (no value). */
export const replyToSet = (): boolean => Boolean(process.env.NEWSLETTER_REPLY_TO);

/**
 * Provider status for admin/system-health visibility. Reports presence of each
 * required/optional env key BY NAME ONLY — never any secret value. `missing` lists
 * the required keys still needed to enable real delivery for the current provider.
 */
export function emailProviderStatus() {
  const provider = emailProvider();
  const active = emailEnabled();
  const present = (k: string) => Boolean(process.env[k]);
  const required = provider === 'resend' ? ['RESEND_API_KEY', 'NEWSLETTER_FROM'] : [];
  const missing = required.filter((k) => !present(k));
  const contactReady = active && present('CONTACT_NOTIFY_TO');
  return {
    provider,
    active,
    mode: active ? 'real-send' : 'local-safe (no external send)',
    doubleOptIn: active && process.env.NEWSLETTER_DOUBLE_OPT_IN === 'true',
    missing,
    keys: {
      NEWSLETTER_PROVIDER: present('NEWSLETTER_PROVIDER'),
      RESEND_API_KEY: present('RESEND_API_KEY'),
      NEWSLETTER_FROM: present('NEWSLETTER_FROM'),
      NEWSLETTER_REPLY_TO: present('NEWSLETTER_REPLY_TO'),
      NEWSLETTER_DOUBLE_OPT_IN: present('NEWSLETTER_DOUBLE_OPT_IN'),
      CONTACT_NOTIFY_TO: present('CONTACT_NOTIFY_TO'),
    },
    readiness: {
      welcome: active,
      teamInvite: active,
      newsletterConfirm: active,
      newsletterUnsubscribe: true, // works without a provider (token-based page)
      contactNotify: contactReady,
    },
  };
}

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  if (!emailEnabled()) return { ok: false, status: 'local_no_send' };
  const p = emailProvider();
  if (p === 'resend') {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: emailFrom(),
          to: [msg.to],
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
          reply_to: process.env.NEWSLETTER_REPLY_TO || undefined,
        }),
      });
      return { ok: res.ok, status: res.ok ? 'sent' : `error_${res.status}` };
    } catch {
      return { ok: false, status: 'error_network' };
    }
  }
  return { ok: false, status: `unsupported_${p}` };
}
