---
status: accepted
---

# Runtime decisions

## Better Auth and Redis

Better Auth 1.7.2 is pinned. PostgreSQL stores Sessions. Redis is still required for Session lookup, the five-minute cookie cache, and distributed rate limiting. There is no automatic PostgreSQL failover when Redis is unavailable: `/health/ready` returns 503 within two seconds and the replica must leave service.

Redis keys use `zebabu:<APP_ENV>:better-auth:`. Local Compose deliberately disables persistence. Production Redis must enable AOF or managed persistence and high availability. Losing Redis can require sign-in again and resets rate-limit state. A revoked Session may remain accepted until its signed cookie cache expires, for at most five minutes.

Better Auth's API Key plugin is pinned to 1.7.2. Migration `0013_chemical_skullbuster.sql` adds its User-owned `apikey` table after the pre-split migration head. Keys are hashed in PostgreSQL, expire after at most 365 days, and have independent per-key rate limits. `read` permits safe application requests; `write` also permits mutations. API keys never create browser Sessions. Creating, listing, and revoking keys requires a Session.

After an explicit Better Auth version change, generate its expected schema from the API identity configuration and compare it with `apps/api/src/modules/identity/schema.ts` before creating a Drizzle migration. Application-owned User columns are expected additions.

## Database rollout

The release workflow builds web and API images from the same commit. The web image is in `zebabu-web`; the API runtime and migration images are in `zebabu-api`. Runtime images use the commit SHA tag; the migration image uses `migration-` followed by that SHA. A dedicated Coolify Docker Image application runs the migration image on the same destination network as PostgreSQL. Its Docker health check passes only after `bun src/migrate.mjs` succeeds. The workflow waits for that result, confirms the migration application has exited, deploys the API, checks `https://dev.zebabu.com/api/health/ready`, then deploys the web. A failure stops the release before the next application. A later release cannot start while a previous migration image is still running. Application startup never runs migrations.

Configure the migration application without a domain or host port mapping. Coolify requires an internal port, so use `3000`; the migration container does not serve traffic. Give it the PostgreSQL Internal URL as `DATABASE_URL`. Configure the API on port `3101`, with ingress routing `/api/*` to it on the web hostname. Store the API and migration application UUIDs as GitHub secrets `COOLIFY_API_APP_UUID` and `COOLIFY_MIGRATION_APP_UUID`. Store a Coolify token with `read` and `write` permissions as `COOLIFY_CONFIG_API_TOKEN`; `COOLIFY_API_TOKEN` handles deploy and stop operations. Add these before enabling the release workflow. A failed migration must leave the current web container in service.

Set the web runtime's `ORIGIN` to the public web origin and `API_INTERNAL_URL` to the private API URL. SvelteKit uses `ORIGIN` to validate native form submissions. The API runtime needs its database, Redis, Better Auth, and email variables from `apps/api/.env.example`.

Main-branch workflows must not cancel an in-progress release because that could interrupt a running migration. Keep schema changes compatible with the currently running web image until the new image is healthy.

Coolify's application pre-deployment command runs inside the old container, which may not contain new migration files. Its post-deployment command runs after the new application starts and does not gate the deployment. Neither is used for schema changes. See [Coolify's deployment command behavior](https://coolify.io/docs/applications/builds/dockerfile).

The Bun SQL pool is configured by `DB_POOL_SIZE`, `DB_CONNECTION_TIMEOUT_SECONDS`, `DB_IDLE_TIMEOUT_SECONDS`, and `DB_QUERY_TIMEOUT_MS`. SIGINT and SIGTERM close it cleanly.
