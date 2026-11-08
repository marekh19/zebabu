FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package.json bun.lock ./
COPY packages/tooling/package.json packages/tooling/*.js ./packages/tooling/
COPY packages/tooling/tsconfig/ ./packages/tooling/tsconfig/
COPY packages/api-contract/package.json ./packages/api-contract/
COPY packages/emails/package.json ./packages/emails/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN bun run --filter @zebabu/api-contract build
RUN bun run --filter @zebabu/emails build
RUN bun run --filter @zebabu/api build

FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs bunuser
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./
COPY --from=builder /app/packages/tooling/package.json ./packages/tooling/
COPY --from=builder /app/packages/api-contract/package.json ./packages/api-contract/
COPY --from=builder /app/packages/api-contract/dist ./packages/api-contract/dist
COPY --from=builder /app/packages/emails/package.json ./packages/emails/
COPY --from=builder /app/packages/emails/dist ./packages/emails/dist
COPY --from=builder /app/packages/ui/package.json ./packages/ui/
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/web/package.json ./apps/web/
RUN bun install --production --frozen-lockfile --ignore-scripts --filter @zebabu/api
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/drizzle ./apps/api/drizzle
COPY --from=builder /app/apps/api/src/migrate.mjs ./apps/api/src/migrate.mjs
USER bunuser
WORKDIR /app/apps/api

FROM runtime AS migration
HEALTHCHECK --interval=5s --timeout=2s --start-period=5m --retries=3 \
  CMD test -f /tmp/zebabu-migration-complete
CMD ["sh", "-c", "bun src/migrate.mjs && touch /tmp/zebabu-migration-complete && exec tail -f /dev/null"]

FROM runtime AS runner
EXPOSE 3101
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3101/health/ready || exit 1
CMD ["bun", "./dist/index.js"]
