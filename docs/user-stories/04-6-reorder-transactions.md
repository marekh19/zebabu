# [US-4.6] Reorder Transactions

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☒ Done
**Triage:** ready-for-agent

## User Story

**As a** user,
**I want to** drag transactions within a category to reorder them,
**So that** I can organize them in the order that suits my budget.

## Current-State Alignment

- Transactions already load by `sortOrder`; creation appends after the current highest value.
- Transaction deletion deliberately leaves gaps for this story to normalize.
- The budget board already uses `@dnd-kit-svelte/svelte` with pointer and keyboard sensors for category reordering.
- Transaction rows already contain edit, paid, and actions controls, so dragging needs a separate handle.
- US-4.5 owns cross-category movement and will be implemented with this story.
- US-8.3 duplicates this story.

## Description

Extend the existing board drag system so transactions can be reordered at exact positions within a category. The board previews the order locally, persists one positioning command, and refreshes authoritative page data after success.

## Acceptance Criteria

- [x] A transaction can be dragged to any exact position within its current category.
- [x] Each transaction row has a dedicated leading drag handle; edit, paid, and actions controls do not start a drag.
- [x] Pointer, touch, and keyboard dragging work through the handle.
- [x] Dragging auto-scrolls vertically through a long category.
- [x] Dragging shows live row rearrangement, a row overlay, and an insertion gap consistent with category dragging.
- [x] Keyboard dragging uses Space to pick up or drop, Escape to cancel, and up/down to change position.
- [x] Focus remains on the reordered transaction's handle after a drop or cancellation.
- [x] Assistive technology receives localized announcements for pickup, position changes, drop, cancellation, and failure.
- [x] Dropping sends the transaction id, current budget-category id, and target index. The client does not send authoritative order lists or sort-order values.
- [x] The server verifies that the user owns the route budget and that the transaction and category belong to it.
- [x] The category is normalized to contiguous zero-based order atomically.
- [x] A successful reorder persists after page reload and refreshes authoritative page data without a browser reload.
- [x] Further transaction dragging is disabled while the reorder is saving; the board exposes its busy state without a spinner or success toast.
- [x] A failed reorder restores the previous layout, preserves focus, and shows one localized error toast.
- [x] Dropping outside the board, cancelling, or returning to the original position restores the original layout without a request.
- [x] Concurrent tabs require no conflict warning; transaction-position writes are serialized per budget and the last applied command wins.

## Technical Implementation

### Expected Areas

- Share the transaction positioning endpoint, service, persistence operation, drag state, accessible handle, announcements, and tests specified by US-4.5.
- Keep pure list-position logic independent of Svelte and database code so edge cases have small unit tests.

### Constraints

1. Use the same `{ targetBudgetCategoryId, targetIndex }` positioning command as US-4.5; source and target categories are equal for this story.
2. Reject malformed or out-of-range target positions. The UI clamps keyboard movement to available positions.
3. Return the same not-found response for missing, out-of-budget, and unauthorized identifiers.
4. Serialize transaction-position commands for one budget inside the database transaction. Do not add versioning or conflict UI.
5. Remove the transaction before interpreting its target index, then write contiguous zero-based `sortOrder` values for the category.
6. Preserve all transaction fields except `sortOrder`. Let existing database behavior update `updatedAt`.
7. Reuse the installed drag dependencies and established category-drag styling. Do not introduce another drag library.
8. Keep the add-transaction row after every sortable transaction slot; it is not draggable and never becomes an insertion target.
9. Disable only transaction drag handles during persistence. Existing row actions retain their behavior.
10. Treat an unchanged final position as a client-side no-op.

## Validation & Business Rules

- A transaction may be reordered only inside a budget category belonging to the owned route budget.
- A target index is a zero-based insertion position after removing the transaction from its current position.
- The category's transaction orders are contiguous from zero after every successful reorder.
- The persistence operation is atomic.

## Testing Checklist

- [x] Pure ordering tests cover moving to the start, middle, and end.
- [x] Pure ordering tests cover existing gaps, unchanged input, one-item categories, and invalid target indices.
- [x] Endpoint tests cover malformed input, missing records, another budget owned by the same user, and another user's budget.
- [x] Persistence or service tests prove atomic normalization and preservation of other transaction fields.
- [x] Client test covers successful persistence, busy-state locking, refresh, rollback, and one error toast.
- [ ] Manual test covers pointer, touch, keyboard, vertical auto-scroll, focus restoration, and screen-reader announcements.
- [ ] Manual test confirms category dragging and transaction edit, paid, delete, and add controls still work.

## Dependencies

- Depends on: US-4.1 (Create Transaction), US-3.1 (Create Category), US-8.1 (Trello Board Layout)
- Implement with: US-4.5 (Move Transaction Between Categories)
- Duplicated by: US-8.3 (Drag Transactions Within Category)
- Blocks: None

## Notes

- Close US-8.3 as a duplicate when this story is complete.
- User-defined automatic sorting modes are outside this story.
