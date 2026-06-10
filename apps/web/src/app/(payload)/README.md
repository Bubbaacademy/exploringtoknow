# (payload) route group

Payload 3 mounts its admin UI and REST/GraphQL API into the Next.js app here via
`@payloadcms/next`. When dependencies are installed, generate the standard mount
files with Payload's scaffolding, or copy them from the Payload Next.js template:

    pnpm --filter @etk/web exec payload generate:importmap

Expected files (created when deps are installed; omitted from Phase 0 scaffold to
avoid committing generated glue):
  (payload)/admin/[[...segments]]/page.tsx
  (payload)/admin/[[...segments]]/not-found.tsx
  (payload)/api/[...slug]/route.ts
  (payload)/layout.tsx

Config is already provided at src/payload.config.ts (Users + Media only in Phase 0).
