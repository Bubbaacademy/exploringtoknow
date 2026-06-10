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
};

export default withPayload(nextConfig);
