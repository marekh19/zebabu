# User Stories - Zebabu Budget Planner

This directory contains all user stories for the Zebabu budget planner application. Each user story is a separate markdown file that can be tracked and implemented independently.

## Template

- `00-TEMPLATE.md` - Template for creating new user stories

## Progress Overview

### Epic 1: User Authentication & Profile Management (P0 - MVP Critical)

**Story Points:** 8 | **Status:** ☐ Not Started

- [ ] `01-1-user-registration.md` - User Registration
- [ ] `01-2-user-login.md` - User Login
- [ ] `01-3-user-logout.md` - User Logout
- [ ] `01-4-password-reset.md` - Password Reset
- [ ] `01-5-set-primary-currency.md` - Set Primary Currency
- [ ] `01-6-set-locale.md` - Set Locale for Number Formatting

### Epic 2: Budget Management (P0 - MVP Critical)

**Story Points:** 13 | **Status:** ☐ Not Started

- [ ] `02-1-create-monthly-budget.md` - Create Monthly Budget
- [ ] `02-2-create-scenario-budget.md` - Create Scenario Budget
- [ ] `02-3-list-budgets.md` - List All Budgets
- [ ] `02-4-view-budget-details.md` - View Budget Details
- [ ] `02-5-duplicate-budget.md` - Duplicate Budget
- [ ] `02-6-delete-budget.md` - Delete Budget
- [ ] `02-7-prevent-duplicate-monthly.md` - Prevent Duplicate Monthly Budgets

### Epic 3: Category Management (P0 - MVP Critical)

**Story Points:** 8 | **Status:** ☐ Not Started

- [ ] `03-1-create-category.md` - Create Category
- [ ] `03-2-edit-category.md` - Edit Category
- [ ] `03-3-delete-category.md` - Delete Category
- [ ] `03-4-reorder-categories.md` - Reorder Categories via Drag & Drop
- [ ] `03-5-prevent-delete-last-category.md` - Prevent Deleting Last Income/Expense Category

### Epic 4: Transaction Management (P0 - MVP Critical)

**Story Points:** 10 | **Status:** ☐ Not Started

- [ ] `04-1-create-transaction.md` - Create Transaction
- [ ] `04-2-edit-transaction.md` - Edit Transaction
- [ ] `04-3-delete-transaction.md` - Delete Transaction
- [ ] `04-4-mark-transaction-paid.md` - Mark Transaction as Paid/Unpaid
- [ ] `04-5-move-transaction.md` - Move Transaction Between Categories
- [ ] `04-6-reorder-transactions.md` - Reorder Transactions

### Epic 5: Budget Calculations & Validation (P0 - MVP Critical)

**Story Points:** 5 | **Status:** ☐ Not Started

- [ ] `05-1-display-total-income.md` - Display Total Income
- [ ] `05-2-display-total-expenses.md` - Display Total Expenses
- [ ] `05-3-display-budget-balance.md` - Display Budget Balance
- [ ] `05-4-display-allocation-percentage.md` - Display Allocation Percentage
- [ ] `05-5-display-unallocated-amount.md` - Display Unallocated Amount
- [ ] `05-6-warn-over-budget.md` - Warn If Over Budget
- [ ] `05-7-warn-unallocated.md` - Warn If Not Fully Allocated
- [ ] `05-8-category-totals.md` - Display Per-Category Totals and Percentages
- [ ] `05-9-category-variance.md` - Display Variance Between Target and Actual

### Epic 6: Multi-Currency Support (P1 - Important)

**Story Points:** 8 | **Status:** ☐ Not Started

- [ ] `06-1-set-primary-currency.md` - Set Primary Currency in Profile
- [ ] `06-2-multi-currency-transactions.md` - Add Transactions in Different Currencies
- [ ] `06-3-currency-conversion.md` - Display All Amounts in Primary Currency
- [ ] `06-4-show-original-currency.md` - Show Original Amount and Currency
- [ ] `06-5-fetch-exchange-rates.md` - Automatically Fetch Exchange Rates

### Epic 7: Data Import/Export (P2 - Nice to Have)

**Story Points:** 5 | **Status:** ☐ Not Started

- [ ] `07-1-export-budget-csv.md` - Export Budget to CSV
- [ ] `07-2-import-budget-csv.md` - Import Budget from CSV

### Epic 8: Trello-Like UI & Drag-and-Drop (P0 - MVP Critical)

**Story Points:** 13 | **Status:** ☐ Not Started

- [ ] `08-1-trello-board-layout.md` - Display Budget as Trello-Like Board
- [ ] `08-2-drag-categories.md` - Drag Categories to Reorder
- [ ] `08-3-drag-transactions-same-category.md` - Drag Transactions Within Category
- [ ] `08-4-drag-transactions-between-categories.md` - Drag Transactions Between Categories
- [ ] `08-5-transaction-edit-modal.md` - Edit Transaction in Modal
- [ ] `08-6-add-transaction-inline.md` - Add Transaction via Inline Form
- [ ] `08-7-add-category-button.md` - Add Category via Button

## Total Story Points by Priority

- **P0 (MVP Critical):** 57 story points
- **P1 (Important):** 8 story points
- **P2 (Nice to Have):** 5 story points
- **Total:** 70 story points

## Sprint Planning

Estimated sprint capacity: 10-15 story points per sprint
Estimated time to MVP: 4-6 sprints (8-12 weeks)

## How to Use

1. Pick a user story file to implement
2. Read the acceptance criteria and implementation steps
3. Mark checkboxes as you complete each step
4. Update the status in this README when complete
5. Run validation commands: `pnpm run lint`, `pnpm run format`, `pnpm run check`

## Conventions

- User stories are named: `[epic]-[number]-[slug].md`
- Status markers: ☐ Not Started | ☑ Completed
- Priority: P0 (Critical) > P1 (Important) > P2 (Nice to Have) > P3 (Future)

## Example User Stories Created

The following user stories have been created as examples and templates:

- ✅ `00-TEMPLATE.md` - Template for all user stories
- ✅ `01-1-user-registration.md` - Complete authentication example
- ✅ `02-1-create-monthly-budget.md` - Complete CRUD example with business rules
- ✅ `04-1-create-transaction.md` - Complete data entry example
- ✅ `05-6-warn-over-budget.md` - Complete calculations example
- ✅ `08-1-trello-board-layout.md` - Complete complex UI example

## Generating Remaining User Stories

To create the remaining user stories, use the template (`00-TEMPLATE.md`) and follow these steps:

1. **Copy the template**: `cp 00-TEMPLATE.md [epic]-[number]-[slug].md`
2. **Fill in the header**: Epic name, priority, story points, status
3. **Write the user story**: As a... I want to... So that...
4. **Add description**: Why this feature is needed
5. **List acceptance criteria**: Specific, testable requirements
6. **Define implementation**:
   - Files to modify/create
   - Step-by-step implementation plan
   - Code examples (service layer, UI)
7. **Add business rules**: Reference BR-X from technical spec
8. **Create testing checklist**: Unit, integration, manual tests
9. **Note dependencies**: What blocks this? What does this block?

## Reference Documentation

All user stories are derived from:

- `/docs/product-description/Technical Specification Document.md`
- `/docs/product-description/Zebabu Product Definition Questions.md`

Each user story references specific sections from these documents.
