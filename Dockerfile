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

# Build SvelteKit app
RUN pnpm --filter @zebabu/web build

# Compile migration script using esbuild (already available as a vite dep).
# Bundles drizzle-orm + postgres into a single file so the runner needs no devDeps.
RUN node_modules/.bin/esbuild apps/web/src/migrate.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outfile=apps/web/build/migrate.mjs

# Create standalone production node_modules — resolves @zebabu/emails workspace
# dep into a flat directory with no symlinks (required for multi-stage copy)
RUN pnpm --filter @zebabu/web deploy --prod /app/standalone

# ── Runner ───────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Production node_modules (flat, workspace deps resolved)
COPY --from=builder /app/standalone/node_modules ./node_modules
# Compiled SvelteKit server + bundled migration script
COPY --from=builder /app/apps/web/build          ./build
# SQL migration files read by migrate.mjs at runtime
COPY --from=builder /app/apps/web/drizzle        ./drizzle

EXPOSE 3000
# Run pending migrations (idempotent), then start the server
CMD ["sh", "-c", "node build/migrate.mjs && node build/index.js"]
