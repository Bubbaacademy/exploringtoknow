import crypto from 'node:crypto';

/**
 * Newsletter provider abstraction. With no provider configured (the default),
 * the system runs in safe LOCAL mode: subscribers are captured and marked active
 * immediately, no external calls are made, and no email is sent. When a provider
 * is wired in a later phase (env NEWSLETTER_PROVIDER + NEWSLETTER_DOUBLE_OPT_IN),
 * double opt-in + confirmation email can be enabled without changing callers.
 */
export function newsletterProvider(): string {
  return (process.env.NEWSLETTER_PROVIDER || 'local').toLowerCase();
}

export function isLocalMode(): boolean {
  return newsletterProvider() === 'local';
}

/** Double opt-in only when a real provider is configured AND explicitly enabled. */
export function isDoubleOptIn(): boolean {
  return !isLocalMode() && process.env.NEWSLETTER_DOUBLE_OPT_IN === 'true';
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function makeToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(24).toString('base64url');
  return { token, hash: hashToken(token) };
}

/**
 * Send a confirmation email via the configured provider. In local mode this is a
 * no-op (returns false = not sent). Provider integration plugs in here later.
 */
export async function sendConfirmationEmail(_email: string, _confirmUrl: string): Promise<boolean> {
  if (isLocalMode()) return false;
  // Provider adapter would send here once credentials are configured.
  return false;
}
