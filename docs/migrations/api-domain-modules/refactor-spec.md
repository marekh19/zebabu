---
status: completed
---

# API domain-module refactor specification

This specification records the completed implementation of API ADR 0004. Keep it as the structural reference for module ownership.

The implementation followed [API ADR 0004](../../../apps/api/docs/adr/0004-organize-api-by-domain-modules.md) as a structural refactor of `apps/api`. It preserved the observable HTTP interface and database behavior.

## Target shape

The names below describe ownership. Create a file only when it has behavior to own; avoid pass-through files added to satisfy a pattern.

```text
apps/api/
├── docs/adr/                         # API architecture and domain decisions
├── drizzle/                          # Existing migration history
└── src/
    ├── index.ts                      # Bun startup and shutdown
    ├── app.ts                        # Hono routes and request middleware
    ├── router.ts                     # Root oRPC procedure assembly
    ├── openapi.ts                    # OpenAPI generation
    ├── environment.ts                # Application environment validation
    ├── http/
    │   └── principal.ts              # Session/API Key request resolution
    ├── infrastructure/
    │   ├── database/
    │   │   ├── client.ts             # PostgreSQL client configuration
    │   │   ├── database.ts           # Drizzle instance and transaction type
    │   │   └── schema.ts             # Compose Identity and Budget Planning schema
    │   ├── redis.ts                  # Redis connection
    │   └── readiness.ts              # PostgreSQL and Redis readiness
    ├── modules/
    │   ├── identity/
    │   │   ├── CONTEXT.md
    │   │   ├── schema.ts             # User, Session, API Key, auth tables
    │   │   ├── auth/
    │   │   │   ├── better-auth.ts     # Better Auth configuration and email callbacks
    │   │   │   ├── environment.ts    # Identity-specific environment
    │   │   │   └── storage.ts        # Better Auth Redis storage adapter
    │   │   ├── users/
    │   │   │   ├── procedures.ts     # Profile oRPC procedures
    │   │   │   └── profile.ts        # User profile reads and updates
    │   │   └── api-keys/
    │   │       ├── procedures.ts     # API Key oRPC procedures
    │   │       ├── service.ts        # Issuance, listing, revocation
    │   │       └── repository.ts     # API Key SQL
    │   └── budget-planning/
    │       ├── CONTEXT.md
    │       ├── schema.ts             # Budget Planning tables and relations
    │       ├── model.ts              # Types shared within Budget Planning
    │       ├── allocation-targets/
    │       │   └── rules.ts          # Rules shared by default and Budget targets
    │       ├── categories/
    │       │   ├── procedures.ts     # Category oRPC procedures
    │       │   ├── service.ts        # Catalog and default-target operations
    │       │   ├── repository.ts     # Category SQL
    │       │   └── types.ts          # Category types and colors
    │       └── budgets/
    │           ├── procedures.ts     # Budget oRPC procedures
    │           ├── service.ts        # Budget creation, duplication, reads, deletion
    │           ├── repository.ts     # Budget SQL
    │           ├── mapping.ts        # Budget result projections
    │           ├── types.ts          # Budget types
    │           ├── result.ts         # Budget operation result codes, if still useful
    │           ├── budget-categories/
    │           │   ├── service.ts    # Add and order Categories in a Budget
    │           │   └── repository.ts # BudgetCategory SQL
    │           ├── transactions/
    │           │   ├── service.ts    # Transaction operations
    │           │   ├── repository.ts # Transaction SQL
    │           │   └── rules.ts      # Ordering rules
    │           └── allocation-targets/
    │               └── service.ts    # Targets owned by BudgetCategories
    └── workflows/
        └── provision-user.ts         # Coordinate Identity and initial Categories

packages/api-contract/src/                # Existing transport contracts; stays separate
```

Keep `apps/api/drizzle.config.ts` and `apps/api/src/migrate.mjs` as application entry points. Keep `apps/api/docs/adr/` at its current location. Move both `CONTEXT.md` files beside their domain modules and update `CONTEXT-MAP.md`.

## Ownership rules

- `procedures.ts` implements the existing oRPC contract. It resolves the principal, translates transport values and errors, and calls application operations. It does not contain SQL, ordering decisions, or transaction coordination.
- A domain service owns a complete operation, including domain checks and transaction coordination. Keep simple operations together; extract a dedicated use-case file only when its complexity earns one.
- A repository owns Drizzle queries and updates when persistence has enough behavior to justify a separate file. A small self-contained operation such as `users/profile.ts` may contain its own query. Procedure files never run SQL. Repositories may accept the current transaction type. Keep database connection creation and cross-domain schema composition in `infrastructure/database`.
- Budget Planning owns reusable Categories. Its `budgets/` module owns BudgetCategories and Transactions. Category default Allocation Targets remain in `categories/`; targets stored on a BudgetCategory remain under `budgets/`. Shared target validation belongs in `budget-planning/allocation-targets/rules.ts`.
- `workflows/provision-user.ts` owns the cross-domain provisioning transaction. Identity owns the User provisioning state; Budget Planning supplies initial Category behavior. Preserve locking, idempotence, locale handling, and retry behavior. Neither domain imports the other's tables directly.
- `http/principal.ts` owns request authentication and calls the provisioning workflow after authentication. Session and API Key rules, permissions, and rate limits retain their current behavior.
- Keep the existing shared database and explicit Drizzle schema composition. Add a repository interface or injected adapter only for a demonstrated second implementation or test need.
- Keep `packages/api-contract` dependency-light and unchanged unless a verified compatibility fix requires it. The public method, path, operation ID, input/output schema, error code, and security behavior of every procedure remain stable.

## Current-to-target map

| Current path                                                                                 | Target owner                                                                                              |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/routes/{budgets,categories,profile,keys}.ts`                                            | Corresponding module `procedures.ts`                                                                      |
| `src/principal.ts`                                                                           | `src/http/principal.ts`                                                                                   |
| `src/lib/identity/server/{create-identity,environment,secondary-storage}.ts`                 | `modules/identity/auth/`                                                                                  |
| `src/lib/identity/server/persistence/schema.ts`                                              | `modules/identity/schema.ts`                                                                              |
| `src/lib/identity/server/{provisioning,provisioning-repository}.ts`                          | `workflows/provision-user.ts` plus domain-owned persistence functions                                     |
| `src/lib/budget-planning/server/{budgets,categories}/service.ts`                             | Corresponding domain services; split BudgetCategory, Transaction, and Budget Allocation Target operations |
| `src/lib/budget-planning/server/persistence/{budget,category}-repository.ts`                 | Corresponding domain repositories; split BudgetCategory and Transaction SQL from Budget SQL               |
| `src/lib/budget-planning/server/persistence/schema.ts`                                       | `modules/budget-planning/schema.ts`                                                                       |
| `src/lib/budget-planning/server/model-mappers.ts`                                            | `budgets/mapping.ts` and local Category projection where used                                             |
| `src/lib/budget-planning/server/budgets/transaction-rules.ts`                                | `budgets/transactions/rules.ts`                                                                           |
| `src/lib/budget-planning/{model,allocation-targets/rules,budgets/types,categories/types}.ts` | Same concept under `modules/budget-planning/`                                                             |
| `src/lib/operation-result.ts`                                                                | `budgets/result.ts` if used; remove unused generic exports                                                |
| `src/lib/server/{cache,persistence,readiness}`                                               | `src/infrastructure/`                                                                                     |

Delete unused `src/lib/budget-planning/server/index.ts` and `src/lib/identity/server/index.ts` barrels after checking their consumers. End with no application source under `apps/api/src/lib` and no `$lib` imports in `apps/api`; update `tsconfig.json` accordingly. Preserve the existing root composition files and route keys.

## Implementation sequence

1. **Baseline.** Use `src/openapi.test.ts` as the public method/path/operation-ID baseline. Run the existing API tests with PostgreSQL and Redis available. Note any pre-existing failures before changing code. The baseline is complete when the agent can compare the same behavior after the move.
2. **Move infrastructure and glossaries.** Move the database client, composed schema, Redis, readiness, and both context files. Update Drizzle config, test helpers, migration imports, `CONTEXT-MAP.md`, and all consumers. Keep SQL schema definitions and migration files unchanged. This step is complete when database tests and migration configuration load from the new paths.
3. **Move Identity.** Move Better Auth configuration and storage, then profile and API Key procedures. Put their persistence outside procedure files. Extract User provisioning to the root workflow, retaining one atomic transaction and its current locks. This step is complete when authentication, profile, key, and provisioning tests pass with the same responses.
4. **Move Budget Planning.** Move Category files first. Split Budget services and repositories by Budget, BudgetCategory, Transaction, and Allocation Target responsibility. Move procedure-level Category ordering logic into the owning BudgetCategory operation. Keep duplicate Budget behavior, ownership filters, lock order, and decimal conversions intact. This step is complete when the current Budget Planning and two-User tests pass through the new paths.
5. **Finish composition.** Update root router imports, OpenAPI generation, all test imports, explicit test-file paths in `apps/api/package.json`, and any build or deployment references. Remove obsolete barrels, paths, and aliases. This step is complete when searches find no stale `src/lib`, `$lib`, or old `src/routes` imports within `apps/api`.

Keep existing integration tests at their relevant ownership level: HTTP/OpenAPI tests by the application root; Identity Session tests under Identity; Budget ownership, concurrency, and constraint tests under Budget Planning; database test helpers under infrastructure. Adjust locations only when they improve test ownership. Add a regression test only for behavior changed while moving logic, such as BudgetCategory ordering or provisioning coordination.

## Acceptance gates

- Public routes, contract schemas, OpenAPI operation IDs, error codes, authentication, and request IDs match the baseline. Better Auth stays at `/api/auth/*`; application procedures stay under `/api/v1/*`.
- Database tables, relations, constraints, migration journal, and existing migration files are unchanged. No migration is generated for this refactor.
- Ownership checks still treat a foreign Budget, BudgetCategory, Category, Transaction, or API Key as inaccessible. Budget duplication still copies the source Budget's targets; later Category default changes do not rewrite Budget targets.
- Concurrent Budget creation, Category ordering, Transaction positioning, and first-request User provisioning retain their locking and rollback behavior.
- Domain modules contain their procedures and operations; procedure files contain no Drizzle queries. `src/lib` and the `$lib` alias are gone from `apps/api`.
- Run from the workspace root: `bun run lint:check`, `bun run format:fix`, then `bun run typecheck`. With PostgreSQL and Redis running and `apps/api/.env` configured, run `bun --env-file=apps/api/.env run --filter @zebabu/api test`. If a dev server is running, use `bun run --filter @zebabu/web typecheck:dev` while it runs, then run the full typecheck after stopping it.
- Report the final file map, behavior checks, and any failed or unavailable checks with their remaining risks.
