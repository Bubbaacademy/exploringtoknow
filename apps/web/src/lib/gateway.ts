import { headers } from 'next/headers';

/**
 * Host-aware base path for BubbaAffiliate gateway links (Phase 1C).
 *
 * On the `bubbaaffiliate.com` apex the gateway is served at the site root, so links
 * are clean (`/sellers`). Everywhere else (e.g. `exploringtoknow.com`) the gateway
 * lives under `/bubbaaffiliate`. The actual request routing — mapping the clean
 * apex paths to the internal `/bubbaaffiliate/*` routes without changing the URL —
 * is enforced in `middleware.ts`; this helper only keeps rendered links consistent.
 */
const GATEWAY_HOSTS = new Set(['bubbaaffiliate.com', 'www.bubbaaffiliate.com']);

export async function gatewayBase(): Promise<string> {
  const host = ((await headers()).get('host') || '').toLowerCase().split(':')[0] || '';
  return GATEWAY_HOSTS.has(host) ? '' : '/bubbaaffiliate';
}

/** Build a gateway href from the host-aware base and a leaf path ('' → home). */
export function gwHref(base: string, path = ''): string {
  if (!path || path === '/') return base || '/';
  return `${base}${path}`;
}
