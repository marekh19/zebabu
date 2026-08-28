# Context Map

## Contexts

- [Budget Planning](./apps/web/CONTEXT.md): manages reusable Categories, Budgets, and their planned Transactions
- [Identity](./apps/web/src/lib/identity/CONTEXT.md): registers and authenticates Users and manages Sessions

## Relationships

- **Identity → Budget Planning**: application composition provisions default Categories after Identity creates a User.
