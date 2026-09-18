---
status: accepted
---

# Organize the API by domain modules

The API will place Identity and Budget Planning in separate domain modules. Each module keeps its oRPC procedures, application operations, rules, and persistence close to the concept they serve. Hono and oRPC assembly, database and Redis setup, and workflows that coordinate both domains remain at the application root. Budget Planning owns BudgetCategory and Transaction behavior under Budgets; application composition owns User provisioning across Identity and Budget Planning.

This replaces the inherited SvelteKit `lib` layout and the inconsistent mix of application operations and direct SQL in procedure files. We considered application-wide handler, service, and repository folders, but they would keep one change spread across distant directories. We will split large files by responsibility without requiring a service, repository, or TypeScript interface for every operation; a seam must earn its place through behavior or a real adapter need.

The refactor keeps the contract-first oRPC interface, Better Auth routes, database schema, and migration history established by [system ADR 0002](../../../../docs/adr/0002-separate-web-and-api-applications.md). It does not introduce separate read and write stores; focused query or use-case files may be added when a workflow needs them.
