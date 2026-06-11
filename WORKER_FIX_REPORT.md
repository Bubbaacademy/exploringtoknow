# WORKER_FIX_REPORT.md

_Status: FIXED, DEPLOYED, and OPERATOR-CONFIRMED LIVE. Updated: 2026-06-11T02:21:59Z._

## Symptom
`etk-worker` crash-looped at startup:
`Error: Dynamic require of "punycode" is not supported`

## Root cause (reproduced, not assumed)
The worker is bundled with **tsup (esbuild) → ESM**, inlining workspace packages
(`noExternal: [/^@etk\/]`). Through `@etk/ai → @etk/providers`, esbuild also
inlined the **AI SDKs** (they were transitive, not declared worker deps):
`openai` (257 refs), `@anthropic-ai/sdk` (36), `node-fetch`, `whatwg-url`.
`whatwg-url@5` is CommonJS and calls `require('punycode')`; esbuild's ESM output
routes that through a `__require` helper that **throws** when no ambient `require`
exists → fatal at startup → container restart loop. Confirmed by running the bundle:
`at .../whatwg-url@5.0.0/.../url-state-machine.js`.

## Fix (build configuration — `apps/worker/tsup.config.ts`, commit `c158c5f`)
ESM-interop banner so esbuild's `__require` delegates to a real Node `require`:
```ts
banner: { js:
  "import { createRequire as __etkCreateRequire } from 'module';" +
  "import { fileURLToPath as __etkFileURLToPath } from 'url';" +
  "import { dirname as __etkDirname } from 'path';" +
  "const require = __etkCreateRequire(import.meta.url);" +
  "const __filename = __etkFileURLToPath(import.meta.url);" +
  "const __dirname = __etkDirname(__filename);"
}
```
No architecture change. Worker-only.

## Verification
- **Pre-deploy (build env):** rebuilt bundle, ran `node dist/index.js` → fatal error
  gone (only a `punycode` deprecation **warning**); worker booted to DB connect.
- **Production (operator-confirmed):** `etk-worker` Up and not restarting; logs show
  `scheduler_started` and `worker_ready`; no `Dynamic require of "punycode"`.
  Web, Postgres, Caddy, /admin, public site, /api/health all remained healthy.

## Deployment method (surgical, worker-only)
Updated `apps/worker/tsup.config.ts` on the VPS → `docker compose build worker` →
`docker compose up -d --no-deps worker`. No other container touched.

## Residual
- Harmless `punycode` DeprecationWarning remains. Optional cleanup: declare
  `@anthropic-ai/sdk`/`openai` as explicit worker deps to externalize them (leaner
  image, removes the warning). Tracked in NEXT_PHASE_PLAN §1.
