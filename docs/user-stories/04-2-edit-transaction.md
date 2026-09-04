# [US-4.2] Edit Transaction

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☒ Done

## User Story

**As a** user,
**I want to** edit a transaction's details,
**So that** I can correct mistakes or update my plan.

## Current-State Alignment

- Transactions currently contain `name`, `amount`, `isPaid`, `note`, and `sortOrder` and belong to a `budgetCategory`.
- US-4.1 established the validation, authorization, Superforms, localization, dialog, toast, and page-invalidation conventions for transaction forms.
- Currency is not part of the current transaction model. It belongs to US-6.2.
- Moving a transaction to another budget category belongs to US-4.5.
- US-8.5 duplicates this story and is closed as `wontfix`.

## Description

Clicking or tapping a transaction row opens an edit dialog populated with its current name, amount, paid status, and note. Saving validates and persists the complete editable state, then refreshes the budget data so the row, category total, and budget summary use the server result.

The edit flow should reuse US-4.1's field validation and form-field UI where doing so reduces duplication. It retains a separate dialog, schema, messages, and named action because its identifier, initial state, and submission result differ from create.

## Acceptance Criteria

- [x] Clicking or tapping anywhere on a transaction row opens its edit dialog.
- [x] The row is keyboard accessible with Enter and Space and has visible hover and keyboard-focus states.
- [x] The dialog initially focuses the name field and contains name, amount, paid status, and note fields populated from the selected transaction.
- [x] The transaction's budget category and sort order cannot be changed through the dialog.
- [x] Name is required, trimmed, and at most 200 characters.
- [x] Amount is required, greater than zero, accepts at most two decimal places, and fits the database `numeric(12, 2)` range.
- [x] Note is optional, trimmed, and at most 1,000 characters; an empty note is stored as `null`.
- [x] Invalid fields show localized inline errors, preserve the submitted values, and leave the dialog open.
- [x] Cancel, the close control, Escape, and backdrop click close the dialog and discard unsaved edits.
- [x] Submission prevents duplicate clicks and prevents dismissal while saving.
- [x] A successful submission closes and resets the dialog, shows a localized success toast, and refreshes the edited row from page data.
- [x] Category totals and budget summary values refresh after an amount change.
- [x] The update waits for server success; it does not maintain an optimistic client-side transaction copy.
- [x] The server verifies that the signed-in user owns the route budget and that the transaction belongs to that budget.
- [x] Missing transactions, transactions from another budget, and transactions owned by another user are rejected without exposing their data.
- [x] The named action works without client-side JavaScript; validation failure reopens the relevant edit dialog and success redirects back to the budget.

## Technical Implementation

### Expected Areas

- `apps/web/src/lib/budget-planning/budgets/schemas/` — an update schema containing `transactionId` and the shared editable transaction rules
- `apps/web/src/lib/budget-planning/budgets/components/edit-transaction-dialog.svelte` — pre-populated enhanced edit form
- `apps/web/src/lib/budget-planning/budgets/components/transaction-row.svelte` — accessible edit trigger
- `apps/web/src/lib/budget-planning/budgets/components/category-column.svelte` and `budget-board.svelte` — selected-transaction state and the single edit dialog
- `apps/web/src/routes/(private)/budgets/[id]/+page.server.ts` — initialize the update form and add the `updateTransaction` action
- `apps/web/src/routes/(private)/budgets/[id]/+page.svelte` — pass update form and action error state to the board
- `apps/web/src/lib/budget-planning/server/persistence/budget-repository.ts` — owned transaction lookup and update
- `apps/web/src/lib/budget-planning/server/budgets/service.ts` — authorize and update the transaction
- `apps/web/messages/en.json` and `apps/web/messages/cs.json` — edit labels, validation feedback, toast, and errors
- `apps/web/src/routes/(private)/budgets/[id]/update-transaction.integration.test.ts` — action coverage

### Constraints

1. Reuse the create transaction field rules as the single source of truth; do not duplicate their limits in an unrelated schema.
2. Keep create and edit as separate dialogs and named actions. Extract shared field UI only where it makes both components simpler.
3. Keep one edit dialog at board level and populate it from the selected transaction when opened.
4. Identify the update by `transactionId`. Do not accept `budgetCategoryId` or `sortOrder` as editable input.
5. Resolve the transaction through the route budget and its owner before updating it. Return the same not-found response for missing, out-of-budget, and unauthorized transactions.
6. On enhanced success, rely on SvelteKit action invalidation to refresh loaded budget data. Do not add a second client-side source of truth.
7. On non-enhanced validation failure, use the returned `transactionId` to reopen the matching transaction dialog with the submitted values and errors.
8. Preserve the transaction's category and sort order. Let the existing database update behavior set `updatedAt`.
9. Keep the row's edit interaction compatible with future sibling controls for US-4.3, US-4.4, and transaction drag handles for US-4.5/US-4.6.

## Validation & Business Rules

- **BR-14:** Amount must be greater than zero, have at most two decimal places, and fit `numeric(12, 2)`.
- **BR-16:** Name is required after trimming and is at most 200 characters.
- **BR-18:** Note is optional and at most 1,000 characters after trimming.
- **BR-20:** A user may update a transaction only through a budget they own and only when the transaction belongs to that budget.

Currency validation is outside this story because the current transaction model does not support currency.

## Testing Checklist

- [x] Schema tests prove create and edit enforce the same editable-field rules and cover the required `transactionId`.
- [x] Service or repository test verifies that an update preserves `budgetCategoryId` and `sortOrder`.
- [x] Integration test updates all editable fields through the named action.
- [x] Integration test rejects an invalid payload and returns the submitted form state.
- [x] Integration test rejects a transaction from another budget owned by the same user.
- [x] Integration test rejects a transaction owned by another user without exposing it.
- [ ] Manual test verifies row click, touch, Enter, Space, focus visibility, initial dialog focus, and focus return after closing.
- [ ] Manual test verifies pre-population, validation, dismissal, submission locking, success toast, and refreshed totals in English and Czech.
- [ ] Manual test verifies the non-JavaScript validation and success paths.

## Dependencies

- Depends on: US-4.1 (Create Transaction)
- Blocks: None
