import crypto from 'node:crypto';
import { emailEnabled, emailProvider, sendEmail } from '@/lib/email';
import { SITE_NAME } from '@/lib/public';

/**
 * Newsletter behavior. Default = safe LOCAL mode: subscribers are captured and
 * marked active immediately, no email is sent. Double opt-in + confirmation email
 * activate only when a provider is configured (see lib/email) AND
 * NEWSLETTER_DOUBLE_OPT_IN=true. Callers never change.
 */
export function newsletterProvider(): string {
  return emailProvider();
}

export function isLocalMode(): boolean {
  return !emailEnabled();
}

/** Double opt-in only when delivery is actually possible AND explicitly enabled. */
export function isDoubleOptIn(): boolean {
  return emailEnabled() && process.env.NEWSLETTER_DOUBLE_OPT_IN === 'true';
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function makeToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(24).toString('base64url');
  return { token, hash: hashToken(token) };
}

/**
 * Send a confirmation email via the configured provider. Local mode is a no-op
 * (returns local_no_send). Returns the provider status string for lastEmailStatus.
 */
export async function sendConfirmationEmail(email: string, confirmUrl: string): Promise<string> {
  if (!emailEnabled()) return 'local_no_send';
  const r = await sendEmail({
    to: email,
    subject: `Confirm your ${SITE_NAME} subscription`,
    html: `<p>Thanks for subscribing to ${SITE_NAME}.</p><p>Please confirm your subscription:</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you didn’t request this, you can ignore this email.</p>`,
    text: `Confirm your ${SITE_NAME} subscription: ${confirmUrl}`,
  });
  return r.status;
}
