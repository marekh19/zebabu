# SvelteKit, Hono, and oRPC Migration Plan

This plan starts after the [prerequisites](prerequisites.md) pass. It implements the decision in [ADR 0002](../../adr/0002-separate-web-and-api-applications.md). Use the [verification plan](verification-plan.md) as the acceptance test for every vertical slice and the final cutover.

## Target architecture

```text
Browser or headless client
          |
          | https://app.zebabu.com
          v
   ingress / reverse proxy
      |                 |
      | /*              | /api/*
      v                 v
 apps/web            apps/api
 SvelteKit           Hono
 UI and SSR          Better Auth
 form BFF            oRPC + OpenAPI
 localization        domain operations
                     Drizzle migrations
                          |
                    PostgreSQL, Redis,
                    Resend/email rendering
```

Use one public origin. Route `/api/auth/*`, `/api/v1/*`, `/api/openapi`, and `/api/docs` to `apps/api`; route everything else to `apps/web`. This keeps browser cookies first-party and avoids credentialed cross-origin requests.

In local development, proxy `/api/*` from the SvelteKit development server to the API port. For server-side rendering and form actions, SvelteKit should call a private `API_INTERNAL_URL` while preserving the public request's cookie and origin semantics.

## Ownership

### `apps/api`

The API application owns:

- the Better Auth instance and `/api/auth/*` handler;
- Session and API-key authentication;
- User authorization and ownership checks;
- Identity and Budget Planning domain operations;
- Drizzle schemas, repositories, transactions, and migrations;
- PostgreSQL and Redis connections;
- verification and password-reset email delivery;
- the Hono application, oRPC handlers, OpenAPI documents, health endpoints, and request logging;
- future jobs, exchange-rate integration, CSV import, and CSV export.

### `apps/web`

The web application owns:

- Svelte components and SvelteKit routes;
- SSR page composition and navigation redirects;
- Paraglide localization;
- Superforms state, `FormData` parsing, and progressive enhancement;
- mapping API error codes to localized field and form errors;
- optimistic browser state and rollback;
- a typed API client and the small BFF adapters that earn their place.

The web application must not connect to PostgreSQL or Redis, instantiate Better Auth, send identity email, execute migrations, or import server-domain implementation.

### `packages/api-contract`

This package owns the public interface:

- locale-free Zod request and response schemas;
- transport DTOs and enums;
- oRPC contracts and OpenAPI operation metadata;
- stable error codes and error bodies;
- authentication security-scheme metadata.

It must not import SvelteKit, Superforms, Paraglide, Drizzle, Hono handlers, database rows, or server implementation. Do not add a general shared domain package until two real runtime owners need one.

## BFF rule

Keep a SvelteKit server endpoint or action only when it performs at least one web concern:

- combines multiple API reads for one page;
- parses browser `FormData`;
- preserves non-JavaScript form submission;
- maps error codes to localized form errors;
- redirects after a mutation;
- manages web-only cookie forwarding.

Delete a SvelteKit endpoint that only forwards JSON. The current category reorder, Transaction paid-state, and Transaction position endpoints should become direct browser calls to `/api/v1/*`.

## API conventions

- Use contract-first oRPC and its OpenAPI handler. Do not expose a parallel RPC protocol until a real client needs it.
- Prefix application operations with `/api/v1`. Better Auth remains under `/api/auth`.
- Give every operation an explicit HTTP method, path, operation ID, tag, summary, input schema, success schema, and typed errors.
- Generate OpenAPI 3.1.1 deterministically at `/api/openapi` and render it at `/api/docs`.
- Publish Better Auth documentation as a separate document/source if its OpenAPI plugin is enabled. Do not merge generated auth paths into the application contract.
- Return ISO 8601 timestamp strings and canonical decimal strings for money and percentages.
- Return one structured error shape containing a stable code, safe details where applicable, and a request ID. Do not expose stack traces, SQL details, or unexpected exception messages.
- Derive the authenticated User from request context. Contracts never accept a User ID for ownership.
- Pin all `@orpc/*` packages to the same stable version. Avoid beta releases for this migration.

## Initial HTTP interface

The exact response projections belong in `packages/api-contract`; this list fixes operation ownership and routes.

| Method   | Path                                                                | Operation                                                        |
| -------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `GET`    | `/api/v1/profile`                                                   | Get the authenticated User profile                               |
| `PATCH`  | `/api/v1/profile`                                                   | Update application-owned profile fields such as primary currency |
| `GET`    | `/api/v1/categories`                                                | List the User's reusable Categories and usage data               |
| `POST`   | `/api/v1/categories`                                                | Create a Category                                                |
| `PATCH`  | `/api/v1/categories/{categoryId}`                                   | Update a Category                                                |
| `DELETE` | `/api/v1/categories/{categoryId}`                                   | Delete a Category                                                |
| `PUT`    | `/api/v1/categories/allocation-targets`                             | Replace default Allocation Targets                               |
| `GET`    | `/api/v1/budgets`                                                   | List the User's Budgets                                          |
| `POST`   | `/api/v1/budgets`                                                   | Create a Monthly or Scenario Budget                              |
| `GET`    | `/api/v1/budgets/{budgetId}`                                        | Get a Budget with BudgetCategories and Transactions              |
| `DELETE` | `/api/v1/budgets/{budgetId}`                                        | Delete a Budget                                                  |
| `POST`   | `/api/v1/budgets/{budgetId}/duplicate`                              | Duplicate a Budget                                               |
| `POST`   | `/api/v1/budgets/{budgetId}/categories`                             | Add a reusable Category to a Budget                              |
| `PATCH`  | `/api/v1/budgets/{budgetId}/categories/{budgetCategoryId}/position` | Position a BudgetCategory                                        |
| `PUT`    | `/api/v1/budgets/{budgetId}/allocation-targets`                     | Replace Budget Allocation Targets                                |
| `POST`   | `/api/v1/budgets/{budgetId}/transactions`                           | Create a Transaction                                             |
| `PATCH`  | `/api/v1/budgets/{budgetId}/transactions/{transactionId}`           | Update a Transaction                                             |
| `DELETE` | `/api/v1/budgets/{budgetId}/transactions/{transactionId}`           | Delete a Transaction                                             |
| `PUT`    | `/api/v1/budgets/{budgetId}/transactions/{transactionId}/paid`      | Set paid state explicitly                                        |
| `PATCH`  | `/api/v1/budgets/{budgetId}/transactions/{transactionId}/position`  | Move or reorder a Transaction                                    |

Nested IDs must be validated together. A Transaction or BudgetCategory that exists outside `{budgetId}` is not found for that route.

## Migration sequence

### 1. Record the seam

- Accept ADR 0002 and mark the old app-local persistence ADR as superseded.
- Add this migration area to the repository documentation index if one is introduced.
- Treat the current product specification's full-stack-only structure and no-CORS assumption as historical. Update it when the cutover lands.
- Keep current context vocabulary. During the cutover, move each `CONTEXT.md` to its owning workspace and update `CONTEXT-MAP.md`; do not duplicate a context in web and API.

**Gate:** repository docs describe one target and no active ADR contradicts it.

### 2. Create the contract package

- Add `packages/api-contract` with Zod and the contract-building oRPC package only.
- Define common ID, timestamp, decimal, pagination if needed, error, and authentication schemas.
- Define Identity and Budget Planning contracts using the routes above.
- Add examples for success and each declared error to improve generated documentation.
- Add contract tests for accepted and rejected wire values. Snapshot the generated operation IDs and paths.

**Gate:** the package builds in isolation and has no server, UI, persistence, or localization dependency.

### 3. Create the API shell

- Add `apps/api` targeting Bun.
- Install Hono and stable, exactly aligned oRPC packages.
- Validate all environment variables at startup.
- Add request IDs, structured logging with secret/cookie redaction, secure headers, body-size limits, centralized error mapping, and graceful shutdown.
- Add `/health/live` for process health and `/health/ready` for PostgreSQL and Redis readiness.
- Mount the oRPC OpenAPI handler under `/api/v1/*` and documentation under `/api/openapi` and `/api/docs`.
- Apply an exact Origin allowlist and CSRF protection to cookie-authenticated state-changing application routes. Better Auth's own protection does not cover the application routes.
- Keep CORS disabled in the normal same-origin deployment. If a separate trusted origin is required later, allow that exact origin with credentials; never use a wildcard with cookies.

**Gate:** a placeholder protected operation returns typed unauthorized and success responses, appears in OpenAPI, and carries one request ID through logs and errors.

### 4. Move persistence as one composition root

- Move the Identity schema, Budget Planning schema factory, application schema composition, repositories, database client, Drizzle config, migration runner, and migration files to `apps/api` together.
- Preserve the existing migration journal and migration history exactly.
- Keep the injected User-table relationship that prevents Budget Planning from importing Identity persistence directly.
- Make the API the sole runtime database owner.
- Move integration test helpers to the API and use the production Bun SQL driver.
- Add explicit pool limits sized against the total number of API replicas and PostgreSQL's connection budget.

Do not run web and API writes in parallel. Because there are no production Users, use a bounded branch cutover instead of dual writes, compatibility tables, or data synchronization.

**Gate:** the API can migrate an empty database and an existing database, then pass repository and transaction tests. The web still runs until vertical endpoints replace its imports.

### 5. Move Better Auth

- Move Better Auth configuration, Identity persistence, Redis secondary storage, rate limiting, and email callbacks to `apps/api`.
- Mount `app.all('/api/auth/*', ...)` before the oRPC catch-all.
- Resolve the Session once per request from the raw request headers. Cache that promise in request context.
- Expose a principal with an explicit anonymous or Session-authenticated state. Protected procedures require the latter and produce the typed unauthorized error.
- Keep the browser Better Auth client on relative `/api/auth/*` URLs.
- Configure host-only secure cookies, the public Better Auth URL, exact trusted origins, and public web callback/reset URLs.
- Implement `ensureUserProvisioned` after successful authentication rather than inside Better Auth's post-create hook.
- In SvelteKit SSR, forward the original `Cookie`, `Origin`, and request ID. Preserve every upstream `Set-Cookie` header on the final response.
- If ingress routing is unavailable in an environment, use one narrow SvelteKit `/api/*` proxy with no domain logic.

**Gate:** sign-up through sign-out and password recovery pass through the public origin. Session creation, refresh, revocation, cookies, Redis behavior, email links, and redirects match the baseline.

### 6. Migrate Categories as the first vertical slice

- Implement Category procedures from contract through authorization, domain operation, repository, and PostgreSQL.
- Make SvelteKit Category page loads call the typed client.
- Keep Category Superforms actions as BFF adapters. They parse `FormData`, call the API, localize typed errors, and return SvelteKit form responses or redirects.
- Verify all Category rules and two-User isolation before removing the corresponding web server implementation.

**Gate:** no Category domain or persistence implementation remains in web; enhanced and non-enhanced forms behave identically to the baseline.

### 7. Migrate Budgets and Transactions

- Implement Budget list, creation, detail, duplication, deletion, Category membership, and Allocation Target procedures.
- Implement Transaction creation, editing, deletion, paid state, and positioning procedures.
- Preserve the prerequisite transaction locks and database constraints. Transport handlers must not recreate those rules.
- Keep page composition and form adapters in SvelteKit.
- Change optimistic JSON interactions for BudgetCategory position, Transaction paid state, and Transaction position to call the API directly. Preserve rollback, focus, accessibility announcements, and authoritative invalidation after success.
- Remove each old SvelteKit JSON endpoint after its direct API call passes the verification plan.

**Gate:** all Budget Planning behavior is served by the API and the web contains no direct repository or database calls.

### 8. Remove the web backend

- Delete the Better Auth server instance and handler from SvelteKit.
- Delete web-owned Drizzle schema, repositories, migration files, migration runner, database and Redis clients, email delivery, and domain server modules after their callers are gone.
- Remove server-only dependencies and secrets from `apps/web`.
- Type `App.Locals` from the Session/profile transport model or a web-owned minimal projection.
- Remove the three obsolete JSON endpoints.
- Remove SvelteKit's experimental `remoteFunctions` option if no route uses it.
- Search for forbidden imports and environment variables in web as a CI check.
- Update `CONTEXT-MAP.md`, context-document locations, READMEs, and the technical specification to match the deployed ownership.

**Gate:** `apps/web` builds with no database, Redis, Better Auth server, Resend, or migration configuration.

### 9. Split deployment

- Build separate immutable images for `apps/web` and `apps/api`.
- Put migrations and email rendering artifacts only in the API image or a dedicated migration image.
- Run the migration command once before rolling out the API. Application replicas never migrate on startup.
- Create separate Coolify applications or equivalent workloads and configure path routing on one public origin.
- Keep the API private except through the ingress. Keep PostgreSQL and Redis private to the API network.
- Give the API `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_ORIGIN`, `RESEND_API_KEY`, `EMAIL_FROM`, and its port.
- Give the web only `API_INTERNAL_URL` and genuinely public UI configuration.
- Size the database pool for the maximum API replica count. Configure termination grace so in-flight requests finish and connections close.
- Change CI to build and test both applications, verify the OpenAPI artifact, build both images, run the migration job, deploy API, verify readiness, then deploy web.

**Gate:** the deployment smoke tests in the verification plan pass through the public URL and neither app starts a migration.

### 10. Add headless authentication

Do this only after cookie Session parity is stable.

- Enable Better Auth's API Key plugin.
- Make keys User-owned, named, expiring, revocable, permission-scoped, and independently rate-limited.
- Show a key only once at creation and store only its secure hash/material required by Better Auth.
- Resolve API-key requests to a principal directly. Do not turn API keys into browser Sessions.
- Document cookie and API-key security schemes on application operations.
- Keep the browser on secure cookie Sessions. Do not put bearer Session tokens in local storage.
- Add audit metadata sufficient to identify which key performed a mutation without logging the secret.

**Gate:** a headless client can complete the permitted operations, and revoking one key does not affect browser Sessions or other keys.

## Completion criteria

- [ ] All [prerequisites](prerequisites.md) remain satisfied.
- [ ] `apps/api` is the only owner of authentication, domain operations, persistence, migrations, Redis, and identity email.
- [ ] `apps/web` contains only web concerns and justified BFF adapters.
- [ ] `/api/v1` is contract-first, versioned, typed, and documented through OpenAPI.
- [ ] Browser traffic uses one public origin and host-only secure cookies.
- [ ] Headless access uses scoped API keys rather than browser Session tokens.
- [ ] The [verification plan](verification-plan.md) passes.

## Implementation references

- [Better Auth with Hono](https://better-auth.com/docs/integrations/hono)
- [Better Auth Session management](https://better-auth.com/docs/concepts/session-management)
- [Better Auth security](https://better-auth.com/docs/reference/security)
- [Better Auth API keys](https://better-auth.com/docs/plugins/api-key)
- [Hono CSRF middleware](https://hono.dev/docs/middleware/builtin/csrf)
- [oRPC contract-first definitions](https://v1.orpc.dev/docs/contract-first/define-contract)
- [oRPC OpenAPI handler](https://v1.orpc.dev/docs/openapi/openapi-handler)
- [oRPC Better Auth integration](https://orpc.dev/docs/integrations/better-auth)
