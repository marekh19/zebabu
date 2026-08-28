# Agent Guidelines

## TypeScript

- Write functional, immutable TypeScript code
- Do not use `any` type
- Do not use type assertions (`as`)
- Do not write eslint disable comments (if there's a valid use case, justify it)
- Prefer early returns
- Keep code comments only for more complex features or where it might be more difficult to understand just from the code.

## Commands and Outcome Validation

This project is setup with `bun` so always use bun commands

After each feature implementation validate by linting and typechecking

1. `bun run lint:check`
2. `bun run format:fix` (run from workspace root)
3. `bun run typecheck`

While the dev server is running, use
`bun run --filter @zebabu/web typecheck:dev` instead of `bun run typecheck` to
avoid a concurrent `svelte-kit sync`. Run the full typecheck after stopping the dev server and in CI.

## Plan mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Agent skills

### Issue tracker

User stories are tracked in `docs/user-stories/INDEX.md` and its linked story files. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default triage label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Use the multi-context domain-doc layout. See `docs/agents/domain.md`.
