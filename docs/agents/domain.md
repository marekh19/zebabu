# Domain Docs

## Before exploring

Read `CONTEXT-MAP.md` at the repository root, then read each linked `CONTEXT.md` relevant to the work.

Read relevant system-wide ADRs under `docs/adr/` and API ADRs under `apps/api/docs/adr/`.

If these files do not exist, proceed silently. The domain-modeling workflow creates them when terms or decisions are resolved.

## Layout

```text
/
├── CONTEXT-MAP.md
├── docs/adr/
└── apps/api/
    ├── docs/adr/
    └── src/modules/
        ├── budget-planning/CONTEXT.md
        └── identity/CONTEXT.md
```

`CONTEXT-MAP.md` identifies each domain context and links to its glossary. Root ADRs cover system-wide decisions. API ADRs cover API architecture and decisions scoped to its domain contexts.

## Vocabulary

Use the terms defined in the relevant `CONTEXT.md` in issue titles, proposals, hypotheses, and test names. Do not substitute synonyms the glossary rejects.

If a needed concept is absent, reconsider the term or note the gap for domain modeling.

## ADR conflicts

Surface conflicts with an existing ADR explicitly instead of silently overriding the decision.
