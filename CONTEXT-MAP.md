# Context Map

## Contexts

- [Budget Planning](./apps/api/src/modules/budget-planning/CONTEXT.md): manages reusable Categories, Budgets, and their planned Transactions
- [Identity](./apps/api/src/modules/identity/CONTEXT.md): registers and authenticates Users and manages Sessions

## Relationships

- **Identity → Budget Planning**: application composition provisions default Categories after Identity creates a User.

## Supporting packages

- [`@zebabu/api-contract`](./packages/api-contract): locale-free transport schemas and oRPC contracts shared by the API and web application. It does not own domain behavior.
- [`@zebabu/emails`](./packages/emails): identity email templates and rendering used by the API. It does not own Identity behavior or delivery policy.
- [`@zebabu/ui`](./packages/ui/README.md): reusable visual primitives and design tokens. Applications and domain modules may import it; it cannot import application or domain code.
