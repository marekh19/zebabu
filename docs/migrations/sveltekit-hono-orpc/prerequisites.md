# SvelteKit, Hono, and oRPC Migration Prerequisites

Complete this work in the current SvelteKit application before following the [migration plan](migration-plan.md). These changes make existing behavior safe and explicit so the migration only changes ownership and transport.

## 1. Lock down ownership

- Fix `updateCategory` so the final update is constrained by both Category ID and User ID. Its duplicate-name check is User-scoped, but `updateCategoryTx` currently updates by Category ID alone.
- Audit every Budget, Category, BudgetCategory, and Transaction read and write. Require the authenticated User ID in the repository query instead of loading by a global ID and checking ownership later.
- For User-owned resources, return the same not-found result for a missing resource and a resource owned by another User. This avoids leaking which IDs exist.
- Add two-User integration tests for every read and mutation. User A must never read or modify User B's resources, including through nested IDs from different Budgets.
- Derive the User ID from the authenticated Session. Never accept it from form data, JSON, URL query parameters, or forwarding headers.

## 2. Make unauthenticated behavior explicit

- Replace `ensureDefined(locals.user)` at request boundaries with an explicit unauthenticated result.
- Keep browser navigation behavior in SvelteKit: private page loads redirect to sign-in.
- Make mutation behavior transport-neutral: unauthenticated mutations produce a typed unauthorized result rather than an internal error.
- Add tests for expired, revoked, malformed, and absent Session cookies.

## 3. Close transaction and concurrency gaps

- Move Budget duplication into one database transaction. Read the source Budget, check target uniqueness, create the copy, and copy BudgetCategories and Transactions under that transaction. Lock the relevant User/Budget rows and map unique violations to the existing conflict result.
- Take the same User Category-set lock when creating a Budget snapshot as when creating or deleting a Category. This prevents a Budget from capturing an inconsistent Category set.
- Replace `Promise.all` calls that issue writes through one Drizzle transaction with one bulk statement or sequential awaited statements. Do this for default and Budget allocation-target writes.
- Keep transaction-position commands serialized per Budget. Validate the source Transaction, source BudgetCategory, target BudgetCategory, and Budget all belong to the same authenticated User before writing.
- Replace arbitrary category reorder arrays with a single positioning command where practical. Otherwise require a complete permutation with no missing or duplicate BudgetCategory IDs.
- Add real-Postgres concurrency tests for duplicate monthly Budgets, duplicate scenario names, Category creation during Budget creation, Budget duplication, and simultaneous reorder commands.

## 4. Put invariants in PostgreSQL

Add Drizzle migrations for rules that are currently only application rules:

- A Monthly Budget has a valid month and year and no scenario name.
- A Scenario Budget has a non-empty name and no month or year.
- Transaction amounts are positive.
- Category and Transaction sort positions are non-negative.
- Allocation Targets are either null or between `0.0` and `100.0`.
- Existing uniqueness constraints remain the final authority for monthly periods, scenario names, Category names, and Category membership in a Budget.

Test each constraint directly against PostgreSQL. Keep application validation for useful errors, but do not rely on it for integrity.

## 5. Normalize transport values before transport exists

- Introduce transport-neutral result models for the current domain operations. Do not expose Drizzle rows.
- Represent timestamps as ISO 8601 strings at an external seam.
- Represent money and percentages as canonical decimal strings. Do not convert PostgreSQL `numeric` values through JavaScript floating-point numbers.
- Define stable machine-readable error codes such as `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, and `INVALID_POSITION`. Keep localized text in SvelteKit.
- Separate locale-free Zod rules from Superforms parsing and Paraglide messages. Form schemas may normalize `FormData`, then call the locale-free rule.

This is preparatory refactoring inside the monolith. Do not add Hono, oRPC, or an HTTP client yet.

## 6. Make User provisioning recoverable

Default Category creation currently runs after Better Auth creates a User and depends on the active Paraglide locale. A failure can leave a valid User without the required Categories.

- Replace the post-create callback with an idempotent `ensureUserProvisioned` operation.
- Run it on the first authenticated application request until provisioning succeeds.
- Serialize it per User and insert only missing default Category types.
- Pass a validated locale explicitly. Do not read an implicit SvelteKit request locale from API-domain code.
- Record completion so normal requests do not repeat the work.
- Test retries after a partial insert, duplicate requests, unsupported locale input, and email-verification flows.

## 7. Stabilize Better Auth

- Exact-pin Better Auth rather than relying on a range during the migration.
- Upgrade it as a separate change before moving it. Generate its expected schema and compare it with the hand-maintained Identity schema before applying a migration.
- Preserve and characterize current behavior: email/password sign-up, mandatory email verification, no automatic sign-in after verification, password reset, seven-day Sessions, daily expiry refresh, five-minute cookie cache, Postgres Session storage, Redis secondary storage, and Redis-backed rate limiting.
- Use validated `BETTER_AUTH_URL` and `WEB_ORIGIN` values. Remove production fallbacks to localhost and configure exact trusted origins.
- Decide and document Redis failure behavior. With the current configuration, API readiness should fail when Redis is unavailable unless Sessions and rate limiting are deliberately redesigned first.
- Prefix all Redis keys by application and environment. Enable persistence outside local development if Redis state must survive restarts.
- Test Redis restart and outage behavior rather than assuming Postgres Session rows provide automatic failover.

Do not add API keys in this phase. They are a new headless authentication method and belong after browser Session parity.

## 8. Stabilize database lifecycle

- Configure the Bun SQL client explicitly: pool size, connection timeout, idle timeout, query timeout policy, and graceful shutdown.
- Make integration tests use the same Bun SQL/Drizzle driver as production and migrations. This catches driver-specific transaction behavior.
- Stop running migrations in every web container startup. Add a one-shot migration command that CI or the deployment platform runs once before application rollout.
- Prove migrations against both an empty database and a copy at the current migration head.
- Preserve the existing Drizzle migration journal and file order. Do not squash migrations unless all environments are intentionally reset.

## 9. Build the behavioral baseline

The migration must preserve these observable flows:

- Sign-up, verification, sign-in, Session refresh, sign-out, forgotten password, password reset, and primary-currency update.
- Category list, create, edit, delete, last-of-type protection, in-use protection, default Allocation Targets, and duplicate-name handling.
- Budget list, monthly and scenario creation, uniqueness conflicts, detail, duplication, deletion, Category addition, and Budget Allocation Targets.
- Transaction create, edit, delete, paid status, reorder, and move between BudgetCategories.
- Enhanced and non-enhanced Superforms submissions, redirects, localized validation, optimistic updates, rollback, focus restoration, and accessible drag announcements.

Add missing tests at the current public seam. Avoid tests that assert repository implementation details.

## Exit criteria

- [ ] No known cross-User read or write is possible.
- [ ] Missing and foreign User-owned resources have indistinguishable responses.
- [ ] Unauthenticated requests never fail as internal errors.
- [ ] Concurrency-sensitive operations are atomic and tested against PostgreSQL.
- [ ] Database constraints enforce domain invariants.
- [ ] External values and error codes have one locale-free representation.
- [ ] User provisioning is idempotent and retryable.
- [ ] Better Auth and Redis behavior is pinned, configured, and characterized.
- [ ] Migrations run once per release, not once per application replica.
- [ ] The behavioral baseline passes with `bun run test`.
- [ ] `bun run lint:check`, `bun run format:fix`, `bun run typecheck`, and `bun run build` pass.
