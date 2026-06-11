# WORKER_FIX_REPORT.md

## Symptom
`etk-worker` crash-looping at startup with:
`Error: Dynamic require of "punycode" is not supported`

## Root cause (verified, not assumed)
The worker is bundled with **tsup (esbuild) to ESM**. Its config inlines the
workspace packages (`noExternal: [/^@etk\//]`). Following `@etk/ai → @etk/providers`,
esbuild pulled the **AI SDKs into the bundle** because they are transitive deps not
declared as the worker's own dependencies:

- bundle contained `openai` (257 refs), `@anthropic-ai/sdk` (36), `node-fetch`, `whatwg-url`.
- `whatwg-url@5` (CommonJS) calls `require('punycode')`.
- esbuild's ESM output replaces dynamic `require()` with a `__require` helper that
  **throws** when no ambient `require` exists → fatal at startup → container restarts.

Reproduced locally by running the built bundle:
```
Error: Dynamic require of "punycode" is not supported
  at .../whatwg-url@5.0.0/.../url-state-machine.js
```

## Fix (source/build configuration)
`apps/worker/tsup.config.ts` — add an ESM-interop banner so esbuild's `__require`
delegates to a real Node `require`:
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
This is the standard, documented fix for esbuild ESM + CommonJS dynamic `require`.
No architecture change; commit `c158c5f`.

## Verification (done here, on Node 22)
Rebuilt the worker and ran the bundle:
```
$ node apps/worker/dist/index.js
(node) DeprecationWarning: The `punycode` module is deprecated   <- warning only
{"level":"error","msg":"worker_fatal","err":"connect ECONNREFUSED 127.0.0.1:5432"}
```
The fatal dynamic-require crash is **gone**; the worker boots through env-load and
queue-init and fails only at DB connect (no local Postgres in the build env). On the
VPS, with Postgres reachable, the worker stays up.

## Redeploy (on the VPS — worker only)
After syncing the repo to commit `c158c5f`:
```
cd /opt/exploringtoknow/compose
docker compose --env-file ../env/.env --profile app build worker
docker compose --env-file ../env/.env --profile app up -d worker
docker logs -n 50 etk-worker        # expect: worker_ready / scheduler_started
```

## Prevention
- Declare runtime SDKs as explicit worker deps later to externalize them (leaner image), or keep the banner (self-contained bundle). Banner alone fully resolves the class of error.
