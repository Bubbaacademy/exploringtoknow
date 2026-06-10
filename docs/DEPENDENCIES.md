# Initial Dependency List (Phase 0)

Declared in package.json files; install with `pnpm install`. Versions are
pinned to a known-good baseline and may be bumped during install.

## Root (dev)
turbo ^2.1.3 · typescript ^5.6.3 · @types/node ^20.16 · prettier ^3.3

## apps/web (@etk/web)
**runtime:** next 15.0.3 · react 19 · react-dom 19 · payload ^3 ·
@payloadcms/db-postgres ^3 · @payloadcms/next ^3 · @payloadcms/richtext-lexical ^3 ·
@payloadcms/storage-s3 ^3 · @etk/core · @etk/db
**dev:** typescript · @types/react 19 · @types/react-dom 19 · eslint · eslint-config-next

## apps/worker (@etk/worker)
**runtime:** pg-boss ^10 · node-cron ^3 · @etk/core · @etk/db · @etk/ai
**dev:** typescript · tsx ^4 · @types/node · @types/node-cron

## packages/core (@etk/core)
zod ^3.23

## packages/db (@etk/db)
pg ^8.13 · @etk/core · (dev) @types/pg

## packages/ai (@etk/ai) — LangGraph
@langchain/langgraph ^0.2 · @langchain/core ^0.3 · @etk/core

## Reserved packages (no deps yet)
intelligence · content · publishing · social · tracking · analytics · payload-types

## Notes
- **Queue:** pg-boss (Postgres-backed) — no Redis dependency in the MVP (ADR-0002).
- **AI SDKs** (@anthropic-ai/sdk, openai) are added in Phase 1 when real nodes land.
- **Meta / GA4 / GSC / HubSpot / Amazon** SDKs are added in Phases 2–3.
