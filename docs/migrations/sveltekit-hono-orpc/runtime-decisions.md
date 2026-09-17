# Runtime decisions

## Better Auth and Redis

Better Auth 1.7.2 is pinned. PostgreSQL stores Sessions. Redis is still required for Session lookup, the five-minute cookie cache, and distributed rate limiting. There is no automatic PostgreSQL failover when Redis is unavailable: `/health/ready` returns 503 within two seconds and the replica must leave service.

Redis keys use `zebabu:<APP_ENV>:better-auth:`. Local Compose deliberately disables persistence. Production Redis must enable AOF or managed persistence and high availability. Losing Redis can require sign-in again and resets rate-limit state. A revoked Session may remain accepted until its signed cookie cache expires, for at most five minutes.

Generate the expected Better Auth schema after an explicit version change:

```sh
cd apps/web
bunx --bun auth@1.7.2 generate \
  --config ./src/lib/server/application.ts \
  --output /tmp/zebabu-better-auth-schema.ts \
  --yes
```

Compare it with `src/lib/identity/server/persistence/schema.ts` before generating a Drizzle migration. Application-owned User columns are expected additions.

## Database rollout

The release workflow builds web and migration images from the same commit. A dedicated Coolify Docker Image application runs the migration image on the same destination network as PostgreSQL. Its Docker health check passes only after `bun src/migrate.mjs` succeeds. The workflow waits for that result, stops the migration application, and then deploys the web image. Both applications use the commit SHA as their image tag. Application startup never runs migrations.

Configure the migration application without a domain or exposed port. Give it the PostgreSQL Internal URL as `DATABASE_URL` and the same registry access as the web application. Store its UUID as the GitHub secret `COOLIFY_MIGRATION_APP_UUID`. Store a Coolify token with `read` and `write` permissions as `COOLIFY_CONFIG_API_TOKEN`; the existing `COOLIFY_API_TOKEN` handles deploy and stop operations. Add these before enabling the release workflow. A failed migration must leave the current web container in service.

Main-branch workflows must not cancel an in-progress release because that could interrupt a running migration. Keep schema changes compatible with the currently running web image until the new image is healthy.

Coolify's application pre-deployment command runs inside the old container, which may not contain new migration files. Its post-deployment command runs after the new application starts and does not gate the deployment. Neither is used for schema changes. See [Coolify's deployment command behavior](https://coolify.io/docs/applications/builds/dockerfile).

The Bun SQL pool is configured by `DB_POOL_SIZE`, `DB_CONNECTION_TIMEOUT_SECONDS`, `DB_IDLE_TIMEOUT_SECONDS`, and `DB_QUERY_TIMEOUT_MS`. SIGINT and SIGTERM close it cleanly.
