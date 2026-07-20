import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Two surfaces in one app: public (site) + internal (dashboard) + Payload admin.
  // Standalone output → slim production image; tracing root = monorepo root so
  // pnpm-symlinked workspace deps are bundled into .next/standalone.
  output: 'standalone',
  outputFileTracingRoot: path.join(dir, '../../'),
  experimental: { reactCompiler: false },
  /**
   * Phase 2E — magazine section routes were renamed to their canonical public
   * names. The previous paths were live and present in the sitemap, so they are
   * kept as PERMANENT (308) redirects: one canonical URL per section, existing
   * links and any search-engine equity preserved.
   *
   * Scope note: these two paths are served only by the ExploringToKnow magazine.
   * The bubbaaffiliate.com gateway exposes `/`, `/sellers`, `/creators`,
   * `/pricing` and `/how-it-works` only, so neither rule can affect gateway
   * routing, and `middleware.ts` (which owns host-aware gateway rewrites) is
   * untouched.
   */
  async redirects() {
    return [
      { source: '/reviews', destination: '/product-reviews', permanent: true },
      { source: '/explore', destination: '/explore-picks', permanent: true },
    ];
  },
};

export default withPayload(nextConfig);
