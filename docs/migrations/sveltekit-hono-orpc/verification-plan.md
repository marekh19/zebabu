# SvelteKit, Hono, and oRPC Migration Verification Plan

Run this plan after each vertical slice and in full before cutover. A migration is complete only when observable behavior, security, data integrity, and operations pass through the public deployment shape.

## Test fixtures

Create deterministic fixtures through public interfaces:

- **User A**: verified, signed in, one income Category, two expense Categories, one Monthly Budget, one Scenario Budget, BudgetCategories with Allocation Targets, paid and unpaid Transactions.
- **User B**: verified, signed in, equivalent independent data.
- **Unverified User**: registered but not verified.
- **Expired Session**, **revoked Session**, and, after headless support, valid, expired, revoked, and under-scoped API keys.

Keep all User A and User B IDs. Every owned endpoint uses them in cross-User tests.

## 1. Repository gates

Run from the workspace root:

```bash
bun install --frozen-lockfile
bun run lint:check
bun run format:fix
bun run typecheck
bun run test
bun run build
bun run knip
```

Then assert by search or a small CI script:

- `apps/web` has no imports of Drizzle, Bun SQL, Redis, Resend, Better Auth server adapters, API implementation, or migration code.
- `apps/web` does not read `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`, or email-provider secrets.
- `apps/api` does not import Svelte components, SvelteKit route types, Superforms, or Paraglide messages.
- `packages/api-contract` does not import web, API implementation, Drizzle, Hono handlers, Superforms, or localization.
- Only the API/migration workload contains Drizzle migrations.
- No public contract accepts `userId` for authorization.

## 2. Contract and OpenAPI checks

- Generate the OpenAPI document twice and compare bytes. Generation must be deterministic.
- Validate it as OpenAPI 3.1.1.
- Snapshot every method, path, operation ID, tag, success status, declared error, and security scheme.
- Fail CI on duplicate operation IDs or undocumented `/api/v1` routes.
- Verify request and response examples against their Zod schemas.
- Verify the typed client compiles against the same contract package without importing server implementation.
- Exercise one success and every declared error for each operation. The observed status and body must match the document.
- Verify dates are ISO 8601 strings and money/percentages are canonical decimal strings without precision loss.
- Verify unknown fields, malformed JSON, unsupported content types, and oversized bodies are rejected consistently.
- Verify `/api/openapi` and `/api/docs` are reachable in the intended environments. Keep Better Auth documentation separate from the application document.

## 3. Authentication checks

Exercise these flows through the public origin:

- Sign up with a supported locale; receive one verification email with the correct public callback URL.
- Attempt sign-in before verification; no Session is created.
- Verify email; sign in; receive a secure host-only cookie with the intended same-site and expiry settings.
- Load multiple private pages; Session identity remains consistent.
- Cross the configured refresh age; the refreshed cookie reaches the browser through direct API calls and SvelteKit BFF responses.
- Sign out; the Session is revoked and the browser cookie is cleared.
- Request a password reset; receive a correct public link; reset the password; reject the old password and accept the new one.
- Retry User provisioning after a forced failure; exactly one income and one expense default Category exist.
- Restart Redis and repeat Session lookup. Confirm documented behavior during and after the outage.

For every protected application operation, test absent, malformed, expired, and revoked cookies. Each returns the same typed unauthorized response without a stack trace.

Verify state-changing cookie requests:

- accepted from the exact web origin;
- rejected when `Origin` is absent where policy requires it;
- rejected from an untrusted origin;
- rejected with a cross-site request even when a cookie is supplied;
- accepted through SSR/BFF forwarding without weakening the origin policy.

After API keys are added, test creation, one-time display, permission denial, expiry, revocation, per-key rate limits, and secret redaction. API-key requests must not create browser Sessions.

## 4. Authorization matrix

Run this matrix for every User-owned read and mutation:

| Principal and resource         | Expected result                          |
| ------------------------------ | ---------------------------------------- |
| User A with User A ID          | Success, subject to domain rules         |
| User A with a missing ID       | `NOT_FOUND`                              |
| User A with User B ID          | Same status and body shape as missing ID |
| Anonymous with any ID          | `UNAUTHORIZED`                           |
| Valid but under-scoped API key | `FORBIDDEN`                              |

Repeat the matrix with nested mismatches:

- User A Budget with User B BudgetCategory;
- User A Budget with User B Transaction;
- User A Transaction with another User A Budget;
- User A Category added to User B Budget;
- valid IDs combined under the wrong parent path.

After each rejected mutation, query as the owner and confirm no row, order, Allocation Target, or timestamp changed.

## 5. Budget Planning behavior

### Categories

- List only the authenticated User's Categories and correct Budget usage.
- Create income and expense Categories.
- Reject duplicate names and invalid names, types, colors, and Allocation Targets.
- Edit name and color without changing type or ownership.
- Prevent deletion of the last Category of a type, an in-use Category, and a Category with a non-zero default Allocation Target.
- Enable, replace, and disable a complete default Allocation Target set. Reject missing, duplicate, foreign, income, out-of-range, or non-totaling entries.

### Budgets

- Create valid Monthly and Scenario Budgets.
- Reject duplicate User/month/year and duplicate User/scenario-name combinations.
- Reject invalid Monthly/Scenario field combinations at both contract and database levels.
- Snapshot the selected reusable Categories and current default Allocation Targets.
- List and load complete Budget details with stable ordering and calculated values.
- Duplicate a Budget with its BudgetCategories, Allocation Targets, and Transactions but new IDs.
- Delete a Budget without deleting reusable Categories.
- Add an unused User-owned Category and reject duplicate, foreign, or missing Categories.
- Replace Budget Allocation Targets and reject incomplete or invalid sets.

### Transactions and ordering

- Create, edit, and delete Transactions with exact decimal amounts.
- Reject zero, negative, malformed, or over-precision amounts.
- Set paid state explicitly and verify repeated identical requests are safe.
- Reorder within one BudgetCategory at the first, middle, last, and unchanged position.
- Move between non-empty and empty BudgetCategories.
- Reject negative and out-of-range positions.
- Confirm positions are contiguous after every successful command.
- Run concurrent commands for one Budget and verify serialization and the documented last-applied result.
- Force an error mid-command and verify the complete transaction rolls back.

## 6. Web behavior

Test each Superforms mutation twice: with JavaScript enhancement and as a native browser form submission.

- Field values and validation errors survive a failed submission.
- Error codes map to the correct localized message in every supported locale.
- Success responses redirect or invalidate data exactly once.
- Private page navigation redirects anonymous Users to sign-in.
- Authenticated Users are redirected away from public auth pages where expected.
- SSR page data is complete and contains no transport-only or secret fields.
- Primary currency updates through `/api/v1/profile`, persists after reload, and no longer depends on the generic Better Auth update-user route.

For optimistic board interactions:

- the UI updates immediately;
- a successful API response refreshes authoritative data without a full reload;
- a failed response restores the exact prior order or paid state;
- only one localized error toast appears;
- drag controls are disabled while saving;
- keyboard focus returns to the correct handle;
- pickup, movement, drop, cancellation, and failure announcements remain localized and accurate.

Test with direct navigation, browser refresh, back/forward navigation, two tabs, and a Session expiring during a mutation.

## 7. Database and migration checks

Run the release migration command against:

1. an empty PostgreSQL database;
2. a database at every supported existing migration head, at minimum the pre-split head;
3. a database where the migration command has already completed.

Verify:

- all three runs finish safely and the repeated run is a no-op;
- the Drizzle journal and existing migration order are preserved;
- row counts, IDs, foreign keys, decimals, timestamps, and Session records are unchanged by the ownership move;
- new checks reject invalid Monthly/Scenario Budgets, amounts, sort positions, and Allocation Targets;
- rollback or restore procedure is tested before deployment;
- two application replicas can start without attempting schema changes;
- total configured connection pools cannot exceed the PostgreSQL connection budget.

## 8. Routing and deployment checks

Exercise the deployed public hostname, not container ports:

- `/*` reaches SvelteKit.
- `/api/auth/*` reaches Better Auth in Hono.
- `/api/v1/*` reaches the oRPC OpenAPI handler.
- `/api/openapi` and `/api/docs` reach the API.
- Unknown web and API paths return their respective not-found formats.
- Cookies set by Better Auth and refreshed through a BFF action reach the browser without header loss or accidental combination.
- Browser requests do not require cross-origin CORS in the normal deployment.
- Internal SSR calls use `API_INTERNAL_URL` but retain the original cookie, allowed origin, and request ID.
- Logs in web and API share the request ID and redact cookies, authorization headers, reset tokens, API keys, and database URLs.

Operational probes:

- Liveness stays healthy during a dependency outage while readiness fails.
- PostgreSQL outage produces bounded failures and recovery without process leaks.
- Redis outage matches the documented Session and readiness policy.
- Email-provider failure returns a safe result and can be retried without duplicate provisioning.
- `SIGTERM` stops accepting work, completes in-flight requests within the grace period, and closes database and Redis connections.
- Rate limits work across two API replicas.
- The API and web can be rolled back independently to the last schema-compatible images.

## 9. Final acceptance run

- [ ] Repository gates pass from a clean checkout.
- [ ] OpenAPI checks pass and the published document matches the deployed API.
- [ ] Authentication and CSRF checks pass through the public origin.
- [ ] Every authorization matrix case passes.
- [ ] All Category, Budget, BudgetCategory, Transaction, and Allocation Target behavior passes.
- [ ] Enhanced and native forms pass in every supported locale.
- [ ] Optimistic updates, rollback, focus, and announcements pass.
- [ ] Empty, upgrade, and repeated migrations pass.
- [ ] Two-replica routing, rate limiting, readiness, shutdown, and rollback smoke tests pass.
- [ ] `apps/web` has no backend infrastructure access.
- [ ] A headless client can discover and use the documented API with a scoped API key, if headless authentication is included in this release.
