# [US-4.3] Delete Transaction

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☒ Done
**Triage:** ready-for-agent

## User Story

**As a** user,
**I want to** delete a transaction,
**So that** I can remove incorrect or unnecessary entries from my budget.

## Current-State Alignment

- Transactions contain `name`, `amount`, `isPaid`, `note`, and `sortOrder` and belong to a `budgetCategory`; currency belongs to US-6.2.
- Clicking or tapping the transaction row opens the edit dialog established by US-4.2.
- Budget and category actions already use an actions menu, the shared confirmation dialog, localized toasts, and enhanced forms.
- Category totals and budget summary values are derived from page-loaded transactions rather than stored separately.

## Description

Each transaction row has an always-visible actions menu containing Edit and Delete. Delete opens one board-level confirmation dialog that names the transaction and warns that deletion cannot be undone.

Deletion waits for server success. The page data is then invalidated so the row, category total, and budget summary refresh from the server together. This story does not add optimistic state, undo, soft deletion, bulk deletion, or audit logging.

## Acceptance Criteria

- [x] Each transaction row has an always-visible three-dot actions button labelled `Actions for {transaction name}`.
- [x] The actions menu contains Edit followed by a separated destructive Delete item.
- [x] Clicking the row body or choosing Edit opens the edit dialog.
- [x] Clicking the actions button or a menu item does not also trigger row editing.
- [x] Choosing Delete opens the shared board-level confirmation dialog.
- [x] The dialog names the transaction and states that deletion cannot be undone.
- [x] Cancel, Escape, and backdrop click close the idle dialog and return focus to the actions button.
- [x] Confirming deletion disables repeat submission and prevents dismissal while the request is pending.
- [x] The transaction remains visible until the server confirms deletion.
- [x] Successful deletion closes the dialog, shows a localized `Transaction “{name}” deleted` toast, and refreshes page data.
- [x] The deleted row, category total, and budget summary update from refreshed server data without optimistic client state.
- [x] After deletion, focus moves to the next transaction, otherwise the previous transaction, otherwise the category's Add transaction control.
- [x] A failed deletion leaves the transaction intact, keeps the dialog open, re-enables its controls, and shows a localized error toast.
- [x] The server verifies that the signed-in user owns the route budget and that the transaction belongs to that budget.
- [x] Missing transactions, transactions from another budget, and transactions owned by another user are rejected as not found without exposing their data.
- [x] The named action validates its transaction identifier and redirects back to the budget after a successful non-enhanced POST.
- [x] Deletion does not renumber sibling transaction `sortOrder` values.

## Technical Implementation

### Expected Areas

- `apps/web/src/lib/budget-planning/budgets/schemas/delete-transaction-schema.ts` — validate `transactionId`
- `apps/web/src/lib/budget-planning/budgets/components/transaction-row.svelte` — separate row edit target and accessible actions menu
- `apps/web/src/lib/budget-planning/budgets/components/category-column.svelte` and `budget-board.svelte` — pass delete selection and own the single confirmation dialog
- `apps/web/src/routes/(private)/budgets/[id]/+page.server.ts` — add the `deleteTransaction` named action
- `apps/web/src/lib/budget-planning/server/persistence/budget-repository.ts` — delete an identified transaction
- `apps/web/src/lib/budget-planning/server/budgets/service.ts` — authorize and delete within one database transaction
- `apps/web/src/lib/budget-planning/server/index.ts` — export the service operation
- `apps/web/messages/en.json` and `apps/web/messages/cs.json` — menu, confirmation, success, and error messages
- `apps/web/src/lib/budget-planning/server/budgets/service.test.ts` — service authorization and deletion coverage
- `apps/web/src/routes/(private)/budgets/[id]/delete-transaction.integration.test.ts` — action coverage

### Constraints

1. Keep the row body and actions trigger as sibling controls; do not nest interactive elements.
2. Keep one delete confirmation dialog at board level and retain the triggering element for focus restoration.
3. Accept only `transactionId` as mutation input. Resolve it through the route budget and signed-in user with `findOwnedTransaction`.
4. Authorize and delete within the same database transaction. Add the delete operation beside the existing transaction persistence functions.
5. Return the same not-found result for a missing, out-of-budget, or unauthorized transaction.
6. Keep the dialog open and locked while pending. Close it only after success; on failure, retain it for retry.
7. On enhanced success, invalidate page data and do not maintain a second client-side transaction collection.
8. Preserve sibling `sortOrder` values. US-4.6 may normalize them while implementing transaction reordering.
9. The overflow menu and confirmation dialog require client-side JavaScript. A directly submitted named action must still follow the normal POST and redirect contract, but an end-to-end no-JavaScript UI is outside this story.
10. Keep the row layout compatible with US-4.4 paid controls and US-4.5/US-4.6 drag handles.

## Validation & Business Rules

- **BR-21:** A user may delete a transaction only through a budget they own and only when the transaction belongs to that budget.
- Deletion is permanent and affects exactly one transaction.
- Deleting a transaction does not cascade to other records.

## Testing Checklist

- [x] Schema test rejects a missing or empty `transactionId`.
- [x] Service test deletes a transaction found within the owned route budget.
- [x] Service test rejects an out-of-budget or unauthorized transaction without deleting it.
- [x] Integration test deletes through the `deleteTransaction` named action.
- [x] Integration test rejects invalid input without calling the service.
- [x] Integration test maps a missing or inaccessible transaction to not found.
- [x] Integration test reports an unexpected service failure without deleting UI state.
- [ ] Manual test verifies row click, Edit, Delete, menu keyboard access, and that menu interaction does not open editing.
- [ ] Manual test verifies confirmation dismissal, pending lock, retry after failure, and focus restoration.
- [ ] Manual test verifies the localized success and error toasts in English and Czech.
- [ ] Manual test verifies the row, category total, and budget summary refresh after success.

## Dependencies

- Depends on: US-4.1 (Create Transaction), US-4.2 (Edit Transaction)
- Blocks: None

## Out of Scope

- Undo or soft deletion
- Bulk deletion
- Audit logging
- Sibling `sortOrder` compaction
- End-to-end no-JavaScript menu and confirmation UI
