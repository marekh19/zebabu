# Zebabu API

Hono serves Better Auth at `/api/auth/*`, the oRPC application API at `/api/v1/*`, the OpenAPI document at `/api/openapi`, and its reference at `/api/docs`.

Copy `.env.example` to `.env` and fill in the API secrets. From the workspace root, run `bun run db:start`, `bun run db:migrate`, then `bun run --filter @zebabu/api dev`. The API listens on port 3101 by default. The web development server proxies `/api/*` to this port.

The API owns PostgreSQL, Redis, identity email, and migrations. The migration image runs `src/migrate.mjs` once before the API runtime image is deployed. Runtime replicas do not migrate on startup.

Signed-in users can create API keys with `POST /api/v1/keys` using `{ "name": "...", "scope": "read" | "write", "expiresInDays": 1..365 }`. The response shows the key secret once. Send it as `x-api-key` on later requests. Read keys allow `GET`; write keys allow reads and mutations. List keys with `GET /api/v1/keys` and revoke one with `DELETE /api/v1/keys/{keyId}`. Key management itself requires a browser Session. Better Auth stores a hash of each key and rate limits each key.

Use `bun run --filter @zebabu/api typecheck` and `bun --env-file=apps/api/.env run --filter @zebabu/api test` for local checks. The integration tests require PostgreSQL and Redis.
