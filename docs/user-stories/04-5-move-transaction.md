# [US-4.5] Move Transaction Between Categories

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☒ Done
**Triage:** ready-for-agent

## User Story

**As a** user,
**I want to** drag a transaction to a different category,
**So that** I can reclassify it without recreating it.

## Current-State Alignment

- The budget board already uses `@dnd-kit-svelte/svelte` with pointer and keyboard sensors to reorder category columns.
- A transaction belongs to a `budgetCategory`; categories are reusable across budgets.
- Transaction rows already contain edit, paid, and actions controls, so dragging needs a separate handle.
- US-4.6 owns transaction ordering within a category and will be implemented with this story.
- US-8.4 duplicates this story.

## Description

Extend the existing board drag system so a transaction can move to an exact position in any category in the same budget. The board previews the move locally, persists one positioning command, and refreshes authoritative page data after success.

## Acceptance Criteria

- [x] A transaction can be dragged to an exact position in any other category in the same budget, including between income and expense categories.
- [x] Empty categories accept a transaction at position zero.
- [x] Each transaction row has a dedicated leading drag handle; edit, paid, and actions controls do not start a drag.
- [x] Pointer, touch, and keyboard dragging work through the handle.
- [x] Dragging auto-scrolls vertically through transactions and horizontally across the board.
- [x] Dragging shows live row rearrangement, a row overlay, an insertion gap, and a highlighted target column consistent with category dragging.
- [x] Keyboard dragging uses Space to pick up or drop, Escape to cancel, up/down to reorder, and left/right to enter the adjacent category at the nearest equivalent position.
- [x] Focus remains on the moved transaction's handle after a drop or cancellation.
- [x] Assistive technology receives localized announcements for pickup, position and category changes, drop, cancellation, and failure.
- [x] Dropping sends the transaction id, target budget-category id, and target index. The client does not send authoritative order lists or sort-order values.
- [x] The server verifies that the user owns the route budget and that both the transaction and target budget category belong to it.
- [x] Moving and normalizing the source and target categories happen atomically.
- [x] A successful move persists after page reload and refreshes authoritative page data without a browser reload.
- [x] The board's naturally derived row placement and category totals may update during the drag. Optimistically updating the separate top-level budget summary is not required.
- [x] Further transaction dragging is disabled while the move is saving; the board exposes its busy state without a spinner or success toast.
- [x] A failed move restores the previous layout and derived totals, preserves focus, and shows one localized error toast.
- [x] Dropping outside the board, cancelling, or returning to the original position restores the original layout without a request.
- [x] Concurrent tabs require no conflict warning; transaction-position writes are serialized per budget and the last applied command wins.

## Technical Implementation

### Expected Areas

- `apps/web/src/lib/budget-planning/budgets/components/budget-board.svelte` — own transaction drag state, preview, persistence, refresh, rollback, busy state, and announcements
- `apps/web/src/lib/budget-planning/budgets/components/category-column.svelte` — expose sortable transaction lists, empty targets, insertion feedback, and auto-scroll boundaries
- `apps/web/src/lib/budget-planning/budgets/components/transaction-row.svelte` — add a dedicated accessible drag handle without changing existing row controls
- `apps/web/src/routes/(private)/budgets/[id]/transactions/[transactionId]/position/+server.ts` — accept the JSON positioning command
- `apps/web/src/lib/budget-planning/server/budgets/service.ts` — authorize and atomically apply the move
- `apps/web/src/lib/budget-planning/server/persistence/budget-repository.ts` — lock the budget, move the transaction, and update affected sort orders
- `apps/web/messages/en.json` and `apps/web/messages/cs.json` — handle labels, announcements, and failure feedback
- Existing unit and integration test locations for ordering rules, service behavior, and the endpoint

### Constraints

1. Represent the command as `{ targetBudgetCategoryId, targetIndex }` on a transaction-specific route.
2. Reject malformed or out-of-range target positions. The UI clamps keyboard movement to available positions.
3. Return the same not-found response for missing, out-of-budget, and unauthorized transaction or category identifiers.
4. Serialize transaction-position commands for one budget inside the database transaction. Do not add versioning or conflict UI.
5. Remove the transaction from its source ordering, insert it at the requested target index, and write contiguous zero-based `sortOrder` values for both affected categories.
6. Preserve the transaction's name, amount, note, and paid state. Let existing database behavior update `updatedAt`.
7. Reuse the installed drag dependencies and established category-drag styling. Do not introduce another drag library.
8. Keep the add-transaction row after every sortable transaction slot; it is not draggable and never becomes an insertion target.
9. Disable only transaction drag handles during persistence. Existing row actions retain their behavior.
10. A server-confirmed success is silent. Refresh page data so the top-level summary reflects cross-type moves.

## Validation & Business Rules

- A transaction may move only between budget categories belonging to the same owned route budget.
- A target index is a zero-based insertion position in the target category after removing the transaction when source and target are the same.
- Affected transaction orders are contiguous from zero after every successful command.
- The persistence operation is atomic.

## Testing Checklist

- [x] Pure ordering tests cover moving to the start, middle, end, and an empty category.
- [x] Pure ordering tests cover same-category input, unchanged input, source normalization, and invalid target indices.
- [x] Endpoint tests cover malformed input, missing records, another category in the same budget, another budget owned by the same user, and another user's budget.
- [x] Persistence or service tests prove the move is atomic, normalizes both categories, and preserves other transaction fields.
- [x] Client test covers successful persistence, busy-state locking, refresh, rollback, and one error toast.
- [ ] Manual test covers pointer, touch, keyboard, vertical and horizontal auto-scroll, empty categories, focus restoration, and screen-reader announcements.
- [ ] Manual test confirms category dragging and transaction edit, paid, delete, and add controls still work.

## Dependencies

- Depends on: US-4.1 (Create Transaction), US-3.1 (Create Category), US-8.1 (Trello Board Layout)
- Implement with: US-4.6 (Reorder Transactions)
- Duplicated by: US-8.4 (Drag Transactions Between Categories)
- Blocks: None

## Notes

- Close US-8.4 as a duplicate when this story is complete.
- Bulk move and move-with-copy are outside this story.
