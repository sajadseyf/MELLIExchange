FROM node:20-alpine AS base
RUN corepack enable pnpm

# ── Install all deps ─────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @melli/admin build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /repo/apps/admin/.next/standalone ./
COPY --from=builder /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /repo/apps/admin/public ./apps/admin/public 2>/dev/null || true
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/admin/server.js"]
