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
4. Run `bun run dev`. Turbo starts the API, web application, and email preview server.

## Checks

Run `bun run lint:check`, `bun run format:fix`, and `bun run typecheck` from the workspace root after changes. Run `bun --env-file=apps/api/.env run test`, `bun run build`, and `bun run knip` when the affected behavior requires them. PostgreSQL and Redis are required for the API integration tests.

The completed application split's [verification plan](docs/migrations/sveltekit-hono-orpc/verification-plan.md) remains a regression checklist for architecture, security, and deployment changes.
