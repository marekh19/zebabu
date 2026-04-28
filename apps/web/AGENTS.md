# Content

Make sure to always use paraglide and store translation strings in json instead of hardcoding text into components.

# Database

Always use `bun run db:migrate` instead of `bun run db:push`

# Typesafety and type narrowing

We have a library `narrowland` that is used to narrow types. Always use it to narrow `Resource | null` to just `Resource`. It offers utilities like `isDefined`, `ensureDefined`, `assertDefined` and many more (boolean type guard, assertion function and assertion + return the value respectively). Never use non-nullish assertion like `user!.id` if user is potentially undefined or null.
