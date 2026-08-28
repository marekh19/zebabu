# [US-4.1] Create Transaction

**Epic:** Transaction Management

**Priority:** P0 (MVP Critical)

**Story Points:** 2

**Status:** ☐ Not Started

---

## User Story

**As a** user,

**I want to** add a transaction to a budget category,

**So that** I can track my planned income and expenses.

## Current-State Alignment

The original story predates the application. The implementation must follow the current model and conventions:

- The transaction table, budget detail query, `TransactionRow`, category columns, and total calculations already exist.
- A transaction belongs to a `budgetCategory` through `budgetCategoryId`, not directly to a reusable category.
- Current fields are `name`, `amount`, `isPaid`, `note`, and `sortOrder`. Transactions do not have a currency field, and users do not yet have a primary currency. Multi-currency support remains in US-1.5 and US-6.x.
- The budget detail route is `src/routes/(private)/budgets/[id]`. Feature UI and schemas live under `src/lib/features`; budget persistence lives under `src/lib/server/budgets`; database tables are defined in `src/lib/server/db/budgets.ts`.
- Forms use Zod, SvelteKit Superforms, named page actions, and progressive enhancement. User-facing text must use Paraglide messages in both English and Czech.
- The existing budget detail load already returns transactions, and the summary and category totals derive from that data. A successful enhanced action should invalidate and refresh the page data rather than add a second client-side source of truth.

## Description

Add a transaction from any category column on the budget detail board. Each column ends with a full-width add button styled as an empty transaction row. It has the same standard width and height as a transaction row, uses a large plus sign as its visible content, and has a localized accessible name that identifies the category.

Activating the button opens a dialog containing all currently supported editable transaction fields: name, amount, paid status, and optional note. The selected budget category is fixed by the trigger and is not editable in the dialog.

## Acceptance Criteria

- [ ] Every budget category column shows the add button below its transactions, including an empty category.
- [ ] The button spans the transaction list width and matches the standard transaction-row height.
- [ ] The button is visually distinct as an action while fitting the existing category-column design.
- [ ] The button shows a large `+` and has a localized accessible name such as “Add transaction to Housing”; the plus sign is hidden from assistive technology.
- [ ] The button has visible hover and keyboard-focus states and meets the existing light and dark theme contrast requirements.
- [ ] Activating the button opens the create-transaction dialog for that `budgetCategoryId`.
- [ ] The dialog identifies the destination category and initially focuses the name field.
- [ ] The dialog contains name, amount, paid, and note fields.
- [ ] Name is required, trimmed, and at most 200 characters.
- [ ] Amount is required, greater than zero, accepts at most two decimal places, and fits the database `numeric(12, 2)` range.
- [ ] Paid defaults to false.
- [ ] Note is optional, trimmed, and at most 1,000 characters; an empty note is stored as `null`.
- [ ] Invalid fields show localized inline errors and preserve the entered values.
- [ ] Cancel, the close control, and Escape close the dialog without creating a transaction.
- [ ] Submission prevents duplicate clicks and keeps the dialog open while saving.
- [ ] A successful submission closes and resets the dialog, shows a localized success toast, and displays the transaction at the bottom of the correct category.
- [ ] Category totals and budget summary values update after creation.
- [ ] The server verifies that the signed-in user owns the budget containing the supplied `budgetCategoryId`.
- [ ] Missing or unauthorized budget categories are rejected without revealing another user's data.

## Technical Implementation

### Files to Modify/Create

- `apps/web/src/lib/features/budgets/schemas/create-transaction-schema.ts` — shared form validation
- `apps/web/src/lib/features/budgets/components/create-transaction-dialog.svelte` — dialog and enhanced form
- `apps/web/src/lib/features/budgets/components/add-transaction-row.svelte` — row-sized dialog trigger
- `apps/web/src/lib/features/budgets/components/category-column.svelte` — render the trigger after the transaction list
- `apps/web/src/lib/features/budgets/components/budget-board.svelte` — pass the shared form and action error to columns
- `apps/web/src/routes/(private)/budgets/[id]/+page.server.ts` — initialize the form and add the `createTransaction` action
- `apps/web/src/routes/(private)/budgets/[id]/+page.svelte` — pass form state and the action error to the board
- `apps/web/src/lib/server/budgets/repository.ts` — find an owned budget category and insert the transaction
- `apps/web/src/lib/server/budgets/service.ts` — authorize and create the transaction
- `apps/web/messages/en.json` and `apps/web/messages/cs.json` — labels, validation feedback, toast, and errors
- `apps/web/src/routes/(private)/budgets/[id]/create-transaction.integration.test.ts` — action coverage

No database migration or new transaction display component is required.

### Implementation Notes

1. Define one Zod schema for `budgetCategoryId`, `name`, `amount`, `isPaid`, and `note`. Use the schema on the server and as the Superforms client validator.
2. Initialize `createTransactionForm` in the page load. Submit JSON to `?/createTransaction` with `use:enhance`, following the existing add-category dialog pattern.
3. Keep one create dialog per category trigger unless sharing one dialog materially reduces code without complicating form reset and destination state.
4. Find the destination through its budget and owner before inserting. Return the same not-found response for a missing category and a category owned by someone else.
5. Append with `max(sortOrder) + 1` within the destination budget category. The insert and order calculation must be atomic enough to avoid duplicate ordering from concurrent creates.
6. On success, rely on SvelteKit action invalidation to refresh the loaded budget. The existing derived totals then recalculate from the returned transactions.
7. Preserve the existing empty-state message if useful, but the add button is always the final row and is the primary empty-state action.

## Validation & Business Rules

- **BR-14:** Amount must be greater than zero, have at most two decimal places, and fit `numeric(12, 2)`.
- **BR-16:** Name is required after trimming and is at most 200 characters.
- **BR-17:** `sortOrder` is non-negative and new transactions append to the category.
- **BR-18:** Note is optional and at most 1,000 characters after trimming.
- **BR-19:** A user may create a transaction only inside a budget they own.

Currency validation is outside this story because the current transaction and user schemas do not support currency.

## Testing Checklist

- [ ] Schema tests cover blank and overlong names, valid decimal amounts, zero, negative, excess decimal places, the database maximum, paid default, and note normalization.
- [ ] Service or repository test verifies append ordering.
- [ ] Integration test creates a transaction through the named action.
- [ ] Integration test rejects an invalid payload.
- [ ] Integration test rejects a budget category owned by another user.
- [ ] Manual test verifies the add button in empty and populated columns, light and dark themes, and narrow screens.
- [ ] Manual keyboard test verifies focus visibility, dialog focus, Escape, cancel, submit, and focus return to the trigger.
- [ ] Manual screen-reader test verifies the trigger announces both the action and destination category while the decorative plus is ignored.
- [ ] Manual test verifies the new row, category total, and budget summary update without a full browser reload.

## Dependencies

- Depends on: US-2.1 (Create Monthly Budget), US-3.1 (Create Category)
- Blocks: US-4.2 (Edit Transaction), US-4.5 (Move Transaction)
- Currency fields depend on: US-1.5 and US-6.x
