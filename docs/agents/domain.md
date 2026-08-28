# Domain Docs

## Before exploring

Read `CONTEXT-MAP.md` at the repo root, then read each linked `CONTEXT.md` relevant to the work.

Read relevant system-wide ADRs under `docs/adr/` and context-specific ADRs under the owning workspace's `docs/adr/`.

If these files do not exist, proceed silently. The domain-modeling workflow creates them when terms or decisions are resolved.

## Layout

```text
/
├── CONTEXT-MAP.md
├── docs/adr/
├── apps/
│   └── web/
│       ├── CONTEXT.md
│       └── docs/adr/
└── packages/
    └── emails/
        ├── CONTEXT.md
        └── docs/adr/
```

`CONTEXT-MAP.md` identifies each domain context and links to its `CONTEXT.md`. Root ADRs cover system-wide decisions. Workspace ADRs cover decisions scoped to that context.

## Vocabulary

Use the terms defined in the relevant `CONTEXT.md` in issue titles, proposals, hypotheses, and test names. Do not substitute synonyms the glossary rejects.

If a needed concept is absent, reconsider the term or note the gap for domain modeling.

## ADR conflicts

Surface conflicts with an existing ADR explicitly instead of silently overriding the decision.
