import crypto from 'node:crypto';

/**
 * Provider token vault (Phase 30) — server-only AES-256-GCM encryption for OAuth
 * tokens. The key comes ONLY from env `PROVIDER_TOKEN_ENCRYPTION_KEY` (32 bytes,
 * supplied as 64 hex chars or base64). If the key is missing/invalid the vault is
 * DISABLED: encrypt/decrypt throw, and connection UI/flows stay local-safe
 * ("not configured"). Tokens are NEVER logged, returned to clients, or committed.
 *
 * Ciphertext format (string): `v1:<base64(iv(12) | authTag(16) | ciphertext)>`.
 */
const ENV_KEY = 'PROVIDER_TOKEN_ENCRYPTION_KEY';

/** Parse the env key into a 32-byte Buffer, or null if absent/malformed. Never logs the value. */
function loadKey(): Buffer | null {
  const raw = process.env[ENV_KEY];
  if (!raw || typeof raw !== 'string') return null;
  const v = raw.trim();
  try {
    if (/^[0-9a-fA-F]{64}$/.test(v)) return Buffer.from(v, 'hex');
    // base64 / base64url of 32 bytes
    const b = Buffer.from(v, 'base64');
    if (b.length === 32) return b;
  } catch { /* fall through */ }
  return null;
}

export type KeyStatus = 'ready' | 'missing' | 'invalid';

/** Report vault key status WITHOUT exposing the value. */
export function encryptionKeyStatus(): KeyStatus {
  const raw = process.env[ENV_KEY];
  if (!raw || !String(raw).trim()) return 'missing';
  return loadKey() ? 'ready' : 'invalid';
}

/** Is the token vault usable (a valid key is present)? */
export function encryptionReady(): boolean {
  return loadKey() !== null;
}

/** Encrypt a token string. Throws if the vault is not configured. */
export function encryptToken(plaintext: string): string {
  const key = loadKey();
  if (!key) throw new Error('Provider token vault is not configured.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${Buffer.concat([iv, tag, ct]).toString('base64')}`;
}

/** Decrypt a token string produced by encryptToken. Throws on tamper or if not configured. */
export function decryptToken(payload: string): string {
  const key = loadKey();
  if (!key) throw new Error('Provider token vault is not configured.');
  if (typeof payload !== 'string' || !payload.startsWith('v1:')) throw new Error('Bad token ciphertext.');
  const buf = Buffer.from(payload.slice(3), 'base64');
  if (buf.length < 12 + 16 + 1) throw new Error('Bad token ciphertext.');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

/**
 * Sign/verify a short OAuth `state` value bound to the workspace + provider, so the
 * callback can reject forged/missing state. HMAC-SHA256 keyed by the vault key (only
 * available when the vault is configured, which is also when OAuth is enabled).
 */
export function signState(payload: { workspaceId: string | number; provider: string; nonce: string }): string {
  const key = loadKey();
  if (!key) throw new Error('Provider token vault is not configured.');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', key).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verifyState(state: string): { workspaceId: string | number; provider: string; nonce: string } | null {
  const key = loadKey();
  if (!key || typeof state !== 'string' || !state.includes('.')) return null;
  const [body, mac] = state.split('.');
  if (!body || !mac) return null;
  const expected = crypto.createHmac('sha256', key).update(body).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
}
