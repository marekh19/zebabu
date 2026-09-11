# [US-5.9] Set Expense Allocation Targets for a Budget

**Epic:** Budget Calculations & Validation
**Priority:** P1
**Story Points:** 5
**Triage:** ready-for-agent
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** opt into and adjust allocation targets for one Budget,
**So that** its spending plan can differ from my defaults without affecting other Budgets.

---

## Description

Add a visible **Allocation targets** action beside the Budget title. It opens the
shared allocation-target editor in Budget mode. Budget targets are optional values
owned by BudgetCategories, not live references to Category defaults.

---

## Acceptance Criteria

- [ ] Budget detail has a labeled **Allocation targets** action beside the title.
- [ ] The editor reuses the global editor's layout, validation, and running-total feedback.
- [ ] **Use allocation targets for this budget** enables or disables the complete target set.
- [ ] Only expense BudgetCategories participate; targets accept 0–100 with at most one decimal place.
- [ ] Save is available only when enabled targets total exactly 100.0%.
- [ ] Enabling targets starts from current global defaults when available, otherwise 0%; a sole expense Category starts at 100%.
- [ ] **Use current defaults** fills matching Categories without normalizing missing Categories; the user must rebalance before saving.
- [ ] Disabling targets requires confirmation and clears the complete Budget target set.
- [ ] Creating a Budget offers **Use default allocation targets**, checked by default, only when complete global defaults exist.
- [ ] Creating with defaults copies their values into the new Budget; later default changes do not affect it.
- [ ] Existing Budgets remain without targets until explicitly configured.
- [ ] Adding an expense Category to a targeted Budget gives it a 0% target.
- [ ] Duplicating a Budget copies the source Budget's targets, including the disabled state.
- [ ] All reads and writes enforce Budget ownership.
- [ ] Controls, validation, confirmation, and feedback are accessible and localized in English and Czech.

---

## Technical Implementation

- Add a nullable one-decimal allocation target to BudgetCategory persistence and domain models. Existing rows remain unset.
- Reuse the batch editor from US-3.6 with Budget-specific labels, load data, and actions.
- Extend both Budget creation paths to conditionally copy a complete default set.
- Extend Budget duplication to copy targets from the source Budget, never current defaults.
- Integrate target state with adding Categories to an existing Budget.
- Keep the invariant transactional: expense BudgetCategory targets are either all unset or all set and total 100.0%.

---

## Testing Checklist

- [ ] Schema and service tests cover optional state, range, precision, exact total, ownership, and atomic updates.
- [ ] Creation tests cover defaults absent, accepted, and declined.
- [ ] Duplication tests prove source targets are copied after global defaults change.
- [ ] Existing-Budget and added-Category tests cover unset and 0% behavior.
- [ ] Manual testing covers both Budget types, confirmation, focus restoration, responsive layout, and both locales.

---

## Dependencies

- Depends on: US-3.6
- Blocks: US-5.10

---
