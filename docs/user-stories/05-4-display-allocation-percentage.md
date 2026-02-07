# [US-5.4] Display Allocation Percentage

**Epic:** Budget Calculations & Validation
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see what percentage of my income is allocated,
**So that** I can track progress toward 100% allocation.

---

## Description

Calculate and display the percentage of income that has been allocated to expenses. The goal is 100% (zero-based budgeting principle). Includes visual progress bar.

---

## Acceptance Criteria

- [ ] Percentage = (Total Expenses / Total Income) × 100
- [ ] Updates in real-time
- [ ] Shows 0% if no income
- [ ] Progress bar visualization
- [ ] Color-coded (green when approaching 100%, red when over)
- [ ] Formatted as percentage (e.g., "87.5%")

---

## Technical Implementation

```typescript
export function calculateAllocationPercentage(
  budget: Budget,
  exchangeRates: ExchangeRate[],
  user: User,
): number {
  const income = calculateTotalIncome(budget, exchangeRates, user)
  if (income === 0) return 0

  const expenses = calculateTotalExpenses(budget, exchangeRates, user)
  return (expenses / income) * 100
}
```

```svelte
<div class="summary-card">
  <h3>Allocated</h3>
  <p class="card-value">{formatPercentage(allocatedPercentage, user.locale)}</p>
  <div class="progress-bar">
    <div
      class="progress-fill"
      class:full={allocatedPercentage >= 100}
      class:over={allocatedPercentage > 100}
      style="width: {Math.min(allocatedPercentage, 100)}%"
    ></div>
  </div>
</div>
```

---

## Dependencies

- Depends on: US-5.1, US-5.2
- Blocks: US-5.7 (Warn If Not Fully Allocated)

---
