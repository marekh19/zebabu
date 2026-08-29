# Centralize Shared Development Configuration in One Tooling Package

Shared TypeScript, ESLint, lint-staged, and Svelte compiler configuration lives in `@zebabu/tooling`; workspaces keep only adapters and rules specific to themselves. One package keeps cross-workspace defaults versioned together without creating a separate package per tool or coupling workspace-specific policy into a root configuration.
