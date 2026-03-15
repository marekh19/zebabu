# ── Builder ──────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app

# Copy workspace manifests before source for better layer caching on pnpm install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/tsconfig/package.json           ./packages/tsconfig/
COPY packages/tsconfig/*.json                 ./packages/tsconfig/
COPY packages/emails/package.json             ./packages/emails/
COPY apps/web/package.json                    ./apps/web/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/      ./apps/

# Build workspace dep first — apps/web imports @zebabu/emails
RUN pnpm --filter @zebabu/emails build

# Dummy env vars required by SvelteKit's post-build analyse phase,
# which executes server code to detect prerendered routes.
# These never reach the runner stage.
ENV DATABASE_URL=postgres://build:build@localhost/build \
    REDIS_URL=redis://localhost:6379 \
    BETTER_AUTH_SECRET=build-secret \
    BETTER_AUTH_BASE_URL=http://localhost:3000 \
    APP_URL=http://localhost:3000

# Build SvelteKit app
RUN pnpm --filter @zebabu/web build

# Create standalone production node_modules — resolves @zebabu/emails workspace
# dep into a flat directory with no symlinks (required for multi-stage copy)
RUN pnpm --filter @zebabu/web deploy --prod /app/standalone

# ── Runner ───────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Production node_modules (flat, workspace deps resolved, includes drizzle-orm)
COPY --from=builder /app/standalone/node_modules ./node_modules
# Compiled SvelteKit server
COPY --from=builder /app/apps/web/build          ./build
# SQL migration files read by migrate.mjs at runtime
COPY --from=builder /app/apps/web/drizzle        ./drizzle
# Plain JS migration runner — no compilation needed, imports from node_modules
COPY apps/web/src/migrate.mjs                    ./migrate.mjs
# Required for Node.js module resolution ("type": "module")
COPY apps/web/package.json                       ./package.json

EXPOSE 3000
# Run pending migrations (idempotent), then start the server
CMD ["sh", "-c", "node migrate.mjs && node build"]
