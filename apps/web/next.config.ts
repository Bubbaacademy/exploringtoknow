import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig: NextConfig = {
  // Two surfaces in one app: public (site) + internal (dashboard) + Payload admin.
  experimental: { reactCompiler: false },
};

// withPayload mounts the Payload admin + API into the Next.js app.
export default withPayload(nextConfig);
