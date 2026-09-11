# [US-5.8] Display Per-Category Totals

**Epic:** Budget Calculations & Validation
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☑ Done

---

## User Story

**As a** user,
**I want to** see the total planned amount in each category,
**So that** I can understand the category without adding its transactions myself.

---

## Resolution

Each category column shows the sum of its planned Transactions below the header.
The total uses the active locale and updates with the board's Transaction state.

Percentages and aggregate Transaction or paid counts are excluded. Percentages
belong with the optional allocation-target feature, where they support a concrete
comparison. Paid state remains visible on each Transaction.

---

## Acceptance Criteria

- [x] Each Category shows the sum of all its planned Transactions.
- [x] An empty Category shows zero using the active locale.
- [x] Paid and unpaid Transactions contribute equally to the planned total.
- [x] Totals update when Transactions are added, edited, deleted, or moved.
- [x] Totals use locale-aware decimal formatting.

---

## Dependencies

- None

---
