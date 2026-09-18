# Zebabu

Zebabu manages planned income, expenses, and Transactions across monthly and scenario Budgets.

## Applications

- `apps/web`: SvelteKit UI, SSR, localized forms, and browser interactions.
- `apps/api`: Bun/Hono API, Better Auth, Budget Planning, PostgreSQL, Redis, email, and migrations.
- `packages/api-contract`: locale-free request and response schemas and oRPC contracts.

The browser uses one origin. The ingress routes `/api/*` to the API and all other paths to the web app. Local Vite development proxies `/api/*` to `http://localhost:3101`.

## Local setup

1. Run `bun install` and `bun run db:start`.
2. Copy `.env.example` to `.env`, `apps/api/.env.example` to `apps/api/.env`, and `apps/web/.env.example` to `apps/web/.env`. Set database credentials and secrets.
3. Run `bun run db:migrate`.
4. Run `bun run --filter @zebabu/api dev` and `bun run --filter @zebabu/web dev` in separate terminals.

## Checks

Run `bun run lint:check`, `bun run format:check`, `bun run typecheck`, `bun run test`, `bun run build`, and `bun run knip` from the workspace root. PostgreSQL and Redis are required for the API integration tests.

See the [migration verification plan](docs/migrations/sveltekit-hono-orpc/verification-plan.md) for release checks.
