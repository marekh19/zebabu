# [US-3.6] Configure Default Expense Allocation Targets

**Epic:** Category Management
**Priority:** P1
**Story Points:** 3
**Triage:** ready-for-agent
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** define an optional default allocation target for each expense Category,
**So that** new Budgets can start with my usual spending plan.

---

## Description

Add a visible **Allocation targets** action beside the Categories page title. It
opens the shared allocation-target editor in global-default mode. Defaults are an
optional template for future Budgets; changing or disabling them never changes an
existing Budget.

---

## Acceptance Criteria

- [ ] The Categories page has a labeled **Allocation targets** action beside its title.
- [ ] The editor states that defaults affect future Budgets only.
- [ ] **Use allocation targets** enables or disables the complete default set.
- [ ] Only expense Categories appear in the editor; income Categories never have targets.
- [ ] Each target accepts 0–100 with at most one decimal place.
- [ ] A running total shows the percentage remaining or over 100%.
- [ ] Save is available only when enabled targets total exactly 100.0%.
- [ ] The complete target set is validated and saved atomically.
- [ ] First-time setup starts at 0%, except a sole expense Category starts at 100%.
- [ ] Disabling configured targets requires confirmation and clears the complete set.
- [ ] A new expense Category gets 0% when defaults are enabled and no target otherwise.
- [ ] A Category with a non-zero default cannot be deleted until its target is reallocated.
- [ ] Controls, validation, confirmation, and feedback are keyboard and screen-reader accessible.
- [ ] Visible text is localized in English and Czech.

---

## Technical Implementation

- Add a nullable one-decimal default allocation target to Category persistence and domain models. Existing rows remain unset; no data backfill is required.
- Add a server-validated batch schema and transactional service operation. A User's expense Category targets must be either all unset or all set and total 100.0%.
- Build one allocation-target editor in the Budget Planning domain for reuse by US-5.9. Pass mode-specific labels and actions instead of duplicating forms.
- Integrate target state with Category creation and deletion rules.

---

## Testing Checklist

- [ ] Schema tests cover range, one-decimal precision, incomplete sets, and totals below, equal to, and above 100%.
- [ ] Service tests cover ownership, atomic updates, disabling, Category creation at 0%, and non-zero target deletion.
- [ ] Route tests cover invalid and successful submissions.
- [ ] Manual testing covers keyboard use, focus restoration, running-total feedback, and both locales.

---

## Dependencies

- Depends on: None
- Blocks: US-5.9
