# syntax=docker/dockerfile:1
# ExploringToKnow web (Next.js 15 + Payload) — production image.
# Build from the MONOREPO ROOT:  docker build -f apps/web/Dockerfile -t etk-web .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

# ---- deps: install the whole workspace (cached on lockfile) ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---- build the web app (produces .next/standalone) ----
FROM deps AS build
RUN pnpm --filter @etk/web build

# ---- runtime: minimal standalone server ----
FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs
# standalone server + assets (paths reflect monorepo tracing root)
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
