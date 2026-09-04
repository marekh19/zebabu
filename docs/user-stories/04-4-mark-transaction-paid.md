# [US-4.4] Mark Transaction as Paid/Unpaid

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☒ Done
**Triage:** ready-for-agent

## User Story

**As a** user,
**I want to** mark a transaction as paid or unpaid from its row,
**So that** I can track which planned items have been paid.

## Current-State Alignment

- `isPaid` is an existing boolean on every transaction. Create and edit dialogs already expose it.
- The budget board is the only transaction list. There is no transaction detail view.
- A paid row currently shows a small green check beside its amount. The whole editable row opens the edit dialog.
- Category transaction and paid counts belong to US-5.8.
- Category reorder provides the existing optimistic-update, rollback, and localized error-toast pattern.

## Description

Turn the paid indicator at the right of each editable transaction row into a dedicated quick toggle. The toggle updates immediately and persists the latest state in the background. The rest of the row continues to open the edit dialog.

Paid remains a manually maintained boolean. It does not record a payment date or change transaction amounts, category totals, budget totals, or balance calculations.

## Acceptance Criteria

- [x] The right side of each editable transaction row contains a paid toggle separate from the row's edit target.
- [x] A paid transaction shows the existing green check. An unpaid transaction shows an outlined circle while its row is hovered or keyboard focus is within the row.
- [x] The toggle has a 44px minimum pointer target, visible keyboard focus, checkbox semantics, and a localized accessible name that identifies the transaction.
- [x] Activating the toggle with a pointer or Space never opens the edit dialog.
- [x] The check state changes immediately without waiting for the server.
- [x] Repeated activation remains available while a request is in flight. Requests are coalesced per transaction so the last selected state is eventually persisted.
- [x] A successful update is silent. The control has no visual saving spinner, but exposes its busy state to assistive technology.
- [x] A failed update restores the last server-confirmed state and shows one localized error toast.
- [x] Opening the edit dialog after a successful quick toggle shows the updated paid state.
- [x] Create and edit dialogs retain their existing paid checkbox and server-confirmed submission behavior.
- [x] Read-only rows, including the drag overlay, display paid state without an interactive toggle.
- [x] The server accepts the desired boolean state rather than an instruction to invert the stored value.
- [x] The server verifies that the signed-in user owns the route budget and that the transaction belongs to that budget.
- [x] Missing, out-of-budget, and unauthorized transactions are rejected without exposing their data.
- [x] The quick toggle requires JavaScript. No form-submission fallback is required.

## Technical Implementation

### Expected Areas

- `apps/web/src/lib/budget-planning/budgets/components/transaction-row.svelte` — split the edit and paid controls into valid sibling interactive targets
- `apps/web/src/lib/budget-planning/budgets/components/category-column.svelte` and `budget-board.svelte` — own and update optimistic transaction state
- `apps/web/src/routes/(private)/budgets/[id]/transactions/[transactionId]/paid/+server.ts` — add a JSON `PATCH` endpoint for one transaction's desired paid state
- `apps/web/src/lib/budget-planning/server/budgets/service.ts` — authorize the transaction within the route budget and update `isPaid`
- `apps/web/src/lib/budget-planning/server/persistence/budget-repository.ts` — add a paid-only update instead of supplying the other editable fields
- `apps/web/messages/en.json` and `apps/web/messages/cs.json` — accessible toggle names and failure feedback
- Endpoint, service/repository, and optimistic-queue tests in the existing test locations

### Constraints

1. Keep the row edit target and paid toggle as sibling controls. Interactive elements must not be nested.
2. Keep optimistic state in the board's transaction data so the row and subsequently opened edit dialog share one value.
3. Send `{ isPaid: boolean }` as the desired final state. An idempotent assignment makes retries and coalescing safe.
4. Maintain one request worker per transaction. A click flips the optimistic state immediately. While its worker is active, retain only the latest desired state; after each success, send again only when that desired state differs from the confirmed state.
5. On failure, replace the optimistic state with the last confirmed state, discard queued intent for that transaction, stop its worker, and emit one error toast.
6. Do not use request cancellation as the consistency mechanism: aborting the browser request does not guarantee that the server mutation was cancelled.
7. Update only `isPaid`. Preserve the transaction's name, amount, note, category, and sort order. Let the existing database behavior update `updatedAt`.
8. Return the same not-found response for missing, out-of-budget, and unauthorized transaction identifiers.
9. Keep paid styling to the indicator. Preserve normal row text, opacity, and background.
10. Leave category paid counts to US-5.8.

## Validation & Business Rules

- **BR-20:** A user may update a transaction only through a budget they own and only when the transaction belongs to that budget.
- `isPaid` must be a JSON boolean.
- The operation assigns the requested state and is safe to repeat.

## Testing Checklist

- [x] Endpoint test persists both `true` and `false` for an owned transaction.
- [x] Endpoint test rejects malformed input.
- [x] Endpoint test rejects a transaction from another budget owned by the same user.
- [x] Endpoint test rejects a transaction owned by another user without exposing it.
- [x] Service or repository test proves that changing paid state preserves every other transaction field.
- [x] Client test proves an initial activation updates immediately and success establishes the new confirmed state.
- [x] Client test proves rapid activations coalesce and persist the last selected state despite response timing.
- [x] Client test proves failure restores the last confirmed state and emits one error.
- [ ] Manual test verifies pointer and keyboard operation, hover/focus appearance, focus visibility, target size, accessible state, and separation from row editing.
- [ ] Manual test verifies create and edit dialogs still read and write paid state.

## Dependencies

- Depends on: US-4.1 (Create Transaction), US-4.2 (Edit Transaction)
- Related: US-5.8 (Category Totals owns transaction and paid counts)
- Blocks: None
