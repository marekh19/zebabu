# Automated User Story Factory

Use one captain agent to move user stories through a repeatable delivery loop. The installed Matt Pocock skills provide most workers. A repository-specific `story-factory` skill must own orchestration, GitHub actions, severity gates, and recovery.

## Workflow

```text
next story
  ↓
refresh story against current codebase
  ↓
implement with TDD
  ↓
validate and review
  ↓
open pull request
  ↓
independent pull request review
  ↓
fix findings and re-review
  ↓
CI green and no medium-or-higher findings
  ↓
merge and continue
```

## Refresh the story

Create a `refresh-user-story` skill rather than using `/triage` unchanged. `/triage` expects maintainer interaction and targets incoming reports.

The skill should:

- Read the story, domain docs, ADRs, and current implementation.
- Search for behavior that already exists.
- Find stale assumptions, obsolete terminology, and architectural conflicts.
- Rewrite the story and acceptance criteria while preserving product intent.
- Mark the story `ready-for-agent`.
- Stop only when product intent cannot be inferred safely.

Run `/to-tickets` for stories too large for one context window. Unattended use requires permission for the captain to approve the vertical-slice breakdown.

## Implement

Run `/implement` in a fresh context for every story or ticket. It already uses `/tdd`, validates during implementation, runs `/code-review`, and commits the result.

Required repository checks:

```bash
bun run lint:check
bun run format:fix
bun run typecheck
```

`/tdd` currently requires the user to approve test seams. Unattended operation needs this standing policy:

> Prefer the highest existing public seam. Do not introduce a new seam unless required. The captain may approve existing seams. Stop when choosing a seam would materially change the architecture.

## Open the pull request

No installed Matt skill owns this step. The captain should:

- Create a story branch or isolated worktree.
- Push the branch.
- Open a pull request containing the story, acceptance criteria, test evidence, and review result.
- Wait for CI.

The factory needs explicit standing permission to push, create pull requests, merge, and delete only its own branches.

## Review independently

Run `/code-review <merge-base>` in a new context. Its independent reviewers cover:

- **Standards:** repository rules and code smells.
- **Spec:** missing behavior, incorrect behavior, and scope creep.

Add severity normalization because `/code-review` does not rank findings:

- `critical`: security, data loss, broken migration, or unusable feature.
- `high`: failed acceptance criterion or broken common path.
- `medium`: real defect or maintainability problem that should block merging.
- `low`: optional cleanup without a credible current failure.

Ignore style findings already enforced by tooling.

## Repair loop

For every medium-or-higher finding:

1. Give the implementation agent the finding and evidence.
2. Require a regression test where applicable.
3. Run repository checks.
4. Commit and push.
5. Review again against the original merge base.
6. Repeat until the gate passes.

Stop and mark the story blocked after three unsuccessful repair rounds.

## Merge gate

Merge only when:

- CI is green.
- Repository checks passed locally.
- No medium, high, or critical findings remain.
- Every acceptance criterion has evidence.
- The branch is current with the target branch.
- No review conversation remains unresolved.
- No migration or deployment step requires human credentials or judgment.

Then squash-merge, update the story state, and claim the next unblocked story.

## Agent responsibilities

The captain retains only workflow state:

```text
story ID
branch or worktree
current phase
attempt count
CI state
review findings
merge decision
```

It delegates bounded work:

- Story auditor refreshes the story.
- Implementer writes code and tests.
- Standards reviewer checks conventions and design.
- Spec reviewer checks acceptance criteria.
- Repair agent fixes accepted findings.
- Captain applies gates and performs GitHub actions.

Do not process consecutive stories concurrently in one worktree. Parallelize independent review and research. Use isolated worktrees before processing multiple stories concurrently.

## Human escalation

Stop for:

- Multiple plausible interpretations of product intent.
- Destructive schema or data migrations.
- Authentication, authorization, billing, or privacy-policy changes.
- Missing credentials or protected-environment actions.
- Repeated review failures.
- Changes to another story's scope.
- Merge conflicts where both sides encode valid product decisions.

Start with one automated story per run and automatic merging behind the gate. After the severity rules and refresh policy work reliably across 10–20 stories, allow the captain to claim the next story automatically.
