# Localization

Use Paraglide for all user-facing copy. Store source messages in `apps/web/messages/*.json`; do not hardcode them in components or route files.

# API boundary

The web application calls the API for authentication and domain operations. It does not access PostgreSQL, Redis, Drizzle schemas, or migrations directly. Run database commands from the workspace root; migrations belong to `@zebabu/api`.

# Type safety and narrowing

Use `narrowland` to narrow nullable resources with utilities such as `isDefined`, `ensureDefined`, and `assertDefined`. Do not use non-null assertions for values that can be `null` or `undefined`.
