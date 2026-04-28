FROM oven/bun:1-alpine AS base
WORKDIR /app

# ── Builder: install all deps and compile everything ─────────────────────────
FROM base AS builder

COPY package.json bun.lock ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/tsconfig/*.json       ./packages/tsconfig/
COPY packages/emails/package.json   ./packages/emails/
COPY apps/web/package.json          ./apps/web/

RUN bun install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/      ./apps/

RUN bun run --filter @zebabu/emails build

# Dummy values required only by SvelteKit's post-build analyse phase, which
# executes server code to detect prerendered routes. Inlined into the RUN
# command so they never persist as image metadata.
RUN DATABASE_URL=postgres://build:build@localhost/build \
    REDIS_URL=redis://localhost:6379 \
    BETTER_AUTH_SECRET=build-secret \
    BETTER_AUTH_BASE_URL=http://localhost:3000 \
    APP_URL=http://localhost:3000 \
    bun run --filter @zebabu/web build

# ── Runner: minimal production image ─────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs bunuser

# Workspace manifests + lockfile for production install
COPY --from=builder /app/package.json              ./
COPY --from=builder /app/bun.lock                  ./
COPY --from=builder /app/packages/tsconfig/package.json ./packages/tsconfig/
COPY --from=builder /app/packages/emails/package.json   ./packages/emails/
# @zebabu/emails compiled output — needed at runtime for email rendering
COPY --from=builder /app/packages/emails/dist           ./packages/emails/dist
COPY --from=builder /app/apps/web/package.json          ./apps/web/

# Run production install so Bun properly wires up workspace resolution.
# --ignore-scripts skips the root `prepare` script (husky, a devDep).
RUN bun install --production --frozen-lockfile --ignore-scripts

# Compiled SvelteKit server (svelte-adapter-bun output)
COPY --from=builder /app/apps/web/build   ./apps/web/build
# SQL migration files read by migrate.mjs at startup
COPY --from=builder /app/apps/web/drizzle ./apps/web/drizzle
# Migration runner
COPY --from=builder /app/apps/web/src/migrate.mjs ./apps/web/migrate.mjs

RUN chown -R bunuser:nodejs /app
USER bunuser

# Bun workspace resolution requires running from the workspace member directory
WORKDIR /app/apps/web
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO /dev/null http://localhost:3000/ || exit 1

CMD ["sh", "-c", "bun migrate.mjs && bun ./build/index.js"]
