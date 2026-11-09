# Agent Guidelines

## Commands and Outcome Validation

This project is setup with `bun` so always use bun commands

After each feature implementation validate by linting and typechecking

1. `bun run lint:check`
2. `bun run format:fix` (run from workspace root)
3. `bun run typecheck`

While the dev server is running, use
`bun run --filter @zebabu/web typecheck:dev` instead of `bun run typecheck` to
avoid a concurrent `svelte-kit sync`. Run the full typecheck after stopping the dev server and in CI.

## Agent skills

### Issue tracker

User stories are tracked in `docs/user-stories/INDEX.md` and its linked story files. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default triage label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Use the multi-context domain-doc layout. See `docs/agents/domain.md`.
