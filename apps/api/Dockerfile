FROM node:20-alpine AS base
RUN corepack enable pnpm

# ── Install all deps ─────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile

# ── Build API ─────────────────────────────────────────────────────────────────
FROM deps AS builder
RUN pnpm --filter @melli/api build
RUN pnpm deploy --filter @melli/api --prod /prod/api

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /prod/api ./
COPY --from=builder /repo/apps/api/dist ./dist
RUN mkdir -p uploads
EXPOSE 4000
CMD ["node", "dist/index.js"]
