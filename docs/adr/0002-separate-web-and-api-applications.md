---
status: accepted
---

# Separate Web and API Applications

Zebabu will use SvelteKit for UI, SSR page composition, localization, and form-specific BFF adapters, while a separate Bun/Hono application owns Better Auth, Budget Planning operations, PostgreSQL, Redis, email delivery, and migrations. Application endpoints will use contract-first oRPC under a versioned `/api/v1` interface with generated OpenAPI documentation; the browser and API will share one public origin, and shared transport schemas will live in a dependency-light contract package.

This replaces app-local persistence because a stable HTTP interface enables headless clients and keeps domain rules behind one authenticated seam. It adds a network hop and a separately deployed application, so SvelteKit adapters are retained only where they provide page composition, progressive forms, redirects, or localization; JSON pass-through endpoints are not retained.

## Consequences

- The API is the only owner of authentication, authorization, domain operations, data stores, migrations, and identity email.
- The web application has no database or Redis access and receives only the secrets needed to call the API internally.
- Browser Session cookies remain host-only and same-origin. Headless clients use scoped API keys after browser auth parity is complete.
- Better Auth routes remain separate from the versioned application contract and may publish a separate generated document.
- `apps/web/docs/adr/0002-compose-cross-context-persistence.md` is superseded.
