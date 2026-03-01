# Agent Guidelines

## TypeScript

- Write functional, immutable TypeScript code
- Do not use `any` type
- Do not use type assertions (`as`)
- Do not write eslint disable comments (if there's a valid use case, justify it)
- Prefer early returns
- Keep code comments only for more complex features or where it might be more difficult to understand just from the code.

## Commands and Outcome Validation

This project is setup with `pnpm` so always use pnpm commands

After each feature implementation validate by linting and typechecking

1. `pnpm run lint`
2. `pnpm run format`
3. `pnpm run check`

## Plan mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.
