# [US-5.3] Display Budget Balance

**Epic:** Budget Calculations & Validation
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see my budget balance (income - expenses),
**So that** I know if I'm over or under budget.

---

## Description

Calculate and display budget balance as the difference between total income and total expenses. Positive means unallocated income, negative means over budget, zero means perfectly balanced.

---

## Acceptance Criteria

- [ ] Balance = Total Income - Total Expenses
- [ ] Updates in real-time
- [ ] Positive balance shown in green
- [ ] Negative balance shown in red
- [ ] Zero balance shown in neutral color
- [ ] Formatted with currency symbol

---

## Technical Implementation

```typescript
export function calculateBalance(
  budget: Budget,
  exchangeRates: ExchangeRate[],
  user: User,
): number {
  const income = calculateTotalIncome(budget, exchangeRates, user)
  const expenses = calculateTotalExpenses(budget, exchangeRates, user)
  return income - expenses
}
```

```svelte
<div
  class="summary-card balance"
  class:positive={balance > 0}
  class:negative={balance < 0}
>
  <div class="card-icon">{balance >= 0 ? '✅' : '⚠️'}</div>
  <div class="card-content">
    <h3>Balance</h3>
    <p
      class="card-value"
      class:positive={balance > 0}
      class:negative={balance < 0}
    >
      {formatCurrency(balance, user.primaryCurrency, user.locale)}
    </p>
  </div>
</div>
```

---

## Dependencies

- Depends on: US-5.1 (Total Income), US-5.2 (Total Expenses)
- Blocks: US-5.6 (Warn If Over Budget)

---
