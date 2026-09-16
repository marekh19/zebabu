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

Run `bun run --filter @zebabu/web db:migrate` once in a CI or deployment job before rolling out web replicas. The web image contains the migration runner and ordered Drizzle journal, but application startup never runs it.

The Bun SQL pool is configured by `DB_POOL_SIZE`, `DB_CONNECTION_TIMEOUT_SECONDS`, `DB_IDLE_TIMEOUT_SECONDS`, and `DB_QUERY_TIMEOUT_MS`. SIGINT and SIGTERM close it cleanly.
