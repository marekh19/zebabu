# ── Builder ──────────────────────────────────────────────────────────────────
FROM oven/bun:alpine AS builder
WORKDIR /app

# Copy workspace manifests before source for better layer caching on bun install
COPY package.json bun.lock ./
COPY packages/tsconfig/package.json           ./packages/tsconfig/
COPY packages/tsconfig/*.json                 ./packages/tsconfig/
COPY packages/emails/package.json             ./packages/emails/
COPY apps/web/package.json                    ./apps/web/

RUN bun install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/      ./apps/

# Build workspace dep first — apps/web imports @zebabu/emails
RUN bun run --filter @zebabu/emails build

# Dummy env vars required by SvelteKit's post-build analyse phase,
# which executes server code to detect prerendered routes.
# These never reach the runner stage.
ENV DATABASE_URL=postgres://build:build@localhost/build \
    REDIS_URL=redis://localhost:6379 \
    BETTER_AUTH_SECRET=build-secret \
    BETTER_AUTH_BASE_URL=http://localhost:3000 \
    APP_URL=http://localhost:3000

# Build SvelteKit app — bunx --bun runs Vite in Bun's runtime so bun built-ins
# (drizzle-orm/bun-sql, bun:redis) are resolvable during SSR analysis
RUN bun run --filter @zebabu/web build

# Prepare production standalone — production-only deps with workspace structure
# intact so bun resolves @zebabu/emails correctly
RUN mkdir -p /standalone/packages/tsconfig /standalone/packages/emails /standalone/apps/web && \
    cp package.json bun.lock /standalone/ && \
    cp packages/tsconfig/package.json /standalone/packages/tsconfig/ && \
    cp packages/emails/package.json /standalone/packages/emails/ && \
    cp -r packages/emails/dist /standalone/packages/emails/ && \
    cp apps/web/package.json /standalone/apps/web/

WORKDIR /standalone
RUN bun install --production --frozen-lockfile

# ── Runner ───────────────────────────────────────────────────────────────────
FROM oven/bun:alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Production node_modules (Docker COPY follows workspace symlinks)
COPY --from=builder /standalone/node_modules  ./node_modules
# Compiled SvelteKit server (svelte-adapter-bun output)
COPY --from=builder /app/apps/web/build       ./build
# SQL migration files read by migrate.mjs at runtime
COPY --from=builder /app/apps/web/drizzle     ./drizzle
# Plain JS migration runner
COPY apps/web/src/migrate.mjs                 ./migrate.mjs
# Required for Bun module resolution ("type": "module")
COPY apps/web/package.json                    ./package.json

EXPOSE 3000
# Run pending migrations (idempotent), then start the server
CMD ["sh", "-c", "bun migrate.mjs && bun ./build/index.js"]
