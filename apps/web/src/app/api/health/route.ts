import { NextResponse } from 'next/server';

/**
 * GET /api/health — liveness + dependency status. Read-only, fast.
 * Phase 0: reports app up and whether required env vars are present.
 * Phase 3+: also surfaces last pipeline_run status and worker heartbeat.
 */
export function GET() {
  const required = ['DATABASE_URL', 'PAYLOAD_SECRET', 'AUTH_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  return NextResponse.json({
    status: missing.length ? 'degraded' : 'ok',
    service: 'web',
    missingEnv: missing,
    time: new Date().toISOString(),
  });
}
