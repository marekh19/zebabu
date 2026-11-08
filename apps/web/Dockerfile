FROM oven/bun:1-alpine AS base
WORKDIR /app

# ── Builder: install all deps and compile everything ─────────────────────────
FROM base AS builder

COPY package.json bun.lock ./
COPY packages/tooling/package.json packages/tooling/*.js ./packages/tooling/
COPY packages/tooling/tsconfig/     ./packages/tooling/tsconfig/
COPY packages/api-contract/package.json ./packages/api-contract/
COPY packages/emails/package.json   ./packages/emails/
COPY packages/ui/package.json       ./packages/ui/
COPY apps/api/package.json          ./apps/api/
COPY apps/web/package.json          ./apps/web/

RUN bun install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/      ./apps/

RUN bun run --filter @zebabu/api-contract build

RUN API_INTERNAL_URL=http://localhost:3101 bun run --filter @zebabu/web build

# ── Runtime: shared production files ─────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs bunuser

# Workspace manifests + lockfile for production install
COPY --from=builder /app/package.json              ./
COPY --from=builder /app/bun.lock                  ./
COPY --from=builder /app/packages/tooling/package.json ./packages/tooling/
COPY --from=builder /app/packages/api-contract/package.json ./packages/api-contract/
COPY --from=builder /app/packages/emails/package.json  ./packages/emails/
COPY --from=builder /app/packages/ui/package.json      ./packages/ui/
COPY --from=builder /app/packages/ui/src               ./packages/ui/src
COPY --from=builder /app/packages/api-contract/dist ./packages/api-contract/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/web/package.json          ./apps/web/

# Run production install so Bun properly wires up workspace resolution.
# --ignore-scripts skips the root `prepare` script (husky, a devDep).
RUN bun install --production --frozen-lockfile --ignore-scripts --filter @zebabu/web

# Compiled SvelteKit server (svelte-adapter-bun output)
COPY --from=builder /app/apps/web/build   ./apps/web/build

USER bunuser

# Bun workspace resolution requires running from the workspace member directory
WORKDIR /app/apps/web

FROM runtime AS runner
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/health/ready || exit 1

CMD ["bun", "./build/index.js"]
