# syntax=docker/dockerfile:1
# ExploringToKnow worker (LangGraph orchestrator). Build from MONOREPO ROOT:
#   docker build -f apps/worker/Dockerfile -t etk-worker .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter @etk/worker build
# prune to production deps for the worker (externalized deps: pg-boss, node-cron, @langchain/*)
RUN pnpm --filter @etk/worker deploy --prod /out

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m worker
COPY --from=build /out/dist ./dist
COPY --from=build /out/node_modules ./node_modules
USER worker
CMD ["node", "dist/index.js"]
